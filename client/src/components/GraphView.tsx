import { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { Note } from '@shared/schema';
import { useTheme } from '@/hooks/use-theme'; // Assuming you might have a theme hook, or just check dark mode class

interface GraphViewProps {
  notes: Note[];
  onNodeClick: (note: Note) => void;
  width?: number;
  height?: number;
}

export function GraphView({ notes, onNodeClick, width, height }: GraphViewProps) {
  const fgRef = useRef<ForceGraphMethods>();
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);

  // Compute graph data: nodes are notes, links are shared keywords
  const graphData = useMemo(() => {
    const nodes = notes.map(n => ({ 
      id: n.id, 
      title: n.title, 
      keywords: n.keywords || [],
      val: (n.keywords?.length || 0) + 1 // larger nodes for more connections
    }));

    const links: { source: number; target: number }[] = [];
    
    // Naive O(n^2) connection building - fine for <1000 notes usually
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const a = notes[i];
        const b = notes[j];
        
        // Find intersection of keywords
        const common = a.keywords?.filter(k => b.keywords?.includes(k));
        
        if (common && common.length > 0) {
          links.push({
            source: a.id,
            target: b.id,
          });
        }
      }
    }

    return { nodes, links };
  }, [notes]);

  // Handle dark mode for colors
  const isDark = document.documentElement.classList.contains('dark');
  const nodeColor = isDark ? '#22c55e' : '#16a34a'; // Green-500 vs Green-600
  const linkColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const bgColor = isDark ? '#0f172a' : '#ffffff'; // Slate-900 vs White

  const handleNodeHover = (node: any) => {
    setHighlightNodes(new Set(node ? [node.id] : []));
    setHighlightLinks(new Set(node ? graphData.links.filter(l => l.source.id === node.id || l.target.id === node.id) : []));
    setHoverNode(node || null);
  };

  return (
    <div className="w-full h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={graphData}
        backgroundColor={bgColor}
        nodeLabel="title"
        nodeColor={(node: any) => highlightNodes.has(node.id) ? '#ef4444' : nodeColor}
        linkColor={() => linkColor}
        nodeRelSize={6}
        linkWidth={link => highlightLinks.has(link) ? 2 : 1}
        onNodeClick={(node: any) => {
          // Find original note object
          const note = notes.find(n => n.id === node.id);
          if (note) onNodeClick(note);
          
          // Center graph on node
          fgRef.current?.centerAt(node.x, node.y, 1000);
          fgRef.current?.zoom(4, 2000);
        }}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
      
      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-muted-foreground bg-background/80 p-4 rounded-xl backdrop-blur-sm border shadow-sm">
            Plant your first idea to start the garden.
          </p>
        </div>
      )}
    </div>
  );
}
