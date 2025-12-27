import { db } from "./db";
import { notes, type Note, type InsertNote, type UpdateNote } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getNotes(): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote & { keywords: string[] }): Promise<Note>;
  updateNote(id: number, note: UpdateNote): Promise<Note>;
  deleteNote(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getNotes(): Promise<Note[]> {
    return await db.select().from(notes);
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(insertNote: InsertNote & { keywords: string[] }): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values(insertNote)
      .returning();
    return note;
  }

  async updateNote(id: number, updateNote: UpdateNote): Promise<Note> {
    const [note] = await db
      .update(notes)
      .set(updateNote)
      .where(eq(notes.id, id))
      .returning();
    if (!note) {
      throw new Error('Note not found');
    }
    return note;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }
}

export const storage = new DatabaseStorage();
