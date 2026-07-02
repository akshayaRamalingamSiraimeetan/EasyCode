import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth";
import toast from "react-hot-toast";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { username, email, password, confirmPassword } = formData;

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    try {
      setLoading(true);

      await register({
        username,
        email,
        password,
      });
      toast.success("Registration successful.");

      navigate("/login", {
        state: {
          message: "Registration successful. Please login.",
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>EasyCode</h1>

        <p>Create your account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              name="username"
              value={username}
              onChange={handleChange}
              placeholder="Enter username"
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter email"
              name="email"
              value={email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              name="password"
              onChange={handleChange}
              value={password}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
              name="confirmPassword"
              onChange={handleChange}
              value={confirmPassword}
            />
          </div>

          {error && <p className="message message-error">{error}</p>}

          <button className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
