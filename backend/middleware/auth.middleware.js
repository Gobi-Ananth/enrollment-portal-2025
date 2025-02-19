import jwt from "jsonwebtoken";
import admin from "../lib/firebase.js";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";

// Middleware to authenticate Firebase user before logging in
export const authenticateFirebaseUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized access denied" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error(`Firebase Authentication Error: ${err.message}`);
    return res.status(401).json({ message: "Unauthorized access denied" });
  }
};

// Middleware to authenticate user
export const protectUserRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized access denied" });
    }
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      req.user = user;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized access denied" });
      }
      throw err;
    }
  } catch (err) {
    console.error(`Protect User Route Error: ${err.message}`);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// Middleware to authenticate admin
export const protectAdminRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized access denied" });
    }
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const admin = await Admin.findById(decoded.adminId);
      if (!admin) {
        return res.status(401).json({ message: "Admin not found" });
      }
      req.user = admin;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized access denied" });
      }
      throw err;
    }
  } catch (err) {
    console.error(`Protect Admin Route Error: ${err.message}`);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
