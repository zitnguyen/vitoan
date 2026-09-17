const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    password: {
      type: String,
      required: function passwordRequired() {
        return !this.googleId;
      },
      select: false,
    },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    role: { type: String, enum: ["Student", "Admin"], default: "Student" },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade" },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "suspended", "disabled"], default: "active" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave() {
  if (!this.isModified("password")) return;
  if (!this.password) return;
  if (this.password.startsWith("$2")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = function matchPassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
