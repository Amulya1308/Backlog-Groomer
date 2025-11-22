require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const port = 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.use(express.static('public'));

app.post('/api/groom', async (req, res) => {
  try {
    const { backlogText } = req.body;

    if (!backlogText) {
      return res.status(400).json({ error: 'Backlog text is required' });
    }

    const prompt = `
      You are an expert Product Owner. Your task is to take the following messy backlog text and structure it into clear, actionable user stories.
      
      For each item, provide:
      - Title: A short, clear title.
      - User Story: "As a [role], I want [feature], so that [benefit]".
      - Acceptance Criteria: A list of bullet points.
      - Priority: High, Medium, or Low based on implied urgency or importance.
      - Tags: An array of strings. Auto-detect tags like "bug", "performance", "feature request", "UX", "security", "infra".

      Return the result as a JSON object with a key "items" containing an array of these objects.
      
      Messy Backlog Text:
      "${backlogText}"
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    const structuredData = JSON.parse(responseContent);

    res.json(structuredData);

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to groom backlog', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
