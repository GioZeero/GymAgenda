import { Suspense } from 'react';
import AgendaView from '@/components/agenda-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function AgendaFallback() {
  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
           <Card key={i}>
            <CardHeader>
                <Skeleton className="h-8 w-1/3" />
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                    <Skeleton className="h-6 w-1/4 mb-3" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-10 w-40" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
                 <div>
                    <Skeleton className="h-6 w-1/4 mb-3" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
            </CardContent>
           </Card>
        ))}
      </div>
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<AgendaFallback />}>
      <AgendaView />
    </Suspense>
  );
}
