using Microsoft.Data.SqlClient;
using TaskManagerApi.Models;
using SS.LoggingCore;
using TaskManagerApi.DTOs;

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
                    Priority = reader["Priority"]?.ToString() ?? "Medium",
                    Category = reader["Category"]?.ToString() ?? "General",
                    DueDate = (DateTime)reader["DueDate"],
                    CreatedAt = (DateTime)reader["CreatedAt"],
                    CompletedAt = reader["CompletedAt"] as DateTime?
                });
            }

            _logger.Debug($"Retrieved {tasks.Count} tasks for userId: {userId}");
            return tasks;
        }

        public PagedTaskResponse GetTasksFiltered(int userId, TaskFilterRequest filter)
        {
            _logger.Debug($"Fetching filtered tasks for userId: {userId}");
            List<TaskItem> tasks = new();

            using SqlConnection conn = new SqlConnection(Conn);

            var whereClauses = new List<string> { "UserId=@uid", "IsDeleted=0" };
            
            if (!string.IsNullOrEmpty(filter.Status))
                whereClauses.Add("Status=@status");
            if (!string.IsNullOrEmpty(filter.Priority))
                whereClauses.Add("Priority=@priority");
            if (!string.IsNullOrEmpty(filter.Category))
                whereClauses.Add("Category=@category");
            if (!string.IsNullOrEmpty(filter.SearchTerm))
                whereClauses.Add("(Title LIKE @search OR Description LIKE @search)");
            if (filter.FromDate.HasValue)
                whereClauses.Add("DueDate >= @fromDate");
            if (filter.ToDate.HasValue)
                whereClauses.Add("DueDate <= @toDate");

            string whereClause = string.Join(" AND ", whereClauses);
            string orderBy = $"ORDER BY {filter.SortBy} {filter.SortOrder}";

            string countQuery = $"SELECT COUNT(*) FROM BT_Tasks WHERE {whereClause}";
            string query = $@"
                SELECT * FROM BT_Tasks
                WHERE {whereClause}
                {orderBy}
                OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY";

            SqlCommand countCmd = new SqlCommand(countQuery, conn);
            SqlCommand cmd = new SqlCommand(query, conn);

            countCmd.Parameters.AddWithValue("@uid", userId);
            cmd.Parameters.AddWithValue("@uid", userId);
            cmd.Parameters.AddWithValue("@offset", (filter.Page - 1) * filter.PageSize);
            cmd.Parameters.AddWithValue("@pageSize", filter.PageSize);

            if (!string.IsNullOrEmpty(filter.Status))
            {
                countCmd.Parameters.AddWithValue("@status", filter.Status);
                cmd.Parameters.AddWithValue("@status", filter.Status);
            }
            if (!string.IsNullOrEmpty(filter.Priority))
            {
                countCmd.Parameters.AddWithValue("@priority", filter.Priority);
                cmd.Parameters.AddWithValue("@priority", filter.Priority);
            }
            if (!string.IsNullOrEmpty(filter.Category))
            {
                countCmd.Parameters.AddWithValue("@category", filter.Category);
                cmd.Parameters.AddWithValue("@category", filter.Category);
            }
            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                string searchParam = $"%{filter.SearchTerm}%";
                countCmd.Parameters.AddWithValue("@search", searchParam);
                cmd.Parameters.AddWithValue("@search", searchParam);
            }
            if (filter.FromDate.HasValue)
            {
                countCmd.Parameters.AddWithValue("@fromDate", filter.FromDate.Value);
                cmd.Parameters.AddWithValue("@fromDate", filter.FromDate.Value);
            }
            if (filter.ToDate.HasValue)
            {
                countCmd.Parameters.AddWithValue("@toDate", filter.ToDate.Value);
                cmd.Parameters.AddWithValue("@toDate", filter.ToDate.Value);
            }

            conn.Open();
            
            int totalCount = (int)countCmd.ExecuteScalar();
            var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                tasks.Add(new TaskItem
                {
                    TaskId = (int)reader["TaskId"],
                    Title = reader["Title"].ToString()!,
                    Description = reader["Description"].ToString()!,
                    Status = reader["Status"].ToString()!,
                    Priority = reader["Priority"]?.ToString() ?? "Medium",
                    Category = reader["Category"]?.ToString() ?? "General",
                    DueDate = (DateTime)reader["DueDate"],
                    CreatedAt = (DateTime)reader["CreatedAt"],
                    CompletedAt = reader["CompletedAt"] as DateTime?
                });
            }

            return new PagedTaskResponse
            {
                Tasks = tasks,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            };
        }

        public TaskStatsResponse GetTaskStats(int userId)
        {
            _logger.Debug($"Fetching task stats for userId: {userId}");
            
            using SqlConnection conn = new SqlConnection(Conn);

            string query = @"
                SELECT 
                    COUNT(*) as Total,
                    SUM(CASE WHEN Status='Completed' THEN 1 ELSE 0 END) as Completed,
                    SUM(CASE WHEN Status='Pending' THEN 1 ELSE 0 END) as Pending,
                    SUM(CASE WHEN Status='In Progress' THEN 1 ELSE 0 END) as InProgress,
                    SUM(CASE WHEN DueDate < GETDATE() AND Status != 'Completed' THEN 1 ELSE 0 END) as Overdue,
                    SUM(CASE WHEN Priority='High' OR Priority='Critical' THEN 1 ELSE 0 END) as HighPriority
                FROM BT_Tasks
                WHERE UserId=@uid AND IsDeleted=0";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@uid", userId);

            conn.Open();
            var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                return new TaskStatsResponse
                {
                    TotalTasks = reader.GetInt32(0),
                    CompletedTasks = reader.GetInt32(1),
                    PendingTasks = reader.GetInt32(2),
                    InProgressTasks = reader.GetInt32(3),
                    OverdueTasks = reader.GetInt32(4),
                    HighPriorityTasks = reader.GetInt32(5)
                };
            }

            return new TaskStatsResponse();
        }

        public void UpdateTask(int id, TaskItem task)
        {
            using SqlConnection conn = new SqlConnection(Conn);

            string query = @"
                UPDATE BT_Tasks
                SET Title=@t,
                    Description=@d,
                    Status=@s,
                    Priority=@p,
                    Category=@c,
                    DueDate=@due,
                    CompletedAt=@completed
                WHERE TaskId=@id";

            SqlCommand cmd = new SqlCommand(query, conn);

            cmd.Parameters.AddWithValue("@t", task.Title);
            cmd.Parameters.AddWithValue("@d", task.Description);
            cmd.Parameters.AddWithValue("@s", task.Status);
            cmd.Parameters.AddWithValue("@p", task.Priority);
            cmd.Parameters.AddWithValue("@c", task.Category);
            cmd.Parameters.AddWithValue("@due", task.DueDate);
            cmd.Parameters.AddWithValue("@completed", 
                task.Status == "Completed" ? (object)DateTime.UtcNow : DBNull.Value);
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
                (Title, Description, Status, Priority, Category, DueDate, UserId)
                VALUES (@t,@d,@s,@p,@c,@due,@uid)";

            SqlCommand cmd = new SqlCommand(query, conn);

            cmd.Parameters.AddWithValue("@t", task.Title);
            cmd.Parameters.AddWithValue("@d", task.Description);
            cmd.Parameters.AddWithValue("@s", task.Status);
            cmd.Parameters.AddWithValue("@p", task.Priority);
            cmd.Parameters.AddWithValue("@c", task.Category);
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
