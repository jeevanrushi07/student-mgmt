const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "student-mgmt-demo-secret-change-in-production";
const DB_FILE = path.join(__dirname, "data.json");
const SEED = require("./seed.json");

const now = Date.now();
const iso = (days) => new Date(now + days * 86400000).toISOString();

function seed() { return JSON.parse(JSON.stringify(SEED)); }

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}
function verifyPassword(password, stored) {
  const [salt, key] = String(stored).split(":");
  if (!salt || !key) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(key));
}
function b64(value) { return Buffer.from(value).toString("base64url"); }
function signJwt(payload) {
  const header = b64(JSON.stringify({alg:"HS256",typ:"JWT"}));
  const body = b64(JSON.stringify({...payload, iat:Math.floor(Date.now()/1000), exp:Math.floor(Date.now()/1000)+7200}));
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}
function verifyJwt(token) {
  const [h,p,s] = String(token).split(".");
  if (!h || !p || !s) throw new Error("Invalid token");
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${h}.${p}`).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) throw new Error("Invalid token");
  const payload = JSON.parse(Buffer.from(p,"base64url").toString());
  if (payload.exp < Math.floor(Date.now()/1000)) throw new Error("Expired token");
  return payload;
}
function uid(prefix){ return `${prefix}-${crypto.randomBytes(5).toString("hex")}`; }
function safeUser(u){ const {password,...rest}=u; return rest; }

let db = globalThis.__studentMgmtDb || seed();
if (!globalThis.__studentMgmtDb) {
  db.users.forEach(u => { if (!String(u.password).includes(':')) u.password = hashPassword(u.password); });
  globalThis.__studentMgmtDb = db;
}
function save(){ globalThis.__studentMgmtDb = db; }

function send(res,status,payload) {
  res.writeHead(status, {"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS"});
  res.end(payload === null ? "" : JSON.stringify(payload));
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let data=""; req.on("data",c=>data+=c);
    req.on("end",()=>{try{resolve(data?JSON.parse(data):{})}catch(e){reject(e)}});
  });
}
function auth(req,res,roles=[]) {
  try {
    const h=req.headers.authorization||""; if(!h.startsWith("Bearer ")) throw new Error();
    const claims=verifyJwt(h.slice(7)); const user=db.users.find(u=>u.id===claims.sub);
    if(!user || (roles.length && !roles.includes(user.role))) throw new Error();
    return user;
  } catch { send(res,401,{message:"Authentication required or token expired."}); return null; }
}
function jsonPath(req){ return new URL(req.url,`http://${req.headers.host}`).pathname; }

const requestHandler=async(req,res)=>{
  if(req.method==="OPTIONS"){send(res,204,null);return;}
  const path=jsonPath(req);
  try {
    if(req.method==="GET"&&path==="/api/health"){send(res,200,{ok:true});return;}
    if(req.method==="POST"&&path==="/api/auth/login"){
      const body=await readBody(req), u=db.users.find(x=>x.email.toLowerCase()===String(body.email||"").toLowerCase());
      if(!u||!verifyPassword(String(body.password||""),u.password)){send(res,401,{message:"Those credentials don't match our records."});return;}
      send(res,200,{token:signJwt({sub:u.id,role:u.role,name:u.name,email:u.email}),user:safeUser(u)});return;
    }
    if(req.method==="POST"&&path==="/api/auth/register"){
      const body=await readBody(req), email=String(body.email||"").toLowerCase();
      if(!body.name||!email||!body.password||!["student","professor"].includes(body.role)){send(res,400,{message:"Complete all required fields."});return;}
      if(db.users.some(u=>u.email.toLowerCase()===email)){send(res,409,{message:"An account with that email already exists."});return;}
      const u={id:uid("u"),name:String(body.name).trim(),email,password:hashPassword(String(body.password)),role:body.role};
      db.users.push(u);save();send(res,201,{token:signJwt({sub:u.id,role:u.role,name:u.name,email:u.email}),user:safeUser(u)});return;
    }

    const user=auth(req,res); if(!user)return;
    if(req.method==="GET"&&path==="/api/data"){send(res,200,{...db,users:db.users.map(safeUser)});return;}

    if(path==="/api/courses"&&req.method==="POST"){
      if(user.role!=="professor"){send(res,403,{message:"Professor access required."});return;}
      const b=await readBody(req), ids=[...new Set((b.studentIds||[]).filter(id=>db.users.some(u=>u.id===id&&u.role==="student")))];
      if(!b.code||!b.name||!b.semester||!ids.length){send(res,400,{message:"Course code, name, semester, and at least one student are required."});return;}
      const c={id:uid("c"),code:String(b.code).trim(),name:String(b.name).trim(),semester:String(b.semester).trim(),professorId:user.id,studentIds:ids};db.courses.push(c);save();send(res,201,c);return;
    }
    const courseMatch=path.match(/^\/api\/courses\/([^/]+)$/);
    if(courseMatch){
      const id=courseMatch[1], c=db.courses.find(x=>x.id===id&&x.professorId===user.id);
      if(!c){send(res,404,{message:"Course not found."});return;}
      if(req.method==="PUT"){
        const b=await readBody(req); const ids=[...new Set((b.studentIds??c.studentIds).filter(x=>db.users.some(u=>u.id===x&&u.role==="student")))];
        Object.assign(c,{code:String(b.code??c.code).trim(),name:String(b.name??c.name).trim(),semester:String(b.semester??c.semester).trim(),studentIds:ids});save();send(res,200,c);return;
      }
      if(req.method==="DELETE"){
        const aIds=db.assignments.filter(a=>a.courseId===id).map(a=>a.id);
        db.courses=db.courses.filter(x=>x.id!==id);db.assignments=db.assignments.filter(a=>a.courseId!==id);db.groups=db.groups.filter(g=>g.courseId!==id);db.acknowledgments=db.acknowledgments.filter(a=>!aIds.includes(a.assignmentId));save();send(res,204,null);return;
      }
    }
    if(path==="/api/assignments"&&req.method==="POST"){
      if(user.role!=="professor"){send(res,403,{message:"Professor access required."});return;}
      const b=await readBody(req), c=db.courses.find(x=>x.id===b.courseId&&x.professorId===user.id);
      if(!c){send(res,403,{message:"You can only add assignments to your own courses."});return;}
      const a={id:uid("a"),...b};db.assignments.push(a);save();send(res,201,a);return;
    }
    const am=path.match(/^\/api\/assignments\/([^/]+)$/);
    if(am){
      const a=db.assignments.find(x=>x.id===am[1]), c=a&&db.courses.find(x=>x.id===a.courseId&&x.professorId===user.id);
      if(!a||!c){send(res,404,{message:"Assignment not found."});return;}
      if(req.method==="PUT"){const b=await readBody(req);Object.assign(a,b,{id:a.id,courseId:a.courseId});save();send(res,200,a);return;}
      if(req.method==="DELETE"){db.assignments=db.assignments.filter(x=>x.id!==a.id);db.acknowledgments=db.acknowledgments.filter(x=>x.assignmentId!==a.id);save();send(res,204,null);return;}
    }
    if(path==="/api/groups"&&req.method==="POST"){
      if(user.role!=="student"){send(res,403,{message:"Student access required."});return;}
      const b=await readBody(req), c=db.courses.find(x=>x.id===b.courseId&&x.studentIds.includes(user.id));
      if(!c){send(res,403,{message:"You are not enrolled in this course."});return;}
      if(db.groups.some(g=>g.courseId===c.id&&g.memberIds.includes(user.id))){send(res,409,{message:"You are already in a group for this course."});return;}
      const g={id:uid("g"),courseId:c.id,name:String(b.name||"New Group").trim(),leaderId:user.id,memberIds:[user.id]};db.groups.push(g);save();send(res,201,g);return;
    }
    const gm=path.match(/^\/api\/groups\/([^/]+)\/join$/);
    if(gm&&req.method==="POST"){
      if(user.role!=="student"){send(res,403,{message:"Student access required."});return;}
      const g=db.groups.find(x=>x.id===gm[1]), c=g&&db.courses.find(x=>x.id===g.courseId);
      if(!g||!c||!c.studentIds.includes(user.id)){send(res,404,{message:"Group not found."});return;}
      if(db.groups.some(x=>x.courseId===g.courseId&&x.memberIds.includes(user.id))){send(res,409,{message:"You are already in a group for this course."});return;}
      g.memberIds.push(user.id);save();send(res,200,g);return;
    }
    if(path==="/api/acknowledgments"&&req.method==="POST"){
      if(user.role!=="student"){send(res,403,{message:"Student access required."});return;}
      const b=await readBody(req), a=db.assignments.find(x=>x.id===b.assignmentId), c=a&&db.courses.find(x=>x.id===a.courseId);
      if(!a||!c||!c.studentIds.includes(user.id)){send(res,404,{message:"Assignment not found."});return;}
      const existing=db.acknowledgments.find(x=>x.assignmentId===a.id&&x.subjectId===b.subjectId);if(existing){send(res,200,existing);return;}
      if(a.submissionType==="group"){const g=db.groups.find(x=>x.id===b.subjectId&&x.courseId===a.courseId);if(!g||g.leaderId!==user.id){send(res,403,{message:"Only the group leader can acknowledge a group assignment."});return;}}
      else if(b.subjectId!==user.id){send(res,403,{message:"A student can only acknowledge their own submission."});return;}
      const ack={id:uid("ack"),assignmentId:a.id,subjectType:b.subjectType,subjectId:b.subjectId,acknowledgedBy:user.id,timestamp:new Date().toISOString()};db.acknowledgments.push(ack);save();send(res,201,ack);return;
    }
    send(res,404,{message:"Route not found."});
  } catch(err) { console.error(err); send(res,500,{message:"Server error."}); }
};

if (require.main === module) {
  const server=http.createServer(requestHandler);
  server.listen(PORT,()=>console.log(`Student management API running on http://localhost:${PORT}`));
}

module.exports = { requestHandler };
