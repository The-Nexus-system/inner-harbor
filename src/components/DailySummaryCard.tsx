import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useDailySummary } from '@/hooks/useDailySummary';
import { useInsights } from '@/hooks/useInsights';
import { Link } from 'react-router-dom';

export function DailySummaryCard() {
  const today = new Date().toISOString().split('T')[0];
  const { summary } = useDailySummary(today);
  const { preferences } = useInsights();
  const [isOpen, setIsOpen] = useState(true);
  const [hidden, setHidden] = useState(false);

  if (!preferences.summariesEnabled || hidden) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card aria-label="Today's summary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <FileText className="h-5 w-5" aria-hidden="true" />
              Today's summary
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHidden(true)}
                className="h-7 w-7 p-0 text-muted-foreground"
                aria-label="Hide summary card"
              >
                <X className="h-4 w-4" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={isOpen ? 'Collapse' : 'Expand'}>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary.narrativeSummary}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {summary.fronters.length > 0 && (
                <span>{summary.fronters.length} fronter{summary.fronters.length !== 1 ? 's' : ''}</span>
              )}
              {summary.tasksCompleted > 0 && (
                <span>{summary.tasksCompleted} task{summary.tasksCompleted !== 1 ? 's' : ''} done</span>
              )}
              {summary.journalCount > 0 && (
                <span>{summary.journalCount} journal entr{summary.journalCount !== 1 ? 'ies' : 'y'}</span>
              )}
              {summary.gaps > 0 && (
                <span>{summary.gaps} gap{summary.gaps !== 1 ? 's' : ''}</span>
              )}
            </div>

            <Link to="/timeline" className="text-sm text-primary underline mt-2 inline-block tap-target">
              View full timeline
            </Link>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
