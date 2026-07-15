const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    // Flat list of preferences (string array)
    preferences: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically tracks createdAt and updatedAt
  },
);

module.exports = mongoose.model("user", UserSchema);
