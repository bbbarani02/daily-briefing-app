import { GoogleGenAI } from "@google/genai";
import type { DailyBriefing, Source } from '../types';

const fetchDailyBriefing = async (lat: number, lon: number): Promise<{ briefing: DailyBriefing, sources: Source[] }> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        .filter(Boolean) // Filter out any non-web chunks
        .map((webChunk: any) => ({
            title: webChunk.title,
            uri: webChunk.uri,
        }))
        // Deduplicate sources based on URI
        .filter((source, index, self) =>
            index === self.findIndex((s) => s.uri === source.uri)
        );

    try {
        // The model can sometimes wrap the JSON in markdown backticks, so we strip them.
        const jsonText = response.text.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
        const data = JSON.parse(jsonText);
        // Basic validation
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

export { fetchDailyBriefing };