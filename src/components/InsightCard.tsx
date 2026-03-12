import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Lightbulb, ChevronDown, ChevronUp, Bookmark, X, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';
import { useInsights } from '@/hooks/useInsights';
import { Link } from 'react-router-dom';

export function InsightCard() {
  const { insights, preferences, saveInsight } = useInsights();
  const [isOpen, setIsOpen] = useState(true);
  const [hidden, setHidden] = useState(false);

  if (!preferences.insightsEnabled || hidden || insights.length === 0) return null;

  const topInsights = insights.slice(0, 2);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card aria-label="Possible patterns">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Lightbulb className="h-5 w-5" aria-hidden="true" />
              Possible patterns
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHidden(true)}
                className="h-7 w-7 p-0 text-muted-foreground"
                aria-label="Hide insights card"
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
            {topInsights.map(insight => (
              <div key={insight.key} className="p-3 rounded-lg bg-muted space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{insight.title}</p>
                    <Badge variant="outline" className="text-xs mt-1">{insight.confidence} confidence</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                <div className="flex gap-1 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 tap-target"
                    onClick={() => saveInsight(insight, 'saved')}
                    aria-label="Save this insight"
                  >
                    <Bookmark className="h-3 w-3" /> Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 tap-target"
                    onClick={() => saveInsight(insight, 'useful')}
                    aria-label="Mark as useful"
                  >
                    <ThumbsUp className="h-3 w-3" /> Useful
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 tap-target"
                    onClick={() => saveInsight(insight, 'not_useful')}
                    aria-label="Mark as not useful"
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 tap-target"
                    onClick={() => saveInsight(insight, 'dismissed')}
                    aria-label="Dismiss this insight"
                  >
                    <X className="h-3 w-3" /> Dismiss
                  </Button>
                </div>
              </div>
            ))}
            <Link to="/insights" className="text-sm text-primary underline mt-2 inline-block tap-target">
              View all insights
            </Link>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
