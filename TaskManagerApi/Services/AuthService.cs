using Microsoft.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using SS.LoggingCore;

namespace TaskManagerApi.Services
{
    public class AuthService
    {
        private readonly IConfiguration _config;
        private readonly ILog _logger;

        public AuthService(IConfiguration config)
        {
            _config = config;
            _logger = new Log(() => new FileLogger());
        }

        private string HashPassword(string password)
        {
            using SHA256 sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        public bool Register(string username, string email, string password)
        {
            _logger.Debug($"Registration attempt for username: {username}");
            var connStr = _config.GetConnectionString("BTConnection");

            using SqlConnection conn = new SqlConnection(connStr);

            string query = @"INSERT INTO AppUsers
                             (Username, Email, PasswordHash)
                             VALUES (@u,@e,@p)";

            SqlCommand cmd = new SqlCommand(query, conn);

            cmd.Parameters.AddWithValue("@u", username);
            cmd.Parameters.AddWithValue("@e", email);
            cmd.Parameters.AddWithValue("@p", HashPassword(password));

            conn.Open();
            var result = cmd.ExecuteNonQuery() > 0;
            _logger.Debug($"Registration {(result ? "successful" : "failed")} for: {username}");
            return result;
        }

        public bool ValidateUser(string username, string password)
        {
            _logger.Debug($"Login attempt for username: {username}");
            var connStr = _config.GetConnectionString("BTConnection");

            using SqlConnection conn = new SqlConnection(connStr);

            string query = @"SELECT PasswordHash
                             FROM AppUsers
                             WHERE Username=@u";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@u", username);

            conn.Open();

            var result = cmd.ExecuteScalar();

            if (result == null)
            {
                _logger.Error($"Login failed - user not found: {username}");
                return false;
            }

            string storedHash = result.ToString()!;
            string inputHash = HashPassword(password);

            var isValid = storedHash == inputHash;
            _logger.Debug($"Login {(isValid ? "successful" : "failed")} for: {username}");
            return isValid;
        }
        public int GetUserId(string username)
        {
            var connStr = _config.GetConnectionString("BTConnection");

            using SqlConnection conn = new SqlConnection(connStr);

            string query = "SELECT Id FROM AppUsers WHERE Username=@u";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@u", username);

            conn.Open();

            var result = cmd.ExecuteScalar();

            return result is null 
                ? throw new Exception("User not found")
                : Convert.ToInt32(result);
        }

    }
}
