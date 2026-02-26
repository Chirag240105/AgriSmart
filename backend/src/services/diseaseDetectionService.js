const diseaseCatalog = [
  {
    diseaseName: "Leaf Blight",
    suggestions: ["Use copper-based fungicide", "Remove infected leaves", "Avoid overhead irrigation"],
  },
  {
    diseaseName: "Powdery Mildew",
    suggestions: ["Apply sulfur spray", "Increase field ventilation", "Irrigate early morning only"],
  },
  {
    diseaseName: "Bacterial Spot",
    suggestions: ["Use certified seeds", "Avoid leaf wetness", "Apply approved bactericide"],
  },
];

export const detectDiseaseFromImage = async ({ imageUrl }) => {
  // TODO(ai-model): Replace this simulation with your CV model inference.
  // Example integration point:
  // const modelResult = await yourModel.predict(imageUrl);
  // return { diseaseName: modelResult.label, confidence: modelResult.score, suggestions: modelResult.suggestions };

  const normalized = String(imageUrl || "").toLowerCase();

  if (normalized.includes("healthy")) {
    return {
      diseaseName: "No visible disease",
      confidence: 0.9,
      suggestions: ["Continue regular monitoring"],
    };
  }

  const pick = diseaseCatalog[Math.floor(Math.random() * diseaseCatalog.length)];
  return {
    diseaseName: pick.diseaseName,
    confidence: Number((0.6 + Math.random() * 0.35).toFixed(2)),
    suggestions: pick.suggestions,
  };
};
