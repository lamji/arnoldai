export interface ClassifiedIntent {
  intent: "wealth" | "insurance" | "general";
  confidence: number;
  revisedPrompt: string;
  extractedData: {
    topic?: string;
    amount?: string;
  };
  dynamicRules: string[];
}

export async function classifyUserIntent(
  userInput: string,
  history: any[],
  endpoint: string = "/api/chat"
): Promise<ClassifiedIntent> {
  // In a real scenario, this would be an AI call. 
  // For this design demo, we'll return a structured mock or simple logic.
  
  const lowInput = userInput.toLowerCase();
  
  let intent: "wealth" | "insurance" | "general" = "general";
  if (lowInput.includes("wealth") || lowInput.includes("money") || lowInput.includes("tax")) {
    intent = "wealth";
  } else if (lowInput.includes("insurance") || lowInput.includes("health") || lowInput.includes("dental")) {
    intent = "insurance";
  }
  
  return {
    intent,
    confidence: 0.9,
    revisedPrompt: userInput,
    extractedData: {},
    dynamicRules: [
      intent === "wealth" ? "Focus on capital efficiency." : 
      intent === "insurance" ? "Focus on coverage precision." : "Be a helpful sentinel."
    ]
  };
}
