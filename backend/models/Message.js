const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 4000 },
    attachments: [
      {
        filename: String,
        originalName: String,
        filePath: String,
        mimeType: String,
        size: Number,
      },
    ],
    visibleToStudent: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
