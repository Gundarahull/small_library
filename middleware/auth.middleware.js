const jwt = require("jsonwebtoken");
const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "JWT token is Missed",
        errors: "UnAuthorized",
      });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "JWT token is Missed",
        errors: "UnAuthorized",
      });
    }

    const isVerified = jwt.verify(token, process.env.SECRET_KEY);


    if (!isVerified) {
      return res.status(401).json({
        success: false,
        message: "JWT token is malformed",
        errors: "UnAuthorized",
      });
    }

    req.member = isVerified;
    next();
  } catch (error) {
    console.error("[AuthMiddleware Error]:", error);
    return res.status(401).json({
      success: false,
      message: "JWT token is malformed",
      errors: "UnAuthorized",
    });
  }
};

const authorizationMiddleware = async (req, res, next) => {
  try {
    const role = req.member.role;
    if (role !== "librarian") {
      return res.status(403).json({
        success: false,
        message: "Your not allowed to perform this Action",
        errors: "Forbidden",
      });
    }

    next();
  } catch (error) {
    console.error("[authorizationMiddleware Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Error at AuthorizationMiddleware",
      errors: error,
    });
  }
};

const authorizationMemberMiddleware = async (req, res, next) => {
  try {
    const role = req.member.role;
    if (role !== "member") {
      return res.status(403).json({
        success: false,
        message: "Your not allowed to perform this Action",
        errors: "Forbidden",
      });
    }

    next();
  } catch (error) {
    console.error("[authorizationMiddleware Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Error at AuthorizationMiddleware",
      errors: error,
    });
  }
};

module.exports = {
  authMiddleware,
  authorizationMiddleware,
  authorizationMemberMiddleware
};
