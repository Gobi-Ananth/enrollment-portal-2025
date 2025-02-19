import express from "express";
import jwt from "jsonwebtoken";
import {
  authenticateFirebaseUser,
  protectAdminRoute,
} from "../middleware/auth.middleware.js";
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

router.post("/login", /**authenticateFirebaseUser,*/ async (req, res) => {
  const { name, email } = req.body;
  if (
    !email ||
    email.trim().length === 0 ||
    !name ||
    name.trim().length === 0
  ) {
    return res.status(400).json({ message: "Email and name are required" });
  }
  const regNoIndex = name.lastIndexOf(" ");
  const adminName = name.slice(0, regNoIndex).trim();
  try {
    const currentAdmin = await Admin.findOne({ email });
    let admin;
    if (currentAdmin) {
      admin = currentAdmin;
    } else {
      admin = await Admin.create({ name: adminName, email });
    }
    const { accessToken, refreshToken } = generateTokens(admin._id);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 60 * 60 * 24 * 7);
    admin.refreshToken = refreshToken;
    admin.refreshTokenExpiresAt = expiresAt;
    await admin.save();
    setCookies(res, accessToken, refreshToken);
    return res.status(currentAdmin ? 200 : 201).json({
      name: admin.name,
      email: admin.email,
    });
  } catch (err) {
    console.error(`Login Error: ${err.message}`);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

router.post("/logout", protectAdminRoute, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await Admin.findByIdAndUpdate(decoded.adminId, {
        $unset: { refreshToken: 1, refreshTokenExpiresAt: 1 },
      });
    }
    res.clearCookie("accessToken", { httpOnly: true });
    res.clearCookie("refreshToken", { httpOnly: true });
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(`Logout Error: ${err.message}`);
    return res.status(500).json({ message: "Server error", err: err.message });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is missing" });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || admin.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const accessToken = jwt.sign(
      { adminId: admin._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    return res.json({ message: "Token refreshed" });
  } catch (err) {
    console.error(`Refresh Token Error: ${err.message}`);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

export default router;
