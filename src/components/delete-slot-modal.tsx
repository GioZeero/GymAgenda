'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { DaySchedule, DayOfWeek } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface DeleteSlotModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: DaySchedule[];
  onDeleteSlot: (day: DayOfWeek, period: 'morning' | 'afternoon', slotId: string) => void;
}

export function DeleteSlotModal({ isOpen, onOpenChange, schedule, onDeleteSlot }: DeleteSlotModalProps) {
  const slotsAvailable = schedule.some(day => day.morning.length > 0 || day.afternoon.length > 0);

  const handleDelete = (day: DayOfWeek, period: 'morning' | 'afternoon', slotId: string) => {
    onDeleteSlot(day, period, slotId);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancella Orario</DialogTitle>
          <DialogDescription>
            Seleziona un orario dall'elenco per cancellarlo permanentemente.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mr-6 pr-6">
          {slotsAvailable ? (
            <Accordion type="multiple" className="w-full">
              {schedule.map(daySchedule => {
                const hasSlots = daySchedule.morning.length > 0 || daySchedule.afternoon.length > 0;
                if (!hasSlots) return null;

                return (
                  <AccordionItem value={daySchedule.day} key={daySchedule.day}>
                    <AccordionTrigger>{daySchedule.day}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {daySchedule.morning.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Mattina</h4>
                            <div className="space-y-2">
                              {daySchedule.morning.map(slot => (
                                <div key={slot.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                  <Badge variant={slot.bookedBy.length > 0 ? "secondary" : "default"}>{slot.timeRange} {slot.bookedBy.length > 0 && `(${slot.bookedBy.length})`}</Badge>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(daySchedule.day, 'morning', slot.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {daySchedule.afternoon.length > 0 && (
                          <div>
                             <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Pomeriggio</h4>
                             <div className="space-y-2">
                              {daySchedule.afternoon.map(slot => (
                                <div key={slot.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                  <Badge variant={slot.bookedBy.length > 0 ? "secondary" : "default"}>{slot.timeRange} {slot.bookedBy.length > 0 && `(${slot.bookedBy.length})`}</Badge>
                                   <Button variant="ghost" size="icon" onClick={() => handleDelete(daySchedule.day, 'afternoon', slot.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-8">Non ci sono orari da cancellare.</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
