function Register() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>EasyCode</h1>

        <p>Create your account</p>

        <form>
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              placeholder="Enter username"
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
            />
          </div>

          <button className="btn-primary">
            Create Account
          </button>
        </form>

        <p>
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}

export default Register;