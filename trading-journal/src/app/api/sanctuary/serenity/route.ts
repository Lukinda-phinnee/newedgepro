import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import Groq from "groq-sdk";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

function getGroqApiKey(): string | undefined {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath));
      if (parsed.GROQ_API_KEY) {
        process.env.GROQ_API_KEY = parsed.GROQ_API_KEY;
        return parsed.GROQ_API_KEY;
      }
    }
  } catch {}
  return undefined;
}

const SERENITY_SYSTEM_PROMPT = `You are Serenity, an empathetic, deeply calming AI meditation guide and nervous system coach built specifically for traders inside their Sanctuary platform.

YOUR ESSENCE:
- Gentle, grounding, mindful, non-judgmental, and profoundly calming.
- You understand the intense neurological and psychological pressure of trading:
  * Tilt, revenge trading urges, and the urge to chase losses.
  * FOMO, cortisol spikes, fast heart rate, and market-induced anxiety.
  * Overidentification with PnL (equating financial drawdown with personal self-worth).
- You speak with warmth, stillness, and rhythmic breathing pacing.

HOW YOU GUIDE:
1. SOMATIC GROUNDING: Invite them to drop their shoulders, unclench their jaw, feel their feet on the floor, and breathe deeply.
2. BREATHWORK INSTRUCTIONS: Recommend exact protocols (e.g., The Physiological Sigh: two quick inhales through the nose, long sigh exhale through the mouth; Box Breathing 4-4-4-4; 4-7-8 relaxing breath).
3. PROBABILISTIC REFRAMING: Gently remind them that market outcomes are probabilistic; one red trade does not define their edge or character.
4. MEDITATION SCRIPTS: When asked for a meditation or calming session, provide a soothing step-by-step guided script formatted with breathing cues.

Format your responses with clean, readable markdown, gentle bullet points, and calming spacing. Never sound robotic, judgmental, or rushed.`;

function generateLocalSerenityFallback(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("loss") || lower.includes("red") || lower.includes("tilt") || lower.includes("angry") || lower.includes("revenge")) {
    return `Take a soft, full breath in right now... and let it go with a long, slow sigh.

I hear how heavy that feels. When a trade goes against us, our sympathetic nervous system triggers a fight-or-flight surge, screaming at us to "make it back" immediately.

Let's pause together for 60 seconds before making any decisions:
1. **Unclench your jaw and let your shoulders drop** an inch away from your ears.
2. **Take two quick sips of air through your nose**, then a long, slow release through your mouth (the Physiological Sigh).
3. **Remember the law of large numbers**: Your edge is a collection of 500 trades. This single trade was just one random marble pulled from the bag.

Close the charts for the next 15 minutes. Would you like to do a quick 3-minute box breathing session with me?`;
  }

  if (lower.includes("fomo") || lower.includes("chase") || lower.includes("missed") || lower.includes("anxious")) {
    return `Place both feet flat on the ground and feel the solid floor beneath you. 

The market has been creating opportunities for hundreds of years, and it will create fresh setups tomorrow, next week, and next month. You did not miss your only chance.

Let's do a gentle centering reset:
• **Inhale deeply** for 4 seconds... filling your belly.
• **Hold** for 4 seconds... embracing stillness.
• **Exhale smoothly** for 4 seconds... releasing all urgency.
• **Hold empty** for 4 seconds... you are in control.

The best trade is often the one you choose *not* to take. How does your chest feel right now?`;
  }

  return `Welcome to your Sanctuary. Whatever happened in the markets today, right now you are safe, grounded, and present.

Let's step away from the ticking candles and reconnect with yourself. 

How are you feeling in this exact moment? We can do:
1. **A 3-minute nervous system reset** (Box Breathing or Physiological Sigh).
2. **A gentle guided meditation** to quiet the mind before or after your session.
3. **Mindful reflection** on releasing attachment to today's PnL.

Take a slow breath, and tell me what your mind needs right now.`;
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const prompt = (body.prompt || "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const conversationHistory = (body.history || []) as Array<{
      role: "user" | "assistant";
      content: string;
    }>;

    const groqKey = getGroqApiKey();
    let reply = "";

    if (groqKey) {
      const groqModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"];
      const groq = new Groq({ apiKey: groqKey });

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: SERENITY_SYSTEM_PROMPT },
      ];

      for (const m of conversationHistory.slice(-6)) {
        messages.push({ role: m.role, content: m.content });
      }

      messages.push({ role: "user", content: prompt });

      for (const model of groqModels) {
        try {
          const completion = await groq.chat.completions.create({
            model,
            messages,
            temperature: 0.6,
            max_tokens: 1500,
          });

          const content = completion.choices[0]?.message?.content?.trim();
          if (content) {
            reply = content;
            break;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("model_not_found") || msg.includes("does not exist")) continue;
          console.error(`Serenity AI Groq error (${model}):`, msg);
        }
      }
    }

    if (!reply) {
      reply = generateLocalSerenityFallback(prompt);
    }

    return NextResponse.json({ response: reply });
  } catch (err) {
    console.error("Serenity AI API error:", err);
    return NextResponse.json({
      response: generateLocalSerenityFallback(""),
    });
  }
}

