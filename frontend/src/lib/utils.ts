import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function riskColor(level: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'var(--color-risk-critical)',
    HIGH: 'var(--color-risk-high)',
    ELEVATED: 'var(--color-risk-elevated)',
    MODERATE: 'var(--color-risk-moderate)',
    LOW: 'var(--color-risk-low)',
  }
  return map[level?.toUpperCase()] || 'var(--color-text-muted)'
}

export function riskColorClass(level: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'text-risk-critical',
    HIGH: 'text-risk-high',
    ELEVATED: 'text-risk-elevated',
    MODERATE: 'text-risk-moderate',
    LOW: 'text-risk-low',
  }
  return map[level?.toUpperCase()] || 'text-text-muted'
}

export function riskBgClass(level: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'bg-risk-critical/15 text-risk-critical border-risk-critical/30',
    HIGH: 'bg-risk-high/15 text-risk-high border-risk-high/30',
    ELEVATED: 'bg-risk-elevated/15 text-risk-elevated border-risk-elevated/30',
    MODERATE: 'bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30',
    LOW: 'bg-risk-low/15 text-risk-low border-risk-low/30',
  }
  return map[level?.toUpperCase()] || ''
}

export function formatScore(score: number): string {
  return score.toFixed(1)
}

export function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}`
}

export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return ''
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((c) => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
