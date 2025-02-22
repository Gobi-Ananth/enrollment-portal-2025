import express from "express";
import jwt from "jsonwebtoken";
import {
  authenticateFirebaseUser,
  protectUserRoute,
} from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";
import Slot from "../models/slot.model.js";
import mongoose from "mongoose";

const router = express.Router();

// Generate access and refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

// Set access and refresh token in users cookies
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

// Login user
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
      return res
        .status(400)
        .json({ success: false, message: "Email and name are required" });
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
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isEliminated: user.isEliminated,
          currentRound: user.currentRound,
          round0Status: user.round0.status,
          round1Status: user.rounds.round1.status,
          round2Status: user.rounds.round2.status,
          round3Status: user.rounds.round3.status,
        },
      });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Logout user
router.post("/logout", async (req, res) => {
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
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", err: err.message });
  }
});

// Refresh user access token
router.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token is required" });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
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
    return res
      .status(200)
      .json({ success: true, message: "Token refreshed successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Get user data
router.get("/", protectUserRoute, async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEliminated: user.isEliminated,
        currentRound: user.currentRound,
        round0Status: user.round0.status,
        round1Status: user.rounds.round1.status,
        round2Status: user.rounds.round2.status,
        round3Status: user.rounds.round3.status,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Round 0 submission
router.post("/round0-submission", protectUserRoute, async (req, res) => {
  try {
    const user = req.user;
    const {
      contactNo,
      branch,
      githubProfile,
      projectLink,
      projectText,
      domain,
      answer1,
      answer2,
      answer3,
      answer4,
      answer5,
      managementQuestion,
      managementAnswer,
    } = req.body;
    if (!contactNo || !/^[6789]\d{9}$/.test(contactNo)) {
      return res.status(400).json({
        success: false,
        message: "Valid Indian contact number is required",
      });
    }
    if (!branch || branch.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Branch is required" });
    }
    if (
      githubProfile &&
      !/^https:\/\/github\.com\/[a-zA-Z0-9-_.]+$/.test(githubProfile)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Valid GitHub profile is required" });
    }
    if (!domain || !Array.isArray(domain) || domain.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Domain selection is required" });
    }
    if (!managementQuestion) {
      return res
        .status(400)
        .json({ success: false, message: "Management question is required" });
    }
    const answers = [
      answer1,
      answer2,
      answer3,
      answer4,
      answer5,
      managementAnswer,
    ];
    if (answers.some((ans) => !ans || ans.trim().length === 0)) {
      return res
        .status(400)
        .json({ success: false, message: "All answers are required" });
    }
    if (user.currentRound === 0 && user.round0.status === "pending") {
      user.round0 = {
        contactNo,
        branch,
        githubProfile: githubProfile || null,
        projectLink: projectLink || null,
        projectText: projectText || null,
        domain,
        answer1,
        answer2,
        answer3,
        answer4,
        answer5,
        managementQuestion,
        managementAnswer,
      };
      user.round0.status = "completed";
      user.currentRound = 1;
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Round 0 submission successful",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "You are not eligible for Round 0 submission",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Get all available slots
router.get(
  "/get-available-slots/:roundNo",
  protectUserRoute,
  async (req, res) => {
    let { roundNo } = req.params;
    const user = req.user;
    roundNo = parseInt(roundNo);
    if (isNaN(roundNo) || roundNo < 1 || roundNo > 3) {
      return res.status(400).json({
        success: false,
        message: "Invalid round number. Must be 1, 2, or 3.",
      });
    }
    if (
      user.rounds[`round${roundNo}`]?.status === "completed" ||
      user.rounds[`round${roundNo}`]?.status === "pending"
    ) {
      return res.status(403).json({
        success: false,
        message: `You cannot book a slot for round ${roundNo} as it is already ${
          user.rounds[`round${roundNo}`].status
        }.`,
      });
    }
    try {
      const currentTime = new Date();
      const slots = await Slot.find({
        round: roundNo,
        isAvailable: true,
        // slotTime: { $gt: currentTime },
      });
      return res
        .status(200)
        .json({ success: true, totalSlots: slots.length, data: slots });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Slot selection by user
router.put("/select-slot/:slotId", protectUserRoute, async (req, res) => {
  try {
    const user = req.user;
    const { slotId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid slot ID" });
    }
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }
    if (!slot.isAvailable) {
      return res.status(400).json({ message: "Slot is not available" });
    }
    const max = 3;
    if (!slot.users) {
      slot.users = [];
    }
    if (slot.round === 1) {
      if (["completed", "pending"].includes(user.rounds.round1.status)) {
        return res
          .status(400)
          .json({ success: false, message: "You have already booked a slot" });
      }
      slot.users = [user._id];
      slot.isAvailable = false;
      slot.status = "pending";
      user.rounds.round1.status = "pending";
    } else if (slot.round === 2) {
      if (["completed", "pending"].includes(user.rounds.round2.status)) {
        return res
          .status(400)
          .json({ success: false, message: "You have already booked a slot" });
      }
      if (!slot.users.includes(user._id)) {
        if (slot.users.length < max) {
          slot.users.push(user._id);
          slot.isAvailable = slot.users.length < max;
          slot.status = "pending";
          user.rounds.round2.status = "pending";
        } else {
          return res.status(400).json({ message: "Slot is full" });
        }
      }
    } else if (slot.round === 3) {
      if (["completed", "pending"].includes(user.rounds.round3.status)) {
        return res
          .status(400)
          .json({ success: false, message: "You have already booked a slot" });
      }
      slot.users = [user._id];
      slot.isAvailable = false;
      slot.status = "pending";
      user.rounds.round3.status = "pending";
    }
    await slot.save();
    await user.save();
    res.status(200).json({
      success: true,
      message: "Slot successfully selected",
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Get slot details
router.get("/get-slot-data/:roundNo", protectUserRoute, async (req, res) => {
  try {
    const { roundNo } = req.params;
    const userId = req.user._id;
    const validRounds = [1, 2, 3];
    if (!validRounds.includes(parseInt(roundNo))) {
      return res.status(400).json({
        success: false,
        message: "Invalid round number. Must be 1, 2, or 3.",
      });
    }
    const slot = await Slot.findOne({ round: roundNo, users: userId });
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "No slot found for this round and user",
      });
    }
    return res.status(200).json({
      success: true,
      data: slot,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

// Ready
router.post("/slot-ready/:slotId", protectUserRoute, async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot ID",
      });
    }
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
      });
    }
    if (!slot.users.includes(userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "User is not part of this slot",
      });
    }
    slot.isReady = true;
    await slot.save();
    return res.status(200).json({
      success: true,
      message: "Slot is now marked as ready",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

// Task submission
router.post("/task-submission", protectUserRoute, async (req, res) => {
  try {
    const user = req.user;
    const { taskLink } = req.body;
    if (!taskLink?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task link is required",
      });
    }
    const roundKey = `rounds.round${user.currentRound}.taskLink`;
    if (user.currentRound > 2 || user.currentRound < 1) {
      return res.status(400).json({
        success: false,
        message: "You are not eligible for task submission",
      });
    }
    user.set(roundKey, taskLink);
    user.currentRound += 1;
    await user.save();
    return res.status(200).json({
      success: true,
      message: `Round ${user.currentRound - 1} task submission successful`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

export default router;
