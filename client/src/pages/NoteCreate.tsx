import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNoteSchema, type InsertNote } from "@shared/schema";
import { useCreateNote } from "@/hooks/use-notes";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NoteCreate() {
  const [, setLocation] = useLocation();
  const createNote = useCreateNote();

  const form = useForm<InsertNote>({
    resolver: zodResolver(insertNoteSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const onSubmit = (data: InsertNote) => {
    createNote.mutate(data, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-semibold">New Note</h1>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={createNote.isPending}
          className="gap-2"
        >
          {createNote.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Note"
          )}
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="text-2xl font-display font-bold h-auto py-3 border-none shadow-none focus-visible:ring-0 bg-transparent"
                      placeholder="Enter note title..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RichTextEditor
                      content={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Start writing..."
                      editable={true}
                      className="min-h-[calc(100vh-300px)]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}

