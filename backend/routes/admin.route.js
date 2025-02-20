import express from "express";
import jwt from "jsonwebtoken";
import {
  authenticateFirebaseUser,
  protectAdminRoute,
  protectSuperadminRoute,
} from "../middleware/auth.middleware.js";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import Slot from "../models/slot.model.js";

const router = express.Router();

// Generate access and refresh tokens
const generateTokens = (adminId) => {
  const accessToken = jwt.sign({ adminId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ adminId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

// Set access and refresh token in admins cookies
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

// Login admin
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
        success: true,
        data: {
          name: admin.name,
          email: admin.email,
          meetLink: admin.meetLink,
          access: admin.access,
        },
      });
    } catch (err) {
      console.error(`Error logging in admin: ${err.message}`);
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Logout admin
router.post("/logout", async (req, res) => {
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
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error(`Error logging out admin: ${err.message}`);
    return res.status(500).json({ message: "Server error", err: err.message });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token is missing" });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || admin.refreshToken !== refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
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
    return res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (err) {
    console.error(`Error refreshing admin access token: ${err.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Get admin data
router.get("/", protectAdminRoute, async (req, res) => {
  try {
    const admin = req.user;
    return res.status(200).json({
      success: true,
      data: {
        name: admin.name,
        email: admin.email,
        meetLink: admin.meetLink,
        access: admin.access,
      },
    });
  } catch (err) {
    console.error(`Error getting admin data: ${err.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Creating slot (superadmin only)
router.post(
  "/create-slot",
  protectAdminRoute,
  protectSuperadminRoute,
  async (req, res) => {
    try {
      const { round, time } = req.body;
      if (!round || !time) {
        return res
          .status(400)
          .json({ success: false, message: "Round and time are required" });
      }
      if (![1, 2, 3].includes(round)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid round number" });
      }
      const newSlot = new Slot({ round, time });
      await newSlot.save();
      return res.status(201).json({
        success: true,
        message: "Slot created successfully",
      });
    } catch (err) {
      console.error(`Error creating slot: ${err.message}`);
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Eliminate non freshers (superadmin only)
router.put(
  "/eliminate-non-freshers",
  protectAdminRoute,
  protectSuperadminRoute,
  async (req, res) => {
    try {
      const result = await User.updateMany(
        { isFresher: false },
        { $set: { isEliminated: true } }
      );
      return res.status(200).json({
        success: true,
        message: "All non-freshers marked as eliminated",
        modifiedCount: result.modifiedCount,
      });
    } catch (err) {
      console.error(`Error eliminating non freshers: ${err.message}`);
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Round 1 elimination (superadmin only)
// router.put(
//   "/round1-elimination",
//   protectAdminRoute,
//   protectSuperadminRoute,
//   async (req, res) => {
//     try {
//       const result = await User.updateMany(
//         { "rounds.round1.taskLink": null },
//         { $set: { isEliminated: true } }
//       );
//       return res.status(200).json({
//         success: true,
//         message: "Round 1 elimination successful",
//         modifiedCount: result.modifiedCount,
//       });
//     } catch (err) {
//       console.error(`Error in round 1 elimination: ${err.message}`);
//       return res
//         .status(500)
//         .json({ success: false, message: "Server error", error: err.message });
//     }
//   }
// );

// Round 2 elimination (superadmin only)
// router.put(
//   "/round2-elimination",
//   protectAdminRoute,
//   protectSuperadminRoute,
//   async (req, res) => {
//     try {
//       const result = await User.updateMany(
//         { "rounds.round2.taskLink": null },
//         { $set: { isEliminated: true } }
//       );
//       return res.status(200).json({
//         success: true,
//         message: "Round 2 elimination successfull",
//         modifiedCount: result.modifiedCount,
//       });
//     } catch (err) {
//       console.error(`Error in round 2 elimination: ${err.message}`);
//       return res
//         .status(500)
//         .json({ success: false, message: "Server error", error: err.message });
//     }
//   }
// );

export default router;
