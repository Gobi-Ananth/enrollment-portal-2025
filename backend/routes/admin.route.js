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
import sendMail from "../lib/mail.js";
import mongoose from "mongoose";

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
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          meetLink: admin.meetLink,
          access: admin.access,
        },
      });
    } catch (err) {
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
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Meet link submission
router.post("/meetlink-submission", protectAdminRoute, async (req, res) => {
  try {
    const { meetLink } = req.body;
    if (!meetLink || meetLink.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Meet link is required" });
    }
    const admin = req.user;
    admin.meetLink = meetLink;
    await admin.save();
    return res
      .status(200)
      .json({ success: true, message: "Meet link submitted successfully" });
  } catch (err) {
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
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        meetLink: admin.meetLink,
        access: admin.access,
      },
    });
  } catch (err) {
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
      if (!round || ![1, 2, 3].includes(round)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or missing round number" });
      }
      if (!time || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format. Use HH:mm (24-hour format)",
        });
      }
      const formattedTime = new Date(`1970-01-01T${time}:00Z`);
      const newSlot = new Slot({ round, time: formattedTime });
      await newSlot.save();
      return res.status(201).json({
        success: true,
        message: "Slot created successfully",
      });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Taking a slot
router.put("/take-slot/:slotId", protectAdminRoute, async (req, res) => {
  const { slotId } = req.params;
  const admin = req.user;
  if (!mongoose.Types.ObjectId.isValid(slotId)) {
    return res.status(400).json({ success: false, message: "Invalid slot ID" });
  }
  if (!admin.meetLink) {
    return res.status(400).json({
      success: false,
      message: "Meet link not found in admin profile",
    });
  }
  try {
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, reviewer: null },
      { reviewer: admin._id, meetLink: admin.meetLink },
      { new: true }
    )
      .populate("users", "name email currentRound round0 rounds")
      .populate("admins", "name")
      .populate("reviewer", "name");
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found or already has a reviewer assigned",
      });
    }
    const userEmails = slot.users.map((user) => user.email);
    const subject = "Your Interview Slot Details";
    const message = `<div style="font-family: Arial, sans-serif; padding: 10px;"><h2 style="color: #007bff;">Interview Slot Confirmation</h2><p>Hello,</p><p>Your interview slot has been confirmed. Below are the details:</p><p><strong>Meet Link:</strong> <a href="${slot.meetLink}" style="color: #28a745; text-decoration: none;">Join Meeting</a></p><p>Please join on time. Wishing you all the best!</p><br><p>Regards,</p><p><strong>Admin Team</strong></p></div>`;
    userEmails.forEach((email) => sendMail(email, subject, message));
    return res.status(200).json({
      success: true,
      message: "Reviewer assigned successfully and email sent",
      data: slot,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Join slot
router.put("/join-slot/:slotId", protectAdminRoute, async (req, res) => {
  const { slotId } = req.params;
  const adminId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(slotId)) {
    return res.status(400).json({ success: false, message: "Invalid slot ID" });
  }
  try {
    const slot = await Slot.findById(slotId)
      .populate("users", "name email currentRound round0 rounds")
      .populate("admins", "name")
      .populate("reviewer", "name");
    if (!slot) {
      return res
        .status(404)
        .json({ success: false, message: "Slot not found" });
    }
    if (!slot.reviewer) {
      return res.status(400).json({
        success: false,
        message: "Slot does not have a reviewer yet",
      });
    }
    if (slot.admins.some((id) => id.toString() === adminId.toString())) {
      return res.status(400).json({
        success: false,
        message: "Admin is already assigned to this slot",
      });
    }
    slot.admins.push(adminId);
    await slot.save();
    return res.status(200).json({
      success: true,
      message: "Admin added to the slot successfully",
      data: slot,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Review slots
router.get("/review-slots", protectAdminRoute, async (req, res) => {
  const adminId = req.user._id;
  try {
    const slots = await Slot.find({ reviewer: adminId })
      .populate({
        path: "users",
        select: "_id name rounds",
      })
      .lean();
    const filteredSlots = slots.filter((slot) => {
      return slot.users?.some((user) => {
        const rounds = user.rounds || {};
        if (slot.round === 1) return !rounds.round1?.review;
        if (slot.round === 2) return !rounds.round2?.review;
        if (slot.round === 3) return !rounds.round3?.review;
        return false;
      });
    });
    return res.status(200).json({
      success: true,
      message: "Slots pending review found",
      data: filteredSlots.map((slot) => ({
        _id: slot._id,
        round: slot.round,
        time: slot.time,
        users:
          slot.users?.map((user) => ({
            _id: user._id,
            name: user.name,
          })) || [],
        reviewer: slot.reviewer,
        status: slot.status,
      })),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Review submission
router.post(
  "/review-submission/:slotId/:userId",
  protectAdminRoute,
  async (req, res) => {
    const { slotId, userId } = req.params;
    const { review } = req.body;
    if (!review?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Review is required" });
    }
    if (
      !mongoose.Types.ObjectId.isValid(slotId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid slot ID or user ID" });
    }
    try {
      const slot = await Slot.findById(slotId).populate("users", "_id");
      if (!slot) {
        return res
          .status(404)
          .json({ success: false, message: "Slot not found" });
      }
      const userExists = slot.users.some(
        (user) => user._id.toString() === userId
      );
      if (!userExists) {
        return res
          .status(403)
          .json({ success: false, message: "User is not part of this slot" });
      }
      const roundKey = `rounds.round${slot.round}`;
      if (
        !["rounds.round1", "rounds.round2", "rounds.round3"].includes(roundKey)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid round number in slot" });
      }
      const roundKeyReview = `${roundKey}.review`;
      const roundKeyStatus = `${roundKey}.status`;
      await User.updateOne(
        { _id: userId },
        { $set: { [roundKeyReview]: review, [roundKeyStatus]: "completed" } }
      );
      return res.status(200).json({
        success: true,
        message: "Review submitted successfully",
      });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Get slots
router.get("/get-slots", protectAdminRoute, async (req, res) => {
  try {
    const { roundNo, status } = req.body;
    if (![1, 2, 3].includes(Number(roundNo))) {
      return res.status(400).json({
        success: false,
        message: "Invalid round number. Must be 1, 2, or 3.",
      });
    }
    const validStatuses = ["pending", "ready", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use 'pending', 'ready', or 'completed'.",
      });
    }
    const filter = {
      round: Number(roundNo),
      status: status === "ready" ? "pending" : status,
      ...(status === "ready" && { isReady: true }),
    };
    console.log(filter)
    const slots = await Slot.find(filter);
    return res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

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
//       return res
//         .status(500)
//         .json({ success: false, message: "Server error", error: err.message });
//     }
//   }
// );

export default router;
