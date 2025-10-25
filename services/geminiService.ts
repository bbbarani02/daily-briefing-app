import { GoogleGenAI, Chat, Modality, LiveSession, LiveServerMessage, Blob } from "@google/genai";
import type { DailyBriefing, Source } from '../types';

// A new GoogleGenAI instance will be created for each API call to ensure the latest key is used.
const getAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. Please select a key.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}


const fetchDailyBriefing = async (lat: number, lon: number): Promise<{ briefing: DailyBriefing, sources: Source[] }> => {
    const ai = getAI();
    const prompt = `You are an expert data aggregator. Your task is to provide a daily briefing based on the user's location (latitude: ${lat}, longitude: ${lon}) and the current date. You must use your search capabilities to find the most accurate, up-to-the-minute information, especially for the financial data.

The entire response must be a single, raw JSON object string, with no surrounding text, comments, or markdown.

The JSON object must conform to this structure:
{
  "news": [
    {
      "title": "string",
      "summary": "string",
      "url": "string",
      "country": "string",
      "isBreaking": "boolean"
    }
  ],
  "weather": {
    "temperature": "number (in Celsius)",
    "condition": "'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy' | 'Windy' | 'Stormy' | 'Foggy'",
    "description": "string",
    "location": "string"
  },
  "financials": {
    "commodities": [
      { "name": "Gold", "price": "number (per ounce in USD)" },
      { "name": "Silver", "price": "number (per ounce in USD)" }
    ],
    "stocks": [
      { "name": "Dow Jones", "ticker": "DJI", "price": "number", "change": "number" },
      { "name": "S&P 500", "ticker": "SPX", "price": "number", "change": "number" },
      { "name": "NASDAQ", "ticker": "IXIC", "price": "number", "change": "number" }
    ]
  }
}

Provide the top 5 latest news headlines for the user's country, prioritizing breaking news.
Provide the current weather alert.
Provide the exact, latest prices for Gold, Silver, and the specified stock indices (DJI, SPX, IXIC).`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources: Source[] = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter(Boolean)
        .map((webChunk: any) => ({
            title: webChunk.title,
            uri: webChunk.uri,
        }))
        .filter((source, index, self) =>
            index === self.findIndex((s) => s.uri === source.uri)
        );

    try {
        const jsonText = response.text.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
        const data = JSON.parse(jsonText);
        if (!data.news || !data.weather || !data.financials) {
            throw new Error("Invalid data structure received from API");
        }
        return { briefing: data as DailyBriefing, sources };
    } catch (e) {
        console.error("Failed to parse Gemini response:", e);
        console.error("Raw response text:", response.text);
        throw new Error("Could not parse the data from the AI service.");
    }
};

const getChatResponse = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string, useThinkingMode: boolean) => {
    const ai = getAI();
    const modelName = useThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const config = useThinkingMode 
        ? { thinkingConfig: { thinkingBudget: 32768 } } 
        : { tools: [{ googleSearch: {} }] };
    
    const chat: Chat = ai.chats.create({
        model: modelName,
        history: history,
        config: config,
    });
    
    const result = await chat.sendMessageStream({ message: newMessage });
    return result;
};


const editImage = async (base64ImageData: string, mimeType: string, prompt: string) => {
    const ai = getAI();
    const imagePart = {
      inlineData: {
        data: base64ImageData,
        mimeType: mimeType,
      },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No image was generated.");
};


// Helper function to encode raw audio data to base64
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const startTranscriptionSession = (onTranscriptionUpdate: (text: string, isFinal: boolean) => void, onError: (error: Error) => void): Promise<LiveSession> => {
    const ai = getAI();
    let currentTranscription = '';
    
    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Live session opened.'),
            onmessage: (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    const { text } = message.serverContent.inputTranscription;
                    currentTranscription += text;
                    onTranscriptionUpdate(currentTranscription, false);
                }
                if (message.serverContent?.turnComplete) {
                    onTranscriptionUpdate(currentTranscription, true);
                    currentTranscription = '';
                }
                // FIX: Per Gemini API guidelines, audio output must be handled when responseModality is AUDIO.
                const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    // The app is for transcription only, so we are not playing back the audio.
                    // We acknowledge receipt of audio data to comply with API guidelines.
                    console.log("Received audio data from model, but not playing it.");
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error('Live session error:', e);
                onError(new Error('Transcription service error.'));
            },
            onclose: (e: CloseEvent) => {
                console.log('Live session closed.');
            },
        },
        config: {
            // FIX: The responseModalities field is required for the Live API.
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
        },
    });

    return sessionPromise;
}

const createAudioBlob = (data: Float32Array): Blob => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


export { fetchDailyBriefing, getChatResponse, editImage, startTranscriptionSession, createAudioBlob };