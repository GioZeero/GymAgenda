'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dumbbell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { requestNotificationPermission } from '@/lib/firebase-client';

export default function Home() {
  const [role, setRole] = useState<'owner' | 'client'>('client');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('gymUser');
    if (storedUser) {
      router.push('/agenda');
    } else {
      setLoading(false);
    }
  }, [router]);

  const subscribeToNotifications = async (user: { name: string; role: string }) => {
    const token = await requestNotificationPermission();
    if (token) {
        try {
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...user, token }),
            });
        } catch (error) {
            console.error("Failed to subscribe user:", error);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const user = { role, name: name.trim() };
      localStorage.setItem('gymUser', JSON.stringify(user));
      await subscribeToNotifications(user);
      router.push(`/agenda`);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-5 w-56 mx-auto mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-4 pt-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <Dumbbell size={40} strokeWidth={2.5} />
          </div>
          <CardTitle className="text-3xl font-headline">Benvenuto su GymAgenda</CardTitle>
          <CardDescription>Per iniziare, dicci chi sei.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Io sono...</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'owner' | 'client')} className="flex gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="client" id="r-client" />
                  <Label htmlFor="r-client">Cliente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="owner" id="r-owner" />
                  <Label htmlFor="r-owner">Proprietario</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Il mio nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="es. Mario Rossi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={!name.trim()}>
              Continua
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
