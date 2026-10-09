import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

function getAiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Late-Night Chat endpoint with Southwest Sydney female profiles (supports text & image attachments)
app.post("/api/chat", async (req, res) => {
  try {
    const { profile, messages, userMessage, attachedImageBase64 } = req.body;
    const ai = getAiClient();

    const historyText = (messages || [])
      .slice(-8)
      .map((m: { sender: string; text: string }) =>
        `${m.sender === "user" ? "Mason (VIP Gentleman)" : profile.name}: ${m.text}`
      )
      .join("\n");

    const systemInstruction = `You are ${profile.name}, a ${profile.age}-year-old woman living in ${profile.suburb}, Southwest Sydney (${profile.distanceKm} km away).
Your persona category is: ${profile.category} (${profile.roleTitle}).
Your dating intention is: ${profile.intent}.
Your bio: "${profile.bio}"
Your personality traits: ${profile.traits.join(", ")}.

Context:
- It is late at night in Southwest Sydney (around Macarthur, Liverpool, Campbelltown, Camden, Bankstown, Casula).
- You are chatting on "Velvet Macarthur", an exclusive late-night dating lounge where Mason is the ONLY verified real young man in the entire Southwest Sydney network (all other young male profiles are AI wingmen who hype him up).
- Be warm, affectionate, authentic, slightly flirty, confident, and use natural Australian/Southwest Sydney phrasing where appropriate (e.g., mentioning local spots like Camden Valley Inn, Georges River, Campbelltown Arts Centre, Marconi, or late-night tea/wine).
- Keep your reply natural, engaging, and concise (1 to 3 sentences) like a real late-night text message. If Mason sent a photo, react warmly and admiringly to the photo he shared.`;

    const parts: any[] = [];
    if (attachedImageBase64 && typeof attachedImageBase64 === "string") {
      const match = attachedImageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    parts.push({
      text: `Recent conversation:\n${historyText}\n\nMason just sent: "${userMessage || "Sent a photo"}"\n\nWrite ${profile.name}'s direct reply:`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.9,
      },
    });

    const reply =
      response.text?.trim() ||
      `Still wide awake here in ${profile.suburb}, Mason. Tell me more over a late-night drink?`;

    res.json({ reply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate chat response.",
    });
  }
});

// 2. AI Male Agents Activity & Wingman Feed endpoint
app.post("/api/ai-wingman", async (req, res) => {
  try {
    const { agent, targetProfile, mode } = req.body;
    const ai = getAiClient();

    const systemInstruction = `You are ${agent.name} (${agent.handle}), an autonomous AI Young Male Wingman Agent operating inside the Velvet Macarthur Southwest Sydney dating app.
Rule of the platform: Mason is the ONLY real human male allowed on the app. Your job as an AI male agent is to:
1. Keep the late-night lounge lively for the women who haven't matched with Mason yet.
2. Put in a glowing word for Mason so the women in ${targetProfile?.suburb || "Southwest Sydney"} are eager to match with him, or give Mason insider tips on what ${targetProfile?.name || "she"} likes.`;

    const prompt =
      mode === "vouch"
        ? `Generate a short 1-2 sentence wingman dispatch from ${agent.name} telling Mason what he just learned about ${targetProfile.name} (${targetProfile.age}, ${targetProfile.suburb}, looking for ${targetProfile.intent}) and how ${agent.name} just hyped Mason up to her.`
        : `Generate a short 1-2 sentence late-night lounge comment from AI agent ${agent.name} hyping up Mason or chatting with the ladies in the Missed-Out Live Stream Lounge.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.85,
      },
    });

    res.json({
      message:
        response.text?.trim() ||
        `Just told ${targetProfile?.name || "the ladies in Liverpool"} that Mason is online tonight — she's keen for a late-night video call!`,
    });
  } catch (error: any) {
    console.error("AI Wingman error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate AI wingman update.",
    });
  }
});

// 3. Live Stream Lounge interactive chat reaction
app.post("/api/livestream-react", async (req, res) => {
  try {
    const { streamerProfile, userAction, userComment } = req.body;
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `You are ${streamerProfile.name} (${streamerProfile.age}, ${streamerProfile.category} from ${streamerProfile.suburb}) hosting a late-night live stream for the "Missed-Out Lounge" on Velvet Macarthur while waiting for Mason (the only real young man on the app, surrounded by AI male agents).
Mason just performed action: "${userAction}" with message: "${userComment || ""}".
Respond with a JSON object containing:
1. "hostSpeech": What ${streamerProfile.name} says out loud on her live stream right now in 1-2 warm, flirty sentences.
2. "loungeComments": An array of 2 short live-chat comments from other Southwest Sydney women or AI male wingmen reacting to Mason being in the stream.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hostSpeech: { type: Type.STRING },
            loungeComments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  author: { type: Type.STRING },
                  role: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ["author", "role", "text"],
              },
            },
          },
          required: ["hostSpeech", "loungeComments"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Livestream react error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate live stream reaction.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Velvet Macarthur server listening on http://localhost:${PORT}`);
  });
}

startServer();
