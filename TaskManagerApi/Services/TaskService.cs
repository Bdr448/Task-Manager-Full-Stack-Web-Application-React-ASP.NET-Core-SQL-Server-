using Microsoft.Data.SqlClient;
using TaskManagerApi.Models;
using SS.LoggingCore;

namespace TaskManagerApi.Services
{
    public class TaskService
    {
        private readonly IConfiguration _config;
        private readonly ILog _logger;

        public TaskService(IConfiguration config)
        {
            _config = config;
            _logger = new Log(() => new FileLogger());
        }

        private string Conn =>
            _config.GetConnectionString("BTConnection")!;

        public List<TaskItem> GetTasks(int userId)
        {
            _logger.Debug($"Fetching tasks for userId: {userId}");
            List<TaskItem> tasks = new();

            using SqlConnection conn = new SqlConnection(Conn);

            string query = @"
                SELECT * FROM BT_Tasks
                WHERE UserId=@uid AND IsDeleted=0
                ORDER BY CreatedAt DESC";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@uid", userId);

            conn.Open();
            var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                tasks.Add(new TaskItem
                {
                    TaskId = (int)reader["TaskId"],
                    Title = reader["Title"].ToString()!,
                    Description = reader["Description"].ToString()!,
                    Status = reader["Status"].ToString()!,
                    DueDate = (DateTime)reader["DueDate"],
                    CreatedAt = (DateTime)reader["CreatedAt"]
                });
            }

            _logger.Debug($"Retrieved {tasks.Count} tasks for userId: {userId}");
            return tasks;
        }
        public void UpdateTask(int id, TaskItem task)
        {
            using SqlConnection conn = new SqlConnection(Conn);

            string query = @"
        UPDATE BT_Tasks
        SET Title=@t,
            Description=@d,
            Status=@s,
            DueDate=@due
        WHERE TaskId=@id";

            SqlCommand cmd = new SqlCommand(query, conn);

            cmd.Parameters.AddWithValue("@t", task.Title);
            cmd.Parameters.AddWithValue("@d", task.Description);
            cmd.Parameters.AddWithValue("@s", task.Status);
            cmd.Parameters.AddWithValue("@due", task.DueDate);
            cmd.Parameters.AddWithValue("@id", id);

            conn.Open();
            cmd.ExecuteNonQuery();
        }



        public void AddTask(TaskItem task, int userId)
        {
            _logger.Debug($"Adding new task for userId: {userId}, Title: {task.Title}");
            using SqlConnection conn = new SqlConnection(Conn);

            string query = @"
                INSERT INTO BT_Tasks
                (Title, Description, Status, DueDate, UserId)
                VALUES (@t,@d,@s,@due,@uid)";

            SqlCommand cmd = new SqlCommand(query, conn);

            cmd.Parameters.AddWithValue("@t", task.Title);
            cmd.Parameters.AddWithValue("@d", task.Description);
            cmd.Parameters.AddWithValue("@s", task.Status);
            cmd.Parameters.AddWithValue("@due", task.DueDate);
            cmd.Parameters.AddWithValue("@uid", userId);

            conn.Open();
            cmd.ExecuteNonQuery();
            _logger.Debug($"Task added successfully for userId: {userId}");
        }

        public void SoftDelete(int taskId)
        {
            _logger.Debug($"Soft deleting taskId: {taskId}");
            using SqlConnection conn = new SqlConnection(Conn);

            string query =
                "UPDATE BT_Tasks SET IsDeleted=1 WHERE TaskId=@id";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@id", taskId);

            conn.Open();
            cmd.ExecuteNonQuery();
            _logger.Debug($"Task {taskId} deleted successfully");
        }
    }
}
