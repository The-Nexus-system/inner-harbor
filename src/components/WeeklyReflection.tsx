import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WeeklyReflectionData } from '@/lib/daily-summary';

interface Props {
  data: WeeklyReflectionData;
}

export function WeeklyReflection({ data }: Props) {
  return (
    <Card aria-label="Weekly reflection">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading">Weekly reflection</CardTitle>
        <p className="text-xs text-muted-foreground">
          {new Date(data.startDate).toLocaleDateString()} — {new Date(data.endDate).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{data.narrativeSummary}</p>

        {data.commonFronters.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Who was present</h4>
            <div className="flex flex-wrap gap-2">
              {data.commonFronters.map(f => (
                <Badge key={f.name} variant="outline">{f.name} ({f.count} days)</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {data.averageMood !== null && (
            <div>
              <span className="text-muted-foreground">Avg mood:</span>{' '}
              <span className="font-medium">{data.averageMood}/5</span>
            </div>
          )}
          {data.averageStress !== null && (
            <div>
              <span className="text-muted-foreground">Avg stress:</span>{' '}
              <span className="font-medium">{data.averageStress}/5</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Switches:</span>{' '}
            <span className="font-medium">{data.totalSwitches}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tasks done:</span>{' '}
            <span className="font-medium">{data.tasksCompleted}</span>
          </div>
        </div>

        {data.whatSeemedToHelp.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">What seemed to help</h4>
            <ul className="text-sm text-muted-foreground space-y-0.5" role="list">
              {data.whatSeemedToHelp.map(item => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">
          This reflection is observational, not evaluative. You are doing your best.
        </p>
      </CardContent>
    </Card>
  );
}
