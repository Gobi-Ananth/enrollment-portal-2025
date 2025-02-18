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
    meetLink: {
      type: String,
    },
    user: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    isReady: {
      type: Boolean,
      default: false,
    },
    admins: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Admin",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "upcoming"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

const Slot = mongoose.model("Slot", slotSchema);

export default Slot;
