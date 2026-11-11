import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  User,
  Filter,
  TrendingUp,
  TrendingDown,
  FileText,
  Link2,
  ListTodo,
  Timer,
  XCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { useTasks } from "../context/TaskContext";

/* ---------- helpers ---------- */
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/* Returns: "on-time" | "late" | "upcoming" | "overdue" | "no-deadline" */
const getDeadlineState = (task) => {
  const today = startOfDay(new Date());

  if (task.submission?.submittedAt && task.due) {
    const submitted = startOfDay(task.submission.submittedAt);
    const due = startOfDay(task.due);
    if (submitted <= due) return "on-time";
    return "late";
  }

  if (task.due) {
    const due = startOfDay(task.due);
    if (due < today) return "overdue";
    return "upcoming";
  }

  return "no-deadline";
};

const deadlineLabel = {
  "on-time": "On Time",
  late: "Late",
  upcoming: "Upcoming",
  overdue: "Overdue",
  "no-deadline": "No Deadline",
};

const deadlineColor = {
  "on-time": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  late: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "no-deadline": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const statusColor = {
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const priorityColor = {
  High: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

/* Days difference between two dates (positive = late) */
const daysDiff = (later, earlier) => {
  if (!later || !earlier) return null;
  const a = startOfDay(later);
  const b = startOfDay(earlier);
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
};

export default function TaskTracking() {
  const { tasks } = useTasks();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filter from URL (?filter=completed | pending | overdue)
  const urlFilter = searchParams.get("filter") || "all";

  // Initial filter values derived from URL
  const initialStatus = urlFilter === "completed" ? "Completed" : "All";
  const initialDeadline =
    urlFilter === "pending"
      ? "upcoming"
      : urlFilter === "overdue"
      ? "overdue"
      : "All";

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [deadlineFilter, setDeadlineFilter] = useState(initialDeadline);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("timeline");

  // Re-sync filters whenever the URL param changes
  useEffect(() => {
    if (urlFilter === "completed") {
      setStatusFilter("Completed");
      setDeadlineFilter("All");
    } else if (urlFilter === "pending") {
      setStatusFilter("All");
      setDeadlineFilter("upcoming");
    } else if (urlFilter === "overdue") {
      setStatusFilter("All");
      setDeadlineFilter("overdue");
    } else {
      setStatusFilter("All");
      setDeadlineFilter("All");
    }
  }, [urlFilter]);

  // When the user changes a dropdown manually, clear the URL filter
  const handleStatusChange = (value) => {
    setStatusFilter(value);
    if (urlFilter !== "all") setSearchParams({});
  };
  const handleDeadlineChange = (value) => {
    setDeadlineFilter(value);
    if (urlFilter !== "all") setSearchParams({});
  };

  /* ---------- Computed metrics ---------- */
  const metrics = useMemo(() => {
    const submitted = tasks.filter((t) => t.submission);
    const pending = tasks.filter(
      (t) => t.status === "Pending" && !t.submission
    );
    const inProgress = tasks.filter(
      (t) => t.status === "In Progress" && !t.submission
    );
    const completed = tasks.filter((t) => t.status === "Completed");

    const overdue = tasks.filter(
      (t) => !t.submission && getDeadlineState(t) === "overdue"
    );
    const onTime = submitted.filter(
      (t) => getDeadlineState(t) === "on-time"
    ).length;
    const late = submitted.filter((t) => getDeadlineState(t) === "late").length;

    return {
      total: tasks.length,
      submitted: submitted.length,
      pending: pending.length,
      inProgress: inProgress.length,
      completed: completed.length,
      overdue: overdue.length,
      onTime,
      late,
    };
  }, [tasks]);

  /* ---------- Filtered list ---------- */
  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        const matchesQuery =
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.assignee.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === "All" || t.status === statusFilter;
        const matchesDeadline =
          deadlineFilter === "All" ||
          getDeadlineState(t) === deadlineFilter;
        return matchesQuery && matchesStatus && matchesDeadline;
      })
      .sort((a, b) => {
        const aSub = a.submission?.submittedAt;
        const bSub = b.submission?.submittedAt;
        if (aSub && bSub) return new Date(bSub) - new Date(aSub);
        if (aSub) return -1;
        if (bSub) return 1;
        return new Date(a.due || 0) - new Date(b.due || 0);
      });
  }, [tasks, query, statusFilter, deadlineFilter]);

  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">
          Task Tracking
          {urlFilter !== "all" && (
            <span className="text-base sm:text-lg font-semibold text-slate-500 dark:text-slate-400 ml-2 capitalize">
              · {urlFilter}
            </span>
          )}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Timeline of submissions, deadlines, and completion status.
        </p>
      </div>

      {/* ---------- Summary cards ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Submitted"
          value={metrics.submitted}
          icon={Send}
          gradient="from-emerald-500 to-teal-500"
          tint="bg-emerald-50 dark:bg-emerald-950/40"
          accent="text-emerald-600 dark:text-emerald-400"
          subtitle={`${metrics.onTime} on time · ${metrics.late} late`}
        />
        <MetricCard
          label="Pending"
          value={metrics.pending + metrics.inProgress}
          icon={Clock}
          gradient="from-amber-500 to-orange-500"
          tint="bg-amber-50 dark:bg-amber-950/40"
          accent="text-amber-600 dark:text-amber-400"
          subtitle={`${metrics.inProgress} in progress`}
        />
        <MetricCard
          label="Completed"
          value={metrics.completed}
          icon={CheckCircle2}
          gradient="from-indigo-500 to-purple-500"
          tint="bg-indigo-50 dark:bg-indigo-950/40"
          accent="text-indigo-600 dark:text-indigo-400"
          subtitle={`out of ${metrics.total} total`}
        />
        <MetricCard
          label="Overdue"
          value={metrics.overdue}
          icon={AlertTriangle}
          gradient="from-red-500 to-rose-500"
          tint="bg-red-50 dark:bg-red-950/40"
          accent="text-red-600 dark:text-red-400"
          subtitle="past due, not submitted"
        />
      </div>

      {/* ---------- Filters ---------- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or assignee..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-slate-100 transition"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="All">All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>

          <select
            value={deadlineFilter}
            onChange={(e) => handleDeadlineChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Deadlines</option>
            <option value="on-time">On Time</option>
            <option value="late">Late</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
          </select>

          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setView("timeline")}
              className={`px-3 py-2.5 text-sm font-bold transition ${
                view === "timeline"
                  ? "bg-primary-600 text-white"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-2.5 text-sm font-bold transition ${
                view === "table"
                  ? "bg-primary-600 text-white"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Main content ---------- */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <ListTodo size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            No tasks match your filters
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting the search or filters.
          </p>
        </div>
      ) : view === "timeline" ? (
        <TimelineView tasks={filtered} />
      ) : (
        <TableView tasks={filtered} />
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Showing {filtered.length} of {tasks.length} tasks
      </p>
    </div>
  );
}

/* ============================================================
   METRIC CARD — Vibrant with gradient accent
   ============================================================ */
function MetricCard({
  label,
  value,
  icon: Icon,
  gradient,
  tint,
  accent,
  subtitle,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ${tint}`}
    >
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

      {/* Soft gradient glow corner */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 dark:opacity-10 bg-gradient-to-br ${gradient}`}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
          >
            <Icon size={22} className="text-white" />
          </div>
        </div>
        <p className="text-3xl font-extrabold text-slate-800 dark:text-white">
          {value}
        </p>
        <p className={`text-sm font-bold mt-0.5 ${accent}`}>{label}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TIMELINE VIEW — Colored row per status
   ============================================================ */
function TimelineView({ tasks }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
      <div className="relative">
        {/* Gradient vertical line */}
        <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-300 via-amber-300 to-red-300 dark:from-emerald-800 dark:via-amber-800 dark:to-red-800" />

        <div className="space-y-4">
          {tasks.map((t) => {
            const state = getDeadlineState(t);
            const sub = t.submission;
            const isSubmitted = !!sub;
            const diff = sub?.submittedAt
              ? daysDiff(sub.submittedAt, t.due)
              : null;

            const dotBg = isSubmitted
              ? state === "late"
                ? "bg-gradient-to-br from-orange-400 to-orange-600"
                : "bg-gradient-to-br from-emerald-400 to-emerald-600"
              : state === "overdue"
              ? "bg-gradient-to-br from-red-400 to-red-600"
              : "bg-gradient-to-br from-slate-400 to-slate-600";

            const cardBorder = isSubmitted
              ? state === "late"
                ? "border-l-4 border-l-orange-400"
                : "border-l-4 border-l-emerald-400"
              : state === "overdue"
              ? "border-l-4 border-l-red-400"
              : "border-l-4 border-l-slate-300 dark:border-l-slate-600";

            const cardBg = isSubmitted
              ? state === "late"
                ? "bg-orange-50/60 dark:bg-orange-950/20"
                : "bg-emerald-50/60 dark:bg-emerald-950/20"
              : state === "overdue"
              ? "bg-red-50/60 dark:bg-red-950/20"
              : "bg-slate-50 dark:bg-slate-800/50";

            return (
              <div key={t.id} className="relative flex gap-4">
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg ${dotBg}`}
                  >
                    {isSubmitted ? (
                      <Send size={18} className="text-white" />
                    ) : state === "overdue" ? (
                      <AlertTriangle size={18} className="text-white" />
                    ) : (
                      <Clock size={18} className="text-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 pb-4">
                  <div
                    className={`rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition ${cardBg} ${cardBorder}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug">
                        {t.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColor[t.status]}`}
                        >
                          {t.status}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${deadlineColor[state]}`}
                        >
                          {deadlineLabel[state]}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${priorityColor[t.priority]}`}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                      <span className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-400" />
                        {t.assignee}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={12} className="text-slate-400" />
                        Deadline: {fmtDate(t.due)}
                      </span>
                      {isSubmitted && (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Send size={12} />
                          Submitted: {fmtDateTime(sub.submittedAt)}
                        </span>
                      )}
                    </div>

                    {isSubmitted && (
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {diff !== null && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                              diff > 0
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            }`}
                          >
                            {diff > 0 ? (
                              <>
                                <TrendingDown size={11} /> {diff} day
                                {diff === 1 ? "" : "s"} late
                              </>
                            ) : diff === 0 ? (
                              <>
                                <CheckCircle2 size={11} /> On due date
                              </>
                            ) : (
                              <>
                                <TrendingUp size={11} /> {Math.abs(diff)} day
                                {Math.abs(diff) === 1 ? "" : "s"} early
                              </>
                            )}
                          </span>
                        )}

                        {sub.links?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            <Link2 size={11} /> {sub.links.length} link
                            {sub.links.length === 1 ? "" : "s"}
                          </span>
                        )}

                        {sub.files?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            <FileText size={11} /> {sub.files.length} file
                            {sub.files.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    )}

                    {sub?.links?.[0] && (
                      <a
                        href={sub.links[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline truncate max-w-full"
                      >
                        <ExternalLink size={11} /> {sub.links[0]}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TABLE VIEW — Color-tinted rows
   ============================================================ */
function TableView({ tasks }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">
              <th className="px-4 py-3 font-bold">Task</th>
              <th className="px-4 py-3 font-bold">Assignee</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Deadline</th>
              <th className="px-4 py-3 font-bold">Submitted</th>
              <th className="px-4 py-3 font-bold">Timing</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const state = getDeadlineState(t);
              const sub = t.submission;
              const diff = sub?.submittedAt
                ? daysDiff(sub.submittedAt, t.due)
                : null;

              const rowTint = sub
                ? state === "late"
                  ? "bg-orange-50/40 dark:bg-orange-950/10 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                  : "bg-emerald-50/40 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                : state === "overdue"
                ? "bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/50";

              return (
                <tr
                  key={t.id}
                  className={`border-b border-slate-100 dark:border-slate-800 last:border-0 transition ${rowTint}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {t.title}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${priorityColor[t.priority]}`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                    {t.assignee}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${statusColor[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {fmtDate(t.due)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit ${deadlineColor[state]}`}
                      >
                        {deadlineLabel[state]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {sub?.submittedAt ? (
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {fmtDateTime(sub.submittedAt)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">
                        Not submitted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {diff !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                          diff > 0
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        }`}
                      >
                        {diff > 0 ? (
                          <>
                            <TrendingDown size={11} /> {diff}d late
                          </>
                        ) : diff === 0 ? (
                          <>
                            <CheckCircle2 size={11} /> On time
                          </>
                        ) : (
                          <>
                            <TrendingUp size={11} /> {Math.abs(diff)}d early
                          </>
                        )}
                      </span>
                    ) : state === "overdue" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        <XCircle size={11} /> Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Timer size={11} /> Awaiting
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}