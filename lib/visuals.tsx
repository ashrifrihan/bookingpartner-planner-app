import React from 'react';

export type PhaseMeta = {
  icon: React.ReactNode;
  label: string;
  color: string;
  badgeBg: string;
  tag: string;
};

export function getPhaseMeta(week: number): PhaseMeta {
  switch (week) {
    case 1:
      return {
        icon: <DatabaseIcon />,
        label: 'Setup and foundation',
        color: '#2563EB',
        badgeBg: 'rgba(37, 99, 235, 0.12)',
        tag: 'INFRA',
      };
    case 2:
      return {
        icon: <ShieldIcon />,
        label: 'Authentication and users',
        color: '#0284C7',
        badgeBg: 'rgba(2, 132, 199, 0.12)',
        tag: 'AUTH',
      };
    case 3:
      return {
        icon: <GridIcon />,
        label: 'Cities, routes, buses and layouts',
        color: '#0D9488',
        badgeBg: 'rgba(13, 148, 136, 0.12)',
        tag: 'FLEET',
      };
    case 4:
      return {
        icon: <ZapIcon />,
        label: 'Schedules and dated trips',
        color: '#10B981',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        tag: 'TRIPS',
      };
    case 5:
      return {
        icon: <ClockIcon />,
        label: 'Seat holding and polling',
        color: '#3B82F6',
        badgeBg: 'rgba(59, 130, 246, 0.12)',
        tag: 'SEATS',
      };
    case 6:
      return {
        icon: <CreditCardIcon />,
        label: 'Payments and booking confirmation',
        color: '#F43F5E',
        badgeBg: 'rgba(244, 63, 94, 0.12)',
        tag: 'PAYMENTS',
      };
    case 7:
      return {
        icon: <BarChartIcon />,
        label: 'Owner earnings, management and settings',
        color: '#F59E0B',
        badgeBg: 'rgba(245, 158, 11, 0.12)',
        tag: 'FINANCE',
      };
    case 8:
      return {
        icon: <ShieldIcon />,
        label: 'Admin owner and financial APIs',
        color: '#8B5CF6',
        badgeBg: 'rgba(139, 92, 246, 0.12)',
        tag: 'ADMIN',
      };
    case 9:
      return {
        icon: <SearchIcon />,
        label: 'Management, transfers, reviews, notifications',
        color: '#14B8A6',
        badgeBg: 'rgba(20, 184, 166, 0.12)',
        tag: 'OPS',
      };
    case 10:
      return {
        icon: <LockIcon />,
        label: 'Security, concurrency and end-to-end testing',
        color: '#EF4444',
        badgeBg: 'rgba(239, 68, 68, 0.12)',
        tag: 'TESTING',
      };
    case 11:
      return {
        icon: <GaugeIcon />,
        label: 'Production readiness and deployment',
        color: '#0EA5E9',
        badgeBg: 'rgba(14, 165, 233, 0.12)',
        tag: 'STAGING',
      };
    case 12:
    default:
      return {
        icon: <RocketIcon />,
        label: 'Operator onboarding and conditional soft launch',
        color: '#10B981',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        tag: 'LAUNCH',
      };
  }
}

export type TaskChip = {
  label: string;
  type: 'schema' | 'api' | 'test' | 'auth' | 'security' | 'config' | 'task';
};

export function getTaskChip(text: string): TaskChip {
  const lower = text.toLowerCase();
  if (lower.includes('schema') || lower.includes('prisma') || lower.includes('database') || lower.includes('migration') || lower.includes('postgres') || lower.includes('table')) {
    return { label: 'SCHEMA', type: 'schema' };
  }
  if (lower.includes('api') || lower.includes('route') || lower.includes('endpoint') || lower.includes('post') || lower.includes('get') || lower.includes('handler')) {
    return { label: 'API', type: 'api' };
  }
  if (lower.includes('test') || lower.includes('verify') || lower.includes('confirm') || lower.includes('k6') || lower.includes('validate')) {
    return { label: 'TEST', type: 'test' };
  }
  if (lower.includes('auth') || lower.includes('jwt') || lower.includes('login') || lower.includes('token') || lower.includes('user')) {
    return { label: 'AUTH', type: 'auth' };
  }
  if (lower.includes('security') || lower.includes('rate limit') || lower.includes('lock') || lower.includes('owasp') || lower.includes('cors')) {
    return { label: 'SECURITY', type: 'security' };
  }
  if (lower.includes('install') || lower.includes('setup') || lower.includes('.env') || lower.includes('config') || lower.includes('docker')) {
    return { label: 'CONFIG', type: 'config' };
  }
  return { label: 'CORE', type: 'task' };
}

// Crisp Vector Icons for Engineering Domains
export function DatabaseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

export function ZapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function CreditCardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

export function QrCodeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  );
}

export function BarChartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function GaugeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function RocketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export function TargetCrosshairIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function NotebookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h4" />
      <path d="M2 10h4" />
      <path d="M2 14h4" />
      <path d="M2 18h4" />
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M16 2v20" />
    </svg>
  );
}

export function AlertOctagonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

export function CheckCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}



