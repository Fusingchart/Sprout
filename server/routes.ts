import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client - Replit AI integration provides the API key automatically
// if configured, or uses the environment variable if manually set.
const openai = new OpenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

function stripHtmlTags(html: string): string {
  // Remove HTML tags and decode entities
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

async function extractKeywords(text: string): Promise<string[]> {
  try {
    // Strip HTML tags if present
    const cleanText = stripHtmlTags(text);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a keyword extraction tool. Extract 3-5 main keywords or concepts from the text. Return ONLY a JSON object with a 'keywords' array of strings, e.g. {\"keywords\": [\"keyword1\", \"keyword2\"]}. Do not include markdown formatting or explanation."
        },
        {
          role: "user",
          content: cleanText
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) return [];
    
    const parsed = JSON.parse(content);
    return parsed.keywords || [];
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return [];
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.notes.list.path, async (req, res) => {
    const notes = await storage.getNotes();
    res.json(notes);
  });

  app.get(api.notes.get.path, async (req, res) => {
    const note = await storage.getNote(Number(req.params.id));
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  });

  app.post(api.notes.create.path, async (req, res) => {
    try {
      const input = api.notes.create.input.parse(req.body);
      
      // Extract keywords using AI
      const textToAnalyze = `${input.title}\n${input.content}`;
      const keywords = await extractKeywords(textToAnalyze);
      
      const note = await storage.createNote({ ...input, keywords });
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.notes.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.notes.update.input.parse(req.body);
      
      // Extract keywords using AI if content or title changed
      if (input.title || input.content) {
        const existingNote = await storage.getNote(id);
        if (!existingNote) {
          return res.status(404).json({ message: 'Note not found' });
        }
        
        const textToAnalyze = `${input.title || existingNote.title}\n${input.content || existingNote.content}`;
        const keywords = await extractKeywords(textToAnalyze);
        // Note: We don't update keywords on edit, but we could if needed
      }
      
      const note = await storage.updateNote(id, input);
      res.json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err instanceof Error && err.message === 'Note not found') {
        return res.status(404).json({ message: err.message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.notes.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteNote(id);
    res.status(204).send();
  });

  // Seed data if empty
  const existing = await storage.getNotes();
  if (existing.length === 0) {
    await storage.createNote({
      title: "Welcome to Sprout",
      content: "This is a note-taking app that connects your ideas automatically.",
      keywords: ["sprout", "note-taking", "ideas"]
    });
    await storage.createNote({
      title: "Project Ideas",
      content: "1. A gardening app\n2. A recipe organizer\n3. Sprout: An app for connecting ideas.",
      keywords: ["project", "ideas", "sprout", "app"]
    });
     await storage.createNote({
      title: "Gardening Tips",
      content: "Sprouts need water and sunlight. Gardening is relaxing.",
      keywords: ["gardening", "sprouts", "water", "sunlight"]
    });
  }

  return httpServer;
}
