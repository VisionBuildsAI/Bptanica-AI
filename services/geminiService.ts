import { GoogleGenAI, Type, Chat } from "@google/genai";
import { PlantAnalysis } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Switch to Flash model for high speed (1-2s typical latency) while maintaining good accuracy
const ANALYSIS_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-2.5-flash";

// Helper to convert file to base64 with resizing and compression for speed
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize logic: Limit max dimension to 1024px for faster processing
        const MAX_DIMENSION = 1024;
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
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        // Draw and compress to JPEG at 85% quality
        ctx.drawImage(img, 0, 0, width, height);
        const base64String = canvas.toDataURL('image/jpeg', 0.85);
        
        // Remove data url prefix
        resolve(base64String.split(',')[1]);
      };
      img.onerror = (e) => reject(e);
      img.src = event.target?.result as string;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

export const analyzePlantImage = async (base64Image: string, mimeType: string): Promise<PlantAnalysis> => {
  const prompt = `
    Analyze this plant image.
    
    1. **Identification**: Identify the plant's common name and scientific name accurately.
    2. **Diagnosis**: Check for disease, pests, or issues. 
       - If healthy, set 'has_disease' to false.
       - If issues found, set 'has_disease' to true, identify the problem, and provide a confidence score (0-1).
    3. **Care**: Provide care instructions.
       - **Temperature**: Numeric range in Celsius (e.g., "18-24°C").
       - **Water**: Frequency and amount.
       - **Sunlight**: Light requirements.
    4. **Treatment**: Cure instructions and prevention if diseased.
    5. **Planting**: Propagation guide.

    Return the result strictly as a valid JSON object.
  `;

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Common name" },
          scientific_name: { type: Type.STRING, description: "Scientific Latin name" },
          description: { type: Type.STRING, description: "Description of plant status" },
          care: {
            type: Type.OBJECT,
            properties: {
              water: { type: Type.STRING },
              sunlight: { type: Type.STRING },
              soil: { type: Type.STRING },
              fertilizer: { type: Type.STRING },
              temperature: { type: Type.STRING, description: "e.g. 20-25°C" },
            },
            required: ["water", "sunlight", "soil", "temperature"]
          },
          diagnosis: {
            type: Type.OBJECT,
            properties: {
              has_disease: { type: Type.BOOLEAN },
              disease_name: { type: Type.STRING },
              symptoms: { type: Type.STRING },
              cure_instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              preventative_measures: { type: Type.ARRAY, items: { type: Type.STRING } },
              confidence_score: { type: Type.NUMBER, description: "0.0 to 1.0" }
            },
            required: ["has_disease"]
          },
          planting_guide: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }
          }
        },
        required: ["name", "scientific_name", "description", "care", "diagnosis", "planting_guide"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text) as PlantAnalysis;
};

// Chat instance storage to maintain history per session
let chatSession: Chat | null = null;

export const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: CHAT_MODEL,
      config: {
        systemInstruction: `You are 'Sprout', an expert botanist and gardening AI. 
        Your goal is to provide accurate, scientific, yet easy-to-understand gardening advice.
        When diagnosing issues, ask for details if the user's description is vague.
        Always suggest organic and sustainable solutions first.`,
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