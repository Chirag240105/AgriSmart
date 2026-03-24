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
          const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
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

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

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