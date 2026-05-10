import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export function getGemini() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // In this environment, GEMINI_API_KEY should be available
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export interface AIDesignResponse {
  text: string;
  functionCalls: {
    name: string;
    args: any;
  }[];
}

export async function aiDesign(prompt: string, userContext: any): Promise<AIDesignResponse> {
  const gemini = getGemini();
  
  const systemInstruction = `
    You are the Chip NG "AI Designer", a professional profile engineer. 
    Your goal is to help users set up their perfect link-in-bio profile instantly.
    
    You can update the **Cover Image** as part of 'updateProfile'. Recommend abstract patterns or high-quality background images if users want to change their look.
    
    CURRENT CONTEXT:
    ${JSON.stringify(userContext)}

    Be helpful, creative, and efficient. 
    You have access to functions to: updateProfile, addLink, updateLink, deleteLink, applyTheme.
    
    IMPORTANT: When updating properties, use the correct field names:
    - Profiles: displayName, bio, username, textColor (Hex), photoURL, coverImage, backgroundColor (Hex), theme, font, buttonStyle.
    - Themes: minimal, neon, glassmorphism, dark, sunset, ocean, forest, royal, coffee, midnight, lavender, emerald, cyberpunk, retro, nordic, sakura, gold, brutalist, clay, matrix, vibrant, pastel, monochrome, deepsea, desert, galaxy, candy, industrial, vintage, aqua, midnight-purple.
    - Links: title, url, icon, active.
    
    When a user asks for a specific "vibe" or "style", try to apply a matching theme and update colors to match.
  `;

  const response = await gemini.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      tools: [
        {
          functionDeclarations: [
            {
              name: "updateProfile",
              description: "Update the user's profile details like display name, bio, cover image, or username.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  displayName: { type: "STRING" as any },
                  bio: { type: "STRING" as any },
                  username: { type: "STRING" as any },
                  textColor: { type: "STRING" as any },
                  photoURL: { type: "STRING" as any },
                  coverImage: { type: "STRING" as any },
                  backgroundColor: { type: "STRING" as any },
                  theme: { type: "STRING" as any }
                }
              }
            },
            {
              name: "addLink",
              description: "Add a new link to the user's profile.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  title: { type: "STRING" as any },
                  url: { type: "STRING" as any }
                },
                required: ["title", "url"]
              }
            },
            {
              name: "updateLink",
              description: "Update an existing link's title or URL.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  id: { type: "STRING" as any },
                  title: { type: "STRING" as any },
                  url: { type: "STRING" as any }
                },
                required: ["id"]
              }
            },
            {
              name: "deleteLink",
              description: "Delete a link from the profile.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  id: { type: "STRING" as any }
                },
                required: ["id"]
              }
            },
            {
              name: "applyTheme",
              description: "Change the visual theme of the profile.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  theme: { type: "STRING" as any }
                },
                required: ["theme"]
              }
            }
          ]
        }
      ]
    }
  });

  return {
    text: response.text || "",
    functionCalls: response.functionCalls?.map(fc => ({
      name: fc.name,
      args: fc.args
    })) || []
  };
}

export async function aiWriter(topic: string, keywords?: string) {
  const gemini = getGemini();
  
  const prompt = `Write a professional, high-quality blog post about "${topic}". 
  ${keywords ? `Keywords to include: ${keywords}` : ''}
  
  Return the response in JSON format.
  `;

  const response = await gemini.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT" as any,
        properties: {
          title: { type: "STRING" as any },
          content: { type: "STRING" as any },
          excerpt: { type: "STRING" as any },
          seoTitle: { type: "STRING" as any },
          seoDescription: { type: "STRING" as any },
          seoKeywords: { 
            type: "ARRAY" as any,
            items: { type: "STRING" as any }
          },
          tags: { 
            type: "ARRAY" as any,
            items: { type: "STRING" as any }
          }
        },
        required: ["title", "content", "excerpt"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
