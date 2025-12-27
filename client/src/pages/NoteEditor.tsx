import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateNoteSchema, type UpdateNote } from "@shared/schema";
import { useNote, useUpdateNote } from "@/hooks/use-notes";
import { useAuth } from "@/hooks/use-auth";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NoteEditor() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [, params] = useRoute("/notes/:id/edit");
  const noteId = params ? Number(params.id) : null;
  const { data: note, isLoading } = useNote(noteId);
  const updateNote = useUpdateNote();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const form = useForm<UpdateNote>({
    resolver: zodResolver(updateNoteSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (note) {
      form.reset({
        title: note.title,
        content: note.content,
      });
    }
  }, [note]);

  const onSubmit = (data: UpdateNote) => {
    if (!noteId) return;
    updateNote.mutate(
      { id: noteId, data },
      {
        onSuccess: () => {
          setLocation("/");
        },
      }
    );
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Note not found</p>
        <Button onClick={() => setLocation("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4" style={{ position: "relative", zIndex: 1000 }}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              console.log("Back link clicked");
              setLocation("/");
            }}
            style={{ 
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "2.25rem",
              width: "2.25rem",
              borderRadius: "0.375rem",
              border: "1px solid transparent",
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--accent))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-xl font-display font-semibold">Edit Note</h1>
        </div>
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={updateNote.isPending}
          className="gap-2"
        >
          {updateNote.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save
            </>
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

