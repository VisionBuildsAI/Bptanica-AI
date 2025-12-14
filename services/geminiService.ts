import { GoogleGenAI, Type, Chat } from "@google/genai";
import { PlantDiagnosis, PesticideAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL = "gemini-2.5-flash";

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimization: Drastically reduce resolution for faster inference (<1s target)
        // 512px is sufficient for most leaf disease identification tasks
        const MAX_DIMENSION = 512;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height *= MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width *= MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error("Canvas context failed")); return; }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Optimization: Lower JPEG quality to 0.6 to reduce payload size significantly
        resolve(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const analyzePlant = async (base64: string, mimeType: string): Promise<PlantDiagnosis> => {
  // Optimization: concise prompt to reduce input token processing time
  const prompt = `Analyze plant. Return strict JSON.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: { parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plant_name: { type: Type.STRING },
          disease_name: { type: Type.STRING },
          is_healthy: { type: Type.BOOLEAN },
          severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          cause: { type: Type.STRING },
          spread_risk: { type: Type.STRING },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          is_recoverable: { type: Type.BOOLEAN },
          recovery_time_days: { type: Type.STRING },
          organic_treatments: {
            type: Type.ARRAY,
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
              morning: { type: Type.ARRAY, items: { type: Type.STRING } },
              afternoon: { type: Type.ARRAY, items: { type: Type.STRING } },
              evening: { type: Type.ARRAY, items: { type: Type.STRING } },
              weekly_prevention: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          confidence_score: { type: Type.NUMBER }
        }
      }
    }
  });

  if (!response.text) throw new Error("Analysis failed");
  return JSON.parse(response.text) as PlantDiagnosis;
};

export const analyzePesticide = async (base64: string, mimeType: string): Promise<PesticideAnalysis> => {
  const prompt = `Analyze pesticide label: Genuine/Fake/Expired? Return JSON.`;
  
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
  
  if (!response.text) throw new Error("Check failed");
  return JSON.parse(response.text) as PesticideAnalysis;
}

let chatSession: Chat | null = null;
export const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: MODEL,
      config: {
        systemInstruction: `You are 'AI Crop Doctor'. Help users with plant health. Concise answers.`,
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