/**
 * Mosaic — Import / Restore from Backup
 * 
 * Handles importing plain JSON or encrypted JSON backups,
 * validating structure, previewing data, and upserting into the database.
 */

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Upload, FileJson, Lock, AlertTriangle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/audit";
import { isEncryptedBackup, decryptBackup } from "@/lib/backup-crypto";

// Tables we can import into and their expected array keys in the backup
const IMPORTABLE_TABLES = {
  alters: 'alters',
  front: 'front_events',
  journal: 'journal_entries',
  messages: 'internal_messages',
  tasks: 'tasks',
  calendar: 'calendar_events',
  safety: 'safety_plans',
  checkins: 'daily_check_ins',
  handoffs: 'handoff_notes',
  snapshots: 'context_snapshots',
  medications: 'medications',
} as const;

// Map export keys → DB table names
const KEY_TO_TABLE: Record<string, string> = {
  alters: 'alters',
  front: 'front_events',
  journal: 'journal_entries',
  messages: 'internal_messages',
  tasks: 'tasks',
  calendar: 'calendar_events',
  safety: 'safety_plans',
  checkins: 'daily_check_ins',
  handoffs: 'handoff_notes',
  snapshots: 'context_snapshots',
  medications: 'medications',
};

const KEY_LABELS: Record<string, string> = {
  alters: 'Alter profiles',
  front: 'Front timeline',
  journal: 'Journal entries',
  messages: 'Internal messages',
  tasks: 'Tasks',
  calendar: 'Calendar events',
  safety: 'Safety plans',
  checkins: 'Daily check-ins',
  handoffs: 'Handoff notes',
  snapshots: 'Context snapshots',
  medications: 'Medications',
};

interface ImportPreview {
  key: string;
  label: string;
  count: number;
}

export default function ImportRestoreSection() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [decryptedData, setDecryptedData] = useState<Record<string, unknown[]> | null>(null);
  const [preview, setPreview] = useState<ImportPreview[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFileContent(null);
    setFileName('');
    setIsEncrypted(false);
    setPassword('');
    setDecryptedData(null);
    setPreview([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseAndPreview = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      setError('Invalid backup format. Expected a JSON object with data categories.');
      return;
    }

    const obj = data as Record<string, unknown>;
    const previews: ImportPreview[] = [];
    const cleanData: Record<string, unknown[]> = {};

    for (const key of Object.keys(obj)) {
      if (key in KEY_TO_TABLE && Array.isArray(obj[key])) {
        const arr = obj[key] as unknown[];
        if (arr.length > 0) {
          previews.push({ key, label: KEY_LABELS[key] || key, count: arr.length });
          cleanData[key] = arr;
        }
      }
    }

    if (previews.length === 0) {
      setError('No recognizable data found in this backup file.');
      return;
    }

    setDecryptedData(cleanData);
    setPreview(previews);
    setError(null);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    if (file.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum size is 50 MB.');
      return;
    }

    const text = await file.text();
    setFileContent(text);

    if (isEncryptedBackup(text)) {
      setIsEncrypted(true);
      setDecryptedData(null);
      setPreview([]);
    } else {
      setIsEncrypted(false);
      try {
        const parsed = JSON.parse(text);
        parseAndPreview(parsed);
      } catch {
        setError('Could not parse file. Please ensure it is a valid JSON backup.');
      }
    }
  }, [parseAndPreview]);

  const handleDecrypt = async () => {
    if (!fileContent || !password) return;
    setDecrypting(true);
    setError(null);
    try {
      const data = await decryptBackup(fileContent, password);
      parseAndPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed.');
    } finally {
      setDecrypting(false);
    }
  };

  const handleImport = async () => {
    if (!user || !decryptedData) return;
    setImporting(true);
    setConfirmOpen(false);

    let totalImported = 0;
    const errors: string[] = [];

    for (const [key, records] of Object.entries(decryptedData)) {
      const tableName = KEY_TO_TABLE[key];
      if (!tableName) continue;

      // Prepare records: override user_id, strip fields that would conflict
      const prepared = (records as Record<string, unknown>[]).map(record => {
        const clean = { ...record };
        // Always set user_id to current user
        clean.user_id = user.id;
        // Remove auto-generated fields that would conflict
        delete clean.id;
        delete clean.created_at;
        delete clean.updated_at;
        delete clean.archived_at;
        return clean;
      });

      // Insert in batches of 50
      for (let i = 0; i < prepared.length; i += 50) {
        const batch = prepared.slice(i, i + 50);
        const { error: insertError } = await supabase
          .from(tableName as any)
          .insert(batch as any);

        if (insertError) {
          errors.push(`${KEY_LABELS[key] || key}: ${insertError.message}`);
        } else {
          totalImported += batch.length;
        }
      }
    }

    await logAuditEvent({
      action: 'data_export' as any,
      metadata: {
        operation: 'import',
        totalImported,
        errors: errors.length,
        categories: Object.keys(decryptedData),
      },
    });

    if (errors.length > 0) {
      toast.error(`Imported ${totalImported} records with ${errors.length} error(s). Some data may not have been restored.`);
      console.warn('Import errors:', errors);
    } else {
      toast.success(`Successfully imported ${totalImported} records. Refresh the page to see your restored data.`);
    }

    setImporting(false);
    reset();
  };

  const totalRecords = preview.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
            Import &amp; Restore
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Restore data from a previous Mosaic JSON backup. Supports both plain and encrypted backups.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning */}
          <div className="flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Importing adds new records to your account. It does not overwrite existing data.
                If you import the same backup twice, you may end up with duplicate entries.
              </p>
            </div>
          </div>

          {/* File picker */}
          <div className="space-y-2">
            <Label htmlFor="backup-file">Select backup file</Label>
            <Input
              ref={fileInputRef}
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            {fileName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileJson className="h-4 w-4" aria-hidden="true" />
                {fileName}
                {isEncrypted && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Lock className="h-3 w-3" /> Encrypted
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Decrypt section */}
          {isEncrypted && !decryptedData && (
            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm font-medium">This backup is encrypted</p>
              <p className="text-xs text-muted-foreground">
                Enter the password you used when creating this backup to decrypt it.
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Backup password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDecrypt()}
                />
                <Button
                  onClick={handleDecrypt}
                  disabled={!password || decrypting}
                  className="gap-1.5 whitespace-nowrap"
                >
                  {decrypting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Decrypt
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive font-medium" role="alert">{error}</p>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Backup contents</p>
                <div className="space-y-1.5">
                  {preview.map(p => (
                    <div key={p.key} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/40">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="text-sm">{p.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs tabular-nums">{p.count}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total: {totalRecords} record{totalRecords !== 1 ? 's' : ''} will be imported into your account.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={importing}
                  className="gap-1.5"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Import {totalRecords} records
                </Button>
                <Button variant="outline" onClick={reset}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Import backup data?"
        description={`This will add ${totalRecords} records to your account across ${preview.length} categories. Existing data will not be overwritten, but duplicates may be created if this backup was already imported. This action cannot be undone.`}
        confirmLabel="Import"
        destructive={false}
        onConfirm={handleImport}
      />
    </div>
  );
}
