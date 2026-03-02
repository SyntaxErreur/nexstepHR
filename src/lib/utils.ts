import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

export function generateBypassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `NSHR-${seg()}-${seg()}`;
}

export function generateToken(): string {
  return Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomDelay(min = 300, max = 1200): Promise<void> {
  return delay(min + Math.random() * (max - min));
}

export function longDelay(): Promise<void> {
  return delay(1500 + Math.random() * 2000);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-blue-100 text-blue-700',
    collecting: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-green-100 text-green-700',
    report_generated: 'bg-purple-100 text-purple-700',
    archived: 'bg-gray-100 text-gray-500',
    sent: 'bg-blue-100 text-blue-700',
    opened: 'bg-yellow-100 text-yellow-700',
    submitted: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
    invited: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
    unpaid: 'bg-orange-100 text-orange-700',
    paid: 'bg-green-100 text-green-700',
    bypassed: 'bg-purple-100 text-purple-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getMaterialityColor(level: string): string {
  switch (level) {
    case 'High': return 'bg-red-100 text-red-700 border-red-200';
    case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Low': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-gray-100 text-gray-700';
  }
}
