import express from "express";
import jwt from "jsonwebtoken";
import authenticateFirebaseUser from "../middleware/auth.middleware.js";
import Admin from "../models/admin.model.js";

const router = express.Router();

const generateTokens = (adminId) => {
  const accessToken = jwt.sign({ adminId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ adminId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

router.post("/login", authenticateFirebaseUser, async (req, res) => {
  const { name, email } = req.user;
  if (
    !email ||
    email.trim().length === 0 ||
    !name ||
    name.trim().length === 0
  ) {
    return res.status(400).json({ message: "Email and name are required" });
  }
  const regNoIndex = name.lastIndexOf(" ");
  const userName = name.slice(0, regNoIndex).trim();
  try {
    const currentAdmin = await Admin.findOne({ email });
    let admin;
    if (currentAdmin) {
      admin = currentAdmin;
    } else {
      admin = await Admin.create({ name: userName, email });
    }
    const { accessToken, refreshToken } = generateTokens(admin._id);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 60 * 60 * 24 * 7);
    admin.refreshToken = refreshToken;
    admin.refreshTokenExpiresAt = expiresAt;
    await admin.save();
    setCookies(res, accessToken, refreshToken);
    return res
      .status(currentAdmin ? 200 : 201)
      .json({ name: admin.name, email: admin.email });
  } catch (error) {
    console.error(`Error logging in: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

export default router;
