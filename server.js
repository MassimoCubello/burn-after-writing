import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.static("."));

// Check OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY not set. OpenAI requests will fail.");
}

// Simple keyword-based anger level detection
function getAngerLevel(text) {
  const angryWords = [
    "hate","furious","angry","idiot","stupid","upset","sucks","terrible","mad",
    "unacceptable","annoying","worst","disgusting","rage","pissed","screw you",
    "damn","hell","asshole","dumb","suck","trash","garbage","pathetic","lame",
    "screw","freaking","bloody","bastard","jerk","moron","douche","crap",
    "bullshit","rude","mean","joke","incredulous","ridiculous","absurd","nonsense",
    "disaster","horrible","awful","terrible","atrocious","abysmal","dreadful",
    "appalling","horrendous","ghastly","heinous","monstrous","outrageous","revolting",
    "repulsive","vile","wretched","disgusting","filthy","foul","nasty","offensive",
    "obnoxious","repugnant","reprehensible","scandalous","shameful","sickening",
    "sordid","vicious","wicked"
  ];
  let score = 0;
  angryWords.forEach(word => {
    if (text.toLowerCase().includes(word)) score++;
  });

  if (score >= 4) return "nuclear";
  if (score >= 2) return "spicy";
  return "mild";
}

// Limit response to a number of sentences
function limitSentences(text, sentenceLimit = 5) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, sentenceLimit).join("").trim();
}

// Personality prompts
const personalities = {
  mild: [
    "You are an angry old man responding to an angry unsent email. Use dark humor and sarcasm, but do not promote harm and don't use profanity. Use at least three sentences in your response, and at least one funny joke about how you wish you could help, but can't."
  ],
  spicy: [
    "You are an angry old man responding to an angry unsent email. Use dark humor and sarcasm, but do not promote harm and don't use profanity. Use at least three sentences in your response, and at least one funny joke about how you wish you could help, but can't."
  ],
  nuclear: [
    "You are an angry old man responding to an extremely angry unsent email. Use dark humor and sarcasm, but do not promote harm and don't use profanity. Use at least three sentences in your response, and at least one funny joke about how you wish you could help, but can't."
  ]
};

// API endpoint
app.post("/api/respond", async (req, res) => {
  try {
    const userText = req.body.message;

    if (!userText || typeof userText !== "string") {
      return res.status(400).json({
        reply: "Nothing to burn.",
        level: "mild"
      });
    }

    const trimmedText = userText.slice(0, 500);
    const angerLevel = getAngerLevel(trimmedText);

    const systemPrompt =
      personalities[angerLevel][
        Math.floor(Math.random() * personalities[angerLevel].length)
      ] + " Do not promote harassment, threats, or harm.";

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        reply: "OpenAI API key not set.",
        level: angerLevel
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: trimmedText }
        ],
        max_tokens: 300,
        temperature: 0.9
      })
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    const reply = limitSentences(data.choices[0].message.content, 5);

    res.json({
      reply,
      level: angerLevel
    });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({
      reply: "Something went wrong. Try again.",
      level: "mild"
    });
  }
});

// Use Railway's dynamic PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Burn After Writing running on port ${PORT}`);
});