import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import NoteCreate from "@/pages/NoteCreate";
import NoteEditor from "@/pages/NoteEditor";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/notes/new" component={NoteCreate} />
      <Route path="/notes/:id/edit" component={NoteEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
