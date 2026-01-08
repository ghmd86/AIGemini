import { Content, FunctionCall, GoogleGenAI, Part, Type } from "@google/genai";
import dotenv from "dotenv";
// import { get } from "node:http";
// import { z } from "zod";
// import { describe } from "zod/v4/core";

dotenv.config();

const ai = new GoogleGenAI({});

async function main() {
  // const getWeatherSchema = z.object({
  //   city: z.string().describe("The city to get the weather for"),
  //   temperature: z.number().describe("The current temperature in Celsius"),
  //   condition: z.string().describe("A brief description of the weather condition"),
  // });
  const userInputComment: Part = { text: "What is the weather in Las Vegas?" };
  const userInput: Content = {
    role: "user",
    parts: [userInputComment]
  }
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

  function getWeatherFromAPI(city: string): string {
    console.log(`Fetching weather for ${city}...`);
    switch (city.toLowerCase()) {
      case "las vegas":
        return `The current weather in ${city} is 40°C with sunny skies.`;
      case "new york":
        return `The current weather in ${city} is 22°C with scattered clouds.`;
      case "san francisco":
        return `The current weather in ${city} is 18°C with foggy conditions.`;
      default:
        return `The current weather in ${city} is 30°C with clear skies.`;
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [userInput],
    config: {
      thinkingConfig: { includeThoughts: true },
      tools: [
        {
          functionDeclarations: [getWeatherDeclaration],
        }
      ]
    }
  });
  const functionCall: FunctionCall | undefined = response?.candidates?.[0]?.content?.parts?.find(
    part => part.functionCall
  )?.functionCall;
  let result;
  if (functionCall && functionCall.name === "getWeatherFromAPI") {
    result = getWeatherFromAPI(functionCall?.args?.city as string);
  }
  const followUp = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [userInput,
      { role: "model", parts: [{ functionCall: functionCall }] },
      {
        role: "function", parts: [{
          functionResponse:
          {
            name: functionCall?.name,
            response: { result: result }
          }
        }]
      }],
    config: {
      thinkingConfig: { includeThoughts: true },
      tools: [
        {
          functionDeclarations: [getWeatherDeclaration],
        }
      ]
    }
  });

  console.log("Follow-up response: ", followUp?.text);
}

// const toolCall: FunctionCall | undefined = response?.functionCalls?.[0];
// let result;
// if (toolCall?.name === "getWeatherFromAPI") {
//   result = getWeatherFromAPI((toolCall?.args as Record<string, string>)?.city);
// }
// console.log("Tool result: ", result);
// }

main();