namespace TaskManagerApi.DTOs
{
    public class TaskFilterRequest
    {
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public string? Category { get; set; }
        public string? SearchTerm { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string SortBy { get; set; } = "CreatedAt";
        public string SortOrder { get; set; } = "DESC";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class TaskStatsResponse
    {
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int HighPriorityTasks { get; set; }
    }

    public class PagedTaskResponse
    {
        public List<TaskManagerApi.Models.TaskItem> Tasks { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
