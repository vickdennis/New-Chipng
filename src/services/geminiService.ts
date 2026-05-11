import axios from "axios";

export interface AIDesignResponse {
  text: string;
  functionCalls: {
    name: string;
    args: any;
  }[];
}

export async function aiDesign(prompt: string, userContext: any): Promise<AIDesignResponse> {
  const response = await axios.post("/api/ai-design", { prompt, userContext });
  return response.data;
}

export async function aiWriter(topic: string, keywords?: string) {
  const response = await axios.post("/api/ai-writer", { topic, keywords });
  return response.data;
}
