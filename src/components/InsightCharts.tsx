/**
 * Insight Charts — accessible visualizations with text alternatives
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, CartesianGrid, Legend, Cell } from 'recharts';
import type { FrontEvent, DailyCheckIn } from '@/types/system';

interface Props {
  frontEvents: FrontEvent[];
  checkIns: DailyCheckIn[];
}

const TIME_BUCKETS = ['Morning\n6–12', 'Afternoon\n12–17', 'Evening\n17–22', 'Night\n22–6'] as const;

function getTimeBucket(dateStr: string): number {
  const h = new Date(dateStr).getHours();
  if (h >= 6 && h < 12) return 0;
  if (h >= 12 && h < 17) return 1;
  if (h >= 17 && h < 22) return 2;
  return 3;
}

export function InsightCharts({ frontEvents, checkIns }: Props) {
  // --- Switching frequency by time of day ---
  const switchData = useMemo(() => {
    const counts = [0, 0, 0, 0];
    for (const fe of frontEvents) {
      counts[getTimeBucket(fe.startTime)]++;
    }
    return TIME_BUCKETS.map((label, i) => ({
      name: label.replace('\n', ' '),
      switches: counts[i],
    }));
  }, [frontEvents]);

  const switchTextAlt = useMemo(() => {
    if (frontEvents.length === 0) return 'No switching data available yet.';
    const lines = ['Switching frequency by time of day:'];
    for (const d of switchData) {
      lines.push(`  ${d.name}: ${d.switches} switch${d.switches !== 1 ? 'es' : ''}`);
    }
    lines.push(`Total: ${frontEvents.length} recorded front changes.`);
    return lines.join('\n');
  }, [switchData, frontEvents.length]);

  // --- Switching frequency over days (last 14 days) ---
  const dailySwitchData = useMemo(() => {
    const today = new Date();
    const days: { date: string; label: string; switches: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = frontEvents.filter(fe => fe.startTime.startsWith(dateStr)).length;
      days.push({
        date: dateStr,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        switches: count,
      });
    }
    return days;
  }, [frontEvents]);

  const dailySwitchTextAlt = useMemo(() => {
    const withData = dailySwitchData.filter(d => d.switches > 0);
    if (withData.length === 0) return 'No switching data in the last 14 days.';
    const lines = ['Switches per day (last 14 days):'];
    for (const d of dailySwitchData) {
      if (d.switches > 0) lines.push(`  ${d.label}: ${d.switches}`);
    }
    return lines.join('\n');
  }, [dailySwitchData]);

  // --- Mood/Stress correlation scatter ---
  const moodStressData = useMemo(() => {
    return checkIns.map(ci => ({
      mood: ci.mood,
      stress: ci.stress,
      date: ci.date,
      fatigue: ci.fatigue,
    }));
  }, [checkIns]);

  const moodStressTextAlt = useMemo(() => {
    if (moodStressData.length === 0) return 'No check-in data available for mood/stress correlation.';
    const lines = ['Mood vs. stress check-in data:'];
    for (const d of moodStressData) {
      lines.push(`  ${d.date}: mood ${d.mood}/5, stress ${d.stress}/5, fatigue ${d.fatigue}/5`);
    }
    const avgMood = moodStressData.reduce((s, d) => s + d.mood, 0) / moodStressData.length;
    const avgStress = moodStressData.reduce((s, d) => s + d.stress, 0) / moodStressData.length;
    lines.push(`Averages: mood ${avgMood.toFixed(1)}/5, stress ${avgStress.toFixed(1)}/5.`);
    return lines.join('\n');
  }, [moodStressData]);

  // --- Stress vs switches per day ---
  const stressSwitchData = useMemo(() => {
    const checkInByDate = new Map(checkIns.map(c => [c.date, c]));
    const result: { date: string; stress: number; switches: number }[] = [];
    for (const d of dailySwitchData) {
      const ci = checkInByDate.get(d.date);
      if (ci && d.switches > 0) {
        result.push({ date: d.label, stress: ci.stress, switches: d.switches });
      }
    }
    return result;
  }, [dailySwitchData, checkIns]);

  const stressSwitchTextAlt = useMemo(() => {
    if (stressSwitchData.length === 0) return 'Not enough data to show stress vs. switching correlation.';
    const lines = ['Stress level vs. number of switches (days with both data):'];
    for (const d of stressSwitchData) {
      lines.push(`  ${d.date}: stress ${d.stress}/5, ${d.switches} switch${d.switches !== 1 ? 'es' : ''}`);
    }
    return lines.join('\n');
  }, [stressSwitchData]);

  const chartColors = {
    primary: 'hsl(160, 30%, 40%)',
    accent: 'hsl(200, 25%, 55%)',
    safe: 'hsl(145, 40%, 45%)',
    warning: 'hsl(35, 80%, 55%)',
  };

  return (
    <div className="space-y-6">
      {/* Switching by time of day */}
      <Card aria-label="Switching frequency by time of day">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">When switching tends to happen</CardTitle>
          <p className="text-xs text-muted-foreground">Distribution of front changes across the day</p>
        </CardHeader>
        <CardContent>
          {frontEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No front event data yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="h-48" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={switchData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="switches" fill={chartColors.primary} radius={[4, 4, 0, 0]} name="Switches" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <details className="text-sm">
                <summary className="text-muted-foreground cursor-pointer tap-target">Text alternative</summary>
                <pre className="whitespace-pre-wrap text-xs mt-2 p-2 bg-muted rounded font-sans" role="document">{switchTextAlt}</pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Switches per day */}
      <Card aria-label="Switching frequency over the last 14 days">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Switches over time</CardTitle>
          <p className="text-xs text-muted-foreground">Number of front changes per day (last 14 days)</p>
        </CardHeader>
        <CardContent>
          {frontEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No front event data yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="h-48" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySwitchData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="switches" fill={chartColors.accent} radius={[3, 3, 0, 0]} name="Switches" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <details className="text-sm">
                <summary className="text-muted-foreground cursor-pointer tap-target">Text alternative</summary>
                <pre className="whitespace-pre-wrap text-xs mt-2 p-2 bg-muted rounded font-sans" role="document">{dailySwitchTextAlt}</pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mood vs Stress scatter */}
      <Card aria-label="Mood and stress correlation">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Mood and stress</CardTitle>
          <p className="text-xs text-muted-foreground">Each dot is a daily check-in. This may show possible connections.</p>
        </CardHeader>
        <CardContent>
          {moodStressData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No check-in data yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="h-52" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" dataKey="stress" name="Stress" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} label={{ value: 'Stress', position: 'bottom', fontSize: 11, offset: -5 }} />
                    <YAxis type="number" dataKey="mood" name="Mood" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} label={{ value: 'Mood', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(value: number, name: string) => [`${value}/5`, name]} />
                    <Scatter data={moodStressData} fill={chartColors.safe} fillOpacity={0.7}>
                      {moodStressData.map((_, i) => (
                        <Cell key={i} r={6} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <details className="text-sm">
                <summary className="text-muted-foreground cursor-pointer tap-target">Text alternative</summary>
                <pre className="whitespace-pre-wrap text-xs mt-2 p-2 bg-muted rounded font-sans" role="document">{moodStressTextAlt}</pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stress vs Switches */}
      {stressSwitchData.length > 0 && (
        <Card aria-label="Stress level and switching frequency">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Stress and switching</CardTitle>
            <p className="text-xs text-muted-foreground">Days with both check-in and switching data. This is observational, not causal.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-52" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" dataKey="stress" name="Stress" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} label={{ value: 'Stress', position: 'bottom', fontSize: 11, offset: -5 }} />
                    <YAxis type="number" dataKey="switches" name="Switches" tick={{ fontSize: 11 }} label={{ value: 'Switches', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Scatter data={stressSwitchData} fill={chartColors.warning} fillOpacity={0.7}>
                      {stressSwitchData.map((_, i) => (
                        <Cell key={i} r={6} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <details className="text-sm">
                <summary className="text-muted-foreground cursor-pointer tap-target">Text alternative</summary>
                <pre className="whitespace-pre-wrap text-xs mt-2 p-2 bg-muted rounded font-sans" role="document">{stressSwitchTextAlt}</pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
