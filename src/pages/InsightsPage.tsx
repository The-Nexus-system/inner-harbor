import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, Bookmark, X, ThumbsUp, ThumbsDown, FileText, BarChart3 } from 'lucide-react';
import { useInsights } from '@/hooks/useInsights';
import { insightsToPlainText } from '@/lib/insights';
import { InsightCharts } from '@/components/InsightCharts';
import { useSystem } from '@/contexts/SystemContext';
import { PageSkeleton } from '@/components/LoadingSkeleton';

const categoryLabels: Record<string, string> = {
  switching: 'Switching',
  wellbeing: 'Wellbeing',
  medical: 'Medical',
  environment: 'Environment',
  recovery: 'Recovery',
  grounding: 'Grounding',
  continuity: 'Continuity',
};

export default function InsightsPage() {
  const { insights, savedInsights, preferences, isLoading, saveInsight, updateInsightStatus } = useInsights();
  const [tab, setTab] = useState('current');

  if (isLoading) return <PageSkeleton message="Loading insights..." />;

  if (!preferences.insightsEnabled) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
        <header>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Insights</h1>
        </header>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Pattern insights are currently turned off. You can enable them in Settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plainText = insightsToPlainText(insights, preferences.detailMode);
  const savedOnly = savedInsights.filter(s => s.status === 'saved' || s.status === 'useful');

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Insights</h1>
        <p className="text-muted-foreground mt-1">
          Possible patterns from your data. These are gentle observations, not conclusions.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="current">Current ({insights.length})</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedOnly.length})</TabsTrigger>
          <TabsTrigger value="text">Plain text</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4 mt-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No patterns detected yet. As more data is recorded, possible patterns may appear here.</p>
              </CardContent>
            </Card>
          ) : (
            insights.map(insight => (
              <Card key={insight.key}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{insight.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{categoryLabels[insight.category] || insight.category}</Badge>
                        <Badge variant="secondary" className="text-xs">{insight.confidence} confidence</Badge>
                        <Badge variant="secondary" className="text-xs">{insight.dataPoints} data points</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 tap-target" onClick={() => saveInsight(insight, 'saved')}>
                      <Bookmark className="h-3 w-3" /> Save
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 tap-target" onClick={() => saveInsight(insight, 'useful')}>
                      <ThumbsUp className="h-3 w-3" /> Useful
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 tap-target" onClick={() => saveInsight(insight, 'not_useful')}>
                      <ThumbsDown className="h-3 w-3" /> Not useful
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 tap-target" onClick={() => saveInsight(insight, 'dismissed')}>
                      <X className="h-3 w-3" /> Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4 mt-4">
          {savedOnly.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Bookmark className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No saved insights yet. Save insights you find helpful from the Current tab.</p>
              </CardContent>
            </Card>
          ) : (
            savedOnly.map(si => (
              <Card key={si.id}>
                <CardContent className="pt-4 space-y-2">
                  <h3 className="font-medium">{si.title}</h3>
                  <p className="text-sm text-muted-foreground">{si.description}</p>
                  <div className="flex gap-2">
                    <Badge variant={si.status === 'useful' ? 'default' : 'outline'} className="text-xs">
                      {si.status === 'useful' ? 'Marked useful' : 'Saved'}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => updateInsightStatus(si.id, 'dismissed')}>
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <FileText className="h-5 w-5" /> Plain text summary
              </CardTitle>
              <p className="text-xs text-muted-foreground">Optimized for screen readers and braille displays</p>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm font-sans text-foreground leading-relaxed" role="document" aria-label="Insights plain text summary">
                {plainText}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
