using System.Data;
using Microsoft.Data.SqlClient;
using TaskManagerApi.DTOs;

namespace TaskManagerApi.Services
{
    public class UserService
    {
        private readonly IConfiguration _config;

        public UserService(IConfiguration config)
        {
            _config = config;
        }

        public bool ValidateUser(LoginRequest request)
        {
            var connectionString =
                _config.GetConnectionString("BTConnection");

            using SqlConnection conn = new SqlConnection(connectionString);

            string query = @"
                SELECT COUNT(1)
                FROM Users
                WHERE Username = @username
                AND Password = @password";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@username", request.Username);
            cmd.Parameters.AddWithValue("@password", request.Password);

            conn.Open();

            int count = (int)cmd.ExecuteScalar();

            return count > 0;
        }
    }
}
