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

export const generateChatbotReply = async ({ message, user }) => {
  // TODO(ai-model): Replace this with your LLM/RAG call.
  // Example integration point:
  // const aiResponse = await llmClient.chat({ message, userContext: user });
  // return { reply: aiResponse.text, source: "ai-model" };

  const normalized = String(message || "").toLowerCase();
  const match = guidance.find((item) => item.keywords.some((word) => normalized.includes(word)));

  if (match) {
    return { reply: match.reply, source: "rule-based" };
  }

  return {
    reply: "Share crop, location, and issue details. I can guide irrigation, disease checks, pricing, and weather actions.",
    source: "rule-based",
  };
};
