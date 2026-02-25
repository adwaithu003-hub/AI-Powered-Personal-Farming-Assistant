
import { GoogleGenAI } from "@google/genai";
import { HistoryItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert vegetable plant pathologist, entomologist, and agronomist. 
Your goal is to identify diseases, pests, insects, and nutritional deficiencies in vegetable plant leaves accurately.
Provide clear, professional advice.

CRITICAL RULE: NEVER include raw JSON code, brackets like '{' or '}', or data structures in your conversational text output. Always speak in plain, natural language formatted with markdown (bolding, lists) for readability.

Provide professional advice on:
1. Identification: Name the specific disease or pest.
2. Symptoms/Signs: Detail what is seen.
3. Organic Cures: Natural ways to treat the issue.
4. Chemical Solutions: Specific pesticides or fungicides.
5. Prevention: How to stop it from returning.
6. MANDATORY Purchase Links: For EVERY chemical treatment listed, you MUST provide a search/purchase URL.`;

const GARDENING_MASTER_INSTRUCTION = `You are the "Garden Master," an expert horticulturist. 
When providing a guide, speak naturally. NEVER output raw JSON or code-like structures. 
Always use the following bold headers:

**Potting Mixture Ratio**
**Watering Needs**
**Sunlight Requirements**
**Possible Diseases & Pests**
**Flowering Season**
**Fertilizer Time Period**
**Maintenance: Repotting & Pruning**

Tone: Professional, warm, and helpful.`;

const SOIL_ANALYSER_INSTRUCTION = `You are an expert Agricultural Soil Scientist. 
Analyze images of soil reports. Return the data strictly in JSON format matching the schema. 
IMPORTANT: All fields are required. If a value is unknown, use "N/A" for strings and an empty array [] for arrays. 
Do not include any conversational text outside the JSON block.`;

const SEED_ANALYSER_INSTRUCTION = `You are an expert Botanist. 
Analyze images of seeds. Return the data strictly in JSON format matching the schema.
IMPORTANT: All fields are required.
Do not include any conversational text outside the JSON block.`;

const NUTRIENT_ANALYSER_INSTRUCTION = `You are an expert Plant Physiologist. 
Analyze the plant image for nutrient deficiencies (Nitrogen, Phosphorus, Potassium, Calcium, Magnesium, etc.). 
Estimate a health score from 0 to 100 based on visual vigor and color.
Return the data strictly in JSON format matching the schema.
IMPORTANT: All fields are required.
Do not include any conversational text outside the JSON block.`;

const SOIL_EXPERT_CHAT_INSTRUCTION = `You are a professional Agricultural Soil Scientist. 
Answer questions naturally. NEVER include raw JSON or data brackets in your chat replies. Provide actionable, practical advice.`;

export const analyzePlantImage = async (base64Image: string): Promise<Partial<HistoryItem>> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Analyze this vegetable plant leaf image. Identify if it has a disease or a pest/bug infestation. Identify the plant, the disease/pest name, symptoms, organic cures, chemical treatments, purchase links, and prevention.

Return the data strictly in JSON format matching this schema:
{
  "plantName": string,
  "diseaseName": string, 
  "severity": "Low" | "Medium" | "High",
  "symptoms": string[],
  "cures": {
    "organic": string[],
    "chemical": string[]
  },
  "purchaseLinks": [
    { "pesticideName": string, "url": string }
  ],
  "prevention": string[]
}`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse AI response:", text);
    throw new Error("Invalid response format from AI");
  }
};

export const analyzeSoilReport = async (base64Image: string): Promise<HistoryItem['soilData']> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Analyze this soil test report image. Return data strictly in this JSON format:
{
  "phValue": string,
  "nitrogen": string,
  "phosphorus": string,
  "potassium": string,
  "organicMatter": string,
  "suitableCrops": string[],
  "improvementTips": string[]
}`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: SOIL_ANALYSER_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse soil report:", text);
    throw new Error("Invalid response format from AI");
  }
};

export const analyzeSeedImage = async (base64Image: string): Promise<HistoryItem['seedData']> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Analyze this seed image. Identify the seed name, the plant it grows into, giving a description, list cultivation places (regions/countries), best soil type, and sowing/growth tips.

Return data strictly in this JSON format:
{
  "seedName": string,
  "plantName": string,
  "description": string,
  "cultivationPlaces": string[],
  "bestSoil": string,
  "growthTips": string[]
}`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: SEED_ANALYSER_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse seed report:", text);
    throw new Error("Invalid response format from AI");
  }
};

export const analyzePlantNutrients = async (base64Image: string): Promise<HistoryItem['nutrientData']> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Analyze this plant image for signs of nutrient deficiencies (e.g., Nitrogen, Phosphorus, Potassium, Iron, Magnesium, etc.).
  
  Provide a health score from 0 to 100 based on the plant's visual vigor, leaf color, and structural integrity.
  100 is perfectly healthy, 0 is dead.
  
  Return data strictly in this JSON format:
  {
    "healthScore": number,
    "deficiencies": string[],
    "symptoms": string[],
    "recommendations": string[]
  }`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: NUTRIENT_ANALYSER_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse nutrient report:", text);
    throw new Error("Invalid response format from AI");
  }
};

export const getWeatherDetails = async (location: string) => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Find the current weather, 3-day forecast, and disaster risks (flood, cyclone) for ${location}.
  
  Return the output strictly as a JSON object with the following structure. Do not use Markdown code blocks.
  {
    "locationName": "City, Region",
    "current": {
      "temp": "string (e.g. 30°C)",
      "condition": "string (e.g. Rainy)",
      "humidity": "string",
      "wind": "string"
    },
    "forecast": [
      { "day": "string", "temp": "string", "condition": "string" },
      { "day": "string", "temp": "string", "condition": "string" },
      { "day": "string", "temp": "string", "condition": "string" }
    ],
    "risks": {
      "floodProbability": "Low" | "Medium" | "High",
      "cycloneProbability": "Low" | "Medium" | "High",
      "details": "string summary of risks"
    },
    "farmingTip": "string"
  }`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });

  let data = null;
  const text = response.text || "{}";
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse weather JSON", e);
  }

  return {
    data,
    groundingMetadata: response.candidates?.[0]?.groundingMetadata
  };
};

export const chatWithBotanist = async (history: { role: 'user' | 'model', text: string }[], newMessage: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};

export const chatWithGardenMaster = async (history: { role: 'user' | 'model', text: string }[], newMessage: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: GARDENING_MASTER_INSTRUCTION,
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};

export const chatWithSoilExpert = async (history: { role: 'user' | 'model', text: string }[], newMessage: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SOIL_EXPERT_CHAT_INSTRUCTION,
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};

export const translateText = async (text: string, targetLanguage: 'Hindi' | 'Malayalam') => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Translate the following text into ${targetLanguage}. MAINTAIN ALL MARKDOWN FORMATTING. Do not add JSON or code brackets. Original text: "${text}"`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return response.text;
};
