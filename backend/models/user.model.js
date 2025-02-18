import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    isFresher: {
      type: Boolean,
      default: false,
    },
    isEliminated: {
      type: Boolean,
      default: false,
    },
    currentRound: {
      type: Number,
      min: 0,
      max: 3,
    },
    round0: {
      contactNo: {
        type: Number,
        unique: true,
        match: [/^[6789]\d{9}$/, "Invalid contact number"],
      },
      branch: {
        type: String,
      },
      githubProfile: {
        type: String,
        unique: true,
        match: [
          /^https:\/\/github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9-_]{0,38}[a-zA-Z0-9])?$/,
          "Invalid github profile",
        ],
      },
      projectLink: {
        type: String,
        unique: true,
      },
      projectText: {
        type: String,
      },
      domain: {
        type: [String],
      },
      question1: {
        type: String,
      },
      question2: {
        type: String,
      },
      question3: {
        type: String,
      },
      question4: {
        type: String,
      },
      question5: {
        type: String,
      },
      // question6: {
      //   type: String,
      // },
      managementQuestion: {
        type: String,
      },
    },
    rounds: {
      round1: {
        review: {
          type: String,
        },
        taskTitle: {
          type: String,
        },
        taskDescription: {
          type: String,
        },
        taskLink: {
          type: String,
          unique: true,
        },
        status: {
          type: String,
          enum: ["Pending", "Completed", "Upcoming"],
          default: "Upcoming",
        },
      },
      round2: {
        review: {
          type: String,
        },
        taskTitle: {
          type: String,
        },
        taskDescription: {
          type: String,
        },
        taskLink: {
          type: String,
          unique: true,
        },
        status: {
          type: String,
          enum: ["Pending", "Completed", "Upcoming"],
          default: "Upcoming",
        },
      },
      round3: {
        review: {
          type: String,
        },
        status: {
          type: String,
          enum: ["Pending", "Completed", "Upcoming"],
          default: "Upcoming",
        },
      },
    },
    refreshToken: {
      type: String,
      unique: true,
    },
    refreshTokenExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
