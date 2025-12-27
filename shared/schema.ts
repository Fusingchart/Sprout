import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  keywords: text("keywords").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  keywords: true // Keywords are generated server-side
});

export const updateNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  keywords: true // Keywords are generated server-side
}).partial();

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
