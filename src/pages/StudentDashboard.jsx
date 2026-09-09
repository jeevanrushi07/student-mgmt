import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Navbar from "../components/Navbar";
import CourseCard from "../components/CourseCard";
import { CURRENT_SEMESTER } from "../data/mockData";
import { useToast } from "../context/ToastContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { courses: allCoursesData, coursesForStudent, assignmentsForCourse, enrollCourse } = useData();
  const { notify } = useToast();

  const allCourses = coursesForStudent(user.id);
  const courses = allCourses.filter((c) => c.semester === CURRENT_SEMESTER);
  const pastCourses = allCourses.filter((c) => c.semester !== CURRENT_SEMESTER);
  const availableCourses = allCoursesData.filter((c) => c.semester === CURRENT_SEMESTER && !c.studentIds.includes(user.id));

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

        {availableCourses.length > 0 && (
          <section className="mt-10 fade-up">
            <div className="mb-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-brass-dark)] mb-1">Available courses</p>
              <p className="text-sm text-[var(--color-ink-soft)]">Courses published by professors. Enroll to access their assignments.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCourses.map((course) => (
                <div key={course.id} className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                  <p className="font-mono text-xs text-[var(--color-brass-dark)]">{course.code}</p>
                  <h3 className="font-display text-xl text-[var(--color-ink)] mt-1">{course.name}</h3>
                  <p className="text-sm text-[var(--color-ink-soft)] mt-1">{course.semester}</p>
                  <button
                    onClick={async () => { await enrollCourse(course.id); notify(`Enrolled in ${course.code}.`, "success"); }}
                    className="mt-4 rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] px-3.5 py-2 text-sm font-semibold hover:bg-[var(--color-navy-2)] cursor-pointer"
                  >
                    Enroll
                  </button>
                </div>
              ))}
            </div>
          </section>
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
