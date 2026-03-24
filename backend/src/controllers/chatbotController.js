import { generateChatbotReply } from "../services/chatbotService.js";

export const askChatbot = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const response = await generateChatbotReply({
      message,
      user: req.user,
      conversationHistory,
    });

    res.json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

