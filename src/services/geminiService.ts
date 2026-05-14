import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getEmergencyGuidance = async (
  emergencyType: string,
  location: string,
  situation: string
) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("API Key logic: Search for 'GEMINI_API_KEY' in your environment secrets.");
  }

  const systemPrompt = `You are Crisis Helper, an emergency assistant for Pakistan. 
When someone describes an emergency:
1. First show IMMEDIATE action steps (numbered, bold)
2. List relevant emergency numbers for their city (Always include 1122 and 15)
3. Provide nearby help options based on their location: ${location}
4. Give safety instructions in simple Urdu AND English
5. End with a calm reassuring message

Always be calm, clear, and concise. Lives may depend on clarity.
Never give wrong medical advice — always say 'call 1122 immediately' for serious medical situations.

Provide the response in the following JSON-like format for parsing:
{
  "immediate_steps": ["step 1", "step 2"],
  "contacts": [{"name": "1122", "number": "1122"}],
  "nearby_options": ["option 1", "option 2"],
  "urdu_instructions": ["urdu step 1", "urdu step 2"],
  "english_instructions": ["english step 1", "english step 2"],
  "reassurance": "Calm message here"
}`;

  const prompt = `Emergency Type: ${emergencyType}\nLocation: ${location}\nSituation: ${situation}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
