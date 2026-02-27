import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getCountries, getAnomalies, getHealth } from '../api'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSummary,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useAnomalies() {
  return useQuery({
    queryKey: ['anomalies'],
    queryFn: getAnomalies,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
  })
}
