'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Plus, User, Trash2, Sun, Moon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddSlotModal } from './add-slot-modal';
import { DeleteSlotModal } from './delete-slot-modal';
import type { DayOfWeek, DaySchedule, Slot } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { collection, doc, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { ThemeToggle } from './theme-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const initialScheduleData: DaySchedule[] = [
  { day: 'Lunedì', morning: [], afternoon: [], isOpen: false },
  { day: 'Martedì', morning: [], afternoon: [], isOpen: false },
  { day: 'Mercoledì', morning: [], afternoon: [], isOpen: false },
  { day: 'Giovedì', morning: [], afternoon: [], isOpen: false },
  { day: 'Venerdì', morning: [], afternoon: [], isOpen: false },
  { day: 'Sabato', morning: [], afternoon: [], isOpen: false },
  { day: 'Domenica', morning: [], afternoon: [], isOpen: false },
];

const sendNotification = async (payload: { targetRole: 'owner' | 'client', title: string, body: string }) => {
    try {
        await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error("Failed to send notification:", error);
    }
};

function AgendaViewLoader() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/4 mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/4 mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AgendaView() {
  const [user, setUser] = useState<{ role: 'owner' | 'client'; name: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalPeriod, setModalPeriod] = useState<'morning' | 'afternoon'>('morning');
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('gymUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('gymUser');
        router.replace('/');
      }
    } else {
      router.replace('/');
    }
    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user) return;
      setLoading(true);
      if (!db) {
        setSchedule(initialScheduleData);
        setLoading(false);
        return;
      }
      try {
        const scheduleCol = collection(db, 'schedule');
        const scheduleSnapshot = await getDocs(scheduleCol);
        if (scheduleSnapshot.empty) {
          const batch = writeBatch(db);
          initialScheduleData.forEach(daySchedule => {
            const { day, ...dataToSet } = daySchedule;
            const dayRef = doc(db, 'schedule', day);
            batch.set(dayRef, dataToSet);
          });
          await batch.commit();
          setSchedule(initialScheduleData);
        } else {
          const scheduleData = scheduleSnapshot.docs.map(docSnapshot => {
            const data = docSnapshot.data();
            const transformSlot = (slot: any): Slot => ({
              ...slot,
              bookedBy: Array.isArray(slot.bookedBy) ? slot.bookedBy : (slot.bookedBy ? [String(slot.bookedBy)] : []),
            });

            return {
              day: docSnapshot.id as DayOfWeek,
              morning: (data.morning || []).map(transformSlot),
              afternoon: (data.afternoon || []).map(transformSlot),
              isOpen: data.isOpen || false,
            };
          });
          
          const dayOrder: DayOfWeek[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
          scheduleData.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
          
          setSchedule(scheduleData as DaySchedule[]);
        }
      } catch (error) {
        console.error("Error fetching schedule: ", error);
        setSchedule(initialScheduleData);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('gymUser');
    router.push('/');
  };

  const handleAddSlot = async (day: DayOfWeek, period: 'morning' | 'afternoon', timeRange: string) => {
    if (!db || !user) return;
    const originalSchedule = [...schedule];
    const dayRef = doc(db, 'schedule', day);
    const dayData = schedule.find(d => d.day === day);
    if (!dayData) return;

    const newSlot: Slot = { id: `${day}-${period}-${Date.now()}`, timeRange, bookedBy: [], createdBy: user.name };
    const updatedPeriodSlots = [...dayData[period], newSlot].sort((a,b) => a.timeRange.localeCompare(b.timeRange));
    
    const updatedDay = { ...dayData, [period]: updatedPeriodSlots, isOpen: true };
    
    setSchedule(currentSchedule => currentSchedule.map(d => (d.day === day ? updatedDay : d)));

    try {
        await updateDoc(dayRef, { [period]: updatedPeriodSlots, isOpen: true });
        await sendNotification({
            targetRole: 'client',
            title: 'Nuovi orari disponibili!',
            body: `È stato aggiunto un nuovo orario per ${day}: ${timeRange}`,
        });
    } catch (error) {
        console.error("Error adding slot: ", error);
        setSchedule(originalSchedule);
    }
  };

  const handleBookSlot = async (slotToBook: Slot) => {
    if (!db || !user) return;
    const originalSchedule = [...schedule];
    const dayOfWeek = schedule.find(day => day.morning.some(s => s.id === slotToBook.id) || day.afternoon.some(s => s.id === slotToBook.id))?.day;

    if (!dayOfWeek) return;

    const dayRef = doc(db, 'schedule', dayOfWeek);
    const dayData = schedule.find(d => d.day === dayOfWeek);
    if (!dayData) return;

    const isBooking = !slotToBook.bookedBy.includes(user.name);

    const updateSlots = (slots: Slot[]) => {
      return slots.map(s => {
        if (s.id === slotToBook.id) {
          const isBooked = s.bookedBy.includes(user.name);
          if (isBooked) {
            return { ...s, bookedBy: s.bookedBy.filter(name => name !== user.name) };
          } else {
            return { ...s, bookedBy: [...s.bookedBy, user.name].sort() };
          }
        }
        return s;
      });
    };

    const updatedMorning = updateSlots(dayData.morning);
    const updatedAfternoon = updateSlots(dayData.afternoon);
    
    setSchedule(currentSchedule => currentSchedule.map(d => d.day === dayOfWeek ? {...d, morning: updatedMorning, afternoon: updatedAfternoon} : d));

    try {
        await updateDoc(dayRef, { morning: updatedMorning, afternoon: updatedAfternoon });
        if (isBooking) {
            await sendNotification({
                targetRole: 'owner',
                title: 'Nuova prenotazione!',
                body: `${user.name} si è prenotato per ${slotToBook.timeRange} il giorno ${dayOfWeek}.`,
            });
        }
    } catch (error) {
        console.error("Error booking slot: ", error);
        setSchedule(originalSchedule);
    }
  };

  const handleDeleteSlot = async (day: DayOfWeek, period: 'morning' | 'afternoon', slotId: string) => {
    if (!db) return;
    const originalSchedule = JSON.parse(JSON.stringify(schedule));
    const dayRef = doc(db, 'schedule', day);
    const dayData = schedule.find(d => d.day === day);
    if (!dayData) return;

    const updatedPeriodSlots = dayData[period].filter(slot => slot.id !== slotId);
    
    const otherPeriod = period === 'morning' ? 'afternoon' : 'morning';
    const dayIsOpen = updatedPeriodSlots.length > 0 || dayData[otherPeriod].length > 0;

    const updatedDay = { ...dayData, [period]: updatedPeriodSlots, isOpen: dayIsOpen };
    
    setSchedule(currentSchedule => currentSchedule.map(d => (d.day === day ? updatedDay : d)));

    try {
        await updateDoc(dayRef, { [period]: updatedPeriodSlots, isOpen: dayIsOpen });
        setIsDeleteModalOpen(false);
    } catch (error) {
        console.error("Error deleting slot: ", error);
        setSchedule(originalSchedule);
    }
  };

  if (checkingAuth || !user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="p-4 md:p-6 flex justify-between items-center border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <Skeleton className="h-7 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <AgendaViewLoader />
        </main>
      </div>
    );
  }

  const renderSlot = (slot: Slot) => {
    if (user.role === 'owner') {
      return (
        <Popover key={slot.id}>
          <PopoverTrigger asChild>
            <Badge variant={slot.bookedBy.length > 0 ? "secondary" : "default"} className="p-2 text-sm cursor-pointer select-none">
              {slot.timeRange} {slot.bookedBy.length > 0 && `(${slot.bookedBy.length})`}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            <div className="grid gap-2 text-sm">
              <p><strong className="font-medium">Orario:</strong> {slot.timeRange}</p>
              {slot.createdBy && <p><strong className="font-medium">Creato da:</strong> {slot.createdBy}</p>}
              <p><strong className="font-medium">Stato:</strong> {slot.bookedBy.length > 0 ? `Prenotato (${slot.bookedBy.length})` : 'Libero'}</p>
              {slot.bookedBy.length > 0 && (
                <div className="text-sm">
                  <p className="font-semibold">Persone prenotate:</p>
                  <div className="max-h-24 overflow-y-auto pr-2">
                    <ul className="list-disc list-inside">
                      {slot.bookedBy.map((name, index) => <li key={index}>{name}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    const isBookedByUser = slot.bookedBy.includes(user.name);
    return (
        <Popover key={slot.id}>
            <PopoverTrigger asChild>
                <Button variant={isBookedByUser ? "secondary" : "default"} className="flex-grow transition-all duration-300">
                    <Clock className="mr-2 h-4 w-4" />
                    {slot.timeRange}
                    {slot.bookedBy.length > 0 && <Badge variant="outline" className="ml-2">{slot.bookedBy.length}</Badge>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4">
                <div className="space-y-4">
                    <div className="text-center">
                        <p className="font-semibold">{isBookedByUser ? 'Sei già prenotato/a' : 'Conferma prenotazione'}</p>
                        <div className="text-sm text-muted-foreground">
                            <p>Orario: {slot.timeRange}</p>
                            {slot.createdBy && <p>Creato da: {slot.createdBy}</p>}
                        </div>
                    </div>

                    {slot.bookedBy.length > 0 && (
                        <div className="text-sm text-center">
                            <p className="font-semibold">Persone prenotate ({slot.bookedBy.length}):</p>
                            <div className="text-muted-foreground max-h-20 overflow-y-auto">
                                {slot.bookedBy.map((name, i) => <div key={i}>{name}{name === user.name && ' (Tu)'}</div>)}
                            </div>
                        </div>
                    )}

                    <Button onClick={() => handleBookSlot(slot)} className="w-full" size="sm">
                        {isBookedByUser ? 'Cancella prenotazione' : 'Prenota ora'}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {user.role === 'owner' && (
        <>
          <AddSlotModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} onAddSlot={handleAddSlot} period={modalPeriod} onPeriodChange={setModalPeriod} />
          <DeleteSlotModal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} schedule={schedule} onDeleteSlot={handleDeleteSlot} />
        </>
      )}
      
      <header className="p-4 md:p-6 flex justify-between items-center border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Link href="/" className="text-2xl font-bold font-headline text-primary">GymAgenda</Link>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-right hidden md:block">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
          </div>
          {user.role === 'owner' ? (
            <>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Aggiungi Orari
              </Button>
              <Button variant="destructive" size="icon" aria-label="Cancella orario" onClick={() => setIsDeleteModalOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-full border p-2 bg-card">
              <User className="h-4 w-4 text-primary" />
              <span className="font-semibold">{user.name}</span>
            </div>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8">
        { loading ? <AgendaViewLoader /> : (
          <div className="space-y-6">
            {schedule.map(daySchedule => {
              const hasSlots = daySchedule.morning.length > 0 || daySchedule.afternoon.length > 0;
              if (user.role === 'client' && !hasSlots) return null;

              return (
                <Card key={daySchedule.day} className={`transition-all ${!hasSlots ? 'opacity-60 bg-muted/30' : 'shadow-lg border-primary/20'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                      <Calendar className="h-6 w-6 text-primary" />
                      {daySchedule.day}
                    </CardTitle>
                    {!hasSlots && <CardDescription>Nessun orario disponibile per questo giorno.</CardDescription>}
                  </CardHeader>
                  {hasSlots && (
                    <CardContent className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Sun className="text-accent" /> Mattina</h3>
                        <div className="flex flex-wrap gap-2">
                          {daySchedule.morning.length > 0 ? daySchedule.morning.map(renderSlot) : <p className="text-sm text-muted-foreground">Nessun orario per la mattina.</p>}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Moon className="text-blue-400" /> Pomeriggio</h3>
                        <div className="flex flex-wrap gap-2">
                          {daySchedule.afternoon.length > 0 ? daySchedule.afternoon.map(renderSlot) : <p className="text-sm text-muted-foreground">Nessun orario per il pomeriggio.</p>}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
