import { useState } from "react";
import {
  Plus,
  User,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  Clock,
  Save,
  Search,
} from "lucide-react";
import { useTasks } from "../../context/TaskContext";

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

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AdminCreateTasks() {
  const { tasks, createTask } = useTasks();
  const [query, setQuery] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    due: "",
    priority: "Medium",
    status: "Pending",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.assignee.trim()) return;

    createTask({
      ...formData,
      workBreakdown: [],
      challenges: [],
      submission: null,
    });

    // Reset form
    setFormData({
      title: "",
      description: "",
      assignee: "",
      due: "",
      priority: "Medium",
      status: "Pending",
    });
    alert("Task created and assigned successfully!");
  };

  const filteredTasks = tasks.filter((t) => 
    t.title.toLowerCase().includes(query.toLowerCase()) || 
    t.assignee.toLowerCase().includes(query.toLowerCase())
  );

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">Manage Tasks</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Create, assign, and view a summary of all tasks across the team.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT: CREATE TASK FORM */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 self-start">
          <h2 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2">
            <Plus size={18} className="text-primary-500" /> Create & Assign
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 dark:text-slate-200">Task Title *</label>
              <input
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Design new landing page"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 dark:text-slate-200">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Provide clear instructions..."
                className={inputClass + " resize-none"}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 dark:text-slate-200">Assign To *</label>
              <input
                required
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                placeholder="e.g. Sarah K."
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 dark:text-slate-200">Due Date</label>
              <input
                type="date"
                name="due"
                value={formData.due}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5 dark:text-slate-200">Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className={inputClass}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 dark:text-slate-200">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                  <option>Pending</option>
                  <option>In Progress</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition active:scale-95"
            >
              <Save size={16} /> Create Task
            </button>
          </form>
        </div>

        {/* RIGHT: TASK TABLE */}
        <div className="xl:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">
              <ListTodo size={18} className="text-primary-500" /> Task Directory
            </h2>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-bold whitespace-nowrap">Task Title</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap">Assignee</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap">Due Date</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate">
                        {t.title}
                      </p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">
                          {t.assignee[0]?.toUpperCase()}
                        </div>
                        {t.assignee}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={12} className="text-slate-400" /> {fmtDate(t.due)}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusColor[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${priorityColor[t.priority]}`}>
                        {t.priority}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-400 italic">
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}