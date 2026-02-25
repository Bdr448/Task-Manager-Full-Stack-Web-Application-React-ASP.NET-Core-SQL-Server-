import { useEffect, useState } from "react";
import { getTasks, addTask, deleteTask, updateTask, getTaskStats } from "../services/api";
import "./Dashboard.css";

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

  // Load tasks and stats
  async function loadData() {
    try {
      const [tasksData, statsData] = await Promise.all([
        getTasks(),
        getTaskStats()
      ]);
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

  // Filter tasks locally
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

  // Check if task is overdue
  const isOverdue = (task) => {
    return new Date(task.dueDate) < new Date() && task.status !== "Completed";
  };

  // Add task
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await addTask({
        title,
        description,
        status,
        priority,
        category,
        dueDate: dueDate || new Date().toISOString()
      });
      await loadData();
      resetForm();
      setView("list");
    } catch (err) {
      alert("Failed to add task");
    }
  };

  // Edit task
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
      await updateTask(selectedTask.taskId, {
        ...selectedTask,
        title,
        description,
        status,
        priority,
        category,
        dueDate
      });
      await loadData();
      resetForm();
      setView("list");
    } catch (err) {
      alert("Failed to update task");
    }
  };

  // Delete task
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

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>📋 Task Manager</h2>
        
        <button
          className={`nav-btn ${view === "list" ? "active" : ""}`}
          onClick={() => setView("list")}
        >
          📊 Dashboard
        </button>

        <button
          className={`nav-btn ${view === "add" ? "active" : ""}`}
          onClick={() => { resetForm(); setView("add"); }}
        >
          ➕ Add Task
        </button>

        <div style={{ flex: 1 }} />

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
        >
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats Cards */}
        {view === "list" && stats && (
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📝</div>
              <div>
                <div className="stat-value">{stats.totalTasks}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
            </div>

            <div className="stat-card completed">
              <div className="stat-icon">✅</div>
              <div>
                <div className="stat-value">{stats.completedTasks}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div>
                <div className="stat-value">{stats.pendingTasks}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>

            <div className="stat-card progress">
              <div className="stat-icon">🔄</div>
              <div>
                <div className="stat-value">{stats.inProgressTasks}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>

            <div className="stat-card overdue">
              <div className="stat-icon">⚠️</div>
              <div>
                <div className="stat-value">{stats.overdueTasks}</div>
                <div className="stat-label">Overdue</div>
              </div>
            </div>

            <div className="stat-card high-priority">
              <div className="stat-icon">🔥</div>
              <div>
                <div className="stat-value">{stats.highPriorityTasks}</div>
                <div className="stat-label">High Priority</div>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="page-header">
          <h1>
            {view === "list" && "My Tasks"}
            {view === "add" && "Create New Task"}
            {view === "edit" && "Edit Task"}
          </h1>
        </div>

        <div className="content-card">
          {/* Task List View */}
          {view === "list" && (
            <>
              {/* Filters */}
              <div className="filters">
                <input
                  type="text"
                  placeholder="🔍 Search tasks..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  className="filter-select"
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
                  className="filter-select"
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
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="CreatedAt">Sort by Date</option>
                  <option value="DueDate">Sort by Due Date</option>
                  <option value="Priority">Sort by Priority</option>
                </select>
              </div>

              {loading && <p>Loading tasks...</p>}

              {!loading && filteredTasks.length === 0 && (
                <div className="empty-state">
                  <h3>No tasks found</h3>
                  <p>Create your first task to get started.</p>
                </div>
              )}

              <div className="tasks-grid">
                {filteredTasks.map(task => (
                  <div
                    key={task.taskId}
                    className={`task-card ${isOverdue(task) ? "overdue-card" : ""}`}
                  >
                    <div className="task-header">
                      <h3>{task.title}</h3>
                      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>

                    <p className="task-description">{task.description}</p>

                    <div className="task-meta">
                      <span className={`status-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>
                        {task.status}
                      </span>
                      <span className="category-badge">{task.category}</span>
                    </div>

                    <div className="task-date">
                      📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                      {isOverdue(task) && <span className="overdue-text"> (Overdue!)</span>}
                    </div>

                    <div className="task-actions">
                      <button className="edit-btn" onClick={() => startEdit(task)}>
                        ✏️ Edit
                      </button>
                      <button className="delete-btn" onClick={() => removeTask(task.taskId)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Add/Edit Form */}
          {(view === "add" || view === "edit") && (
            <form
              onSubmit={view === "add" ? handleAddTask : handleEditTask}
              className="task-form"
            >
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    className="form-input"
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

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>General</option>
                    <option>Work</option>
                    <option>Personal</option>
                    <option>Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {view === "add" ? "💾 Save Task" : "✅ Update Task"}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => { resetForm(); setView("list"); }}
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
