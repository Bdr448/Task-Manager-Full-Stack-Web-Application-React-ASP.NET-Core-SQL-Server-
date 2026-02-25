using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskManagerApi.Models;
using TaskManagerApi.Services;
using TaskManagerApi.DTOs;

namespace TaskManagerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly TaskService _taskService;
        private readonly AuthService _authService;

        public TaskController(TaskService taskService,
                              AuthService authService)
        {
            _taskService = taskService;
            _authService = authService;
        }

        private int CurrentUserId()
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(username))
                throw new UnauthorizedAccessException("Invalid token");

            return _authService.GetUserId(username);
        }

        [HttpGet]
        public IActionResult GetTasks()
        {
            var tasks = _taskService.GetTasks(CurrentUserId());
            return Ok(tasks);
        }

        [HttpPost("filter")]
        public IActionResult GetTasksFiltered([FromBody] TaskFilterRequest filter)
        {
            var result = _taskService.GetTasksFiltered(CurrentUserId(), filter);
            return Ok(result);
        }

        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            var stats = _taskService.GetTaskStats(CurrentUserId());
            return Ok(stats);
        }

        [HttpPost]
        public IActionResult AddTask(TaskItem task)
        {
            _taskService.AddTask(task, CurrentUserId());
            return Ok(task);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, TaskItem task)
        {
            _taskService.UpdateTask(id, task);
            return Ok();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            _taskService.SoftDelete(id);
            return Ok();
        }
    }
}
