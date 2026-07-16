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
      minlength: [6, "Password must be at least 6 characters long"],
    },
    // Structured category and language preferences
    preferences: {
      categories: {
        type: [String],
        default: [],
      },
      languages: {
        type: [String],
        default: [],
      },
    },
    // Optional tracked news features
    readArticles: [{
      title: String,
      description: String,
      url: { type: String },
      source: String,
      publishedAt: String,
      image: String
    }],
    favoriteArticles: [{
      title: String,
      description: String,
      url: { type: String },
      source: String,
      publishedAt: String,
      image: String
    }]
  },
  {
    timestamps: true, // Automatically tracks createdAt and updatedAt
  },
);

module.exports = mongoose.model("User", UserSchema);
