const bcrypt = require("bcryptjs");

const User = require("../models/User");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // 2. Check username
    const usernameExists = await User.findOne({ username });

    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // 3. Check email
    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create user
    const user = new User({
      username,
      email,
      passwordHash,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please login.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = {
  register,
};