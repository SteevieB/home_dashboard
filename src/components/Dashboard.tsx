// Dashboard.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from 'lucide-react'
import { SensorTable } from './dashboard/SensorTable'
import { HeaterControl } from './dashboard/HeaterControl'
import { SolarStatistics } from './dashboard/SolarStatistics'
import { PVSettingsForm } from './dashboard/PVSettingsForm'
import { PowerMetrics } from './dashboard/PowerMetrics'
import { HeaterType, PVSettingsType } from './types'
import { useSensors, useHeaters, useSolarStats, usePowerMetrics, useSettings } from '@/lib/swr-hooks'

const initialHeaters: HeaterType[] = [
  { id: 1, name: "Heizstab 1 - Phase 1", state: false },
  { id: 2, name: "Heizstab 1 - Phase 2", state: false },
  { id: 3, name: "Heizstab 1 - Phase 3", state: false },
  { id: 4, name: "Heizstab 2 - Phase 1", state: false },
  { id: 5, name: "Heizstab 2 - Phase 2", state: false },
  { id: 6, name: "Heizstab 2 - Phase 3", state: false },
]

export default function Dashboard() {
  // State
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [lastUserInteraction, setLastUserInteraction] = useState<number>(0)

  // SWR Hooks für Daten-Fetching mit Caching
  const {
    data: sensorData,
    error: sensorError,
    mutate: mutateSensors
  } = useSensors()

  const {
    data: heaterData,
    error: heaterError,
    mutate: mutateHeaters
  } = useHeaters()

  const {
    data: solarStatsData,
    error: solarError,
    mutate: mutateSolar
  } = useSolarStats()

  const {
    data: powerMetricsData,
    error: powerError,
    mutate: mutatePower
  } = usePowerMetrics()

  const {
    data: settingsData,
    error: settingsError,
    mutate: mutateSettings
  } = useSettings()

  // Memoized values - verhindert unnötige Rerenders
  const sensors = useMemo(() => sensorData || [], [sensorData])
  const heaters = useMemo(() => heaterData?.heaters || initialHeaters, [heaterData])
  const autoMode = useMemo(() => heaterData?.auto_mode || false, [heaterData])

  const solarStats = useMemo(() => solarStatsData || {
    currentPower: 0,
    currentPowerUnit: 'W',
    dailyEnergy: 0,
    totalEnergy: 0
  }, [solarStatsData])

  const powerMetrics = useMemo(() => powerMetricsData || {
    aktuelle_leistung: 0,
    verbrauch: 0,
    einspeisung: 0
  }, [powerMetricsData])

  const pvSettings = useMemo(() => settingsData || {
    minPower: 5,
    incrementPower: 2,
    maxTemp1: 60,
    maxTemp2: 55
  }, [settingsData])

  // Loading states basierend auf SWR-Loading
  const loadingStates = useMemo(() => ({
    sensors: !sensorData && !sensorError,
    heaters: !heaterData && !heaterError,
    solar: !solarStatsData && !solarError,
    settings: !settingsData && !settingsError,
    powerMetrics: !powerMetricsData && !powerError
  }), [
    sensorData, sensorError,
    heaterData, heaterError,
    solarStatsData, solarError,
    settingsData, settingsError,
    powerMetricsData, powerError
  ])

  // Zusammenfassung aller Fehler
  useEffect(() => {
    const errors = []
    if (sensorError) errors.push('Sensordaten')
    if (heaterError) errors.push('Heizstäbe')
    if (solarError) errors.push('Solardaten')
    if (settingsError) errors.push('Einstellungen')
    if (powerError) errors.push('Stromzählerdaten')

    if (errors.length > 0) {
      setError(`Fehler beim Laden: ${errors.join(', ')}`)
    } else {
      setError(null)
    }
  }, [sensorError, heaterError, solarError, settingsError, powerError])

  // User-Interaktion Handler - memoized
  const handleUserInteraction = useCallback(() => {
    setLastUserInteraction(Date.now())
  }, [])

  // Optimierter fetch - weniger rerenders durch useCallback
  const fetchData = useCallback(async () => {
    setError(null)
    try {
      // Parallel data fetching
      await Promise.all([
        mutateSensors(),
        mutateHeaters(),
        mutateSolar(),
        mutateSettings(),
        mutatePower()
      ])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Fehler beim Aktualisieren der Daten')
    }
  }, [mutateSensors, mutateHeaters, mutateSolar, mutateSettings, mutatePower])

  // Optimierter toggleHeater - weniger rerenders durch useCallback
  const toggleHeater = useCallback(async (id: number) => {
    if (autoMode) return

    try {
      const heater = heaters.find(h => h.id === id)

      // Optimistic UI update
      const optimisticData = {
        heaters: heaters.map(h =>
            h.id === id ? {...h, state: !h.state} : h
        ),
        auto_mode: autoMode
      }

      // Verwende SWR's optimistische Updates
      mutateHeaters(optimisticData, false)

      // Tatsächlicher API-Call im Hintergrund
      const response = await fetch('/api/heaters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, state: !heater?.state })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Schalten des Heizstabs')
      }

      // Revalidate data
      mutateHeaters()
    } catch (error) {
      console.error('Failed to toggle heater:', error)
      setError('Fehler beim Schalten des Heizstabs')
      // Revalidate to reset the optimistic update
      mutateHeaters()
    }
  }, [autoMode, heaters, mutateHeaters])

  // Auto-mode toggle optimized
  const toggleAutoMode = useCallback(async () => {
    try {
      // Optimistic update
      const optimisticData = {
        heaters,
        auto_mode: !autoMode
      }

      mutateHeaters(optimisticData, false)

      const response = await fetch('/api/auto-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !autoMode })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Umschalten des Auto-Modus')
      }

      // Revalidate data
      mutateHeaters()
    } catch (error) {
      console.error('Failed to toggle auto mode:', error)
      setError('Fehler beim Umschalten des Auto-Modus')
      // Revalidate to reset optimistic update
      mutateHeaters()
    }
  }, [autoMode, heaters, mutateHeaters])

  // PV Settings update optimized
  const updatePvSettings = useCallback(async (key: keyof PVSettingsType, value: number) => {
    try {
      // Optimistic update
      const optimisticSettings = {
        ...pvSettings,
        [key]: value
      }

      mutateSettings(optimisticSettings, false)

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Einstellungen');
      }

      // Revalidate
      mutateSettings()
      setError(null);
    } catch (error) {
      console.error('Failed to update setting:', error);
      setError('Fehler beim Speichern der Einstellung');
      // Revalidate to reset optimistic update
      mutateSettings()
      throw error;
    }
  }, [pvSettings, mutateSettings])

  // Polling interval optimiert basierend auf Benutzerinteraktion
  useEffect(() => {
    // Initial fetch
    fetchData()

    // Poll less frequently when user is active
    const interval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastUserInteraction
      if (timeSinceLastInteraction >= 5000) {
        fetchData()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchData, lastUserInteraction])

  // Memoized render sections
  const headerSection = useMemo(() => (
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Neuschmied-8-Dashboard</h1>
        <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          Letztes Update: {lastUpdate?.toLocaleTimeString()}
        </span>
          <Button onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Aktualisieren
          </Button>
        </div>
      </div>
  ), [lastUpdate, fetchData])

  const errorSection = useMemo(() => (
      error ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
      ) : null
  ), [error])

  return (
      <div className="container mx-auto p-4">
        {headerSection}
        {errorSection}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Temperatursensoren</CardTitle>
            </CardHeader>
            <CardContent>
              <SensorTable
                  sensors={sensors}
                  isLoading={loadingStates.sensors}
              />
            </CardContent>
          </Card>

          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle>Warmwasser-Steuerung</CardTitle>
            </CardHeader>
            <CardContent>
              <HeaterControl
                  heaters={heaters}
                  autoMode={autoMode}
                  isLoading={loadingStates.heaters}
                  onToggleHeater={toggleHeater}
                  onToggleAutoMode={toggleAutoMode}
                  error={null}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="flex-1 min-h-[290px]">
              <CardHeader>
                <CardTitle>Solaranlagen-Statistiken</CardTitle>
              </CardHeader>
              <CardContent>
                <SolarStatistics
                    stats={solarStats}
                    isLoading={loadingStates.solar}
                />
              </CardContent>
            </Card>

            <Card className="flex-1 min-h-[290px]">
              <CardHeader>
                <CardTitle>Stromzähler</CardTitle>
              </CardHeader>
              <CardContent>
                <PowerMetrics
                    data={powerMetrics}
                    isLoading={loadingStates.powerMetrics}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle>PV-Steuerungseinstellungen</CardTitle>
            </CardHeader>
            <CardContent>
              <PVSettingsForm
                  settings={pvSettings}
                  isLoading={loadingStates.settings}
                  error={error}
                  onUpdateSettings={updatePvSettings}
                  onUserInteraction={handleUserInteraction}
              />
            </CardContent>
          </Card>
        </div>
      </div>
  )
}