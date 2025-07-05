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
import { initializePushNotifications } from '@/lib/firebase-client'; // Modificato import

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

  const handleSubscription = async (fcmToken: string, userName: string, userRole: 'owner' | 'client') => {
    console.log('FCM Token received in UI for subscription:', fcmToken);
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName, // Nome utente
          role: userRole,   // Ruolo utente
          token: fcmToken, // Token FCM
        }),
      });
      const data = await response.json();
      if (data.success) {
        console.log('Subscription to backend successful!');
      } else {
        console.error('Subscription to backend failed:', data.error);
      }
    } catch (error) {
      console.error('Error subscribing to backend:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const user = { role, name: name.trim() };
      localStorage.setItem('gymUser', JSON.stringify(user));

      // Inizializza le notifiche push e passa il callback per la sottoscrizione
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          console.log('Requesting notification permission and initializing push...');
          initializePushNotifications((token) => handleSubscription(token, user.name, user.role));
        } else if (Notification.permission === 'granted') {
          console.log('Notification permission already granted. Initializing push...');
          initializePushNotifications((token) => handleSubscription(token, user.name, user.role));
        } else {
          console.log('Notification permission was denied. Skipping push initialization.');
        }
      }
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
