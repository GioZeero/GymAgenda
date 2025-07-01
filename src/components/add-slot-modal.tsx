'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DayOfWeek } from '@/lib/types';

interface AddSlotModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSlot: (day: DayOfWeek, period: 'morning' | 'afternoon', timeRange: string) => void;
  period: 'morning' | 'afternoon';
  onPeriodChange: (period: 'morning' | 'afternoon') => void;
}

export function AddSlotModal({ isOpen, onOpenChange, onAddSlot, period, onPeriodChange }: AddSlotModalProps) {
  const [day, setDay] = useState<DayOfWeek>('Lunedì');
  const [timeRange, setTimeRange] = useState('');

  const handleSubmit = () => {
    if (timeRange.trim()) {
      onAddSlot(day, period, timeRange);
      setTimeRange('');
      onOpenChange(false);
    }
  };

  const days: DayOfWeek[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Orario</DialogTitle>
          <DialogDescription>
            Seleziona un giorno, un periodo e inserisci l'orario per la nuova fascia.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="day" className="text-right">Giorno</Label>
            <Select onValueChange={(value) => setDay(value as DayOfWeek)} defaultValue={day}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleziona un giorno" />
              </SelectTrigger>
              <SelectContent>
                {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="period" className="text-right">Periodo</Label>
            <Select onValueChange={(value) => onPeriodChange(value as 'morning' | 'afternoon')} value={period}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleziona un periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Mattina</SelectItem>
                <SelectItem value="afternoon">Pomeriggio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">Orario</Label>
            <Input
              id="time"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              placeholder="es. 09:00 - 12:00"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button type="submit" onClick={handleSubmit}>Aggiungi Orario</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
