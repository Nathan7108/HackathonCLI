import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/app-shell'
import { DashboardPage } from './pages/dashboard'
import { GlobePage } from './pages/globe'
import { CountriesPage } from './pages/countries'
import { ForecastsPage } from './pages/forecasts'
import { TrackRecordPage } from './pages/track-record'
import { CountryDetailPage } from './pages/country-detail'
import { SettingsPage } from './pages/settings'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="globe" element={<GlobePage />} />
        <Route path="countries" element={<CountriesPage />} />
        <Route path="forecasts" element={<ForecastsPage />} />
        <Route path="track-record" element={<TrackRecordPage />} />
        <Route path="country/:code" element={<CountryDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
