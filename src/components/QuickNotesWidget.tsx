import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StickyNote, Plus, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QuickNote {
  id: string;
  content: string;
  created_at: string;
  expires_at: string | null;
}

export function QuickNotesWidget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [input, setInput] = useState('');

  const { data: notes = [] } = useQuery({
    queryKey: ['quick_notes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_notes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      // Filter expired client-side
      const now = new Date().toISOString();
      return (data as QuickNote[]).filter(n => !n.expires_at || n.expires_at > now);
    },
    enabled: !!user?.id,
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('quick_notes').insert([{
        user_id: user!.id,
        content,
      }] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quick_notes', user?.id] });
      setInput('');
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quick_notes').delete().eq('id', id) as any;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quick_notes', user?.id] }),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addNote.mutate(input.trim());
  };

  return (
    <Card aria-label="Quick notes for next fronter">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <StickyNote className="h-5 w-5" aria-hidden="true" /> Quick notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Leave a note for the next fronter…"
            maxLength={300}
            className="flex-1"
          />
          <Button type="submit" size="icon" variant="outline" disabled={!input.trim() || addNote.isPending} aria-label="Add note">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No notes yet. Leave a quick message!</p>
        ) : (
          <ul className="space-y-2" role="list">
            {notes.map(note => (
              <li key={note.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm group">
                <span className="flex-1">
                  {note.content}
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => deleteNote.mutate(note.id)}
                  aria-label="Dismiss note"
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
