import { useAuth } from "../context/AuthContext";
import ProfessorAssignments from "./ProfessorAssignments";
import StudentAssignments from "./StudentAssignments";

// A course click lands here from either dashboard; role decides which
// assignments experience to render for the same /course/:courseId route.
export default function CourseGate() {
  const { user } = useAuth();
  return user.role === "professor" ? <ProfessorAssignments /> : <StudentAssignments />;
}
