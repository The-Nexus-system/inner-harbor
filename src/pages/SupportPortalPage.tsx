import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { UserCheck, Plus, Copy, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { SupportContact, SupportContactRole, SharedSection } from "@/types/system";

const ROLE_LABELS: Record<SupportContactRole, string> = {
  caregiver: 'Caregiver',
  therapist: 'Therapist',
  doctor: 'Doctor',
  family: 'Family member',
  friend: 'Friend',
  other: 'Other',
};

const SECTION_LABELS: Record<SharedSection, string> = {
  safety: 'Safety plans',
  calendar: 'Calendar events',
  tasks: 'Tasks',
  medications: 'Medications',
  checkin: 'Daily check-ins',
};

export default function SupportPortalPage() {
  const { supportContacts, createSupportContact, updateSupportContact, deleteSupportContact, isLoading } = useSystem();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<SupportContactRole>("caregiver");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sharedSections, setSharedSections] = useState<SharedSection[]>(['safety', 'calendar', 'tasks']);

  if (isLoading) return <PageSkeleton message="Loading support portal…" />;

  const resetForm = () => {
    setName(""); setRole("caregiver"); setEmail(""); setPhone(""); setNotes("");
    setSharedSections(['safety', 'calendar', 'tasks']); setEditingId(null);
  };

  const openCreate = () => { resetForm(); setFormOpen(true); };

  const openEdit = (contact: SupportContact) => {
    setEditingId(contact.id);
    setName(contact.name); setRole(contact.role); setEmail(contact.email || "");
    setPhone(contact.phone || ""); setNotes(contact.notes || "");
    setSharedSections([...contact.sharedSections]);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const data: Partial<SupportContact> = {
      name, role, email: email || undefined, phone: phone || undefined,
      notes: notes || undefined, sharedSections,
    };
    if (editingId) {
      await updateSupportContact(editingId, data);
      toast.success("Contact updated");
    } else {
      await createSupportContact(data);
      toast.success("Support contact added");
    }
    setFormOpen(false); resetForm();
  };

  const toggleSection = (section: SharedSection) => {
    setSharedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  const toggleActive = async (contact: SupportContact) => {
    await updateSupportContact(contact.id, { isActive: !contact.isActive });
    toast.success(contact.isActive ? "Access paused" : "Access restored");
  };

  const activeContacts = supportContacts.filter(c => c.isActive);
  const pausedContacts = supportContacts.filter(c => !c.isActive);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            Support Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            Share selected information with trusted people. You control exactly what they see.
          </p>
        </div>
        <Button onClick={openCreate} className="tap-target">
          <Plus className="h-4 w-4 mr-1.5" /> Add contact
        </Button>
      </header>

      {/* Info card */}
      <Card className="border-l-4 border-l-primary/40">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Each contact gets a unique, shareable link. They can view only the sections you choose — 
            no login required. You can pause or revoke access at any time.
          </p>
        </CardContent>
      </Card>

      {/* Active contacts */}
      <section aria-label="Active support contacts">
        <h2 className="text-lg font-heading font-semibold mb-3">Active contacts</h2>
        {activeContacts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No support contacts yet. Add someone you trust to share information with.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeContacts.map(contact => (
              <Card key={contact.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-xs">{ROLE_LABELS[contact.role]}</Badge>
                        {contact.email && <Badge variant="outline" className="text-xs">{contact.email}</Badge>}
                        {contact.phone && <Badge variant="outline" className="text-xs">{contact.phone}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyShareLink(contact.shareToken)} title="Copy share link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(contact)} title="Pause access">
                        <EyeOff className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(contact)} title="Edit">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(contact.id)} title="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs text-muted-foreground">Can see:</span>
                    {contact.sharedSections.map(section => (
                      <Badge key={section} variant="outline" className="text-xs">{SECTION_LABELS[section]}</Badge>
                    ))}
                  </div>
                  {contact.lastAccessedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last viewed: {new Date(contact.lastAccessedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Paused contacts */}
      {pausedContacts.length > 0 && (
        <section aria-label="Paused support contacts">
          <h2 className="text-lg font-heading font-semibold mb-3 text-muted-foreground">Paused</h2>
          <div className="space-y-2">
            {pausedContacts.map(contact => (
              <Card key={contact.id} className="opacity-60">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{contact.name}</p>
                    <Badge variant="secondary" className="text-xs">{ROLE_LABELS[contact.role]}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(contact)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Restore
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(contact.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={open => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Edit contact" : "Add support contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Name *</Label>
              <Input id="contact-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dr. Rivera" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-role">Role</Label>
              <Select value={role} onValueChange={v => setRole(v as SupportContactRole)}>
                <SelectTrigger id="contact-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input id="contact-phone" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>What can they see?</Label>
              <p className="text-xs text-muted-foreground">Select which sections to share with this person</p>
              <div className="space-y-2">
                {(Object.entries(SECTION_LABELS) as [SharedSection, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer tap-target">
                    <Checkbox checked={sharedSections.includes(key)} onCheckedChange={() => toggleSection(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea id="contact-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any notes about this person or relationship" />
            </div>
            <Button onClick={handleSave} disabled={!name.trim()} className="w-full">
              {editingId ? "Save changes" : "Add contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        title="Remove this contact?"
        description="This will permanently remove this contact and revoke their portal access."
        confirmLabel="Remove"
        onConfirm={() => {
          if (deleteId) deleteSupportContact(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
