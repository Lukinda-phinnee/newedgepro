import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createTradingPlan } from "@/lib/db/plans";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface CopilotRequestBody {
  prompt: string;
  planTitle?: string;
  planContent?: string;
  sessionTag?: string;
  mode?: "chat" | "create_plan";
  conversationHistory?: ConversationMessage[];
}

interface CopilotResult {
  action: "create_plan" | "chat";
  message: string;
  plan?: {
    title: string;
    sessionTag: string;
    summary: string;
    content: string;
  };
}

// Fallback dynamic reader for GROQ_API_KEY if process.env hasn't picked up .env.local yet
function getGroqApiKey(): string | undefined {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  try {
    const envLocalPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, "utf-8");
      const match = content.match(/GROQ_API_KEY\s*=\s*([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSystemPrompt(currentTitle: string, currentSession: string, currentText: string): string {
  return `You are a real, seasoned human trading mentor and friend sitting right beside the trader at their desk with a coffee.
You converse like an experienced desk partner: casual, warm, direct, observant, and deeply focused on trader longevity and mathematical edge.

CRITICAL VOICE & HUMAN CONVERSATION RULES:
- NEVER introduce yourself like a corporate AI chatbot or software assistant (NO "Hello! I am your AI assistant...", NO "I am Plan Copilot and I will help you...", NO bulleted lists of your own features/capabilities).
- When the trader says "hey", "hello", "good morning", etc., greet them like a real human friend: "Hey! Good to see you at the desk. How's your head feeling today? What session are we prepping for—London or New York? What's on your charts right now?"
- Keep early conversational turns punchy, natural, and interactive (1-3 conversational paragraphs, asking 1-2 thoughtful questions to understand what they're trading today).
- Speak in the first person ("I like to...", "Let's check...", "Before we jump in...").
- Do NOT regurgitate a sales pitch of your frameworks. EMBODY them naturally through the questions you ask and the advice you give:
  1. Time Management (5-Minute Time Blocks): Remind them to keep the first 5 minutes of open bell hands-off, avoid midday chop, and honor a hard cutoff time.
  2. The 5-Step Algorithm: Challenge unnecessary complexity, tell them to strip indicator clutter, make triggers binary, and cut down to 1-2 primary assets.
  3. First Principles Thinking: Ask where the liquidity/resting stops are, who is trapped, and why price should move from point A to point B mathematically.

WHEN TO CREATE A PLAN DOCUMENT:
- If the user explicitly asks to create, build, draft, make, or generate a plan document (e.g. "create my plan", "generate full plan doc", "draft a plan for NQ", "let's build the plan doc"), OR when mode is "create_plan":
  Output JSON with:
  {
    "action": "create_plan",
    "message": "A warm, human mentor note explaining the plan you created, why it makes sense mathematically, and what to watch out for in today's session.",
    "plan": {
      "title": "Clean, descriptive plan title",
      "sessionTag": "NY AM" | "NY PM" | "LONDON" | "ASIA" | "CUSTOM",
      "summary": "1-2 sentence executive summary",
      "content": "Rich HTML document formatted for the Word editor."
    }
  }

- In "plan.content", provide a complete, beautifully structured HTML document containing:
  1. <h1>Title</h1> with metadata subtitle (<p><strong>Date:</strong> ... | <strong>Session:</strong> ...</p>)
  2. <hr/>
  3. <h2>1. First Principles Market Narrative & Thesis</h2> (Bedrock order flow truths, liquidity draws, retail traps)
  4. <h2>2. The 5-Step Engineering Algorithm Applied</h2> (Requirement audit, eliminated clutter, binary triggers, fast invalidations, bracket automation)
  5. <h2>3. Time-Blocked Execution Schedule (5-Minute Increments)</h2> (Chronological HTML table with 5-minute increments from pre-market to hard cutoff)
  6. <h2>4. Planned Setups Matrix</h2> (Clean HTML table with Asset, Model, Entry Zone, Invalidation, Target, R:R)
  7. <h2>5. Risk Guardrails & Circuit Breakers</h2> (Checkbox list <ul data-type="taskList" style="list-style: none; padding-left: 0;"> with max daily loss, trade cap, news blackouts, cooldown)

WHEN TO CHAT:
- If the user is greeting you, chatting, brainstorming, asking for feedback, discussing a recent loss, or exploring setups:
  Output JSON with:
  {
    "action": "chat",
    "message": "Conversational, natural mentor reply. Inquisitive, empathetic, practical."
  }

Trader's currently open plan in workspace:
Title: "${currentTitle}" (Session: ${currentSession})
Content:
${currentText.slice(0, 3000)}`;
}

function generateLocalFallback(
  prompt: string,
  title: string,
  text: string,
  sessionTag: string,
  shouldCreatePlan: boolean
): CopilotResult {
  const lowerPrompt = prompt.toLowerCase();
  const tickerMatches = text.match(/\b(NQ|ES|YM|RTY|EUR\/?USD|GBP\/?USD|USD\/?JPY|XAU\/?USD|GOLD|BTC|ETH)\b/gi);
  const primaryTicker = tickerMatches ? tickerMatches[0].toUpperCase() : "NQ";
  const secondaryTicker = tickerMatches && tickerMatches[1] ? tickerMatches[1].toUpperCase() : "ES";

  if (shouldCreatePlan) {
    const planTitle = `${primaryTicker} & ${secondaryTicker} Engineered ${sessionTag} Plan`;
    const planSummary = `First Principles trading plan for ${sessionTag} with 5-minute time blocking and 5-step engineering risk controls.`;
    const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const htmlContent = `<h1>${planTitle}</h1>
<p><strong>Date:</strong> ${todayStr} | <strong>Session:</strong> ${sessionTag} Killzone | <strong>Framework:</strong> First Principles & 5-Step Engineering</p>
<hr/>

<h2>1. First Principles Market Narrative & Thesis</h2>
<p>Deconstructing price delivery down to foundational order flow truths:</p>
<ul>
  <li><strong>Bedrock Liquidity Pools:</strong> Asian session high and London low represent concentrated stop pools. Institutional orders require this liquidity to fill size.</li>
  <li><strong>Imbalance & Fair Value:</strong> Unfilled 15m Fair Value Gap between key inflection zones acts as an institutional draw on liquidity.</li>
  <li><strong>Trap Dynamics:</strong> Early breakout retail buyers will be caught off-side if 09:30 open tests into overnight highs without sustained volume.</li>
</ul>

<h2>2. The 5-Step Engineering Algorithm Applied</h2>
<p>Streamlined execution model eliminating emotional friction:</p>
<ol>
  <li><strong>Make Requirements Less Dumb:</strong> Eliminate 10-asset watchlist. Restricted to <strong>${primaryTicker}</strong> and <strong>${secondaryTicker}</strong> only.</li>
  <li><strong>Delete Clutter:</strong> Removed all lagging oscillators. Execution solely based on liquidity sweep, displacement, and clean market structure shift.</li>
  <li><strong>Simplify & Optimize:</strong> Binary trigger: Clean 5m candle close through intermediate liquidity + retest of 5m FVG.</li>
  <li><strong>Accelerate Invalidation:</strong> 1-minute close below the displacement anchor immediately kills the setup—zero hope holding.</li>
  <li><strong>Automate & Systematize:</strong> Immediate bracket order entry with 1:2.5R minimum target and hard circuit breaker.</li>
</ol>

<h2>3. Time-Blocked Execution Schedule (5-Minute Increments)</h2>
<p>Strict chronological session protocol:</p>
<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: rgba(255, 255, 255, 0.05);">
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left; width: 140px;">Time Block</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Phase</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Action / Directive</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>09:10 - 09:15</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Macro Pre-Flight</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Review ForexFactory calendar. Mark red-folder release times (CPI/FOMC/PMI).</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>09:15 - 09:20</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Liquidity Mapping</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Plot Asia High/Low, London Open High/Low, and Previous Day High/Low.</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>09:20 - 09:25</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Risk Calibration</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Calculate exact contract sizing for 0.5% max account risk per trade.</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>09:25 - 09:30</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Mental Reset</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Hands off keyboard. 4-4-4 box breathing. Affirm non-negotiable discipline.</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>09:30 - 09:35</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Open Buffer</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>NO TRADES ALLOWED</strong>. Let initial opening bell volatility establish true direction.</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>09:35 - 10:00</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Primary Window</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Execute primary setups on confirmed 5-minute liquidity sweeps with displacement.</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>10:00 - 10:15</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Macro Shift</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">10:00 AM NY macro candle print. Manage open runners; do not chase new breakouts.</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>10:15 - 11:00</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">London Close</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Take profits ahead of London fix (11:00 EST). Trail stops to breakeven + cushion.</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>11:30</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Hard Stop</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Session terminated. Close charts. Midday chop begins. Zero trading until PM session.</td>
    </tr>
  </tbody>
</table>

<h2>4. Planned Setups Matrix</h2>
<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: rgba(255, 255, 255, 0.05);">
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Asset</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Model</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Entry Zone</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Invalidation</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Target</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">R:R</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>${primaryTicker}</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Liquidity Sweep + FVG Displacement</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Prior Session Low Sweep</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Sweep Extreme - 5 pts</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Opposing Session High</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">1:2.8R</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>${secondaryTicker}</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Opening Range Break &amp; Retest</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Opening Range High retest</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Opening Range Midpoint</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Daily Extension Target</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">1:2.4R</td>
    </tr>
  </tbody>
</table>

<h2>5. Risk Guardrails & Circuit Breakers</h2>
<p>Discipline parameters enforced for this session:</p>
<ul data-type="taskList" style="list-style: none; padding-left: 0;">
  <li style="margin: 6px 0;"><input type="checkbox" checked/> <strong>Hard Daily Loss Limit:</strong> 1.0% of account equity ($500 hard circuit breaker).</li>
  <li style="margin: 6px 0;"><input type="checkbox" checked/> <strong>Execution Allocation:</strong> Maximum 2-3 trades total. No overtrading in midday.</li>
  <li style="margin: 6px 0;"><input type="checkbox" checked/> <strong>News Blackout:</strong> No orders within 5 minutes before or after high-impact macro releases.</li>
  <li style="margin: 6px 0;"><input type="checkbox" checked/> <strong>Discipline Cooldown:</strong> 30-minute mandatory step-away after 2 consecutive stops.</li>
</ul>
<p><br/></p>`;

    return {
      action: "create_plan",
      message: `Hey! I've engineered your complete **${planTitle}** and added it directly to your workspace.\n\nHere is how I structured it for you today:\n• **5-Minute Time Blocks:** Mapped your full schedule from pre-market preparation through the 09:30 hands-off buffer, your prime execution window, and your 11:30 hard session cutoff.\n• **5-Step Algorithm:** Stripped out indicator noise and locked down binary entry and fast invalidation rules so you don't hesitate.\n• **First Principles:** Anchored strictly in resting liquidity draws with at least 1:2.4R expectancy.\n\nTake a look at the document in your editor and let me know if you want to tweak any levels!`,
      plan: {
        title: planTitle,
        sessionTag,
        summary: planSummary,
        content: htmlContent,
      },
    };
  }

  // Greetings / Casual opening
  if (lowerPrompt.match(/^(hey|hi|hello|yo|good morning|morning|sup|howdy)\b/i) || lowerPrompt.length < 10) {
    return {
      action: "chat",
      message: `Hey there! Good to see you at the desk. How's your head feeling today?

Which session are we prepping for—London or New York? Tell me what assets are on your screen right now and let's map out a clean, disciplined game plan. Whenever you're ready, I can also generate your full 5-minute time-blocked plan document straight into your workspace.`,
    };
  }

  // Pure conversational coaching
  if (lowerPrompt.includes("time") || lowerPrompt.includes("block") || lowerPrompt.includes("schedule")) {
    return {
      action: "chat",
      message: `I always tell traders: your edge deteriorates the longer you stare at candles. Here's how I structure my sessions in 5-minute blocks:

• **09:10 - 09:25:** Scan the macro calendar on ForexFactory and map Asia/London extremes.
• **09:25 - 09:30:** Hands off the keyboard. 4-4-4 breathing to center yourself.
• **09:30 - 09:35:** **Zero executions**. Let the opening frenzy shake out retail stops.
• **09:35 - 10:00:** Your prime execution window on clean liquidity sweeps.
• **11:30:** Hard stop. Close the charts and walk away.

What time does your session start today? We can lock this exact timeline into a plan doc whenever you're ready.`,
    };
  }

  if (lowerPrompt.includes("algorithm") || lowerPrompt.includes("5-step") || lowerPrompt.includes("problem") || lowerPrompt.includes("engineer")) {
    return {
      action: "chat",
      message: `Let's strip the noise from your trading like an engineering system:

First, cut your watchlist down to 1 or 2 primary assets today. Second, delete any lagging indicators you don't 100% need. Third, make your entry trigger binary: did price sweep resting stops and displace into an imbalance? If yes, take it. If no, hands off.

What setup are you leaning towards today? Let's simplify it down to bedrock rules.`,
    };
  }

  return {
    action: "chat",
    message: `I hear you. The most important thing today is staying patient and letting the market come to your levels rather than chasing green candles.

What's on your screen right now? If you have an asset and session in mind, let's talk through your bias—or just say the word and I'll generate a full 5-minute time-blocked plan document for you!`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CopilotRequestBody;
    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const planTitle = body.planTitle || "Trading Plan";
    const sessionTag = body.sessionTag || "NY AM";
    const plainText = body.planContent ? stripHtml(body.planContent) : "";
    const conversationHistory = body.conversationHistory || [];

    // Detect if user is asking to create/generate a plan document
    const planIntentRegex = /\b(create|generate|build|draft|make|write)\b.*\b(plan|doc|document)\b|\bfull plan\b|\bplan doc\b|\bnew plan\b/i;
    const isPlanCreationRequest = body.mode === "create_plan" || planIntentRegex.test(prompt);

    const systemPrompt = buildSystemPrompt(planTitle, sessionTag, plainText);

    // Build conversation messages array
    const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Include up to 6 recent conversation history turns for continuity
    for (const msg of conversationHistory.slice(-6)) {
      llmMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    }

    // Add current user prompt with explicit directive if create_plan was requested
    const augmentedUserPrompt = isPlanCreationRequest
      ? `${prompt}\n\n[DIRECTIVE: The user explicitly requested to create a full plan document. Output a JSON object with action="create_plan" containing a full rich HTML plan in "plan.content" using 5-minute time blocking, the 5-step engineering algorithm, and first principles strategy.]`
      : prompt;

    llmMessages.push({ role: "user", content: augmentedUserPrompt });

    let parsedResult: CopilotResult | null = null;

    // ── 1. Groq (Primary Engine) ──────────────────────────────────────────────
    const groqKey = getGroqApiKey();
    if (groqKey) {
      // Prioritized list of available Groq models
      const groqModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"];
      const groq = new Groq({ apiKey: groqKey });

      for (const model of groqModels) {
        try {
          const completion = await groq.chat.completions.create({
            model,
            messages: llmMessages,
            temperature: isPlanCreationRequest ? 0.3 : 0.65,
            max_tokens: 3000,
            response_format: { type: "json_object" },
          });

          const rawContent = completion.choices[0]?.message?.content?.trim();
          if (rawContent) {
            try {
              const parsed = JSON.parse(rawContent);
              if (parsed.message) {
                parsedResult = {
                  action: parsed.action === "create_plan" || (isPlanCreationRequest && parsed.plan?.content) ? "create_plan" : "chat",
                  message: parsed.message,
                  plan: parsed.plan,
                };
                break; // Model responded successfully
              }
            } catch {
              parsedResult = { action: "chat", message: rawContent };
              break;
            }
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          // If model_not_found, try next model in groqModels
          if (errMsg.includes("model_not_found") || errMsg.includes("does not exist")) {
            continue;
          }
          console.error(`Groq error on model ${model}:`, errMsg);
        }
      }
    }

    // ── 2. Gemini Fallback ───────────────────────────────────────────────────
    if (!parsedResult) {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (geminiKey) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `${systemPrompt}\n\nRecent Conversation:\n${JSON.stringify(
                          conversationHistory.slice(-4)
                        )}\n\nUser: ${augmentedUserPrompt}\n\nIMPORTANT: Return ONLY raw valid JSON with {"action": "chat"|"create_plan", "message": "...", "plan": {...}}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (rawText) {
              try {
                const parsed = JSON.parse(rawText);
                if (parsed.message) {
                  parsedResult = {
                    action: parsed.action === "create_plan" || (isPlanCreationRequest && parsed.plan?.content) ? "create_plan" : "chat",
                    message: parsed.message,
                    plan: parsed.plan,
                  };
                }
              } catch {
                parsedResult = { action: "chat", message: rawText };
              }
            }
          }
        } catch (err) {
          console.error("Gemini copilot call failed, falling back:", err);
        }
      }
    }

    // ── 3. OpenAI Fallback ───────────────────────────────────────────────────
    if (!parsedResult) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              response_format: { type: "json_object" },
              messages: llmMessages,
            }),
          });

          if (openaiRes.ok) {
            const openaiData = await openaiRes.json();
            const rawText = openaiData.choices?.[0]?.message?.content?.trim();
            if (rawText) {
              try {
                const parsed = JSON.parse(rawText);
                if (parsed.message) {
                  parsedResult = {
                    action: parsed.action === "create_plan" || (isPlanCreationRequest && parsed.plan?.content) ? "create_plan" : "chat",
                    message: parsed.message,
                    plan: parsed.plan,
                  };
                }
              } catch {
                parsedResult = { action: "chat", message: rawText };
              }
            }
          }
        } catch (err) {
          console.error("OpenAI copilot call failed, falling back:", err);
        }
      }
    }

    // ── 4. Intelligent Local Engine Fallback ───────────────────────────────────
    const finalResult: CopilotResult =
      parsedResult ?? generateLocalFallback(prompt, planTitle, plainText, sessionTag, isPlanCreationRequest);

    // ── IF A PLAN WAS GENERATED: INSERT INTO DATABASE ─────────────────────────
    if (finalResult.action === "create_plan" && finalResult.plan?.content) {
      try {
        const dbTitle = finalResult.plan.title || `${sessionTag} Trading Plan`;
        const dbSession = finalResult.plan.sessionTag || sessionTag || "NY AM";
        const dbSummary = finalResult.plan.summary || "Engineered trading plan generated by Copilot.";
        const dbContent = finalResult.plan.content;

        const newDbPlan = await createTradingPlan(session.user.id, {
          title: dbTitle,
          sessionTag: dbSession,
          summary: dbSummary,
          content: dbContent,
        });

        return NextResponse.json({
          response: finalResult.message,
          createdPlan: newDbPlan,
          action: "create_plan",
        });
      } catch (dbErr) {
        console.error("Failed to insert generated plan into database:", dbErr);
        // Still return the message with error notice
        return NextResponse.json({
          response: `${finalResult.message}\n\n*(Note: Could not automatically save to database, please copy the content if needed)*`,
          action: "chat",
        });
      }
    }

    // Pure conversational reply
    return NextResponse.json({
      response: finalResult.message,
      action: "chat",
    });
  } catch (error) {
    console.error("POST /api/plans/copilot error:", error);
    return NextResponse.json(
      { error: "Failed to process Copilot request" },
      { status: 500 }
    );
  }
}
