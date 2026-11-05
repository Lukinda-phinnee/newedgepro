import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

interface CopilotRequestBody {
  prompt: string;
  planTitle?: string;
  planContent?: string;
  sessionTag?: string;
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

function generateLocalPlanAnalysis(prompt: string, title: string, text: string, sessionTag: string): string {
  const lowerPrompt = prompt.toLowerCase();
  const lowerText = text.toLowerCase();

  // Extract tickers mentioned
  const tickerMatches = text.match(/\b(NQ|ES|YM|RTY|EUR\/?USD|GBP\/?USD|USD\/?JPY|XAU\/?USD|GOLD|BTC|ETH)\b/gi);
  const tickers = tickerMatches ? Array.from(new Set(tickerMatches.map((t) => t.toUpperCase()))) : ["NQ", "ES"];

  // Extract risk metrics if present
  const lossMatch = text.match(/max daily loss:?\s*([\d.]+[%$]|\$[\d,]+)/i);
  const maxLoss = lossMatch ? lossMatch[1] : "1.0% ($500)";

  const tradeCapMatch = text.match(/(?:max|maximum)\s*(?:trades|executions)[^\d]*(\d+)/i);
  const tradeCap = tradeCapMatch ? tradeCapMatch[1] : "3";

  // Check categories of inquiries
  if (lowerPrompt.includes("risk") || lowerPrompt.includes("boundary") || lowerPrompt.includes("drawdown")) {
    return `### Risk Guardrails Audit: ${title}

1. **Daily Loss Ceiling**: Your plan enforces a hard limit of **${maxLoss}**. If this threshold is hit, the session is terminated immediately—no exceptions or recovery chasing.
2. **Execution Allocation**: Capped at **${tradeCap} trades maximum**. This ensures you do not overtrade during midday chop.
3. **Position Sizing Check**:
   • Recommended risk per setup: **0.33% - 0.5%** of account equity.
   • At 0.5% risk, you have an operational cushion of 2 full stops before hitting daily halt.
4. **Discipline Protocol**: If you experience 2 consecutive losing trades, enforce a mandatory **30-minute cooling off period** away from your charts.`;
  }

  if (lowerPrompt.includes("news") || lowerPrompt.includes("macro") || lowerPrompt.includes("blackout") || lowerPrompt.includes("event")) {
    return `### Macro & News Blackout Protocol:

1. **Pre-Session Calendar Review**:
   • Always cross-reference the ForexFactory or Bloomberg economic calendar before the open.
   • High-impact (Red Folder) releases include: **CPI, PPI, FOMC, Non-Farm Payrolls (NFP), and ISM Services PMI**.
2. **Blackout Window Directive**:
   • **No new limit or market orders** within **5 minutes before** and **5 minutes after** high-impact releases.
   • Spreads typically widen 3x to 5x during the announcement; slippage can exceed your stop size.
3. **Open Position Management**:
   • If holding open runners ahead of a tier-1 release, trail stops to breakeven or take partials to eliminate downside tail risk.`;
  }

  if (lowerPrompt.includes("invalidation") || lowerPrompt.includes("stop") || lowerPrompt.includes("sweep")) {
    return `### Trade Invalidation Framework (${tickers.join(", ")}):

1. **Structural Invalidation vs. Hard Stop**:
   • **Pre-Execution Invalidation**: If the market aggressively displaces through your planned entry zone before a confirmation signal prints, cancel all pending orders. The setup is dead.
   • **In-Trade Invalidation**: A 5-minute candle close beyond the key swing high/low invalidates the thesis. Exit immediately—do not wait for an extended wick stop.
2. **Reversal Trap Warning**:
   • Avoid immediately flipping bias after an invalidation. Wait for fresh market structure confirmation and order flow equilibrium.`;
  }

  if (lowerPrompt.includes("checklist") || lowerPrompt.includes("entry") || lowerPrompt.includes("rule")) {
    return `### In-Session Execution Checklist (${sessionTag} Session):

- [ ] **Stage 1: Context Alignment**
  • Higher timeframe order flow supports trade direction.
  • Prior session extremes (Asian/London High & Low) identified as liquidity draws.
- [ ] **Stage 2: Setup Qualification**
  • Clean liquidity sweep printed with displacement.
  • Fair Value Gap (FVG) or optimal trade entry (OTE) confirmed.
- [ ] **Stage 3: Risk Pre-Flight**
  • Hard stop placed at invalidation point.
  • Calculated Risk:Reward ratio is at least **1:2.0R**.
  • Position size strictly adheres to the ${maxLoss} daily limit.
- [ ] **Stage 4: Post-Entry Directives**
  • Take 50% partial at TP1; move stop to breakeven.
  • Let remainder run to institutional liquidity targets.`;
  }

  // General Context-Aware Analysis of the active plan
  return `### Plan Copilot Analysis: ${title}

• **Active Session**: ${sessionTag}
• **Monitored Assets**: ${tickers.join(", ")}
• **Risk Parameter**: Max Daily Loss bounded at ${maxLoss} across ${tradeCap} max executions.

**Key Observation**:
Your plan establishes clear structured parameters. To maximize your execution rate today:
1. Wait patiently for price to reach your defined entry zone—do not chase green candles into premium pricing.
2. Treat your hard invalidation levels as non-negotiable exit points.
3. Let me know if you would like me to simulate an invalidation path or audit a specific R:R calculation.`;
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

    // Check if an external LLM key is configured in the environment
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

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
                      text: `You are the EdgePro Trading Plan Copilot. You are an expert trading mentor, risk-management analyst, and discipline coach.
The trader is currently working on this Trading Plan:
Title: "${planTitle}" (Session: ${sessionTag})
Plan Content Details:
${plainText.slice(0, 4000)}

Trader's inquiry: "${prompt}"

Provide direct, actionable, professional trading feedback. Be concise, well-structured with markdown headings and bullet points where helpful. Cite their specific plan numbers, risk ceilings, or tickers where relevant. Avoid generic disclaimers.`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ response: reply });
          }
        }
      } catch (err) {
        console.error("Gemini API call failed, falling back to local engine:", err);
      }
    } else if (openaiKey) {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are the EdgePro Trading Plan Copilot. You are an expert trading mentor and risk-management coach.
The trader's active trading plan:
Title: "${planTitle}" (Session: ${sessionTag})
Content:
${plainText.slice(0, 4000)}

Be concise, direct, and actionable. Use markdown. Cite their exact numbers and tickers where applicable.`,
              },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (openaiRes.ok) {
          const openaiData = await openaiRes.json();
          const reply = openaiData.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ response: reply });
          }
        }
      } catch (err) {
        console.error("OpenAI API call failed, falling back to local engine:", err);
      }
    }

    // Default: EdgePro Intelligent Trading Plan Analysis Engine
    const localReply = generateLocalPlanAnalysis(prompt, planTitle, plainText, sessionTag);
    return NextResponse.json({ response: localReply });
  } catch (error) {
    console.error("POST /api/plans/copilot error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}

