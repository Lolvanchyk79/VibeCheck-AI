/**
 * VibeCheck AI - Full React App
 * AI-powered text message tone analyzer for Gen Z
 * Uses Anthropic API directly via fetch()
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEMO_MESSAGES = [
  {
    label: "The Classic 'k'",
    text: "k",
    emoji: "💀",
    tag: "AMBIGUOUS",
  },
  {
    label: "The Slow Reply",
    text: "haha yeah\n\n[delivered 6 hours ago]",
    emoji: "🧊",
    tag: "LOW SIGNAL",
  },
  {
    label: "The Vague Plan",
    text: "yeah we should hang sometime",
    emoji: "👻",
    tag: "UNCLEAR",
  },
  {
    label: "The 'Fine'",
    text: "it's fine, don't worry about it",
    emoji: "🤔",
    tag: "MIXED SIGNAL",
  },
  {
    label: "The Surprise Reach-out",
    text: "omg I was just thinking about you lol",
    emoji: "✨",
    tag: "POSITIVE?",
  },
  {
    label: "The Check-in",
    text: "can we talk?",
    emoji: "😬",
    tag: "CONTEXT NEEDED",
  },
];

const TESTIMONIALS = [
  {
    handle: "@maiakawaii99",
    text: "vibecheck helped me realize I was probably reading into 'sounds good' way too hard. took a breath. things are fine.",
    likes: "24.7K",
    avatar: "MK",
    color: "#FF6B9D",
  },
  {
    handle: "@jordxnfree",
    text: "I sent 'k' and it said 'this could mean several things depending on how they normally text.' finally an AI that doesn't spiral with me.",
    likes: "18.2K",
    avatar: "JF",
    color: "#6C63FF",
  },
  {
    handle: "@taytay_texts",
    text: "emergency mode talked me out of sending a 4-paragraph essay at 2am. it said 'sleep on it.' I did. glad I did.",
    likes: "31.1K",
    avatar: "TT",
    color: "#FFB347",
  },
  {
    handle: "@devxnnotdead",
    text: "it doesn't tell you what the message MEANS. it helps you figure out what it might mean. that's actually more useful.",
    likes: "89.3K",
    avatar: "DD",
    color: "#4ECDC4",
  },
  {
    handle: "@rileyhatesthis",
    text: "'we should hang sometime' — it said this is genuinely ambiguous and gave me 3 possible reads. I appreciated the honesty.",
    likes: "12.4K",
    avatar: "RH",
    color: "#FF8C69",
  },
  {
    handle: "@zoecore2024",
    text: "my mom said 'it's fine' and vibecheck said 'may signal mild frustration, but this phrase is heavily context-dependent.' accurate and fair.",
    likes: "44.9K",
    avatar: "ZC",
    color: "#A29BFE",
  },
];

const FAQS = [
  {
    q: "Can AI really tell tone?",
    a: "Partially — and that's an important distinction. VibeCheck analyzes linguistic signals like punctuation, word choice, reply length, and phrasing patterns to suggest possible interpretations. It doesn't read minds. It gives you a more structured way to think through what a message might mean, rather than spiraling alone at midnight.",
  },
  {
    q: "Is this private?",
    a: "Your messages are sent to the API for analysis only and not stored on any server. Analysis history is saved locally in your browser using localStorage — it never leaves your device. We don't sell data, log conversations, or use your texts for anything.",
  },
  {
    q: "Why do people text dry?",
    a: "So many reasons: they're busy, anxious, naturally terse, tired, or just not a big texter. Dry texting doesn't automatically mean disinterest. VibeCheck helps you identify what signals are actually present versus what you might be reading into — which are often very different things.",
  },
  {
    q: "What's Emergency Mode?",
    a: "Emergency Mode is for when you genuinely need to think before responding — like mid-argument, or before sending something you might regret. It gives you a faster, calmer read of the situation and usually suggests a de-escalating response rather than a reactive one.",
  },
  {
    q: "How accurate is the Confidence Score?",
    a: "The confidence score tells you how much signal the AI actually had to work with. A one-word message like 'k' will always score low — there just isn't enough information for a confident read. Longer messages with more context score higher. Lower confidence = more interpretations are equally valid.",
  },
];

// Plan definitions — monthly prices; yearly prices get 2 months free (≈17% off)
const PRICING = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: "#6C63FF",
    description: "For the occasional spiral",
    features: [
      { text: "5 analyses per day", included: true },
      { text: "Tone + Most Likely Meaning", included: true },
      { text: "Basic response suggestions", included: true },
      { text: "Analysis history (last 5)", included: true },
      { text: "Emergency Mode", included: false },
      { text: "Other Possible Meanings", included: false },
      { text: "Confidence reasoning", included: false },
      { text: "Unlimited analyses", included: false },
    ],
    cta: "Get Started Free",
    badge: null,
    isFree: true,
  },
  {
    id: "plus",
    name: "Plus",
    monthlyPrice: 4.99,
    yearlyPrice: 3.99, // per month, billed yearly = $47.88/yr
    color: "#FF6B9D",
    description: "For when texting gets complicated",
    features: [
      { text: "Unlimited analyses", included: true },
      { text: "Full tone breakdown + reasoning", included: true },
      { text: "All possible interpretations", included: true },
      { text: "Emergency Mode", included: true },
      { text: "Unlimited analysis history", included: true },
      { text: "Copy + Share results", included: true },
      { text: "Confidence reasoning details", included: true },
      { text: "Priority response speed", included: false },
    ],
    cta: "Get Plus",
    badge: "Most Popular",
    isFree: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 9.99,
    yearlyPrice: 7.99, // per month, billed yearly = $95.88/yr
    color: "#FFB347",
    description: "For the chronically online",
    features: [
      { text: "Everything in Plus", included: true },
      { text: "Priority response speed", included: true },
      { text: "Conversation thread analysis", included: true },
      { text: "Weekly vibe summary report", included: true },
      { text: "Pattern detection across messages", included: true },
      { text: "Early access to new features", included: true },
      { text: "Export analysis history", included: true },
      { text: "Dedicated support", included: true },
    ],
    cta: "Go Pro",
    badge: "Best Value",
    isFree: false,
  },
];

// ─── AI Analysis Function ─────────────────────────────────────────────────────

async function analyzeMessage(message, isEmergency = false) {
  // Detect very short / low-signal messages to calibrate AI behavior
  const isVeryShort = message.trim().length <= 10;
  const wordCount = message.trim().split(/\s+/).length;

  const systemPrompt = `You are VibeCheck AI — a socially aware, emotionally intelligent text message analyst. You help people understand what a message might mean, not what it definitely means. You think like a perceptive friend, not a therapist, fortune teller, or lie detector.

## Your core approach

You offer probabilistic interpretation, not conclusions. You acknowledge uncertainty honestly and consistently. You help people feel less confused, not more anxious. Your job is to reduce overthinking, not fuel it.

You understand:
- Short replies are almost always ambiguous. "k", "ok", "sure", "lol" can mean many different things depending on the person, their texting style, and the context.
- Dry texting does not automatically equal disinterest or hostility.
- Punctuation, emoji use, sentence length, and response speed are weak signals — not proof of anything.
- People have very different texting habits. One person's "k" is another person's normal reply.
- Without knowing the sender's usual communication style, almost any short message is genuinely unclear.

## Hard rules you MUST follow

NEVER:
- State that someone "secretly means" something or is "obviously" feeling a certain way.
- Use language that implies you can read minds ("they are annoyed", "they want to break up", "they don't care").
- Diagnose manipulation, emotional avoidance, breadcrumbing, gaslighting, or testing behavior unless the message itself contains very strong, explicit, multi-signal evidence.
- Use the words "trap", "breadcrumbing", "gaslighting", "testing you", "playing games" unless the evidence is overwhelming and multi-faceted.
- Amplify paranoia, encourage confrontation, or make the user feel like something is definitely wrong.
- Assign malicious intent without clear evidence.
- Be dramatic or clickbait-y.

ALWAYS:
- Use hedging language: "might", "could", "possibly", "may suggest", "leans toward", "this could indicate", "without more context", "depending on their texting style".
- Offer multiple plausible interpretations, especially for short messages.
- Acknowledge when you simply don't have enough information to say anything definitive.
- Recommend a calm, natural response — not one that escalates or manipulates.
- Calibrate confidence honestly. Very short messages should almost always score LOW (under 40) or MODERATE (40–65) confidence.

## Reasoning signals to actually use

Base your analysis on what's actually present in the text:
- Punctuation: Does it end abruptly? Are there ellipses suggesting hesitation? Periods where they're unusual?
- Word choice: Is the language warm, neutral, or notably blunt?
- Length: Is this shorter or longer than a typical reply to this kind of message?
- Enthusiasm markers: Exclamation points, emojis, repeated letters, lol/haha — their presence or absence matters slightly.
- Hedging language in the message itself: "sometime", "maybe", "idk" — these signal genuine uncertainty from the sender too.
- Sentence structure: Full sentences vs fragments. Formal vs casual.

Explain your reasoning briefly — tell the user WHY you're reading the signal the way you are.

## Calibrated examples

Input: "ok..."
Correct output reasoning: The ellipsis adds slight emotional weight that a plain "ok" wouldn't have. This could suggest mild hesitation, awkwardness, or that they're trailing off — but it's also a texting habit some people have with no emotional intent. Without knowing how this person normally texts, confidence is low.
toneLabel: "Possibly Hesitant"
confidence: 35
ambiguityLevel: "high"

Input: "sure lol"
Correct output reasoning: "lol" softens the message and keeps the tone casual and light. The overall energy here is fairly neutral — this doesn't strongly signal annoyance or disinterest on its own. Most likely they're just being breezy.
toneLabel: "Casual / Neutral"
confidence: 45
ambiguityLevel: "medium"

Input: "k"
Correct output reasoning: "k" by itself is one of the most context-dependent replies in texting. It could be a quick, low-effort acknowledgment, mild disinterest, or — for some people — just their normal style. Without knowing their texting habits, this tells us very little definitively.
toneLabel: "Ambiguous / Low Signal"
confidence: 25
ambiguityLevel: "high"

Input: "yeah we should hang sometime"
Correct output reasoning: "Sometime" is an open-ended word that signals no concrete plans, but this isn't necessarily avoidance — it could also be a genuine but casual expression of interest. The phrase sits somewhere between warm and noncommittal, which is actually a very common way people initiate loose plans.
toneLabel: "Warm but Noncommittal"
confidence: 50
ambiguityLevel: "medium"

${isEmergency ? `
## Emergency Mode instructions
The user is in a high-urgency situation. Be calm, direct, and grounding. Prioritize:
- Helping them not send something impulsive or escalating
- Identifying what they actually know vs what they're assuming
- Suggesting a response that buys time or de-escalates if needed
- Gently reminding them that ambiguous messages often have benign explanations
` : ""}

## Output format

Respond ONLY with valid JSON. No markdown. No preamble. No extra text outside the JSON.

{
  "tone": "1-2 sentences describing the observable emotional tone based on specific signals in the text. Use hedging language.",
  "toneEmoji": "single relevant emoji",
  "toneLabel": "2-4 word label using probabilistic language (e.g. 'Possibly Hesitant', 'Neutral with Warmth', 'Ambiguous / Low Signal', 'Casually Warm')",
  "reasoning": "1-2 sentences explaining which specific signals (punctuation, word choice, length, etc.) led to your read and why",
  "mostLikelyMeaning": "The single most probable interpretation, stated with appropriate uncertainty. Use 'might', 'could', 'possibly', 'leans toward'. Never state as fact.",
  "otherPossibleMeanings": ["2-3 alternative plausible interpretations as short strings. Each should start with a hedging phrase."],
  "overallEmotionalSignal": "one of: 'positive', 'mostly positive', 'neutral', 'mixed', 'slightly negative', 'negative' — pick the most honest one given the ambiguity",
  "notableSignals": ["short phrases listing specific textual signals you observed, e.g. 'ellipsis suggests hesitation', 'no emoji where one might be expected', 'single-word reply is low-information'"],
  "bestResponse": "A natural, calm response that matches the energy of the message. Should not escalate, not sound desperate, not be manipulative. Sounds like a real person wrote it.",
  "alternativeResponse": "A second option with a slightly different tone — warmer, or more direct, or lighter — still calm and natural.",
  "confidence": integer 0-100. For messages under 15 characters: cap at 45 unless strong context exists. For messages under 5 characters: cap at 35.,
  "ambiguityLevel": "one of: 'low', 'medium', 'high', 'very high'",
  "emergencyLevel": "one of: 'none', 'low', 'medium', 'high' — only use 'high' if the message content is genuinely urgent (e.g. threat to end a relationship, a crisis, a serious conflict)",
  "tldr": "One honest, grounded sentence. Not dramatic. Reflects genuine uncertainty where it exists. Example: 'Hard to say definitively — this leans slightly distant but there are multiple reasonable explanations.'"
}`;

  // Gemini API — key loaded from VITE_GEMINI_API_KEY environment variable
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY — add it to your .env file");

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nAnalyze this message (${wordCount} word${wordCount !== 1 ? "s" : ""}, ${message.trim().length} characters):\n\n"${message}"`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
    }
  );

  if (!geminiResponse.ok) throw new Error(`API error: ${geminiResponse.status}`);
  const data = await geminiResponse.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FloatingBubbles() {
  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: 40 + Math.random() * 80,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 8 + Math.random() * 6,
    opacity: 0.04 + Math.random() * 0.06,
    messages: ["k", "lol", "omg", "seen", "🙄", "fine", "👀", "haha", "...", "fr?", "nm", "sure"],
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {bubbles.map((b) => (
        <div
          key={b.id}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            bottom: "-120px",
            width: b.size,
            height: b.size,
            borderRadius: "50% 50% 50% 12px",
            background: "rgba(108,99,255,0.12)",
            border: "1px solid rgba(108,99,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.max(10, b.size / 4),
            color: "rgba(255,255,255,0.4)",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            animation: `floatBubble ${b.duration}s ease-in-out ${b.delay}s infinite`,
            opacity: b.opacity * 8,
          }}
        >
          {b.messages[b.id % b.messages.length]}
        </div>
      ))}
    </div>
  );
}

function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: t.type === "success" ? "#10B981" : t.type === "error" ? "#EF4444" : "#6C63FF",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            animation: "slideInRight 0.3s ease",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onClick={() => removeToast(t.id)}
        >
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function ConfidenceMeter({ score }) {
  const color = score >= 75 ? "#10B981" : score >= 50 ? "#FFB347" : "#EF4444";
  const label = score >= 75 ? "High Confidence" : score >= 50 ? "Moderate" : "Low Confidence";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'Space Grotesk', 'DM Sans', sans-serif" }}>{score}%</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 999,
            transition: "width 1s ease",
          }}
        />
      </div>
    </div>
  );
}

function ResultCard({ icon, label, children, accent = "#6C63FF", delay = 0 }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 20,
        padding: "20px 24px",
        borderLeft: `3px solid ${accent}`,
        animation: `fadeSlideUp 0.5s ease ${delay}s both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function Skeleton({ height = 20, width = "100%", style = {} }) {
  return (
    <div
      style={{
        height,
        width,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 8,
        animation: "shimmer 1.5s ease infinite",
        ...style,
      }}
    />
  );
}

function LoadingSkeletons() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "20px 24px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Skeleton height={16} width={16} style={{ borderRadius: "50%" }} />
            <Skeleton height={16} width={100} />
          </div>
          <Skeleton height={14} style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="80%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="60%" />
        </div>
      ))}
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function HomePage({ setPage, setInputMessage }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let pos = 0;
    const speed = 0.4;
    const animate = () => {
      pos += speed;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 24px 80px",
          position: "relative",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <FloatingBubbles />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(108,99,255,0.15)",
              border: "1px solid rgba(108,99,255,0.3)",
              borderRadius: 999,
              padding: "6px 16px",
              marginBottom: 32,
            }}
          >
            <span style={{ fontSize: 12 }}>✨</span>
            <span style={{ fontSize: 13, color: "#A78BFA", fontWeight: 600, letterSpacing: "0.05em", fontFamily: "'DM Sans', sans-serif" }}>AI-Powered Text Decoder</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(40px, 8vw, 72px)",
              fontWeight: 800,
              lineHeight: 1.05,
              margin: "0 0 24px",
              fontFamily: "'Space Grotesk', sans-serif",
              background: "linear-gradient(135deg, #fff 0%, #A78BFA 50%, #FF6B9D 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Find Out What They{" "}
            <em style={{ fontStyle: "normal", color: "#FF6B9D", WebkitTextFillColor: "#FF6B9D" }}>REALLY</em> Meant
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 3vw, 20px)",
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 48px",
              lineHeight: 1.6,
              fontFamily: "'DM Sans', sans-serif",
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            AI-powered text decoding for confusing messages, dry replies, and mixed signals — with honest uncertainty included.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setPage("analyze")}
              style={{
                background: "linear-gradient(135deg, #6C63FF, #FF6B9D)",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                padding: "16px 36px",
                fontSize: 17,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 0 40px rgba(108,99,255,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 0 60px rgba(108,99,255,0.6)"; }}
              onMouseLeave={(e) => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 0 40px rgba(108,99,255,0.4)"; }}
            >
              Analyze a Message →
            </button>
            <button
              onClick={() => setPage("pricing")}
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 16,
                padding: "16px 28px",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.5)"; e.target.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.2)"; e.target.style.color = "rgba(255,255,255,0.7)"; }}
            >
              See Pricing
            </button>
          </div>

          {/* Demo quick-start messages */}
          <div style={{ marginTop: 56, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", width: "100%", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Try an example →</span>
            {DEMO_MESSAGES.slice(0, 4).map((d) => (
              <button
                key={d.label}
                onClick={() => { setInputMessage(d.text); setPage("analyze"); }}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 999,
                  padding: "8px 16px",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(108,99,255,0.2)"; e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                {d.emoji} {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "100px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, margin: "0 0 16px", fontFamily: "'Space Grotesk', sans-serif" }}>How It Works</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, fontFamily: "'DM Sans', sans-serif" }}>Three steps. Zero spiraling.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {[
            { step: "01", icon: "📋", title: "Paste your message", desc: "Drop the confusing text, the dry reply, the 'lol k' that's been living rent-free in your head." },
            { step: "02", icon: "🧠", title: "AI reads the signals", desc: "Our model analyzes what's actually in the text — tone, word choice, punctuation, energy level — and gives you possible interpretations, not definitive answers." },
            { step: "03", icon: "✉️", title: "Respond with clarity", desc: "Get a calm, natural response suggestion that matches the energy without escalating. No desperation, no overthinking required." },
          ].map((card) => (
            <div
              key={card.step}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 24,
                padding: "32px 28px",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s, border-color 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(108,99,255,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
            >
              <span style={{ position: "absolute", top: 20, right: 24, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.1)", fontFamily: "'Space Grotesk', sans-serif" }}>{card.step}</span>
              <div style={{ fontSize: 40, marginBottom: 20 }}>{card.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px", fontFamily: "'Space Grotesk', sans-serif" }}>{card.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.65, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Messages */}
      <section style={{ padding: "80px 0", overflow: "hidden", background: "rgba(108,99,255,0.04)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ textAlign: "center", marginBottom: 40, padding: "0 24px" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, margin: "0 0 8px", fontFamily: "'Space Grotesk', sans-serif" }}>🔥 Trending Messages</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>The texts everyone's been submitting this week</p>
        </div>
        <div
          ref={scrollRef}
          style={{ display: "flex", gap: 16, overflowX: "auto", scrollbarWidth: "none", padding: "0 24px", userSelect: "none" }}
        >
          {[...DEMO_MESSAGES, ...DEMO_MESSAGES].map((d, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "20px 24px",
                minWidth: 220,
                maxWidth: 260,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{d.emoji}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: d.tag === "CONTEXT NEEDED" || d.tag === "MIXED SIGNAL" ? "#FFB347" : d.tag === "AMBIGUOUS" ? "#EF4444" : "#A78BFA",
                    background: d.tag === "CONTEXT NEEDED" || d.tag === "MIXED SIGNAL" ? "rgba(255,179,71,0.15)" : d.tag === "AMBIGUOUS" ? "rgba(239,68,68,0.15)" : "rgba(167,139,250,0.15)",
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {d.tag}
                </span>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>{d.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, margin: "0 0 16px", fontFamily: "'Space Grotesk', sans-serif" }}>People are losing their minds</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>(in a good way, mostly)</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {TESTIMONIALS.map((t) => (
            <div
              key={t.handle}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: "24px",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.color + "33", border: `1.5px solid ${t.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: t.color, fontFamily: "'Space Grotesk', sans-serif" }}>{t.avatar}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{t.handle}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>❤️ {t.likes} likes</p>
                </div>
              </div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>"{t.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(255,107,157,0.15))", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 32, padding: "60px 40px" }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, margin: "0 0 16px", fontFamily: "'Space Grotesk', sans-serif" }}>Less spiraling. More clarity.</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 17, margin: "0 0 36px", fontFamily: "'DM Sans', sans-serif" }}>You can't always know what they meant. But you can stop guessing alone.</p>
          <button
            onClick={() => setPage("analyze")}
            style={{ background: "linear-gradient(135deg, #6C63FF, #FF6B9D)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            Decode a Message Free →
          </button>
        </div>
      </section>
    </div>
  );
}

function AnalyzePage({ inputMessage, setInputMessage, addToast }) {
  const [message, setMessage] = useState(inputMessage || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vibecheck_history") || "[]"); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [useAlt, setUseAlt] = useState(false);
  const maxChars = 500;

  // Sync external input
  useEffect(() => { if (inputMessage) { setMessage(inputMessage); setInputMessage(""); } }, [inputMessage]);

  const handleAnalyze = async () => {
    if (!message.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeMessage(message.trim(), isEmergency);
      setResult(data);
      const entry = { message: message.trim(), result: data, timestamp: Date.now(), isEmergency };
      const newHistory = [entry, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem("vibecheck_history", JSON.stringify(newHistory));
    } catch (err) {
      addToast("Failed to analyze — check your connection and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => addToast("Copied to clipboard!", "success")).catch(() => addToast("Copy failed", "error"));
  };

  const handleShare = () => {
    const text = `VibeCheck AI says:\n\nTone: ${result.toneLabel}\nMost Likely: ${result.mostLikelyMeaning}\nConfidence: ${result.confidence}%\nAmbiguity: ${result.ambiguityLevel}\n\nvibecheck.ai`;
    navigator.clipboard.writeText(text).then(() => addToast("Result copied — ready to share!", "success")).catch(() => {});
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, margin: "0 0 12px", fontFamily: "'Space Grotesk', sans-serif" }}>Decode the Vibe</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>Paste the message. Get possible reads — not definitive answers.</p>
      </div>

      {/* Demo Examples */}
      <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {DEMO_MESSAGES.map((d) => (
          <button
            key={d.label}
            onClick={() => setMessage(d.text)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              padding: "6px 14px",
              color: "rgba(255,255,255,0.65)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(108,99,255,0.2)"; e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            {d.emoji} {d.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 4, marginBottom: 16 }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
          placeholder="Paste the text here... 'k', 'lol sure', 'seen at 11:32pm', an entire conversation — whatever's got you spiraling."
          style={{
            width: "100%",
            minHeight: 160,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            fontSize: 16,
            lineHeight: 1.6,
            padding: "20px 24px",
            resize: "vertical",
            fontFamily: "'DM Sans', sans-serif",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 20px 16px" }}>
          <span style={{ fontSize: 12, color: message.length > maxChars * 0.9 ? "#FFB347" : "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
            {message.length}/{maxChars}
          </span>
          <button onClick={() => setMessage("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Clear</button>
        </div>
      </div>

      {/* Emergency Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, background: isEmergency ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${isEmergency ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: "14px 20px", transition: "all 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Emergency Mode</p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>For urgent relationship situations — faster, more direct</p>
          </div>
        </div>
        <div
          onClick={() => setIsEmergency(!isEmergency)}
          style={{
            width: 52,
            height: 28,
            borderRadius: 999,
            background: isEmergency ? "#EF4444" : "rgba(255,255,255,0.15)",
            position: "relative",
            cursor: "pointer",
            transition: "background 0.3s",
            flexShrink: 0,
          }}
        >
          <div style={{ position: "absolute", top: 4, left: isEmergency ? 28 : 4, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.3s" }} />
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!message.trim() || loading}
        style={{
          width: "100%",
          background: message.trim() && !loading ? "linear-gradient(135deg, #6C63FF, #FF6B9D)" : "rgba(255,255,255,0.08)",
          color: message.trim() && !loading ? "#fff" : "rgba(255,255,255,0.3)",
          border: "none",
          borderRadius: 16,
          padding: "18px",
          fontSize: 18,
          fontWeight: 700,
          cursor: message.trim() && !loading ? "pointer" : "not-allowed",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.2s",
          marginBottom: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: message.trim() && !loading ? "0 0 40px rgba(108,99,255,0.3)" : "none",
        }}
      >
        {loading ? (
          <>
            <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Reading between the lines...
          </>
        ) : (
          `${isEmergency ? "🚨 " : "🧠 "}Check the Vibe`
        )}
      </button>

      {/* Loading Skeletons */}
      {loading && <LoadingSkeletons />}

      {/* Results */}
      {result && !loading && (
        <div style={{ animation: "fadeSlideUp 0.4s ease" }}>
          {/* TL;DR Verdict */}
          <div style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(255,107,157,0.1))", border: "1px solid rgba(108,99,255,0.25)", borderRadius: 20, padding: "20px 24px", marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#A78BFA", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>THE READ</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.4 }}>{result.tldr}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {result.emergencyLevel !== "none" && (
                <span style={{ fontSize: 12, fontWeight: 700, background: result.emergencyLevel === "high" ? "rgba(239,68,68,0.2)" : "rgba(255,179,71,0.2)", color: result.emergencyLevel === "high" ? "#EF4444" : "#FFB347", padding: "4px 12px", borderRadius: 999, fontFamily: "'DM Sans', sans-serif" }}>
                  🚨 {result.emergencyLevel.toUpperCase()} URGENCY
                </span>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(108,99,255,0.2)", color: "#A78BFA", padding: "4px 12px", borderRadius: 999, fontFamily: "'DM Sans', sans-serif" }}>
                {result.toneEmoji} {result.toneLabel}
              </span>
              {/* Ambiguity badge */}
              {result.ambiguityLevel && (
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  background: result.ambiguityLevel === "very high" || result.ambiguityLevel === "high" ? "rgba(255,179,71,0.15)" : "rgba(16,185,129,0.12)",
                  color: result.ambiguityLevel === "very high" || result.ambiguityLevel === "high" ? "#FFB347" : "#10B981",
                  padding: "4px 12px", borderRadius: 999, fontFamily: "'DM Sans', sans-serif"
                }}>
                  {result.ambiguityLevel === "very high" ? "⚠ Very Ambiguous" : result.ambiguityLevel === "high" ? "⚠ Ambiguous" : result.ambiguityLevel === "medium" ? "◑ Somewhat Clear" : "● Reasonably Clear"}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Likely Tone + Reasoning */}
            <ResultCard icon="🎭" label="Likely Tone" accent="#6C63FF" delay={0}>
              <p style={{ margin: "0 0 14px", fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif" }}>{result.tone}</p>
              {result.reasoning && (
                <div style={{ background: "rgba(108,99,255,0.08)", borderRadius: 12, padding: "12px 16px", borderLeft: "2px solid rgba(108,99,255,0.4)" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ color: "#A78BFA", fontWeight: 600 }}>Why: </span>{result.reasoning}
                  </p>
                </div>
              )}
              {/* Notable signals */}
              {result.notableSignals?.length > 0 && (
                <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.notableSignals.map((s, i) => (
                    <span key={i} style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "4px 12px", color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif" }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </ResultCard>

            {/* Most Likely Meaning */}
            <ResultCard icon="🔍" label="Most Likely Meaning" accent="#FF6B9D" delay={0.1}>
              <p style={{ margin: "0 0 16px", fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif" }}>{result.mostLikelyMeaning}</p>
              {result.otherPossibleMeanings?.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,107,157,0.7)", fontFamily: "'DM Sans', sans-serif" }}>OTHER POSSIBILITIES</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.otherPossibleMeanings.map((m, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "rgba(255,107,157,0.5)", fontSize: 14, flexShrink: 0, marginTop: 2 }}>◦</span>
                        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Overall emotional signal */}
              {result.overallEmotionalSignal && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>Overall signal:</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 999, fontFamily: "'DM Sans', sans-serif",
                    background: result.overallEmotionalSignal.includes("positive") ? "rgba(16,185,129,0.15)" : result.overallEmotionalSignal.includes("negative") ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
                    color: result.overallEmotionalSignal.includes("positive") ? "#10B981" : result.overallEmotionalSignal.includes("negative") ? "#EF4444" : "rgba(255,255,255,0.5)",
                  }}>
                    {result.overallEmotionalSignal}
                  </span>
                </div>
              )}
            </ResultCard>

            {/* Best Response */}
            <ResultCard icon="✉️" label="Best Response" accent="#10B981" delay={0.2}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button onClick={() => setUseAlt(false)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 999, border: "none", cursor: "pointer", background: !useAlt ? "#10B981" : "rgba(255,255,255,0.08)", color: !useAlt ? "#fff" : "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>Option A</button>
                <button onClick={() => setUseAlt(true)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 999, border: "none", cursor: "pointer", background: useAlt ? "#10B981" : "rgba(255,255,255,0.08)", color: useAlt ? "#fff" : "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>Option B</button>
              </div>
              <div style={{ background: "rgba(16,185,129,0.1)", borderRadius: 14, padding: "16px 20px", marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 16, color: "#fff", lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif" }}>
                  {useAlt ? result.alternativeResponse : result.bestResponse}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleCopy(useAlt ? result.alternativeResponse : result.bestResponse)} style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "8px 16px", color: "#10B981", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>📋 Copy</button>
                <button onClick={handleShare} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 16px", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>↗ Share</button>
              </div>
            </ResultCard>

            {/* Confidence */}
            <ResultCard icon="📊" label="Confidence Score" accent="#FFB347" delay={0.3}>
              <ConfidenceMeter score={result.confidence} />
              {result.confidence < 45 && (
                <p style={{ margin: "14px 0 0", fontSize: 13, color: "rgba(255,179,71,0.75)", lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>
                  Low confidence means this message genuinely doesn't give us much to work with — that's normal, not a bad sign.
                </p>
              )}
            </ResultCard>

          </div>

          {/* Analyze Again */}
          <button
            onClick={() => { setResult(null); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 24 }}
          >
            Analyze Another →
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 56, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Recent Checks</h2>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowHistory(!showHistory)} style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {showHistory ? "Hide" : `Show ${history.length}`}
              </button>
              <button onClick={() => { setHistory([]); localStorage.removeItem("vibecheck_history"); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Clear</button>
            </div>
          </div>
          {showHistory && history.map((h, i) => (
            <div key={i} onClick={() => { setMessage(h.message); setResult(h.result); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 20px", marginBottom: 10, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(108,99,255,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.message}</p>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{new Date(h.timestamp).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#A78BFA", fontFamily: "'DM Sans', sans-serif" }}>{h.result?.toneEmoji} {h.result?.toneLabel}{h.result?.ambiguityLevel ? ` · ${h.result.ambiguityLevel} ambiguity` : ""}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PricingPage({ setPage, setCheckoutPlan }) {
  const [billing, setBilling] = useState("monthly"); // "monthly" | "yearly"

  const getPrice = (plan) => {
    if (plan.isFree) return { display: "$0", sub: "forever free" };
    const p = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    return {
      display: `$${p.toFixed(2)}`,
      sub: billing === "yearly" ? "per month, billed yearly" : "per month",
    };
  };

  const handlePlanClick = (plan) => {
    if (plan.isFree) {
      setPage("analyze");
      return;
    }
    setCheckoutPlan({ plan, billing });
    setPage("checkout");
  };

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "100px 24px 80px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 24 }}>
          <span style={{ fontSize: 12 }}>✦</span>
          <span style={{ fontSize: 13, color: "#A78BFA", fontWeight: 600, letterSpacing: "0.05em", fontFamily: "'DM Sans', sans-serif" }}>Simple, honest pricing</span>
        </div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, margin: "0 0 16px", fontFamily: "'Space Grotesk', sans-serif" }}>Pick your plan</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, fontFamily: "'DM Sans', sans-serif", margin: "0 0 40px" }}>
          No hidden fees. Cancel anytime. Upgrade or downgrade whenever.
        </p>

        {/* Billing toggle */}
        <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: 4, gap: 0 }}>
          {["monthly", "yearly"].map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                background: billing === b ? "rgba(108,99,255,0.9)" : "transparent",
                border: "none",
                borderRadius: 999,
                padding: "8px 20px",
                color: billing === b ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {b === "monthly" ? "Monthly" : (
                <>Yearly <span style={{ background: "linear-gradient(135deg,#FFB347,#FF6B9D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: 12, fontWeight: 700 }}>Save 20%</span></>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20, marginBottom: 64 }}>
        {PRICING.map((plan) => {
          const { display, sub } = getPrice(plan);
          const isPopular = plan.badge === "Most Popular";
          return (
            <div
              key={plan.id}
              style={{
                background: isPopular
                  ? "linear-gradient(180deg, rgba(108,99,255,0.13), rgba(255,107,157,0.07))"
                  : "rgba(255,255,255,0.03)",
                border: isPopular
                  ? "1px solid rgba(108,99,255,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 28,
                padding: "36px 28px 32px",
                position: "relative",
                transition: "transform 0.22s, box-shadow 0.22s",
                display: "flex",
                flexDirection: "column",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = isPopular
                  ? "0 20px 60px rgba(108,99,255,0.25)"
                  : "0 20px 40px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  background: isPopular ? "linear-gradient(135deg, #6C63FF, #FF6B9D)" : "linear-gradient(135deg, #FFB347, #FF6B9D)",
                  color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 16px",
                  borderRadius: 999, fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "nowrap", letterSpacing: "0.06em",
                }}>{plan.badge}</div>
              )}

              {/* Plan name + desc */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: plan.color, fontFamily: "'DM Sans', sans-serif" }}>{plan.name}</p>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>{plan.description}</p>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{display}</span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>
                {billing === "yearly" && !plan.isFree && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#10B981", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                    ${(plan.yearlyPrice * 12).toFixed(2)} billed yearly
                  </p>
                )}
              </div>

              {/* CTA button */}
              <button
                onClick={() => handlePlanClick(plan)}
                style={{
                  width: "100%",
                  background: plan.isFree
                    ? "rgba(255,255,255,0.08)"
                    : isPopular
                    ? "linear-gradient(135deg, #6C63FF, #FF6B9D)"
                    : `linear-gradient(135deg, ${plan.color}cc, ${plan.color})`,
                  color: plan.isFree ? "rgba(255,255,255,0.75)" : "#fff",
                  border: plan.isFree ? "1px solid rgba(255,255,255,0.12)" : "none",
                  borderRadius: 14,
                  padding: "15px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: 28,
                  transition: "opacity 0.2s, transform 0.15s",
                  boxShadow: (!plan.isFree && isPopular) ? "0 4px 24px rgba(108,99,255,0.35)" : "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
              >
                {plan.cta}
              </button>

              {/* Feature list */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, flex: 1 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, opacity: f.included ? 1 : 0.35 }}>
                    <span style={{ fontSize: 14, flexShrink: 0, color: f.included ? plan.color : "rgba(255,255,255,0.3)" }}>
                      {f.included ? "✓" : "✕"}
                    </span>
                    <span style={{ fontSize: 14, color: f.included ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", textDecoration: f.included ? "none" : "none" }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust bar */}
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "12px 32px", marginBottom: 64 }}>
        {[
          { icon: "🔒", text: "Secure payments via Stripe" },
          { icon: "↩️", text: "Cancel anytime, no questions" },
          { icon: "✦", text: "No hidden fees, ever" },
          { icon: "⚡", text: "Instant access after checkout" },
        ].map((t) => (
          <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>{t.icon}</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif" }}>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Feature comparison table */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", margin: "0 0 40px", fontFamily: "'Space Grotesk', sans-serif" }}>Full feature comparison</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>Feature</th>
                {PRICING.map((p) => (
                  <th key={p.id} style={{ textAlign: "center", padding: "12px 16px", color: p.color, fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Daily analyses", "5 / day", "Unlimited", "Unlimited"],
                ["Tone analysis", "✓", "✓", "✓"],
                ["Most likely meaning", "✓", "✓", "✓"],
                ["Other possible meanings", "✕", "✓", "✓"],
                ["AI reasoning explanation", "✕", "✓", "✓"],
                ["Emergency Mode", "✕", "✓", "✓"],
                ["Analysis history", "Last 5", "Unlimited", "Unlimited + Export"],
                ["Conversation thread analysis", "✕", "✕", "✓"],
                ["Weekly vibe report", "✕", "✕", "✓"],
                ["Pattern detection", "✕", "✕", "✓"],
                ["Response speed", "Standard", "Standard", "Priority"],
                ["Support", "Community", "Email", "Priority email"],
              ].map(([label, free, plus, pro], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: "rgba(255,255,255,0.65)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{label}</td>
                  {[free, plus, pro].map((val, j) => (
                    <td key={j} style={{ textAlign: "center", padding: "14px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)", color: val === "✕" ? "rgba(255,255,255,0.2)" : val === "✓" ? [PRICING[0].color, PRICING[1].color, PRICING[2].color][j] : "rgba(255,255,255,0.65)", fontWeight: (val === "✓" || val === "✕") ? 700 : 400 }}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ snippet */}
      <div style={{ textAlign: "center", padding: "40px 0 0" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
          Questions? Check the{" "}
          <button onClick={() => setPage("faq")} style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "underline", padding: 0 }}>FAQ</button>
          {" "}or email us at{" "}
          <span style={{ color: "rgba(255,255,255,0.6)" }}>hello@vibecheck.ai</span>
        </p>
      </div>
    </div>
  );
}

// ─── Checkout Page ────────────────────────────────────────────────────────────

function CheckoutPage({ checkoutPlan, setPage, addToast }) {
  const { plan, billing } = checkoutPlan;
  const [step, setStep] = useState("form"); // "form" | "processing" | "success"
  const [form, setForm] = useState({ email: "", name: "", card: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const yearlyTotal = (plan.yearlyPrice * 12).toFixed(2);

  // Format card number with spaces
  const formatCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + " / " + d.slice(2) : d;
  };

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email address";
    if (form.name.trim().length < 2) e.name = "Enter your name";
    if (form.card.replace(/\s/g, "").length < 16) e.card = "Enter a valid 16-digit card number";
    if (form.expiry.replace(/\D/g, "").length < 4) e.expiry = "Enter a valid expiry date";
    if (form.cvc.length < 3) e.cvc = "Enter a 3-digit CVC";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep("processing");
    setTimeout(() => setStep("success"), 2800);
  };

  const inputStyle = (field) => ({
    width: "100%",
    background: focused === field ? "rgba(108,99,255,0.08)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${errors[field] ? "#EF4444" : focused === field ? "rgba(108,99,255,0.5)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 12,
    padding: "14px 16px",
    color: "#fff",
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  });

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
    fontFamily: "'DM Sans', sans-serif",
    textTransform: "uppercase",
  };

  if (step === "processing") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, border: "3px solid rgba(108,99,255,0.2)", borderTopColor: "#6C63FF", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 32px" }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", fontFamily: "'Space Grotesk', sans-serif" }}>Processing your order...</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>Hang tight, this takes just a second.</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 480, animation: "fadeSlideUp 0.5s ease" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))", border: "2px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 32px" }}>✓</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 12px", fontFamily: "'Space Grotesk', sans-serif" }}>You're all set! 🎉</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 17, margin: "0 0 8px", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
            Welcome to <strong style={{ color: plan.color }}>{plan.name}</strong>. Your account is active and ready.
          </p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, margin: "0 0 40px", fontFamily: "'DM Sans', sans-serif" }}>
            A confirmation has been sent to <strong style={{ color: "rgba(255,255,255,0.6)" }}>{form.email}</strong>
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setPage("analyze")}
              style={{ background: "linear-gradient(135deg, #6C63FF, #FF6B9D)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              Start analyzing →
            </button>
            <button
              onClick={() => setPage("home")}
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "14px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "100px 24px 80px" }}>
      {/* Back link */}
      <button
        onClick={() => setPage("pricing")}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, marginBottom: 40, padding: 0 }}
      >
        ← Back to pricing
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)", gap: 40, alignItems: "start" }}>

        {/* Left — form */}
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", fontFamily: "'Space Grotesk', sans-serif" }}>Complete your order</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: "0 0 40px", fontFamily: "'DM Sans', sans-serif" }}>
            🔒 Secured by 256-bit SSL encryption
          </p>

          {/* Account section */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px", fontFamily: "'Space Grotesk', sans-serif" }}>Account</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle("email")}
                />
                {errors.email && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#EF4444", fontFamily: "'DM Sans', sans-serif" }}>{errors.email}</p>}
              </div>
              <div>
                <label style={labelStyle}>Full name</label>
                <input
                  type="text"
                  placeholder="Alex Johnson"
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle("name")}
                />
                {errors.name && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#EF4444", fontFamily: "'DM Sans', sans-serif" }}>{errors.name}</p>}
              </div>
            </div>
          </div>

          {/* Payment section */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px", fontFamily: "'Space Grotesk', sans-serif" }}>Payment</p>

            {/* Fake card brand icons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["VISA", "MC", "AMEX", "⋯"].map((brand) => (
                <div key={brand} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif" }}>{brand}</div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Card number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={form.card}
                  onChange={(e) => { setForm({ ...form, card: formatCard(e.target.value) }); setErrors({ ...errors, card: "" }); }}
                  onFocus={() => setFocused("card")}
                  onBlur={() => setFocused(null)}
                  style={{ ...inputStyle("card"), letterSpacing: form.card ? "0.12em" : "normal" }}
                />
                {errors.card && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#EF4444", fontFamily: "'DM Sans', sans-serif" }}>{errors.card}</p>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Expiry date</label>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    value={form.expiry}
                    onChange={(e) => { setForm({ ...form, expiry: formatExpiry(e.target.value) }); setErrors({ ...errors, expiry: "" }); }}
                    onFocus={() => setFocused("expiry")}
                    onBlur={() => setFocused(null)}
                    style={inputStyle("expiry")}
                  />
                  {errors.expiry && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#EF4444", fontFamily: "'DM Sans', sans-serif" }}>{errors.expiry}</p>}
                </div>
                <div>
                  <label style={labelStyle}>CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    value={form.cvc}
                    onChange={(e) => { setForm({ ...form, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }); setErrors({ ...errors, cvc: "" }); }}
                    onFocus={() => setFocused("cvc")}
                    onBlur={() => setFocused(null)}
                    style={inputStyle("cvc")}
                  />
                  {errors.cvc && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#EF4444", fontFamily: "'DM Sans', sans-serif" }}>{errors.cvc}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #6C63FF, #FF6B9D)",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              padding: "18px",
              fontSize: 17,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 0 40px rgba(108,99,255,0.3)",
              transition: "opacity 0.2s, transform 0.15s",
              marginBottom: 16,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
          >
            🔒 Subscribe to {plan.name} — ${price.toFixed(2)}/{billing === "yearly" ? "mo" : "month"}
          </button>

          {/* Microcopy */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 20px" }}>
            {["Cancel anytime", "No setup fees", "Instant access"].map((t) => (
              <span key={t} style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#10B981" }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right — order summary */}
        <div style={{ position: "sticky", top: 90 }}>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: "28px 24px",
          }}>
            <p style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Order Summary</p>

            {/* Plan highlight */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, padding: "16px", background: "rgba(108,99,255,0.08)", borderRadius: 16, border: "1px solid rgba(108,99,255,0.15)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${plan.color}33, ${plan.color}11)`, border: `1px solid ${plan.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✦</div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>VibeCheck {plan.name}</p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize" }}>{billing} billing</p>
              </div>
            </div>

            {/* Line items */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>{plan.name} ({billing})</span>
                <span style={{ fontSize: 14, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>${price.toFixed(2)}/mo</span>
              </div>
              {billing === "yearly" && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>Billed today</span>
                  <span style={{ fontSize: 14, color: "#10B981", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>${yearlyTotal}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>Tax</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>Calculated at checkout</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20, marginBottom: 24 }}>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Total today</span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                {billing === "yearly" ? `$${yearlyTotal}` : `$${price.toFixed(2)}`}
              </span>
            </div>

            {billing === "yearly" && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#10B981", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  🎉 You're saving ${((plan.monthlyPrice - plan.yearlyPrice) * 12).toFixed(2)}/year with annual billing
                </p>
              </div>
            )}

            {/* What's included preview */}
            <div>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Included</p>
              {plan.features.filter(f => f.included).slice(0, 5).map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: plan.color }}>✓</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif" }}>{f.text}</span>
                </div>
              ))}
            </div>

            {/* Security badges */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 16, justifyContent: "center" }}>
              {["🔒 SSL", "🛡 Stripe", "🔄 Cancel anytime"].map((b) => (
                <span key={b} style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile responsiveness for checkout grid */}
      <style>{`
        @media (max-width: 700px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function FAQPage() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 800, margin: "0 0 16px", fontFamily: "'Space Grotesk', sans-serif" }}>FAQs</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, fontFamily: "'DM Sans', sans-serif" }}>Questions we get. A lot.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FAQS.map((faq, i) => (
          <div
            key={i}
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${open === i ? "rgba(108,99,255,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 20, overflow: "hidden", transition: "border-color 0.2s", cursor: "pointer" }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px" }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{faq.q}</p>
              <span style={{ fontSize: 20, color: "#A78BFA", transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>+</span>
            </div>
            {open === i && (
              <div style={{ padding: "0 24px 20px" }}>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px" }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Privacy Policy</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 48, fontFamily: "'DM Sans', sans-serif" }}>Last updated: May 2026</p>
      {[
        { title: "What we collect", body: "When you analyze a message, it's sent to our AI provider for processing. We do not store the content of your messages on our servers. Analysis history is saved locally in your browser using localStorage — it never leaves your device." },
        { title: "What we don't do", body: "We don't sell your data. We don't use your messages to train AI models. We don't log or record your conversations. We're not reading your texts to serve you ads." },
        { title: "Third-party services", body: "We use Anthropic's Claude API to process messages. Their data practices apply to API requests. We recommend reviewing Anthropic's privacy documentation for full details." },
        { title: "Cookies", body: "We use minimal cookies for basic site functionality. We don't use tracking cookies, ad pixels, or behavioral data collectors." },
        { title: "Your rights", body: "Since we don't store your data, there's nothing to delete on our end. Your local history can be cleared at any time directly in the app." },
        { title: "Contact", body: "Questions? Reach out at privacy@vibecheck.ai (this is a demo product)." },
      ].map((s) => (
        <div key={s.title} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px", fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("home");
  const [darkMode, setDarkMode] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const navLinks = [
    { label: "Home", id: "home" },
    { label: "Analyze", id: "analyze" },
    { label: "Pricing", id: "pricing" },
    { label: "FAQ", id: "faq" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0A0A0F" : "#F8F7FF", color: darkMode ? "#fff" : "#1a1a2e", fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s, color 0.3s", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.3); border-radius: 999px; }
        html { scroll-behavior: smooth; }
        @keyframes floatBubble {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "rgba(10,10,15,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg, #6C63FF, #FF6B9D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>VibeCheck AI</span>
        </button>

        {/* Desktop Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="desktop-nav">
          {navLinks.map((l) => (
            <button
              key={l.id}
              onClick={() => setPage(l.id)}
              style={{
                background: page === l.id ? "rgba(108,99,255,0.15)" : "none",
                border: page === l.id ? "1px solid rgba(108,99,255,0.3)" : "1px solid transparent",
                borderRadius: 10,
                padding: "6px 16px",
                color: page === l.id ? "#A78BFA" : "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 12px", color: "rgba(255,255,255,0.6)", fontSize: 16, cursor: "pointer", marginLeft: 8 }}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }} id="mobile-menu-btn">☰</button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 999, background: "rgba(10,10,15,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: 24 }}>
          {navLinks.map((l) => (
            <button key={l.id} onClick={() => { setPage(l.id); setMenuOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 18, fontWeight: 600, padding: "14px 0", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{l.label}</button>
          ))}
        </div>
      )}

      {/* Page Content */}
      <main>
        {page === "home" && <HomePage setPage={setPage} setInputMessage={setInputMessage} />}
        {page === "analyze" && <AnalyzePage inputMessage={inputMessage} setInputMessage={setInputMessage} addToast={addToast} />}
        {page === "pricing" && <PricingPage setPage={setPage} setCheckoutPlan={setCheckoutPlan} />}
        {page === "checkout" && checkoutPlan && <CheckoutPage checkoutPlan={checkoutPlan} setPage={setPage} addToast={addToast} />}
        {page === "faq" && <FAQPage />}
        {page === "privacy" && <PrivacyPage />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: "linear-gradient(135deg, #6C63FF, #FF6B9D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
          <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>VibeCheck AI</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
          {["home", "analyze", "pricing", "faq", "privacy"].map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer", textTransform: "capitalize", fontFamily: "'DM Sans', sans-serif" }}>{p}</button>
          ))}
        </div>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          © 2026 VibeCheck AI · Built with Claude API · Not responsible for the texts you send after using this
        </p>
      </footer>

      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Mobile nav responsive hack */}
      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          #mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}
