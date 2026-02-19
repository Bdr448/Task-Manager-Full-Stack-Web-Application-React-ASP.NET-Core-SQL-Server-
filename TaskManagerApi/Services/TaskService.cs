using Microsoft.Data.SqlClient;
using TaskManagerApi.Models;

namespace TaskManagerApi.Services
{
    public class TaskService
    {
        private readonly IConfiguration _config;

        public TaskService(IConfiguration config)
        {
            _config = config;
        }

        private string Conn =>
            _config.GetConnectionString("BTConnection");

        public List<TaskItem> GetTasks(int userId)
        {
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
                    Title = reader["Title"].ToString(),
                    Description = reader["Description"].ToString(),
                    Status = reader["Status"].ToString(),
                    DueDate = (DateTime)reader["DueDate"],
                    CreatedAt = (DateTime)reader["CreatedAt"]
                });
            }

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
        }

        public void SoftDelete(int taskId)
        {
            using SqlConnection conn = new SqlConnection(Conn);

            string query =
                "UPDATE BT_Tasks SET IsDeleted=1 WHERE TaskId=@id";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@id", taskId);

            conn.Open();
            cmd.ExecuteNonQuery();
        }
    }
}
