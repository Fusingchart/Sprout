import { Note } from "@shared/schema";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface NoteCardProps {
  note: Note;
  isActive?: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function stripHtmlTags(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function NoteCard({ note, isActive, onClick, onDelete }: NoteCardProps) {
  const plainTextContent = stripHtmlTags(note.content);
  return (
    <div
      onClick={onClick}
      className={`
        group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer
        ${isActive 
          ? 'bg-primary/5 border-primary/30 shadow-md shadow-primary/5 scale-[1.02]' 
          : 'bg-card border-border hover:border-primary/20 hover:shadow-lg hover:-translate-y-1'
        }
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-display font-semibold text-lg line-clamp-1 ${isActive ? 'text-primary' : 'text-foreground'}`}>
          {note.title}
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {note.createdAt && format(new Date(note.createdAt), 'MMM d')}
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
        {plainTextContent}
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        {note.keywords?.slice(0, 3).map((keyword, i) => (
          <Badge 
            key={i} 
            variant="secondary" 
            className="bg-secondary/50 text-[10px] px-2 py-0.5 hover:bg-secondary text-secondary-foreground/80"
          >
            #{keyword}
          </Badge>
        ))}
        {note.keywords && note.keywords.length > 3 && (
          <span className="text-[10px] text-muted-foreground">+{note.keywords.length - 3} more</span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
