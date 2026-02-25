import { useEffect, useState } from "react";
import { getTasks, addTask, deleteTask } from "../services/api";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW STATES (dashboard control)
  const [view, setView] = useState("list"); // list | add | edit
  const [selectedTask, setSelectedTask] = useState(null);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");

  // ================= LOAD TASKS =================
  async function loadTasks() {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  // ================= ADD TASK (UI ONLY FOR NOW) =================
  const handleAddTask = async (e) => {
  e.preventDefault();

  try {
    await addTask({
      title,
      description,
      status,
      dueDate: new Date().toISOString()
    });

    await loadTasks(); // reload from DB

    setTitle("");
    setDescription("");
    setStatus("Pending");

    setView("list");
  } catch (err) {
    alert("Failed to add task");
    console.error(err);
  }
};


  // ================= EDIT TASK =================
  const startEdit = (task) => {
    setSelectedTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setView("edit");
  };

  const handleEditTask = (e) => {
    e.preventDefault();

    const updated = tasks.map(t =>
      t.taskId === selectedTask.taskId
        ? { ...t, title, description, status }
        : t
    );

    setTasks(updated);
    setView("list");
  };

  // ================= DELETE =================
const removeTask = async (id) => {
  try {
    await deleteTask(id);
    await loadTasks();
  } catch (err) {
    console.error(err);
  }
};


  // ================= UI =================
return (
  <div style={{ display: "flex", minHeight: "100vh", background:"#f3f4f6" }}>

    {/* ================= SIDEBAR ================= */}
    <aside style={sidebar}>
      <h2 style={{ marginBottom: "30px" }}>Task Manager</h2>

      <button
        style={navBtn(view === "list")}
        onClick={() => setView("list")}
      >
         My Tasks
      </button>

      <button
        style={navBtn(view === "add")}
        onClick={() => setView("add")}
      >
         Add Task
      </button>

      <div style={{ flex: 1 }} />

      <button
        style={logoutBtn}
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </aside>


    {/* ================= MAIN AREA ================= */}
    <main style={{ flex: 1, padding: "40px" }}>

      {/* HEADER */}
      <div style={pageHeader}>
        <h1>
          {view === "list" && "My Tasks"}
          {view === "add" && "Create Task"}
          {view === "edit" && "Edit Task"}
        </h1>
        <p style={{ color: "#6b7280" }}>
          Manage your daily work efficiently
        </p>
      </div>


      <div style={contentCard}>

        {/* ================= TASK LIST ================= */}
        {view === "list" && (
          <>
            {loading && <p>Loading tasks...</p>}

            {!loading && tasks.length === 0 && (
              <div style={emptyState}>
                <h3>No tasks yet</h3>
                <p>Create your first task to get started.</p>
              </div>
            )}

            <div style={grid}>
              {tasks.map(task => (
                <div key={task.taskId} style={taskCard}>
                  <h3>{task.title}</h3>

                  <p style={{ color:"#6b7280" }}>
                    {task.description}
                  </p>

                  <span style={statusBadge(task.status)}>
                    {task.status}
                  </span>

                  <div style={{ marginTop: "16px" }}>
                    <button
                      style={editBtn}
                      onClick={() => startEdit(task)}
                    >
                      Edit
                    </button>

                    <button
                      style={deleteBtn}
                      onClick={() => removeTask(task.taskId)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ================= ADD / EDIT FORM ================= */}
        {(view === "add" || view === "edit") && (
          <form
            onSubmit={view === "add" ? handleAddTask : handleEditTask}
            style={form}
          >
            <div>
              <label>Title</label>
              <input
                style={input}
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Description</label>
              <textarea
                style={input}
                rows={4}
                value={description}
                onChange={(e)=>setDescription(e.target.value)}
              />
            </div>

            <div>
              <label>Status</label>
              <select
                style={input}
                value={status}
                onChange={(e)=>setStatus(e.target.value)}
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>

            <button style={primaryBtn}>
              {view === "add" ? "Save Task" : "Update Task"}
            </button>
          </form>
        )}

      </div>
    </main>
  </div>
);

}

/* ================= STYLES ================= */

const sidebar = {
  width: "240px",
  background: "#4f46e5",
  color: "white",
  padding: "28px",
  display: "flex",
  flexDirection: "column"
};

const navBtn = (active) => ({
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  background: active ? "#a7a4da" : "#433f84",
  color: "white",
  textAlign: "left"
});

const logoutBtn = {
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#000000",
  color: "white",
  cursor: "pointer"
};

const pageHeader = {
  marginBottom: "24px"
};

const contentCard = {
  background: "#fff",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
  gap: "18px"
};

const taskCard = {
  border: "1px solid #eee",
  borderRadius: "12px",
  padding: "18px",
  transition: "0.2s",
  background:"#fafafa"
};

const statusBadge = (status) => ({
  display:"inline-block",
  marginTop:"8px",
  padding:"4px 10px",
  borderRadius:"999px",
  fontSize:"12px",
  background:
    status==="Completed" ? "#dcfce7" :
    status==="In Progress" ? "#fef3c7" :
    "rgb(239 208 255)"
});

const form = {
  maxWidth:"500px",
  display:"flex",
  flexDirection:"column",
  gap:"16px"
};

const input = {
  width:"100%",
  padding:"10px",
  borderRadius:"8px",
  border:"1px solid #d1d5db",
  marginTop:"6px"
};

const primaryBtn = {
  marginTop:"10px",
  padding:"12px",
  background:"#2563eb",
  color:"white",
  border:"none",
  borderRadius:"8px",
  cursor:"pointer"
};

const editBtn = {
  marginRight:"10px",
  padding:"6px 12px",
  borderRadius:"6px",
  border:"none",
  background:"#2563eb",
  color:"white",
  cursor:"pointer"
};

const deleteBtn = {
  padding:"6px 12px",
  borderRadius:"6px",
  border:"none",
  background:"#ef4444",
  color:"white",
  cursor:"pointer"
};

const emptyState = {
  textAlign:"center",
  padding:"40px",
  color:"#6b7280"
};
