import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNoteSchema, type InsertNote } from "@shared/schema";
import { useCreateNote } from "@/hooks/use-notes";
import { useAuth } from "@/hooks/use-auth";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NoteCreate() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const createNote = useCreateNote();

  const form = useForm<InsertNote>({
    resolver: zodResolver(insertNoteSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit = (data: InsertNote) => {
    console.log("Form submitted with data:", data);
    createNote.mutate(data, {
      onSuccess: () => {
        console.log("Note created successfully, navigating home");
        setLocation("/");
      },
      onError: (error) => {
        console.error("Error creating note:", error);
      },
    });
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Create Note button clicked");
    console.log("Form state:", form.getValues());
    console.log("Form errors:", form.formState.errors);
    const result = form.handleSubmit(
      (data) => {
        console.log("Form validation passed, submitting:", data);
        onSubmit(data);
      },
      (errors) => {
        console.log("Form validation failed:", errors);
      }
    );
    result(e);
  };

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
          <h1 className="text-xl font-display font-semibold">New Note</h1>
        </div>
        <Button
          type="submit"
          onClick={handleCreateClick}
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
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Form onSubmit triggered");
              form.handleSubmit(onSubmit)(e);
            }} 
            className="space-y-6 max-w-4xl mx-auto"
          >
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

