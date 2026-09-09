import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Navbar from "../components/Navbar";
import CourseCard from "../components/CourseCard";
import Modal from "../components/Modal";
import CourseForm from "../components/CourseForm";
import { useState } from "react";
import { useToast } from "../context/ToastContext";

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const { coursesForProfessor, assignmentsForCourse, createCourse } = useData();
  const { notify } = useToast();
  const [courseModalOpen, setCourseModalOpen] = useState(false);

  const courses = coursesForProfessor(user.id);

  return (
    <div className="min-h-screen paper-texture">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
        <div className="mb-10 fade-up">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-brass-dark)] mb-2">
            Faculty dashboard
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)]">
            Your courses, {user.name.split(" ")[0]}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-[var(--color-ink-soft)]">{courses.length} course{courses.length !== 1 ? "s" : ""} this term. Open one to manage assignments.</p>
            <button onClick={() => setCourseModalOpen(true)} className="rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] font-semibold px-3.5 py-2 text-sm hover:bg-[var(--color-navy-2)] cursor-pointer">+ Create course</button>
          </div>
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
      </main>
      {courseModalOpen && (
        <Modal title="Create course" onClose={() => setCourseModalOpen(false)}>
          <CourseForm
            onCancel={() => setCourseModalOpen(false)}
            onSubmit={async (data) => {
              await createCourse(data);
              setCourseModalOpen(false);
              notify("Course created and published to students.", "success");
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="fade-up rounded-md border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-14 text-center">
      <p className="font-display text-xl text-[var(--color-ink)] mb-1.5">No courses assigned yet</p>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Once you're assigned to teach a course, it will appear here.
      </p>
    </div>
  );
}
