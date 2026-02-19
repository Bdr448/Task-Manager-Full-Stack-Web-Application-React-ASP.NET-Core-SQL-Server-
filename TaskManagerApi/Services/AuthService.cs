using Microsoft.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;

namespace TaskManagerApi.Services
{
    public class AuthService
    {
        private readonly IConfiguration _config;

        public AuthService(IConfiguration config)
        {
            _config = config;
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
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool ValidateUser(string username, string password)
        {
            var connStr = _config.GetConnectionString("BTConnection");

            using SqlConnection conn = new SqlConnection(connStr);

            string query = @"SELECT PasswordHash
                             FROM AppUsers
                             WHERE Username=@u";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@u", username);

            conn.Open();

            var result = cmd.ExecuteScalar();

            if (result == null) return false;

            string storedHash = result.ToString();
            string inputHash = HashPassword(password);

            return storedHash == inputHash;
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

            if (result == null)
                throw new Exception("User not found");

            return Convert.ToInt32(result);
        }

    }
}
