import express from "express";
import jwt from "jsonwebtoken";
import {
  authenticateFirebaseUser,
  protectUserRoute,
} from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
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

router.post(
  "/login",
  /**authenticateFirebaseUser,*/ async (req, res) => {
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
    const userName = name.slice(0, regNoIndex).trim();
    const regNo = name.slice(regNoIndex + 1).trim();
    const isFresher = regNo.startsWith("24");
    try {
      const currentUser = await User.findOne({ email });
      let user;
      if (currentUser) {
        user = currentUser;
      } else {
        user = await User.create({ name: userName, email, isFresher });
      }
      const { accessToken, refreshToken } = generateTokens(user._id);
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 60 * 60 * 24 * 7);
      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = expiresAt;
      await user.save();
      setCookies(res, accessToken, refreshToken);
      return res.status(currentUser ? 200 : 201).json({
        name: user.name,
        email: user.email,
        isFresher: user.isFresher,
        isEliminated: user.isEliminated,
        currentRound: user.currentRound,
        round1Status: user.rounds.round1.status,
        round2Status: user.rounds.round2.status,
        round3Status: user.rounds.round3.status,
      });
    } catch (err) {
      console.error(`Login Error: ${err.message}`);
      return res
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

router.post("/logout", protectUserRoute, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await User.findByIdAndUpdate(decoded.userId, {
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
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const accessToken = jwt.sign(
      { userId: user._id },
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
