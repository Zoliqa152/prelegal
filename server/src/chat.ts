import { Router, Request, Response } from 'express';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

const NdaFieldsSchema = z.object({
  disclosing_party_name: z.string().nullable(),
  disclosing_party_address: z.string().nullable(),
  receiving_party_name: z.string().nullable(),
  receiving_party_address: z.string().nullable(),
  effective_date: z.string().nullable(),
  confidentiality_period_years: z.number().nullable(),
  governing_law_state: z.string().nullable(),
});

const ChatResponseSchema = z.object({
  message: z.string(),
  extractedFields: NdaFieldsSchema,
});

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function buildSystemPrompt(): string {
  const dataDir = process.env['DATA_DIR'] ?? join(__dirname, '../../data/templates');
  const template = JSON.parse(readFileSync(join(dataDir, 'nda.json'), 'utf-8'));

  const fieldDescriptions = template.fields
    .filter((f: { key: string }) => f.key !== 'nda_type')
    .map((f: { key: string; label: string; type: string; default?: unknown }) => {
      let desc = `- ${f.label} (${f.key}): type=${f.type}`;
      if (f.default != null) desc += `, default=${f.default}`;
      return desc;
    })
    .join('\n');

  return `You are a friendly legal assistant helping a user create a Mutual Non-Disclosure Agreement (NDA).

Your job is to have a natural conversation to collect the information needed for the NDA. Ask about one field at a time, in a logical order. Be conversational but professional.

The fields you need to collect are:
${fieldDescriptions}

Guidelines:
- Start by greeting the user and explaining you'll help them create a Mutual NDA.
- Ask about the disclosing party first, then the receiving party, then the other details.
- When the user provides information, acknowledge it and move to the next field.
- If the user provides multiple pieces of information at once, extract all of them.
- For effective_date, accept natural language like "today", "next Monday", etc. and convert to YYYY-MM-DD format.
- For confidentiality_period_years, the default is 2 years. Suggest this if the user isn't sure.
- For governing_law_state, accept state names or abbreviations.
- Once all fields are collected, confirm the details with the user and let them know they can download the PDF.
- Always include ALL previously extracted fields in your response, even if they weren't mentioned in the latest message.
- Set a field to null only if it hasn't been provided yet.`;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const systemPrompt = buildSystemPrompt();

    const result = await generateObject({
      model: openai('gpt-4.1-mini'),
      schema: ChatResponseSchema,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    res.json(result.object);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
