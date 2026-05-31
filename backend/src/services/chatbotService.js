import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are AgriBot, a friendly and knowledgeable agricultural assistant built into the AgriSmart platform - a marketplace for Indian farmers and buyers.

Your expertise covers:
- Crop selection based on season, soil type, and region (focus on India)
- Pest and disease identification and treatment
- Soil health, fertilizers, and organic farming
- Irrigation and water management
- Weather impact on crops
- Market prices and best time to sell
- Government schemes for farmers (PM-KISAN, MSP, crop insurance, etc.)
- Post-harvest storage and handling

Rules:
- Keep answers short and practical (3-5 sentences max unless a detailed list is needed)
- If the farmer writes in Hindi, respond in Hindi
- Always be encouraging and farmer-friendly
- If asked about non-agriculture topics, politely redirect to farming topics
- When giving advice, mention whether it applies to Rabi, Kharif, or Zaid crops where relevant`;

const guidance = [
  {
    keywords: ["water", "irrigation"],
    reply: "Use moisture-based irrigation scheduling and avoid overwatering during high humidity days.",
  },
  {
    keywords: ["price", "sell", "market"],
    reply: "Check predicted price trend and split your sale into batches instead of selling the full stock at once.",
  },
  {
    keywords: ["disease", "leaf", "pest"],
    reply: "Upload a clear crop image to disease detection and isolate infected patches before treatment.",
  },
  {
    keywords: ["weather", "rain", "wind"],
    reply: "Review current weather risk before spraying or harvesting to avoid quality loss.",
  },
];

export const generateChatbotReply = async ({ message, user, conversationHistory = [] }) => {
  try {
    const userContext = user
      ? `The farmer's name is ${user.name || "unknown"} and their location is ${user.location || "India"}.`
      : "";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.map((entry) => ({
        role: entry.role === "assistant" ? "assistant" : "user",
        content: entry.content,
      })),
      {
        role: "user",
        content: userContext ? `${userContext}\n\n${message}` : message,
      },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    return {
      reply: response.choices[0].message.content,
      source: "groq-ai",
    };
  } catch (error) {
    console.error("AgriBot error:", error.message);

    const normalized = String(message || "").toLowerCase();
    const match = guidance.find((item) => item.keywords.some((word) => normalized.includes(word)));

    if (match) {
      return { reply: match.reply, source: "rule-based-fallback" };
    }

    return {
      reply: "Share crop, location, and issue details. I can guide irrigation, disease checks, pricing, and weather actions.",
      source: "rule-based-fallback",
    };
  }
};