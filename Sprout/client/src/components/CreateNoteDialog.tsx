import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNoteSchema, type InsertNote } from "@shared/schema";
import { useCreateNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Plus } from "lucide-react";

export function CreateNoteDialog() {
  const [open, setOpen] = useState(false);
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
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
          <Plus className="w-5 h-5 mr-2" />
          Plant Idea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-primary">New Sprout</DialogTitle>
          <DialogDescription>
            Write down your thought. AI will automatically analyze it and connect it to your other ideas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Photosynthesis..." className="bg-muted/50 border-transparent focus:border-primary/50 transition-all" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="The process by which plants convert light energy..." 
                      className="min-h-[150px] bg-muted/50 border-transparent focus:border-primary/50 transition-all resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createNote.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {createNote.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing & Connecting...
                  </>
                ) : (
                  "Plant Note"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
