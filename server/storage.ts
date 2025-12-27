import { db } from "./db";
import { notes, type Note, type InsertNote, type UpdateNote } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getNotes(userId: number): Promise<Note[]>;
  getNote(id: number, userId: number): Promise<Note | undefined>;
  createNote(note: InsertNote & { keywords: string[]; userId: number }): Promise<Note>;
  updateNote(id: number, note: UpdateNote, userId: number): Promise<Note>;
  deleteNote(id: number, userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getNotes(userId: number): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  }

  async getNote(id: number, userId: number): Promise<Note | undefined> {
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, id));
    if (!note || note.userId !== userId) {
      return undefined;
    }
    return note;
  }

  async createNote(insertNote: InsertNote & { keywords: string[]; userId: number }): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values(insertNote)
      .returning();
    return note;
  }

  async updateNote(id: number, updateNote: UpdateNote, userId: number): Promise<Note> {
    const existing = await this.getNote(id, userId);
    if (!existing) {
      throw new Error('Note not found');
    }
    const [note] = await db
      .update(notes)
      .set(updateNote)
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async deleteNote(id: number, userId: number): Promise<void> {
    const existing = await this.getNote(id, userId);
    if (!existing) {
      throw new Error('Note not found');
    }
    await db
      .delete(notes)
      .where(eq(notes.id, id));
  }
}

export const storage = new DatabaseStorage();
