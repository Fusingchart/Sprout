import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertNote, type UpdateNote, type Note } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useNotes() {
  const { toast } = useToast();

  return useQuery({
    queryKey: [api.notes.list.path],
    queryFn: async () => {
      const res = await fetch(api.notes.list.path, {
        credentials: "include",
      });
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Error fetching notes",
          description: "Could not load your knowledge graph."
        });
        throw new Error("Failed to fetch notes");
      }
      return api.notes.list.responses[200].parse(await res.json());
    },
  });
}

export function useNote(id: number | null) {
  return useQuery({
    queryKey: [api.notes.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.notes.get.path, { id });
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch note");
      return api.notes.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertNote) => {
      const validated = api.notes.create.input.parse(data);
      const res = await fetch(api.notes.create.path, {
        method: api.notes.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error("API Error:", error);
        throw new Error(error.message || "Failed to create note");
      }
      return api.notes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notes.list.path] });
      toast({
        title: "Sprouted!",
        description: "Your new idea has been planted in the graph.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to sprout",
        description: error.message,
      });
    }
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateNote }) => {
      const validated = api.notes.update.input.parse(data);
      const url = buildUrl(api.notes.update.path, { id });
      const res = await fetch(url, {
        method: api.notes.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update note");
      }
      return api.notes.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.notes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.notes.get.path, variables.id] });
      toast({
        title: "Updated!",
        description: "Your note has been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error.message,
      });
    }
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.notes.delete.path, { id });
      const res = await fetch(url, {
        method: api.notes.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notes.list.path] });
      toast({
        title: "Pruned",
        description: "Note removed from your garden.",
      });
    },
  });
}
