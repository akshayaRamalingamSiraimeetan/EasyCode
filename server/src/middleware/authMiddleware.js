const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  // [DIAGNOSTIC] Confirms middleware was entered
  console.log("[AUTH] middleware entered");

  try {
    const authHeader = req.headers.authorization;

    // [DIAGNOSTIC] Log header presence — value is truncated to avoid leaking full token
    console.log(
      "[AUTH] Authorization header:",
      authHeader
        ? authHeader.substring(0, 15) + "..." // show "Bearer <first7>" only
        : "(missing)"
    );

    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // [DIAGNOSTIC] Log the specific rejection reason
      console.log("[AUTH] rejecting request: missing or malformed Authorization header");
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // [DIAGNOSTIC] Confirm JWT was verified successfully
    console.log("[AUTH] JWT verified");

    // Attach user information to the request
    req.user = decoded;

    // [DIAGNOSTIC] Log the attached user (id only — never log full decoded payload)
    console.log("[AUTH] req.user:", { id: req.user?.id ?? req.user?.userId ?? req.user?.sub ?? "(no id field)" });

    // [DIAGNOSTIC] Confirm next() is about to be called
    console.log("[AUTH] calling next()");
    next();
  } catch (error) {
    // [DIAGNOSTIC] Log rejection with specific error message
    console.log("[AUTH] rejecting request: invalid or expired token —", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authenticate;
