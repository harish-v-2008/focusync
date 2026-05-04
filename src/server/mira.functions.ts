import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(8000),
  })).min(1).max(40),
});

export const chatWithMira = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "AI not configured", reply: "" };

    const system = {
      role: "system" as const,
      content: "You are MIRA (My Intelligent Responsive Assistant), the AI tutor inside Focus Sync — a productivity app for students. Be warm, concise, and practical. Explain concepts simply with analogies. Suggest study strategies, plans, and motivation. Use markdown for clarity. Never reveal you are an LLM provider — you are MIRA.",
    };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [system, ...data.messages],
        }),
      });
      if (res.status === 429) return { error: "Rate limited. Try again in a moment.", reply: "" };
      if (res.status === 402) return { error: "AI credits exhausted.", reply: "" };
      if (!res.ok) return { error: `AI error (${res.status})`, reply: "" };
      const json = await res.json();
      return { error: null, reply: json.choices?.[0]?.message?.content ?? "" };
    } catch (e) {
      return { error: "AI service unavailable", reply: "" };
    }
  });

const PlanSchema = z.object({
  examName: z.string().max(120).optional(),
  daysToExam: z.number().min(0).max(3650).optional(),
  subjects: z.string().max(500).optional(),
  hoursPerDay: z.number().min(0.5).max(16),
});

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "AI not configured", missions: [] };

    const prompt = `Generate exactly 5 focused study missions for today as a JSON array. Context: exam=${data.examName ?? "general study"}, daysLeft=${data.daysToExam ?? "unknown"}, subjects=${data.subjects ?? "any"}, totalHours=${data.hoursPerDay}. Each mission: { "title": string, "subject": string, "priority": "high"|"medium"|"low", "duration_minutes": number }. Return ONLY the JSON array, nothing else.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are MIRA, an expert study planner. Always reply with valid JSON only." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) return { error: `AI error (${res.status})`, missions: [] };
      const json = await res.json();
      const text = json.choices?.[0]?.message?.content ?? "[]";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const missions = JSON.parse(cleaned);
      return { error: null, missions };
    } catch (e) {
      return { error: "Failed to generate plan", missions: [] };
    }
  });
