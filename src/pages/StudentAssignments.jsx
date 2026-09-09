import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import Stamp from "../components/Stamp";
import ProgressBar from "../components/ProgressBar";
import Modal from "../components/Modal";
import Field, { inputCls } from "../components/Field";
import { formatDeadline, formatTimestamp, isPast, timeRemaining } from "../utils/date";

export default function StudentAssignments() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const {
    courses,
    users,
    assignmentsForCourse,
    groupsForCourse,
    groupForStudentInCourse,
    acknowledgmentsForAssignment,
    acknowledge,
    createGroup,
    joinGroup,
  } = useData();
  const { notify } = useToast();

  const course = courses.find((c) => c.id === courseId);
  const [justAcked, setJustAcked] = useState(null);
  const [filter, setFilter] = useState("all");
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  if (!course) return <Navigate to="/student" replace />;
  if (!course.studentIds.includes(user.id)) return <Navigate to="/student" replace />;

  const assignments = assignmentsForCourse(course.id);
  const myGroup = groupForStudentInCourse(user.id, course.id);
  const courseGroups = groupsForCourse(course.id);

  const handleFormGroup = (name) => {
    const group = createGroup({ courseId: course.id, name, studentId: user.id });
    setGroupModalOpen(false);
    notify(`Created "${group.name}". You're the group leader.`, "success");
  };

  const handleJoinGroup = (group) => {
    joinGroup({ groupId: group.id, studentId: user.id });
    setGroupModalOpen(false);
    notify(`Joined "${group.name}".`, "success");
  };

  const enriched = assignments.map((a) => {
    const acks = acknowledgmentsForAssignment(a.id);
    let myAck, isLeaderOfGroup, groupMembers, ackedByUser;
    if (a.submissionType === "individual") {
      myAck = acks.find((ack) => ack.subjectId === user.id);
    } else if (myGroup) {
      myAck = acks.find((ack) => ack.subjectId === myGroup.id);
      isLeaderOfGroup = myGroup.leaderId === user.id;
      ackedByUser = myAck ? users.find((u) => u.id === myAck.acknowledgedBy) : null;
      groupMembers = myGroup.memberIds
        .map((id) => course.studentIds.includes(id) ? id : null)
        .filter(Boolean);
    }
    const overdue = isPast(a.deadline);
    const submittedLate = Boolean(myAck && new Date(myAck.timestamp).getTime() > new Date(a.deadline).getTime());
    const status = myAck ? (submittedLate ? "late" : "acknowledged") : overdue ? "overdue" : "pending";
    return { ...a, myAck, ackedByUser, isLeaderOfGroup, groupMembers, submittedLate, status };
  });

  const filtered = enriched.filter((a) => filter === "all" || a.status === filter);

  const completedCount = enriched.filter((a) => a.status === "acknowledged" || a.status === "late").length;

  const handleAcknowledge = (assignment) => {
    if (assignment.submissionType === "group") {
      acknowledge({
        assignmentId: assignment.id,
        subjectType: "group",
        subjectId: myGroup.id,
        acknowledgedBy: user.id,
      });
      notify(`Submitted on behalf of ${myGroup.name}.`, "success");
    } else {
      acknowledge({
        assignmentId: assignment.id,
        subjectType: "student",
        subjectId: user.id,
        acknowledgedBy: user.id,
      });
      notify("Submission acknowledged.", "success");
    }
    setJustAcked(assignment.id);
    setTimeout(() => setJustAcked(null), 1000);
  };

  return (
    <div className="min-h-screen paper-texture">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-10">
        <Breadcrumb course={course} />

        <div className="mb-8 fade-up">
          <h1 className="font-display text-3xl text-[var(--color-ink)]">{course.name}</h1>
          <p className="text-[var(--color-ink-soft)] mt-1">{course.semester}</p>
          <div className="mt-5 max-w-xs">
            <ProgressBar value={completedCount} total={assignments.length} label="Your progress" />
          </div>
        </div>

        {courseGroups.length > 0 && (
        <section className="mb-6 fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-brass-dark)]">
                Group roster
              </p>
              <p className="text-sm text-[var(--color-ink-soft)] mt-1">
                Group assignments are acknowledged once by the identified leader.
              </p>
            </div>
            {!myGroup && (
              <button
                onClick={() => setGroupModalOpen(true)}
                className="rounded-sm border border-[var(--color-navy)] px-3 py-1.5 text-xs font-semibold text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-[var(--color-paper-2)] transition-colors cursor-pointer"
              >
                Form or join
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {courseGroups.map((g) => (
              <GroupRosterCard
                key={g.id}
                group={g}
                users={users}
                isCurrentUserGroup={myGroup?.id === g.id}
              />
            ))}
          </div>
        </section>
      )}

      <div className="flex rounded-sm border border-[var(--color-line)] overflow-hidden w-fit mb-6 fade-up">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["acknowledged", "Acknowledged"],
            ["late", "Late submission"],
            ["overdue", "Overdue"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                filter === val
                  ? "bg-[var(--color-navy)] text-[var(--color-paper-2)]"
                  : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="fade-up rounded-md border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-14 text-center">
            <p className="font-display text-xl text-[var(--color-ink)] mb-1.5">Nothing here</p>
            <p className="text-sm text-[var(--color-ink-soft)]">Try a different filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                myGroup={a.submissionType === "group" ? myGroup : null}
                onAcknowledge={() => handleAcknowledge(a)}
                onFormOrJoinGroup={() => setGroupModalOpen(true)}
                animate={justAcked === a.id}
              />
            ))}
          </div>
        )}
      </main>

      {groupModalOpen && (
        <Modal title="Form or join a group" onClose={() => setGroupModalOpen(false)}>
          <GroupModalBody
            existingGroups={courseGroups}
            onCreate={handleFormGroup}
            onJoin={handleJoinGroup}
          />
        </Modal>
      )}
    </div>
  );
}

function GroupRosterCard({ group, users, isCurrentUserGroup }) {
  const leader = users.find((u) => u.id === group.leaderId);
  const members = group.memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  return (
    <div className={`rounded-sm border px-4 py-3 ${
      isCurrentUserGroup
        ? "border-[var(--color-brass)] bg-[var(--color-brass-tint)]/40"
        : "border-[var(--color-line)] bg-[var(--color-surface)]"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-semibold text-[var(--color-ink)]">{group.name}</p>
          <p className="text-xs font-mono text-[var(--color-ink-faint)]">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isCurrentUserGroup && (
          <span className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[var(--color-brass-dark)]">
            Your group
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-ink-soft)]">{member.name}</span>
            {member.id === leader?.id ? (
              <span className="rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                Leader
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">
                Member
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupModalBody({ existingGroups, onCreate, onJoin }) {
  const [mode, setMode] = useState(existingGroups.length > 0 ? "join" : "create");
  const [name, setName] = useState("");

  return (
    <div>
      {existingGroups.length > 0 && (
        <div className="flex rounded-sm border border-[var(--color-line)] overflow-hidden mb-5 w-fit">
          {["join", "create"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition-colors cursor-pointer ${
                mode === m
                  ? "bg-[var(--color-navy)] text-[var(--color-paper-2)]"
                  : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)]"
              }`}
            >
              {m === "join" ? "Join existing" : "Form new"}
            </button>
          ))}
        </div>
      )}

      {mode === "join" ? (
        <div className="space-y-2">
          {existingGroups.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)]">No groups exist yet for this course — form the first one.</p>
          ) : (
            existingGroups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-sm border border-[var(--color-line)] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[var(--color-ink)]">{g.name}</p>
                  <p className="text-xs font-mono text-[var(--color-ink-faint)]">
                  {g.memberIds.length} member{g.memberIds.length !== 1 ? "s" : ""} · leader: {g.leaderId}
                </p>
                </div>
                <button
                  onClick={() => onJoin(g)}
                  className="rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] font-semibold px-3.5 py-1.5 text-sm hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer"
                >
                  Join
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onCreate(name.trim());
          }}
        >
          <Field label="Group name">
            <input
              className={inputCls}
              placeholder="Team Recursion"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <p className="text-xs text-[var(--color-ink-faint)] mb-4">
            You'll be set as the group leader, able to acknowledge submissions on the group's behalf.
          </p>
          <button
            type="submit"
            className="w-full rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] font-semibold py-2.5 text-sm hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer"
          >
            Create group
          </button>
        </form>
      )}
    </div>
  );
}

function AssignmentCard({ assignment: a, myGroup, onAcknowledge, onFormOrJoinGroup, animate }) {
  const overdue = isPast(a.deadline);
  const noGroup = a.submissionType === "group" && !myGroup;

  return (
    <div className="fade-up rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-line)]/80 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-display text-xl text-[var(--color-ink)]">{a.title}</h3>
            <span className="font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[var(--color-brass-tint)] text-[var(--color-brass-dark)]">
              {a.submissionType}
            </span>
          </div>
          <p className={`text-xs font-mono ${a.status === "late" || (overdue && a.status !== "acknowledged") ? "text-[var(--color-stamp-red)]" : "text-[var(--color-ink-faint)]"}`}>
            Due {formatDeadline(a.deadline)} · {a.status === "late" ? "Submitted after deadline" : overdue ? "Deadline passed" : timeRemaining(a.deadline)}
          </p>
        </div>
        <Stamp status={a.status} animate={animate} />
      </div>

      <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed mb-4">{a.description}</p>

      <a
        href={a.oneDriveLink}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-[var(--color-brass-dark)] font-medium hover:underline"
      >
        Open OneDrive submission folder ↗
      </a>

      <div className="mt-4 pt-4 border-t border-[var(--color-line-soft)]">
        {noGroup ? (
          <div className="rounded-sm bg-[var(--color-stamp-red-tint)] border border-[var(--color-stamp-red)]/25 px-3 py-2.5">
            <p className="text-sm text-[var(--color-stamp-red)] mb-2.5">
              You are not part of any group. Form or join one to submit this assignment.
            </p>
            <button
              onClick={onFormOrJoinGroup}
              className="rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] font-semibold px-3.5 py-1.5 text-xs hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer"
            >
              Form or join a group
            </button>
          </div>
        ) : a.myAck ? (
          <div className={`rounded-sm border px-3 py-2.5 ${a.submittedLate ? "border-[var(--color-stamp-red)]/30 bg-[var(--color-stamp-red-tint)]" : "border-[var(--color-line)] bg-[var(--color-paper)]"}`}>
            <p className={`text-sm font-semibold ${a.submittedLate ? "text-[var(--color-stamp-red)]" : "text-[var(--color-ink)]"}`}>
              {a.submittedLate ? "Late submission acknowledged" : "Acknowledged"}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              {a.submissionType === "group"
                ? `Submitted by ${a.ackedByUser?.name ?? "the group leader"} (Group Leader) on behalf of ${myGroup.name}`
                : "Submitted by you"}
              {a.submittedLate ? " · After the deadline" : ""} · {formatTimestamp(a.myAck.timestamp)}
            </p>
            {a.submissionType === "group" && (
              <p className={`text-xs font-semibold mt-1.5 ${a.submittedLate ? "text-[var(--color-stamp-red)]" : "text-[var(--color-stamp-green)]"}`}>
                {a.submittedLate
                  ? "Your group leader submitted this after the deadline."
                  : "Your group leader submitted this for the entire group."}
              </p>
            )}
          </div>
        ) : a.submissionType === "group" && !a.isLeaderOfGroup ? (
          <div className="rounded-sm border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Leader acknowledgment required</p>
              <span className="rounded-sm bg-[var(--color-line-soft)] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">
                Member — cannot acknowledge
              </span>
            </div>
            <p className="text-sm text-[var(--color-ink-soft)]">
              <span className="font-semibold">{myGroup.name}</span> is led by the designated group leader. You cannot acknowledge this assignment yourself. Once the leader acknowledges, every group member will see “Acknowledged”.
            </p>
          </div>
        ) : (
          <button
            onClick={onAcknowledge}
            className="rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] font-semibold px-4 py-2 text-sm hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer"
          >
            {a.submissionType === "group" ? `Yes, I have submitted (for ${myGroup.name})` : "Yes, I have submitted"}
          </button>
        )}
      </div>
    </div>
  );
}

function Breadcrumb({ course }) {
  return (
    <p className="fade-up font-mono text-xs text-[var(--color-ink-faint)] mb-4">
      <Link to="/student" className="hover:text-[var(--color-brass-dark)]">
        Dashboard
      </Link>{" "}
      / {course.code}
    </p>
  );
}
