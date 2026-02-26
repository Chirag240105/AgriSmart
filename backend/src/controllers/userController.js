import { User } from "../models/User.models.js";

export const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

export const updateMe = async (req, res) => {
  try {
    const allowedFields = ["name", "phone", "preferences", "farmDetails"];
    const updatePayload = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updatePayload[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updatePayload, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
