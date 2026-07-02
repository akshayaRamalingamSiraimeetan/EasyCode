import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { login } from "../services/auth";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message || "";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      const response = await login({
        email,
        password,
      });

      loginUser(response.data.token);

      navigate("/dashboard");
      toast.success("Welcome back!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed.");

      setError(error.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>EasyCode</h1>

        <p>Welcome back</p>

        {successMessage && (
          <p className="message message-success">{successMessage}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={password}
              onChange={handleChange}
            />
          </div>

          {error && <p className="message message-error">{error}</p>}

          <button className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
