import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp, 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter,
  FiCalendar, FiTag, FiFlag, FiLogOut, FiGrid, FiList
} from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { getTasks, addTask, deleteTask, updateTask, getTaskStats } from "../services/api";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selectedTask, setSelectedTask] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");

  // Filter states
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("CreatedAt");

  async function loadData() {
    try {
      const [tasksData, statsData] = await Promise.all([getTasks(), getTaskStats()]);
      setTasks(tasksData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (filterCategory && task.category !== filterCategory) return false;
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "DueDate") return new Date(a.dueDate) - new Date(b.dueDate);
    if (sortBy === "Priority") {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const isOverdue = (task) => new Date(task.dueDate) < new Date() && task.status !== "Completed";

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await addTask({ title, description, status, priority, category, dueDate: dueDate || new Date().toISOString() });
      await loadData();
      resetForm();
      setView("list");
    } catch (err) {
      alert("Failed to add task");
    }
  };

  const startEdit = (task) => {
    setSelectedTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setCategory(task.category);
    setDueDate(task.dueDate.split('T')[0]);
    setView("edit");
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      await updateTask(selectedTask.taskId, { ...selectedTask, title, description, status, priority, category, dueDate });
      await loadData();
      resetForm();
      setView("list");
    } catch (err) {
      alert("Failed to update task");
    }
  };

  const removeTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("Pending");
    setPriority("Medium");
    setCategory("General");
    setDueDate("");
    setSelectedTask(null);
  };

  const priorityColors = {
    Low: "bg-blue-100 text-blue-700 border-blue-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Critical: "bg-red-100 text-red-700 border-red-200"
  };

  const statusColors = {
    Pending: "bg-purple-100 text-purple-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700"
  };

  const statCards = [
    { icon: FiGrid, label: "Total Tasks", value: stats?.totalTasks || 0, color: "from-blue-500 to-blue-600", iconBg: "bg-blue-100 text-blue-600" },
    { icon: FiCheckCircle, label: "Completed", value: stats?.completedTasks || 0, color: "from-green-500 to-green-600", iconBg: "bg-green-100 text-green-600" },
    { icon: FiClock, label: "Pending", value: stats?.pendingTasks || 0, color: "from-yellow-500 to-yellow-600", iconBg: "bg-yellow-100 text-yellow-600" },
    { icon: FiTrendingUp, label: "In Progress", value: stats?.inProgressTasks || 0, color: "from-indigo-500 to-indigo-600", iconBg: "bg-indigo-100 text-indigo-600" },
    { icon: FiAlertCircle, label: "Overdue", value: stats?.overdueTasks || 0, color: "from-red-500 to-red-600", iconBg: "bg-red-100 text-red-600" },
    { icon: FiFlag, label: "High Priority", value: stats?.highPriorityTasks || 0, color: "from-pink-500 to-pink-600", iconBg: "bg-pink-100 text-pink-600" }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white p-6 flex flex-col shadow-2xl"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MdDashboard className="text-3xl" />
            Task Manager
          </h2>
        </motion.div>

        <nav className="flex-1 space-y-2">
          <motion.button
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("list")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              view === "list" ? "bg-white/20 shadow-lg" : "hover:bg-white/10"
            }`}
          >
            <FiList className="text-xl" />
            <span className="font-medium">Dashboard</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { resetForm(); setView("add"); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              view === "add" ? "bg-white/20 shadow-lg" : "hover:bg-white/10"
            }`}
          >
            <FiPlus className="text-xl" />
            <span className="font-medium">Add Task</span>
          </motion.button>
        </nav>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
          className="flex items-center gap-3 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg"
        >
          <FiLogOut className="text-xl" />
          <span className="font-medium">Logout</span>
        </motion.button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Stats Cards */}
        <AnimatePresence>
          {view === "list" && stats && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8"
            >
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 shadow-xl text-white`}
                >
                  <div className={`${stat.iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon className="text-2xl" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm opacity-90">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-800">
            {view === "list" && "My Tasks"}
            {view === "add" && "Create New Task"}
            {view === "edit" && "Edit Task"}
          </h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          {/* Task List View */}
          {view === "list" && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[250px] relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none cursor-pointer"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="">All Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>

                <select
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none cursor-pointer"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Urgent">Urgent</option>
                </select>

                <select
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="CreatedAt">Sort by Date</option>
                  <option value="DueDate">Sort by Due Date</option>
                  <option value="Priority">Sort by Priority</option>
                </select>
              </div>

              {loading && <p className="text-center py-12 text-gray-500">Loading tasks...</p>}

              {!loading && filteredTasks.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">No tasks found</h3>
                  <p className="text-gray-500">Create your first task to get started.</p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredTasks.map((task, index) => (
                    <motion.div
                      key={task.taskId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className={`border-2 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-2xl transition-all ${
                        isOverdue(task) ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex-1">{task.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>

                      <div className="flex gap-2 mb-4 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[task.status]}`}>
                          {task.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                          <FiTag className="text-xs" />
                          {task.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <FiCalendar className="text-indigo-500" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        {isOverdue(task) && <span className="text-red-600 font-bold">(Overdue!)</span>}
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startEdit(task)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-all shadow-md"
                        >
                          <FiEdit2 />
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeTask(task.taskId)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all shadow-md"
                        >
                          <FiTrash2 />
                          Delete
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Add/Edit Form */}
          {(view === "add" || view === "edit") && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={view === "add" ? handleAddTask : handleEditTask}
              className="max-w-2xl space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none cursor-pointer"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none cursor-pointer"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>General</option>
                    <option>Work</option>
                    <option>Personal</option>
                    <option>Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all"
                >
                  {view === "add" ? "💾 Save Task" : "✅ Update Task"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => { resetForm(); setView("list"); }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
