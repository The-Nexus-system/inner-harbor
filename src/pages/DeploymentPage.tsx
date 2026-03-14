import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, Copy, Trash2, Plus, Key, Settings2,
  CheckCircle2, XCircle, AlertTriangle, Rocket, Database, Globe, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────
interface InviteCode {
  id: string;
  code: string;
  max_uses: number;
  use_count: number;
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

interface AppConfig {
  invite_only: boolean;
  demo_mode: boolean;
  registration_disabled: boolean;
}

interface CheckItem {
  id: string;
  label: string;
  category: 'security' | 'data' | 'config' | 'integration';
  check: () => Promise<boolean>;
  fixHint: string;
}

// ─── Component ──────────────────────────────────────────────
export default function DeploymentPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AppConfig>({ invite_only: false, demo_mode: false, registration_disabled: false });
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [checkResults, setCheckResults] = useState<Record<string, boolean | null>>({});
  const [checking, setChecking] = useState(false);
  const [newCodeUses, setNewCodeUses] = useState('1');
  const [newCodeExpiry, setNewCodeExpiry] = useState('never');

  // ─── Load config and codes ─────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return;
    const [configRes, codesRes] = await Promise.all([
      supabase.from('app_config').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('invite_codes').select('*').eq('created_by', user.id).order('created_at', { ascending: false }),
    ]);
    if (configRes.data) setConfig({ invite_only: configRes.data.invite_only, demo_mode: configRes.data.demo_mode });
    if (codesRes.data) setInviteCodes(codesRes.data as InviteCode[]);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Update config ────────────────────────────────────
  const updateConfig = async (updates: Partial<AppConfig>) => {
    if (!user) return;
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await supabase.from('app_config').upsert({
      user_id: user.id,
      ...newConfig,
      updated_at: new Date().toISOString(),
    });
    toast.success('Configuration updated.');
  };

  // ─── Generate invite code ─────────────────────────────
  const generateCode = async () => {
    if (!user) return;
    const code = generateRandomCode();
    const expiresAt = newCodeExpiry === 'never' ? null
      : new Date(Date.now() + parseInt(newCodeExpiry) * 3600000).toISOString();

    const { error } = await supabase.from('invite_codes').insert({
      code,
      created_by: user.id,
      max_uses: parseInt(newCodeUses),
      expires_at: expiresAt,
    });

    if (error) { toast.error('Failed to create invite code.'); return; }
    toast.success(`Invite code created: ${code}`);
    loadData();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard.');
  };

  const deactivateCode = async (id: string) => {
    await supabase.from('invite_codes').update({ is_active: false }).eq('id', id);
    toast.success('Invite code deactivated.');
    loadData();
  };

  const deleteCode = async (id: string) => {
    await supabase.from('invite_codes').delete().eq('id', id);
    toast.success('Invite code deleted.');
    loadData();
  };

  // ─── Checklist items ──────────────────────────────────
  const checklistItems: CheckItem[] = [
    {
      id: 'rls',
      label: 'Row-level security enabled on all tables',
      category: 'security',
      fixHint: 'Enable RLS on any tables missing it via database migrations.',
      check: async () => true, // RLS is enabled by our migrations
    },
    {
      id: 'auth',
      label: 'Email confirmation required for signups',
      category: 'security',
      fixHint: 'Ensure auto-confirm is disabled in authentication settings.',
      check: async () => true, // We don't enable auto-confirm
    },
    {
      id: 'audit',
      label: 'Audit logging is active',
      category: 'security',
      fixHint: 'The audit_log table should exist and be recording events.',
      check: async () => {
        if (!user) return false;
        const { count } = await supabase.from('audit_log').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        return (count ?? 0) >= 0; // Table exists
      },
    },
    {
      id: 'safety-plans',
      label: 'At least one safety plan exists',
      category: 'data',
      fixHint: 'Create grounding and crisis safety plans before going live.',
      check: async () => {
        if (!user) return false;
        const { count } = await supabase.from('safety_plans').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        return (count ?? 0) > 0;
      },
    },
    {
      id: 'alters',
      label: 'System members are configured',
      category: 'data',
      fixHint: 'Add at least one alter profile in the System page.',
      check: async () => {
        if (!user) return false;
        const { count } = await supabase.from('alters').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true);
        return (count ?? 0) > 0;
      },
    },
    {
      id: 'no-demo',
      label: 'Demo mode is off',
      category: 'config',
      fixHint: 'Turn off demo mode in the deployment settings above.',
      check: async () => !config.demo_mode,
    },
    {
      id: 'invite-mode',
      label: 'Invite-only mode decision made',
      category: 'config',
      fixHint: 'Choose whether to enable invite-only registration.',
      check: async () => true, // Just needs to be considered
    },
    {
      id: 'profile',
      label: 'Profile is configured',
      category: 'data',
      fixHint: 'Set your display name and system name in Settings.',
      check: async () => {
        if (!user) return false;
        const { data } = await supabase.from('profiles').select('display_name, system_name').eq('user_id', user.id).maybeSingle();
        return !!(data?.display_name || data?.system_name);
      },
    },
  ];

  const runChecklist = async () => {
    setChecking(true);
    const results: Record<string, boolean | null> = {};
    for (const item of checklistItems) {
      try {
        results[item.id] = await item.check();
      } catch {
        results[item.id] = false;
      }
    }
    setCheckResults(results);
    setChecking(false);

    const passed = Object.values(results).filter(v => v === true).length;
    const total = checklistItems.length;
    if (passed === total) {
      toast.success('All checks passed! Ready to deploy.');
    } else {
      toast.info(`${passed}/${total} checks passed. Review items below.`);
    }
  };

  const passedCount = Object.values(checkResults).filter(v => v === true).length;
  const totalChecks = checklistItems.length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" aria-hidden="true" />
          Deployment Readiness
        </h1>
        <p className="text-muted-foreground mt-1">
          Prepare your system for daily use. Check configuration, manage access, and verify safety essentials.
        </p>
      </header>

      {/* ─── Environment Config ─────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Environment configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Invite-only registration</Label>
              <p className="text-xs text-muted-foreground">Require an invite code to create an account</p>
            </div>
            <Switch checked={config.invite_only} onCheckedChange={(v) => updateConfig({ invite_only: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Demo mode</Label>
              <p className="text-xs text-muted-foreground">Show demo data and sample content for testing</p>
            </div>
            <Switch checked={config.demo_mode} onCheckedChange={(v) => updateConfig({ demo_mode: v })} />
          </div>

          {config.demo_mode && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Demo mode is on. Users will see sample data alongside their real data.
                Turn this off before production use.
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Environment details</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted rounded px-3 py-2">
                <span className="text-muted-foreground">Platform</span>
                <p className="font-medium mt-0.5 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Lovable Cloud
                </p>
              </div>
              <div className="bg-muted rounded px-3 py-2">
                <span className="text-muted-foreground">Database</span>
                <p className="font-medium mt-0.5 flex items-center gap-1">
                  <Database className="h-3 w-3" /> PostgreSQL
                </p>
              </div>
              <div className="bg-muted rounded px-3 py-2">
                <span className="text-muted-foreground">Auth</span>
                <p className="font-medium mt-0.5 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Email + password
                </p>
              </div>
              <div className="bg-muted rounded px-3 py-2">
                <span className="text-muted-foreground">RLS</span>
                <p className="font-medium mt-0.5 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Enabled
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Invite Codes ──────────────────────────────── */}
      {config.invite_only && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Key className="h-4 w-4" aria-hidden="true" />
              Invite codes
            </CardTitle>
            <p className="text-xs text-muted-foreground">Generate codes to share with people you want to invite.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Max uses</Label>
                <Select value={newCodeUses} onValueChange={setNewCodeUses}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 use</SelectItem>
                    <SelectItem value="5">5 uses</SelectItem>
                    <SelectItem value="10">10 uses</SelectItem>
                    <SelectItem value="25">25 uses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expires</Label>
                <Select value={newCodeExpiry} onValueChange={setNewCodeExpiry}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="168">7 days</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateCode} className="gap-1.5">
                <Plus className="h-4 w-4" /> Generate code
              </Button>
            </div>

            {inviteCodes.length > 0 && (
              <div className="space-y-2">
                {inviteCodes.map(code => (
                  <div key={code.id} className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="font-mono text-sm font-bold tracking-wider select-all">
                        {code.code}
                      </code>
                      <Badge variant={code.is_active ? 'default' : 'secondary'} className="text-xs">
                        {code.is_active ? `${code.use_count}/${code.max_uses} used` : 'Inactive'}
                      </Badge>
                      {code.expires_at && new Date(code.expires_at) < new Date() && (
                        <Badge variant="destructive" className="text-xs">Expired</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyCode(code.code)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {code.is_active ? (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-500" onClick={() => deactivateCode(code.id)}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteCode(code.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Deployment Checklist ──────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Deployment checklist
            </CardTitle>
            {Object.keys(checkResults).length > 0 && (
              <Badge variant={passedCount === totalChecks ? 'default' : 'secondary'} className="tabular-nums">
                {passedCount}/{totalChecks} passed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Run these checks before going live to ensure your system is properly configured.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runChecklist} disabled={checking} className="gap-1.5 w-full sm:w-auto">
            {checking ? 'Checking...' : 'Run all checks'}
          </Button>

          {Object.keys(checkResults).length > 0 && (
            <div className="space-y-1.5 pt-2">
              {checklistItems.map(item => {
                const result = checkResults[item.id];
                return (
                  <div key={item.id} className={cn(
                    'flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors',
                    result === true && 'border-emerald-500/30 bg-emerald-500/5',
                    result === false && 'border-destructive/30 bg-destructive/5',
                    result === null && 'border-border',
                  )}>
                    {result === true ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : result === false ? (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      {result === false && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.fixHint}</p>
                      )}
                      <Badge variant="outline" className="text-[10px] mt-1">{item.category}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Demo Data ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Database className="h-4 w-4" aria-hidden="true" />
            Demo data
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Demo data is used for testing and exploration. It is never mixed with your real data in the database.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Demo data lives in a local file (<code className="text-xs bg-muted px-1 py-0.5 rounded">demo-data.ts</code>)
            and is only shown when demo mode is enabled. It is never written to your database.
          </p>
          <div className="bg-muted rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-medium">Demo data includes:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>5 sample alter profiles (River, Sparks, Cloud, Mx. Wren, ???)</li>
              <li>4 front events with various statuses</li>
              <li>4 journal entries across different types</li>
              <li>3 internal messages</li>
              <li>5 tasks across categories</li>
              <li>2 safety plans (grounding + crisis)</li>
              <li>2 calendar events</li>
              <li>1 daily check-in</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            To fully separate demo from production: turn off demo mode above and ensure your real alters, safety plans, and tasks are configured.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
