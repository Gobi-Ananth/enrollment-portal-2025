import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    round: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    time: {
      type: Date,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    user: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    isReady: {
      type: Boolean,
      default: false,
    },
    admins: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Admin",
      default: [],
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    status: {
      type: String,
      enum: ["upcoming", "pending", "completed"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

const Slot = mongoose.model("Slot", slotSchema);

export default Slot;
