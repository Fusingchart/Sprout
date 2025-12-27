import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { requireAuth } from "./auth";

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
  // All note routes require authentication
  app.get(api.notes.list.path, requireAuth, async (req: any, res) => {
    const userId = (req.user as any).id;
    const notes = await storage.getNotes(userId);
    res.json(notes);
  });

  app.get(api.notes.get.path, requireAuth, async (req: any, res) => {
    const userId = (req.user as any).id;
    const note = await storage.getNote(Number(req.params.id), userId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  });

  app.post(api.notes.create.path, requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const input = api.notes.create.input.parse(req.body);
      
      // Extract keywords using AI
      const textToAnalyze = `${input.title}\n${input.content}`;
      const keywords = await extractKeywords(textToAnalyze);
      
      const note = await storage.createNote({ ...input, keywords, userId });
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("Validation error:", err.errors);
        return res.status(400).json({ message: err.errors[0].message, errors: err.errors });
      }
      console.error("Server error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.notes.update.path, requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const id = Number(req.params.id);
      const input = api.notes.update.input.parse(req.body);
      
      // Extract keywords using AI if content or title changed
      if (input.title || input.content) {
        const existingNote = await storage.getNote(id, userId);
        if (!existingNote) {
          return res.status(404).json({ message: 'Note not found' });
        }
        
        const textToAnalyze = `${input.title || existingNote.title}\n${input.content || existingNote.content}`;
        const keywords = await extractKeywords(textToAnalyze);
        // Note: We don't update keywords on edit, but we could if needed
      }
      
      const note = await storage.updateNote(id, input, userId);
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

  app.delete(api.notes.delete.path, requireAuth, async (req: any, res) => {
    const userId = (req.user as any).id;
    const id = Number(req.params.id);
    await storage.deleteNote(id, userId);
    res.status(204).send();
  });

  return httpServer;
}
