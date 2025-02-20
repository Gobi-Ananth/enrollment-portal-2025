import express from "express";
import jwt from "jsonwebtoken";
import {
  authenticateFirebaseUser,
  protectUserRoute,
} from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";
import Slot from "../models/slot.model.js";

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
      console.error(`Error logging in user: ${err.message}`);
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
    console.error(`Error logging out user: ${err.message}`);
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
    console.error(`Error refreshing user access token: ${err.message}`);
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
    console.error(`Error getting user data: ${err.message}`);
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
      return res
        .status(400)
        .json({ success: false, message: "Valid contact number is required" });
    }
    if (!branch || branch.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Branch is required" });
    }
    if (
      githubProfile &&
      !/^https:\/\/github\.com\/[a-zA-Z0-9-_]+$/.test(githubProfile)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Valid GitHub profile is required" });
    }
    if (!domain || !Array.isArray(domain) || domain.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Domain is required" });
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
        githubProfile: githubProfile ? githubProfile : null,
        projectLink: projectLink ? projectLink : null,
        projectText: projectText ? projectText : null,
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
    console.error(`Error submitting round 0: ${err.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Slot selection by user
router.put("/select/:slotId", protectUserRoute, async (req, res) => {
  try {
    const user = req.user;
    const { slotId } = req.params;
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }
    if (!slot.isAvailable) {
      return res.status(400).json({ message: "Slot is not available" });
    }
    const max = 3;
    if (slot.round === 1) {
      if (user.rounds.round1.status === "completed") {
        return res
          .status(400)
          .json({ success: false, message: "You have completed round 1" });
      }
      slot.user = [user._id];
      slot.isAvailable = false;
    } else if (slot.round === 2) {
      if (user.rounds.round2.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "You have completed round 2",
        });
      }
      if (!slot.user.includes(user._id)) {
        if (slot.user.length < max) {
          slot.user.push(user._id);
          if (slot.user.length === max) {
            slot.isAvailable = false;
          }
        } else {
          return res.status(400).json({ message: "Slot is full" });
        }
      }
    } else if (slot.round === 3) {
      if (user.rounds.round3.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "You have completed round 3",
        });
      }
      slot.user = [user._id];
      slot.isAvailable = false;
    }
    await slot.save();
    res.status(200).json({
      success: true,
      message: "Slot successfully selected",
    });
  } catch (err) {
    console.error(`Error selecting slot: ${err.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Task submission
router.post("/task-submission", protectUserRoute, async (req, res) => {
  try {
    const user = req.user;
    const { taskLink } = req.body;
    console.log(taskLink);
    if (!taskLink || taskLink.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Task link is required" });
    }
    if (user.currentRound === 1) {
      user.rounds.round1.taskLink = taskLink;
      user.currentRound = 2;
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Round 1 task submission successful",
      });
    } else if (user.currentRound === 2) {
      user.rounds.round2.taskLink = taskLink;
      user.currentRound = 3;
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Round 2 task submission successful",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "You are not eligible for task submission",
      });
    }
  } catch (err) {
    console.error(`Error submitting task: ${err}`);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;
