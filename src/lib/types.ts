export type DayOfWeek = 'Lunedì' | 'Martedì' | 'Mercoledì' | 'Giovedì' | 'Venerdì' | 'Sabato' | 'Domenica';

export interface Slot {
  id: string;
  timeRange: string;
  bookedBy: string[];
  createdBy?: string;
}

export interface DaySchedule {
  day: DayOfWeek;
  morning: Slot[];
  afternoon: Slot[];
  isOpen: boolean;
}
