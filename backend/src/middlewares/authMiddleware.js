import jwt from "jsonwebtoken";
import { User } from "../models/User.models.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const publicPaths = [
      "/api/weather/current",
      "/api/weather/latest",
      "/api/prices/predict",
      "/api/prices/current"
    ];
    
    if (publicPaths.some(path => req.path.includes(path))) {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
      if (token) {
        try {
          // ✅ Fix 1: use JWT_SECRET_KEY (same key used in authController)
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
          // ✅ Fix 2: use decodedToken.id (controller signs with { id }, not { _id })
          const user = await User.findById(decodedToken?.id).select("-password -refreshToken");
          if (user) req.user = user;
        } catch (err) {
          // Invalid token, continue as guest
        }
      }
      return next();
    }

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }

    // ✅ Fix 1: use JWT_SECRET_KEY
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // ✅ Fix 2: use decodedToken.id
    const user = await User.findById(decodedToken?.id).select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error?.message || "Invalid access token" });
  }
};

// ✅ Alias for route files that import { protect }
export const protect = verifyJWT;

// ✅ Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};