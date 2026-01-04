import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { get } from "node:http";
import { z } from "zod";
import { describe } from "zod/v4/core";

dotenv.config();

const ai = new GoogleGenAI({});

async function main() {
  const getWeatherSchema = z.object({
    city: z.string().describe("The city to get the weather for"),
    temperature: z.number().describe("The current temperature in Celsius"),
    condition: z.string().describe("A brief description of the weather condition"),
  });

  const getWeatherDeclaration = {
    name: "getWeatherFromAPI",
    description: "Get the current weather for a given city",
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: {
          type: Type.STRING,
          description: "The city to get the weather for",
        }
      }
    },
  };

  function getWeatherFromAPI(city: string) {
    console.log(`Fetching weather for ${city}...`);
   return `The current weather in ${city} is 30°C with clear skies.`;
  }
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: "What is the weather in Las Vegas?" }] },
    { role: "tool", parts: [{ text: "getWeatherFromAPI" }] }],
    config: {
      thinkingConfig: { includeThoughts: true },
      tools: [
        {
          functionDeclarations: [getWeatherDeclaration],
        } 
      ]
    }
  });
  for (const part of response?.candidates[0]?.content?.parts || []) {
    if (!part.text) continue;
    if (part.thought) {
      console.log("Thought: ", part.text);
    } else {
      console.log("Answer: ", part.text);
    }
  }
  console.log(response.text);
}

main();