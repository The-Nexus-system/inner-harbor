import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/** Full-page loading skeleton with calm messaging */
export function PageSkeleton({ message = 'Loading your space...' }: { message?: string }) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in" role="status" aria-label={message}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground text-center" aria-live="polite">{message}</p>
    </div>
  );
}

/** Card-level loading skeleton */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${90 - i * 15}%` }} />
        ))}
      </CardContent>
    </Card>
  );
}

/** Inline list loading skeleton */
export function ListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
