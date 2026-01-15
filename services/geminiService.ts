
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { PlantDiagnosis, PesticideAnalysis } from "../types";

const MODEL = "gemini-3-flash-preview";

// Lazy initialization function to ensure process.env.API_KEY is captured at call time
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        const MAX_DIMENSION = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) { reject(new Error("Canvas context failed")); return; }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const analyzePlant = async (base64: string, mimeType: string): Promise<PlantDiagnosis> => {
  const ai = getAI();
  const prompt = `Act as a Master Plant Pathologist. Analyze the uploaded image.
  
  CRITICAL INSTRUCTIONS:
  1. Identify the plant and any specific disease, pest, or nutrient deficiency.
  2. If the plant is HEALTHY, still provide a "Preventative Daily Care Plan" and "Organic Prevention" tips. NEVER leave these arrays empty.
  3. SPREAD RISK: Provide a descriptive string (e.g., "High - Fungal spores can infect nearby leaves within 48 hours").
  4. DAILY CARE: Provide at least 2 specific instructions for Morning, Afternoon, and Evening.
  5. RECOVERY TIME: Estimate a realistic range in days.
  6. Return strictly as a valid JSON object matching the provided schema.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: { parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["plant_name", "disease_name", "is_healthy", "severity", "spread_risk", "organic_treatments", "daily_care_plan"],
        properties: {
          plant_name: { type: Type.STRING, description: "Common name of the plant" },
          disease_name: { type: Type.STRING, description: "Name of the disease or 'Healthy'" },
          is_healthy: { type: Type.BOOLEAN },
          severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          cause: { type: Type.STRING },
          spread_risk: { type: Type.STRING, description: "Detailed risk of spreading to other plants" },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          is_recoverable: { type: Type.BOOLEAN },
          recovery_time_days: { type: Type.STRING },
          organic_treatments: {
            type: Type.ARRAY,
            minItems: 1,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                ingredients: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } } 
                  } 
                },
                preparation_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                application_frequency: { type: Type.STRING },
                target_pests: { type: Type.ARRAY, items: { type: Type.STRING } },
                safety_precautions: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          chemical_treatments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                product_name: { type: Type.STRING },
                purpose: { type: Type.STRING },
                dosage_per_liter: { type: Type.STRING },
                application_frequency: { type: Type.STRING },
                waiting_period_days: { type: Type.NUMBER },
                safety_warning: { type: Type.STRING }
              }
            }
          },
          emergency_actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { action: { type: Type.STRING }, reason: { type: Type.STRING } }
            }
          },
          daily_care_plan: {
            type: Type.OBJECT,
            properties: {
              morning: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 1 },
              afternoon: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 1 },
              evening: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 1 },
              weekly_prevention: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          confidence_score: { type: Type.NUMBER }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No analysis returned from AI");
  return JSON.parse(text) as PlantDiagnosis;
};

export const analyzePesticide = async (base64: string, mimeType: string): Promise<PesticideAnalysis> => {
  const ai = getAI();
  const prompt = `Verify the pesticide label for authenticity, expiry, and safety. Return JSON.`;
  
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: { parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          is_genuine: { type: Type.BOOLEAN },
          status: { type: Type.STRING, enum: ["GENUINE", "FAKE", "EXPIRED"] },
          product_name: { type: Type.STRING },
          manufacturer: { type: Type.STRING },
          expiry_date_check: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          details: { type: Type.STRING }
        }
      }
    }
  });
  
  const text = response.text;
  if (!text) throw new Error("No data returned from AI");
  return JSON.parse(text) as PesticideAnalysis;
}

let chatSession: Chat | null = null;
export const getChatSession = (): Chat => {
  if (!chatSession) {
    const ai = getAI();
    chatSession = ai.chats.create({
      model: MODEL,
      config: {
        systemInstruction: `You are 'Botanica Expert'. Provide high-accuracy gardening advice. Be concise and professional.`,
      },
    });
  }
  return chatSession;
};

export const sendMessageToBot = async function* (message: string) {
  const chat = getChatSession();
  const result = await chat.sendMessageStream({ message });
  for await (const chunk of result) {
    yield chunk.text;
  }
};
