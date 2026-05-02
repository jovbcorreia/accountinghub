import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-PT').format(new Date(date));
}

export function formatDateInput(date: string | Date) {
  return new Date(date).toISOString().split('T')[0];
}
