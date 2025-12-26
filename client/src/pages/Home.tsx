import { useState, useEffect } from "react";
import { useNotes, useDeleteNote } from "@/hooks/use-notes";
import { GraphView } from "@/components/GraphView";
import { CreateNoteDialog } from "@/components/CreateNoteDialog";
import { NoteCard } from "@/components/NoteCard";
import { Note } from "@shared/schema";
import { format } from "date-fns";
import { Search, Loader2, Leaf, Network, PanelRightClose, PanelRightOpen, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const { data: notes, isLoading } = useNotes();
  const deleteNote = useDeleteNote();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Toggle theme
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const filteredNotes = notes?.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to prune this idea?")) {
      deleteNote.mutate(id);
      if (selectedNote?.id === id) setSelectedNote(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <Leaf className="w-16 h-16 text-primary animate-bounce" />
          <div className="absolute -bottom-2 w-12 h-1 bg-black/10 rounded-full blur-sm mx-auto left-0 right-0 animate-pulse" />
        </div>
        <p className="text-muted-foreground font-display text-lg animate-pulse">Cultivating your garden...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      {/* Sidebar List */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-border bg-muted/10 flex flex-col shrink-0 relative z-10"
          >
            <div className="p-6 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Sprout
                </h1>
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search ideas or tags..." 
                  className="pl-9 bg-background/50 border-transparent focus:border-primary/30 hover:bg-background transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <CreateNoteDialog />
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {filteredNotes?.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isActive={selectedNote?.id === note.id}
                    onClick={() => setSelectedNote(note)}
                    onDelete={(e) => handleDelete(e, note.id)}
                  />
                ))}
                {filteredNotes?.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No sprouts found.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col h-full bg-muted/5">
        {/* Graph Controls */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-background shadow-sm border-border hover:bg-accent hover:text-accent-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>
          
          <div className="bg-background/80 backdrop-blur border border-border px-3 py-1.5 rounded-md text-xs font-mono text-muted-foreground flex items-center gap-2 shadow-sm">
            <Network className="w-3 h-3" />
            {notes?.length || 0} Nodes
          </div>
        </div>

        {/* Graph Visualization */}
        <div className="flex-1 w-full h-full relative">
          <GraphView 
            notes={notes || []} 
            onNodeClick={setSelectedNote}
          />
        </div>

        {/* Details Sheet Overlay */}
        <Sheet open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
          <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-6 space-y-4">
              <div className="flex items-start justify-between">
                <SheetTitle className="text-3xl font-display font-bold leading-tight text-primary">
                  {selectedNote?.title}
                </SheetTitle>
              </div>
              <div className="flex gap-2 text-sm text-muted-foreground font-mono items-center">
                <span>Created {selectedNote?.createdAt && format(new Date(selectedNote.createdAt), 'PPP p')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedNote?.keywords?.map((k, i) => (
                  <div key={i} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md font-medium">
                    #{k}
                  </div>
                ))}
              </div>
            </SheetHeader>
            
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 text-base">
                {selectedNote?.content}
              </p>
            </div>

            {/* Related Notes Section */}
            <div className="mt-12 pt-6 border-t border-border">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Connected Ideas</h4>
              <div className="space-y-2">
                {notes?.filter(n => 
                  n.id !== selectedNote?.id && 
                  n.keywords?.some(k => selectedNote?.keywords?.includes(k))
                ).map(related => (
                  <button 
                    key={related.id}
                    onClick={() => setSelectedNote(related)}
                    className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-primary/20 transition-all group"
                  >
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">{related.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-1">{related.content}</div>
                  </button>
                ))}
                
                {notes?.filter(n => 
                  n.id !== selectedNote?.id && 
                  n.keywords?.some(k => selectedNote?.keywords?.includes(k))
                ).length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No connections yet.</p>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
