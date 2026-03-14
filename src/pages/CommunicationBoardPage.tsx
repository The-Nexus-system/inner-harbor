import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, MessageCircle, Volume2, ArrowUpDown, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableCommCard } from "@/components/SortableCommCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CommCard {
  id: string;
  label: string;
  emoji?: string;
  category: string;
  color?: string;
  sortOrder: number;
  isPhrase: boolean;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { key: 'needs', label: '🫶 Needs', color: 'hsl(var(--primary))' },
  { key: 'feelings', label: '💛 Feelings', color: 'hsl(var(--accent))' },
  { key: 'responses', label: '✋ Responses', color: 'hsl(var(--secondary))' },
  { key: 'actions', label: '🏃 Actions', color: 'hsl(var(--muted))' },
  { key: 'general', label: '💬 General', color: 'hsl(var(--muted))' },
];

const DEFAULT_CARDS: Partial<CommCard>[] = [
  { label: 'Yes', emoji: '✅', category: 'responses' },
  { label: 'No', emoji: '❌', category: 'responses' },
  { label: 'I don\'t know', emoji: '🤷', category: 'responses' },
  { label: 'Need space', emoji: '🚪', category: 'needs' },
  { label: 'Need help', emoji: '🆘', category: 'needs' },
  { label: 'Water', emoji: '💧', category: 'needs' },
  { label: 'Food', emoji: '🍽️', category: 'needs' },
  { label: 'Rest', emoji: '😴', category: 'needs' },
  { label: 'Safe', emoji: '🛡️', category: 'feelings' },
  { label: 'Overwhelmed', emoji: '😵‍💫', category: 'feelings' },
  { label: 'Scared', emoji: '😨', category: 'feelings' },
  { label: 'Happy', emoji: '😊', category: 'feelings' },
  { label: 'Sad', emoji: '😢', category: 'feelings' },
  { label: 'Angry', emoji: '😤', category: 'feelings' },
  { label: 'Pain', emoji: '🤕', category: 'needs' },
  { label: 'Wait', emoji: '⏳', category: 'responses' },
  { label: 'Thank you', emoji: '🙏', category: 'responses' },
  { label: 'Go outside', emoji: '🌳', category: 'actions' },
  { label: 'Headphones', emoji: '🎧', category: 'actions' },
  { label: 'Blanket', emoji: '🧸', category: 'needs' },
];

export default function CommunicationBoardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<CommCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CommCard | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lastTapped, setLastTapped] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  // Form
  const [fLabel, setFLabel] = useState('');
  const [fEmoji, setFEmoji] = useState('');
  const [fCategory, setFCategory] = useState('general');
  const [fIsPhrase, setFIsPhrase] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const fetchCards = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('communication_cards' as any).select('*').eq('user_id', user.id).order('sort_order').order('created_at');
    setCards((data ?? []).map((r: any): CommCard => ({
      id: r.id, label: r.label, emoji: r.emoji ?? undefined,
      category: r.category, color: r.color ?? undefined,
      sortOrder: r.sort_order, isPhrase: r.is_phrase, isActive: r.is_active,
      createdAt: r.created_at,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const seedDefaults = async () => {
    if (!user) return;
    const rows = DEFAULT_CARDS.map((c, i) => ({
      user_id: user.id, label: c.label!, emoji: c.emoji || null,
      category: c.category || 'general', sort_order: i,
    }));
    await supabase.from('communication_cards' as any).insert(rows);
    toast({ title: 'Default cards created', description: 'You can customize or add more.' });
    fetchCards();
  };

  const resetForm = () => {
    setFLabel(''); setFEmoji(''); setFCategory('general'); setFIsPhrase(false); setEditing(null);
  };

  const openEdit = (c: CommCard) => {
    setEditing(c); setFLabel(c.label); setFEmoji(c.emoji || '');
    setFCategory(c.category); setFIsPhrase(c.isPhrase); setFormOpen(true);
  };

  const handleSave = async () => {
    if (!user || !fLabel.trim()) return;
    const row: Record<string, any> = {
      label: fLabel.trim(), emoji: fEmoji || null, category: fCategory, is_phrase: fIsPhrase,
    };
    if (editing) {
      await supabase.from('communication_cards' as any).update(row).eq('id', editing.id);
    } else {
      await supabase.from('communication_cards' as any).insert([{ ...row, user_id: user.id }]);
    }
    toast({ title: editing ? 'Card updated' : 'Card added' });
    setFormOpen(false); resetForm(); fetchCards();
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await supabase.from('communication_cards' as any).delete().eq('id', id);
    toast({ title: 'Card removed' });
    setDeleteId(null);
    fetchCards();
  };

  const handleTap = (card: CommCard) => {
    setLastTapped(card.id);
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(card.label);
      u.rate = 0.9;
      speechSynthesis.speak(u);
    }
    setTimeout(() => setLastTapped(null), 1200);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentCards = selectedCategory
      ? cards.filter(c => c.category === selectedCategory)
      : cards;

    const oldIndex = currentCards.findIndex(c => c.id === active.id);
    const newIndex = currentCards.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(currentCards, oldIndex, newIndex);

    // Optimistic update
    if (selectedCategory) {
      const otherCards = cards.filter(c => c.category !== selectedCategory);
      setCards([...otherCards, ...reordered.map((c, i) => ({ ...c, sortOrder: i }))]);
    } else {
      setCards(reordered.map((c, i) => ({ ...c, sortOrder: i })));
    }

    // Persist new sort orders
    const updates = reordered.map((c, i) =>
      supabase.from('communication_cards' as any).update({ sort_order: i }).eq('id', c.id)
    );
    await Promise.all(updates);
  };

  const filtered = selectedCategory ? cards.filter(c => c.category === selectedCategory) : cards;

  // In reorder mode, show a flat list; in normal mode, group by category
  const grouped = reorderMode
    ? [{ key: 'all', label: 'All cards', cards: filtered }].filter(g => g.cards.length > 0)
    : CATEGORIES.map(cat => ({
        ...cat,
        cards: filtered.filter(c => c.category === cat.key),
      })).filter(g => g.cards.length > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Communication Board</h1>
          <p className="text-muted-foreground mt-1">Tap cards to communicate when words are hard. Cards will be spoken aloud.</p>
        </div>
        <div className="flex gap-2">
          {cards.length > 1 && (
            <Button
              variant={reorderMode ? "default" : "outline"}
              size="sm"
              onClick={() => setReorderMode(!reorderMode)}
            >
              {reorderMode ? <><Check className="mr-2 h-4 w-4" /> Done</> : <><ArrowUpDown className="mr-2 h-4 w-4" /> Reorder</>}
            </Button>
          )}
          <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add card</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit' : 'Add'} Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label>Label</Label>
                    <Input value={fLabel} onChange={e => setFLabel(e.target.value)} placeholder="e.g. Need quiet" />
                  </div>
                  <div>
                    <Label>Emoji</Label>
                    <Input value={fEmoji} onChange={e => setFEmoji(e.target.value)} placeholder="🤫" />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={fCategory} onValueChange={setFCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={fIsPhrase} onCheckedChange={setFIsPhrase} id="phrase-toggle" />
                  <Label htmlFor="phrase-toggle">Full phrase (larger card)</Label>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={!fLabel.trim()}>
                  {editing ? 'Update' : 'Add'} card
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Reorder mode banner */}
      {reorderMode && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-center text-primary font-medium">
          Drag cards to reorder them. Tap "Done" when finished.
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer tap-target"
          onClick={() => setSelectedCategory(null)}
        >All</Badge>
        {CATEGORIES.map(c => (
          <Badge
            key={c.key}
            variant={selectedCategory === c.key ? "default" : "outline"}
            className="cursor-pointer tap-target"
            onClick={() => setSelectedCategory(prev => prev === c.key ? null : c.key)}
          >{c.label}</Badge>
        ))}
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading...</p>}

      {!loading && cards.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No communication cards yet.</p>
            <Button onClick={seedDefaults}>Load default cards</Button>
          </CardContent>
        </Card>
      )}

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {grouped.map(group => (
          <div key={group.key}>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">{group.label}</h2>
            <SortableContext items={group.cards.map(c => c.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {group.cards.map(card => (
                  <SortableCommCard
                    key={card.id}
                    card={card}
                    lastTapped={lastTapped}
                    onTap={handleTap}
                    onEdit={openEdit}
                    onDelete={(id) => setDeleteId(id)}
                    reorderMode={reorderMode}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </DndContext>
    </div>
  );
}
