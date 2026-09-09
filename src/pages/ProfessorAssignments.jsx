import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import AssignmentForm from "../components/AssignmentForm";
import ProgressBar from "../components/ProgressBar";
import { formatDeadline, isPast, timeRemaining } from "../utils/date";

export default function ProfessorAssignments() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const {
    courses,
    assignmentsForCourse,
    groupsForCourse,
    acknowledgmentsForAssignment,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  } = useData();
  const { notify } = useToast();

  const course = courses.find((c) => c.id === courseId);
  const [modal, setModal] = useState(null); // 'create' | assignment object for edit | null
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  if (!course) return <Navigate to="/professor" replace />;
  if (course.professorId !== user.id) return <Navigate to="/professor" replace />;

  const groups = groupsForCourse(course.id);
  const assignments = assignmentsForCourse(course.id);

  const enriched = assignments.map((a) => {
    const acks = acknowledgmentsForAssignment(a.id);
    let submitted, total;
    if (a.submissionType === "individual") {
      total = course.studentIds.length;
      submitted = acks.length;
    } else {
      total = groups.length;
      submitted = new Set(acks.map((ack) => ack.subjectId)).size;
    }
    const overdue = isPast(a.deadline);
    const lateCount = acks.filter((ack) => new Date(ack.timestamp).getTime() > new Date(a.deadline).getTime()).length;
    const submittedOnTimeCount = submitted - lateCount;
    const missingCount = Math.max(total - submitted, 0);
    const hasMultipleStates = [submittedOnTimeCount > 0, lateCount > 0, missingCount > 0].filter(Boolean).length > 1;
    const status = hasMultipleStates
      ? "mixed"
      : submitted === total && total > 0 && lateCount === 0
        ? "submitted"
        : submitted === total && total > 0 && lateCount > 0
          ? "late"
          : overdue && missingCount > 0
            ? "overdue"
            : "open";
    return { ...a, submitted, total, lateCount, status };
  });

  const filtered = enriched.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesQuery = a.title.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const handleCreate = async (data) => {
    await createAssignment({ ...data, courseId: course.id });
    setModal(null);
    notify("Assignment created.", "success");
  };

  const handleUpdate = async (data) => {
    await updateAssignment(modal.id, data);
    setModal(null);
    notify("Assignment updated.", "success");
  };

  const handleDelete = async (assignment) => {
    if (!confirm(`Delete "${assignment.title}"? This can't be undone.`)) return;
    await deleteAssignment(assignment.id);
    notify("Assignment deleted.", "default");
  };

  return (
    <div className="min-h-screen paper-texture">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
        <Breadcrumb course={course} />

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 fade-up">
          <div>
            <h1 className="font-display text-3xl text-[var(--color-ink)]">{course.name}</h1>
            <p className="text-[var(--color-ink-soft)] mt-1">
              {course.studentIds.length} students · {groups.length} groups · {assignments.length} assignments
            </p>
          </div>
          <button
            onClick={() => setModal("create")}
            className="rounded-sm bg-[var(--color-navy)] text-[var(--color-paper-2)] font-semibold px-4 py-2.5 text-sm hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer whitespace-nowrap"
          >
            + New assignment
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 fade-up">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assignments…"
            className="flex-1 min-w-[200px] rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brass)] transition-colors"
          />
          <div className="flex rounded-sm border border-[var(--color-line)] overflow-hidden">
            {[
              ["all", "All"],
              ["open", "Open"],
              ["submitted", "Submitted"],
              ["late", "Late"],
              ["overdue", "Overdue"],
              ["mixed", "Mixed"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  statusFilter === val
                    ? "bg-[var(--color-navy)] text-[var(--color-paper-2)]"
                    : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="fade-up rounded-md border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-14 text-center">
            <p className="font-display text-xl text-[var(--color-ink)] mb-1.5">Nothing here</p>
            <p className="text-sm text-[var(--color-ink-soft)]">Try a different search or filter, or create a new assignment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <AssignmentRow key={a.id} assignment={a} onEdit={() => setModal(a)} onDelete={() => handleDelete(a)} />
            ))}
          </div>
        )}
      </main>

      {modal && (
        <Modal title={modal === "create" ? "New assignment" : "Edit assignment"} onClose={() => setModal(null)}>
          <AssignmentForm
            initial={
              modal === "create"
                ? undefined
                : {
                    title: modal.title,
                    description: modal.description,
                    deadline: toLocalInputValue(modal.deadline),
                    oneDriveLink: modal.oneDriveLink,
                    submissionType: modal.submissionType,
                  }
            }
            submitLabel={modal === "create" ? "Create assignment" : "Save changes"}
            onCancel={() => setModal(null)}
            onSubmit={modal === "create" ? handleCreate : handleUpdate}
          />
        </Modal>
      )}
    </div>
  );
}

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AssignmentRow({ assignment: a, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const { courses, users, groupsForCourse, acknowledgmentsForAssignment } = useData();
  const groups = groupsForCourse(a.courseId);
  const acks = acknowledgmentsForAssignment(a.id);
  const course = courses.find((c) => c.id === a.courseId);
  const deadline = new Date(a.deadline).getTime();
  const now = Date.now();

  const people = a.submissionType === "individual"
    ? (course?.studentIds || []).map((studentId) => {
        const ack = acks.find((x) => x.subjectId === studentId);
        return {
          id: studentId,
          name: users.find((u) => u.id === studentId)?.name || "Unknown student",
          type: "student",
          ack,
        };
      })
    : groups.map((group) => ({
        id: group.id,
        name: group.name,
        type: "group",
        leader: users.find((u) => u.id === group.leaderId),
        ack: acks.find((x) => x.subjectId === group.id),
      }));

  const classify = (item) => {
    if (item.ack) {
      return new Date(item.ack.timestamp).getTime() <= deadline ? "submitted" : "late";
    }
    return now > deadline ? "overdue" : "pending";
  };

  const sections = {
    submitted: people.filter((p) => classify(p) === "submitted"),
    late: people.filter((p) => classify(p) === "late"),
    overdue: people.filter((p) => classify(p) === "overdue"),
    pending: people.filter((p) => classify(p) === "pending"),
  };
  const submittedCount = sections.submitted.length;
  const lateCount = sections.late.length;
  const overdueCount = sections.overdue.length;
  const pendingCount = sections.pending.length;
  const total = people.length;
  const overdueAssignment = now > deadline;

  return (
    <div className="fade-up rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer hover:bg-[var(--color-paper)]/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg text-[var(--color-ink)] truncate">{a.title}</h3>
            <span className="font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[var(--color-brass-tint)] text-[var(--color-brass-dark)]">
              {a.submissionType}
            </span>
          </div>
          <p className={`text-xs font-mono mt-1 ${overdueAssignment ? "text-[var(--color-stamp-red)]" : "text-[var(--color-ink-faint)]"}`}>
            Due {formatDeadline(a.deadline)}
          </p>
        </div>

        <div className="hidden sm:block w-44">
          <ProgressBar value={submittedCount + lateCount} total={total} label={a.submissionType === "individual" ? "Students submitted" : "Groups submitted"} />
        </div>

        <span className={`text-[var(--color-ink-faint)] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-[var(--color-line-soft)] fade-up">
          <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed mb-4">{a.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            <StatusSummary label="Submitted" value={submittedCount} />
            <StatusSummary label="Submitted late" value={lateCount} />
            <StatusSummary label="Overdue" value={overdueCount} />
            <StatusSummary label="Pending" value={pendingCount} />
          </div>

          <div className="space-y-4">
            <SubmissionSection title="Submitted" count={submittedCount} tone="green" items={sections.submitted} assignment={a} />
            <SubmissionSection title="Submitted Late" count={lateCount} tone="red" items={sections.late} assignment={a} />
            <SubmissionSection title="Overdue" count={overdueCount} tone="red" items={sections.overdue} assignment={a} />
            <SubmissionSection title="Pending" count={pendingCount} tone="muted" items={sections.pending} assignment={a} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm mt-5 pt-4 border-t border-[var(--color-line-soft)]">
            <a href={a.oneDriveLink} target="_blank" rel="noreferrer" className="text-[var(--color-brass-dark)] font-medium hover:underline">
              View OneDrive folder ↗
            </a>
            <span className="text-[var(--color-ink-faint)]">·</span>
            <span className="font-mono text-[var(--color-ink-faint)]">
              {submittedCount + lateCount}/{total} submitted
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={onEdit} className="rounded-sm border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-brass)] hover:text-[var(--color-brass-dark)] transition-colors cursor-pointer">
              Edit
            </button>
            <button onClick={onDelete} className="rounded-sm border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-stamp-red)] hover:border-[var(--color-stamp-red)] hover:bg-[var(--color-stamp-red-tint)] transition-colors cursor-pointer">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusSummary({ label, value }) {
  return (
    <div className="rounded-sm border border-[var(--color-line-soft)] bg-[var(--color-paper)] px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">{label}</p>
      <p className="font-display text-xl text-[var(--color-ink)] mt-0.5">{value}</p>
    </div>
  );
}

function SubmissionSection({ title, count, tone, items, assignment }) {
  if (count === 0) return null;
  const toneClass = tone === "green"
    ? "text-[var(--color-stamp-green)]"
    : tone === "red"
      ? "text-[var(--color-stamp-red)]"
      : "text-[var(--color-ink-soft)]";

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-mono text-[10px] uppercase tracking-widest font-semibold ${toneClass}`}>
          {title}
        </h4>
        <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">{count}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <SubmissionPerson key={item.id} item={item} assignment={assignment} />
        ))}
      </div>
    </section>
  );
}

function SubmissionPerson({ item, assignment }) {
  const submittedAt = item.ack?.timestamp;
  const leaderName = item.leader?.name;
  return (
    <div className="rounded-sm border border-[var(--color-line-soft)] bg-[var(--color-paper)] px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
            {item.name}
          </p>
          {item.type === "group" ? (
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              Submitted by <span className="font-semibold">{leaderName || "Group Leader"}</span> · Group Leader
            </p>
          ) : null}
        </div>
        {submittedAt ? (
          <span className="font-mono text-[10px] text-[var(--color-ink-faint)] whitespace-nowrap">
            {formatDeadline(submittedAt)}
          </span>
        ) : null}
      </div>
      {submittedAt && new Date(submittedAt).getTime() > new Date(assignment.deadline).getTime() && (
        <p className="text-xs text-[var(--color-stamp-red)] mt-1.5">
          Submitted after deadline
        </p>
      )}
      {!submittedAt && (
        <p className="text-xs text-[var(--color-stamp-red)] mt-1.5">
          No submission received
        </p>
      )}
    </div>
  );
}

function Breadcrumb({ course }) {
  return (
    <p className="fade-up font-mono text-xs text-[var(--color-ink-faint)] mb-4">
      <Link to="/professor" className="hover:text-[var(--color-brass-dark)]">
        Dashboard
      </Link>{" "}
      / {course.code}
    </p>
  );
}
