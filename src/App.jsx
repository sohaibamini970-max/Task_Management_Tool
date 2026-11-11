import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import TaskTracking from "./pages/TaskTracking";
import Layout from "./components/Layout";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
// import AdminTasks from "./pages/admin/AdminTasks";
import Messages from "./pages/admin/Messages";
import AdminCreateTasks from "./pages/admin/AdminCreateTasks";
import AdminAllTasks from "./pages/admin/AdminAllTasks";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

// Optional: restrict admin routes
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace /> : <Login />} />

      {/* Main Layout Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

        {/* Normal User Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tracking" element={<TaskTracking />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        {/* <Route path="/admin/tasks" element={<AdminRoute><AdminTasks /></AdminRoute>} /> */}
        <Route path="/admin/tracking" element={<AdminRoute><TaskTracking /></AdminRoute>} />
        <Route path="/admin/messages" element={<AdminRoute><Messages /></AdminRoute>} />
        <Route path="/admin/create-task" element={<AdminRoute><AdminCreateTasks /></AdminRoute>} />
        <Route path="/admin/all-tasks" element={<AdminRoute><AdminAllTasks /></AdminRoute>} />

        {/* Shared placeholder routes */}
        <Route path="/completed" element={<div className="text-slate-500">Completed page coming soon...</div>} />
        <Route path="/team" element={<div className="text-slate-500">Team page coming soon...</div>} />
        <Route path="/settings" element={<div className="text-slate-500">Settings page coming soon...</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (

    <BrowserRouter>
      <AuthProvider>
        <TaskProvider>
          <AppRoutes />
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>

  );
}