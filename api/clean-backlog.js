// api/clean-backlog.js

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ error: "Method not allowed" });
  }

  let body = "";

  // Read the request body (Vercel style)
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", resolve);
    req.on("error", reject);
  });

  let data;
  try {
    data = JSON.parse(body || "{}");
  } catch (e) {
    res.statusCode = 400;
    return res.json({ error: "Invalid JSON body" });
  }

  const text = data.text;

  if (!text || text.trim().length === 0) {
    res.statusCode = 400;
    return res.json({ error: "Missing 'text' in request body" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a senior product manager turning messy backlog notes into structured user stories. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `
Take the following messy backlog notes and convert them into an array of backlog items.

For each item, return an object with:
- title (string)
- user_story (string: 'As a..., I want..., so that...')
- acceptance_criteria (array of strings)
- priority (one of 'High', 'Medium', 'Low')
- tags (array of short strings)

Respond with a JSON object like:
{ "items": [ ... ] }

Backlog text:
${text}
          `,
        },
      ],
    });

    const content = completion.choices[0].message.content;
    const json = JSON.parse(content);
    const items = json.items || json;

    res.statusCode = 200;
    return res.json({ items });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.statusCode = 500;
    return res.json({
      error: "Failed to clean backlog",
      details: err.message || String(err),
    });
  }
};
