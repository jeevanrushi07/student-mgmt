import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import CourseCard from "../components/CourseCard";
import Modal from "../components/Modal";
import CourseForm from "../components/CourseForm";

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const { coursesForProfessor, assignmentsForCourse, students, createCourse, updateCourse, deleteCourse } = useData();
  const { notify } = useToast();
  const [modal, setModal] = useState(null);

  const courses = coursesForProfessor(user.id);

  const handleCreate = (data) => {
    createCourse({ ...data, professorId: user.id });
    setModal(null);
    notify("Course created and students enrolled.", "success");
  };

  const handleUpdate = (data) => {
    updateCourse(modal.id, data);
    setModal(null);
    notify("Course updated.", "success");
  };

  const handleDelete = (course) => {
    if (!confirm(`Delete "${course.name}" and all of its assignments? This can't be undone.`)) return;
    deleteCourse(course.id);
    notify("Course deleted.", "default");
  };

  return (
    <div className="min-h-screen paper-texture">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 fade-up">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-brass-dark)] mb-2">
              Faculty dashboard
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)]">
              Your courses, {user.name.split(" ")[0]}
            </h1>
            <p className="text-[var(--color-ink-soft)] mt-2">
              {courses.length} course{courses.length !== 1 ? "s" : ""}. Create courses, manage enrollment, and publish assignments to students.
            </p>
          </div>
          <button
            onClick={() => setModal("create")}
            className="rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] font-semibold px-4 py-2.5 text-sm hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer whitespace-nowrap"
          >
            + New course
          </button>
        </div>

        {courses.length === 0 ? (
          <EmptyState onCreate={() => setModal("create")} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const count = assignmentsForCourse(course.id).length;
              return (
                <div key={course.id} className="relative">
                  <CourseCard
                    course={course}
                    stat={`${count} assignment${count !== 1 ? "s" : ""} · ${course.studentIds.length} student${course.studentIds.length !== 1 ? "s" : ""}`}
                  />
                  <div className="absolute right-4 bottom-16 flex gap-2">
                    <button
                      onClick={(e) => { e.preventDefault(); setModal(course); }}
                      className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-soft)] hover:border-[var(--color-brass)] hover:text-[var(--color-brass-dark)]"
                    >
                      Manage
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(course); }}
                      className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-stamp-red)] hover:border-[var(--color-stamp-red)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {modal && (
        <Modal title={modal === "create" ? "Create course" : "Manage course"} onClose={() => setModal(null)}>
          <CourseForm
            initial={modal === "create" ? undefined : {
              code: modal.code,
              name: modal.name,
              semester: modal.semester,
              studentIds: modal.studentIds,
            }}
            students={students}
            submitLabel={modal === "create" ? "Create course" : "Save changes"}
            onCancel={() => setModal(null)}
            onSubmit={modal === "create" ? handleCreate : handleUpdate}
          />
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="fade-up rounded-md border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-14 text-center">
      <p className="font-display text-xl text-[var(--color-ink)] mb-1.5">No courses assigned yet</p>
      <p className="text-sm text-[var(--color-ink-soft)] mb-5">
        Create a course and enroll students to start publishing assignments.
      </p>
      <button onClick={onCreate} className="rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] font-semibold px-4 py-2.5 text-sm cursor-pointer">
        + Create your first course
      </button>
    </div>
  );
}
