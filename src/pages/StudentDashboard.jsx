import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Navbar from "../components/Navbar";
import CourseCard from "../components/CourseCard";
import { CURRENT_SEMESTER } from "../data/mockData";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { coursesForStudent, assignmentsForCourse } = useData();

  const allCourses = coursesForStudent(user.id);
  const courses = allCourses.filter((c) => c.semester === CURRENT_SEMESTER);
  const pastCourses = allCourses.filter((c) => c.semester !== CURRENT_SEMESTER);

  return (
    <div className="min-h-screen paper-texture">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
        <div className="mb-10 fade-up">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-brass-dark)] mb-2">
            Student dashboard
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)]">
            Welcome, {user.name.split(" ")[0]}
          </h1>
          <p className="text-[var(--color-ink-soft)] mt-2">
            You're enrolled in {courses.length} course{courses.length !== 1 ? "s" : ""} this semester ({CURRENT_SEMESTER}).
          </p>
        </div>

        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const count = assignmentsForCourse(course.id).length;
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  stat={`${count} assignment${count !== 1 ? "s" : ""}`}
                />
              );
            })}
          </div>
        )}

        {pastCourses.length > 0 && (
          <details className="mt-10 fade-up">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-ink-faint)] hover:text-[var(--color-brass-dark)] transition-colors">
              {pastCourses.length} course{pastCourses.length !== 1 ? "s" : ""} from previous semesters
            </summary>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {pastCourses.map((course) => {
                const count = assignmentsForCourse(course.id).length;
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    stat={`${count} assignment${count !== 1 ? "s" : ""}`}
                  />
                );
              })}
            </div>
          </details>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="fade-up rounded-md border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-14 text-center">
      <p className="font-display text-xl text-[var(--color-ink)] mb-1.5">No enrollments yet</p>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Once you're enrolled in a course, it will show up here.
      </p>
    </div>
  );
}
