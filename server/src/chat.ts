import { Router, Request, Response } from 'express';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

type ChatMessage = { role: 'user' | 'assistant'; content: string };

interface TemplateIndex {
  id: string;
  name: string;
  category: string;
  file: string;
}

interface TemplateField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  default?: unknown;
  options?: string[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
}

function getDataDir(): string {
  return process.env['DATA_DIR'] ?? join(__dirname, '../../data/templates');
}

function loadTemplateIndex(): TemplateIndex[] {
  const dataDir = getDataDir();
  const index = JSON.parse(readFileSync(join(dataDir, 'index.json'), 'utf-8'));
  return index.templates;
}

function loadTemplate(templateId: string): Template | null {
  const dataDir = getDataDir();
  const templates = loadTemplateIndex();
  const entry = templates.find(t => t.id === templateId);
  if (!entry) return null;
  return JSON.parse(readFileSync(join(dataDir, entry.file), 'utf-8'));
}

function buildSelectionPrompt(): string {
  const templates = loadTemplateIndex();
  const templateList = templates
    .map((t, i) => `${i + 1}. ${t.name} (${t.category})`)
    .join('\n');

  return `You are a friendly legal assistant helping users create legal documents.

The following document types are available:
${templateList}

Guidelines:
- Start by greeting the user and listing the available document types with their numbers.
- Ask the user to select a document type by number or name.
- If the user asks for a document type that is not in the list, explain that we don't support that type yet. Suggest the closest available document type from the list and explain why it might be relevant.
- Once the user clearly selects a document (by number, name, or description), set selectedTemplateId to the template ID.
- If the user hasn't selected yet or is still deciding, set selectedTemplateId to null.

The template IDs are:
${templates.map((t, i) => `${i + 1}. ${t.id}`).join('\n')}`;
}

function buildFieldCollectionPrompt(template: Template): string {
  const fieldDescriptions = template.fields
    .map(f => {
      let desc = `- ${f.label} (${f.key}): type=${f.type}`;
      if (f.required) desc += ', required';
      if (f.default != null) desc += `, default=${f.default}`;
      if (f.options) desc += `, options=[${f.options.join(', ')}]`;
      return desc;
    })
    .join('\n');

  return `You are a friendly legal assistant helping a user create a ${template.name}.

Description: ${template.description}

Your job is to have a natural conversation to collect the information needed. Ask about one or two related fields at a time, in a logical order. Be conversational but professional.

The fields you need to collect are:
${fieldDescriptions}

Guidelines:
- Ask about parties/names first, then dates, then specific terms and conditions.
- When the user provides information, acknowledge it and move to the next field(s).
- If the user provides multiple pieces of information at once, extract all of them.
- For date fields, accept natural language like "today", "next Monday", etc. and convert to YYYY-MM-DD format.
- For select fields, only accept values from the given options list.
- For fields with defaults, suggest the default value if the user isn't sure.
- Once all required fields are collected, confirm the details with the user and let them know the document is ready to download.
- Always include ALL previously extracted fields in your response, even if they weren't mentioned in the latest message.
- Set a field to null only if it hasn't been provided yet.
- Set allFieldsFilled to true ONLY when every required field has a non-null value.`;
}

function buildFieldsSchema(template: Template): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of template.fields) {
    if (field.type === 'number') {
      shape[field.key] = z.number().nullable();
    } else {
      shape[field.key] = z.string().nullable();
    }
  }
  return z.object(shape);
}

// Phase 1: Template selection
const SelectionResponseSchema = z.object({
  message: z.string(),
  selectedTemplateId: z.string().nullable(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, templateId } = req.body as {
      messages: ChatMessage[];
      templateId?: string | null;
    };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    if (!templateId) {
      // Phase 1: Template selection
      const systemPrompt = buildSelectionPrompt();
      const result = await generateObject({
        model: openai('gpt-4.1-mini'),
        schema: SelectionResponseSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      });
      res.json({ phase: 'selection', ...result.object });
    } else {
      // Phase 2: Field collection
      const template = loadTemplate(templateId);
      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      const systemPrompt = buildFieldCollectionPrompt(template);
      const fieldsSchema = buildFieldsSchema(template);

      const FieldCollectionResponseSchema = z.object({
        message: z.string(),
        extractedFields: fieldsSchema,
        allFieldsFilled: z.boolean(),
      });

      const result = await generateObject({
        model: openai('gpt-4.1-mini'),
        schema: FieldCollectionResponseSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      });
      res.json({ phase: 'collection', ...result.object });
    }
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
