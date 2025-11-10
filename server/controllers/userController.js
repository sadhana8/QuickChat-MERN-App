import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// ✅ Signup Controller
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "Missing details" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Account already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser._id);

    const { password: _, ...safeUserData } = newUser._doc;

    res.json({
      success: true,
      userData: safeUserData,
      token,
      message: "Account created successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await User.findOne({ email });
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);

    const { password: _, ...safeUserData } = userData._doc;

    res.json({
      success: true,
      userData: safeUserData,
      token,
      message: "Login successful",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Check Authentication Controller
export const checkAuth = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  res.json({ success: true, user: req.user });
};

// ✅ Update Profile Controller


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { profilePic, bio, fullName } = req.body;
    let updateData = { fullName, bio };

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic, {
        folder: "profile_pics",
      });
      updateData.profilePic = upload.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    const { password, ...safeUserData } = updatedUser._doc;
    res.json({ success: true, user: safeUserData, message: "Profile updated successfully" });
  } catch (error) {
    console.error("UpdateProfile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
