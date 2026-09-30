import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let aiClient = null;

export function isLiveAIConfigured() {
  return Boolean(API_KEY && API_KEY.trim().length > 0 && API_KEY !== 'your_gemini_api_key_here');
}

export function getGeminiModelName() {
  return MODEL_NAME;
}

export function getGeminiClient() {
  if (!isLiveAIConfigured()) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
}

/**
 * Executes a structured JSON prompt with Gemini.
 * Falls back to null on failure or if not configured.
 */
export async function generateStructuredContent({ prompt, systemInstruction, imageBase64, mimeType, responseSchema }) {
  const client = getGeminiClient();
  if (!client) {
    return { success: false, isPrototype: true, reason: 'Gemini API key not configured' };
  }

  try {
    const contents = [];

    // Add multimodal image part if provided
    if (imageBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      });
    }

    // Add text prompt
    contents.push({ text: prompt });

    const config = {
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: systemInstruction || undefined,
        responseMimeType: 'application/json',
        responseSchema: responseSchema || undefined,
        temperature: 0.2, // low temperature for consistent, grounded agronomic reasoning
      }
    };

    const response = await client.models.generateContent(config);
    const responseText = response.text || '';
    
    // Parse JSON
    const parsed = JSON.parse(responseText);
    return { success: true, isPrototype: false, data: parsed };
  } catch (error) {
    console.error('Gemini API execution error:', error.message || error);
    return { 
      success: false, 
      isPrototype: true, 
      error: error.message || 'Error communicating with Gemini API' 
    };
  }
}

/**
 * Executes a text conversation with Gemini, grounded with system instructions.
 */
export async function generateChatContent({ message, systemInstruction, conversationHistory = [] }) {
  const client = getGeminiClient();
  if (!client) {
    return { success: false, isPrototype: true, reason: 'Gemini API key not configured' };
  }

  try {
    const formattedContents = [];
    
    // Add history if any
    for (const msg of conversationHistory.slice(-6)) { // keep last 6 turns for context
      formattedContents.push({
        role: msg.role === 'ai' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text || msg.content }]
      });
    }

    // Add current user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || undefined,
        temperature: 0.3,
      }
    });

    const responseText = response.text || '';
    return { success: true, isPrototype: false, text: responseText };
  } catch (error) {
    console.error('Gemini Chat API error:', error.message || error);
    return { 
      success: false, 
      isPrototype: true, 
      error: error.message || 'Error communicating with Gemini API' 
    };
  }
}
