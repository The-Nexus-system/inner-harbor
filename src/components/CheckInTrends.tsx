import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

const ranges = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
];

const metrics = [
  { key: 'mood', color: 'hsl(var(--primary))', label: 'Mood' },
  { key: 'stress', color: 'hsl(0 84% 60%)', label: 'Stress' },
  { key: 'pain', color: 'hsl(38 92% 50%)', label: 'Pain' },
  { key: 'fatigue', color: 'hsl(262 83% 58%)', label: 'Fatigue' },
  { key: 'dissociation', color: 'hsl(199 89% 48%)', label: 'Dissociation' },
];

export function CheckInTrends() {
  const { user } = useAuth();
  const [rangeDays, setRangeDays] = useState(7);

  const { data: checkIns, isLoading } = useQuery({
    queryKey: ['check_in_trends', user?.id, rangeDays],
    queryFn: async () => {
      const since = format(subDays(new Date(), rangeDays), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('check_date, mood, stress, pain, fatigue, dissociation')
        .eq('user_id', user!.id)
        .gte('check_date', since)
        .order('check_date');
      if (error) throw error;
      return (data ?? []).map(d => ({
        date: format(new Date(d.check_date + 'T00:00:00'), 'MMM d'),
        mood: d.mood,
        stress: d.stress,
        pain: d.pain,
        fatigue: d.fatigue,
        dissociation: d.dissociation,
      }));
    },
    enabled: !!user?.id,
  });

  return (
    <Card aria-label="Check-in trends">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" /> Check-in trends
          </CardTitle>
          <div className="flex gap-1">
            {ranges.map(r => (
              <Button
                key={r.days}
                variant={rangeDays === r.days ? 'default' : 'ghost'}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setRangeDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading trends…</div>
        ) : !checkIns?.length ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No check-in data yet. Use the daily check-in to start tracking.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={checkIns} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--popover-foreground))',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {metrics.map(m => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  stroke={m.color}
                  name={m.label}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
