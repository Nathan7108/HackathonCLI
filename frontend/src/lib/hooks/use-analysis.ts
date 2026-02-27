import { useQuery } from '@tanstack/react-query'
import { analyzeCountry, getForecast, getTrackRecord } from '../api'

export function useAnalysis(country: string, countryCode: string) {
  return useQuery({
    queryKey: ['analysis', countryCode],
    queryFn: () => analyzeCountry(country, countryCode),
    enabled: !!countryCode,
    staleTime: 5 * 60_000,
  })
}

export function useForecast(country: string, countryCode: string) {
  return useQuery({
    queryKey: ['forecast', countryCode],
    queryFn: () => getForecast(country, countryCode),
    enabled: !!countryCode,
    staleTime: 5 * 60_000,
  })
}

export function useTrackRecord() {
  return useQuery({
    queryKey: ['track-record'],
    queryFn: getTrackRecord,
    staleTime: 60_000,
  })
}
