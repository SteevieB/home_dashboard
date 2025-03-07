// Dashboard.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from 'lucide-react'
import { SensorTable } from './dashboard/SensorTable'
import { HeaterControl } from './dashboard/HeaterControl'
import { SolarStatistics } from './dashboard/SolarStatistics'
import { PVSettingsForm } from './dashboard/PVSettingsForm'
import { PowerMetrics } from './dashboard/PowerMetrics'
import { HeaterType, SensorType, PVSettingsType, SolarStatsType } from './types'

const initialHeaters: HeaterType[] = [
  { id: 1, name: "Heizstab 1 - Phase 1", state: false },
  { id: 2, name: "Heizstab 1 - Phase 2", state: false },
  { id: 3, name: "Heizstab 1 - Phase 3", state: false },
  { id: 4, name: "Heizstab 2 - Phase 1", state: false },
  { id: 5, name: "Heizstab 2 - Phase 2", state: false },
  { id: 6, name: "Heizstab 2 - Phase 3", state: false },
]

export default function Dashboard() {
  const [sensors, setSensors] = useState<SensorType[]>([])
  const [heaters, setHeaters] = useState<HeaterType[]>(initialHeaters)
  const [autoMode, setAutoMode] = useState(false)
  const [lastUserInteraction, setLastUserInteraction] = useState<number>(0)
  const handleUserInteraction = () => {
    setLastUserInteraction(Date.now())
  }
  const [solarStats, setSolarStats] = useState<SolarStatsType>({
    currentPower: 0,
    currentPowerUnit: 'W',
    dailyEnergy: 0,
    totalEnergy: 0
  })
  const [pvSettings, setPvSettings] = useState<PVSettingsType>({
    minPower: 5,
    incrementPower: 2,
    maxTemp1: 60,
    maxTemp2: 55
  })
  const [powerMetrics, setPowerMetrics] = useState({
    aktuelle_leistung: 0,
    verbrauch: 0,
    einspeisung: 0
  })
  const [loadingStates, setLoadingStates] = useState({
    sensors: true,
    heaters: true,
    solar: true,
    settings: true,
    powerMetrics: true
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>()
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setError(null)
    const fetchSensors = async () => {
      try {
        const response = await fetch('/api/sensors')
        if (!response.ok) throw new Error('Fehler beim Laden der Sensordaten')
        const data = await response.json()
        setSensors(data)
      } catch (error) {
        console.error('Failed to fetch sensors:', error)
        setError('Fehler beim Laden der Sensordaten')
      } finally {
        setLoadingStates(prev => ({ ...prev, sensors: false }))
      }
    }

    const fetchHeaters = async () => {
      try {
        const response = await fetch('/api/heaters')
        if (!response.ok) throw new Error('Fehler beim Laden der Heizstäbe')
        const data = await response.json()
        if (data && data.heaters) {
          setHeaters(data.heaters)
          setAutoMode(!!data.auto_mode)
        }
      } catch (error) {
        console.error('Failed to fetch heaters:', error)
        setError('Fehler beim Laden der Heizstäbe')
      } finally {
        setLoadingStates(prev => ({ ...prev, heaters: false }))
      }
    }

    const fetchSolar = async () => {
      try {
        const response = await fetch('/api/solar')
        if (!response.ok) throw new Error('Fehler beim Laden der Solardaten')
        const data = await response.json()
        setSolarStats(data)
      } catch (error) {
        console.error('Failed to fetch solar:', error)
        setError('Fehler beim Laden der Solardaten')
      } finally {
        setLoadingStates(prev => ({ ...prev, solar: false }))
      }
    }

    const fetchPowerMetrics = async () => {
      try {
        const response = await fetch('/api/power-metrics')
        if (!response.ok) throw new Error('Fehler beim Laden der Stromzählerdaten')
        const data = await response.json()
        setPowerMetrics(data)
      } catch (error) {
        console.error('Failed to fetch power metrics:', error)
        setError('Fehler beim Laden der Stromzählerdaten')
      } finally {
        setLoadingStates(prev => ({ ...prev, powerMetrics: false }))
      }
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (!response.ok) throw new Error('Fehler beim Laden der Einstellungen')
        const data = await response.json()
        setPvSettings(data)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        setError('Fehler beim Laden der Einstellungen')
      } finally {
        setLoadingStates(prev => ({ ...prev, settings: false }))
      }
    }

    await Promise.all([
      fetchSensors(),
      fetchHeaters(),
      fetchSolar(),
      fetchSettings(),
      fetchPowerMetrics()
    ])
    setLastUpdate(new Date())
  }, [])

  const toggleHeater = async (id: number) => {
    if (autoMode) return

    try {
      const heater = heaters.find(h => h.id === id)
      const response = await fetch('/api/heaters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, state: !heater?.state })
      })

      if (!response.ok) throw new Error('Fehler beim Schalten des Heizstabs')

      const updatedData = await response.json()
      if (updatedData && updatedData.heaters) {
        setHeaters(updatedData.heaters)
      }
    } catch (error) {
      console.error('Failed to toggle heater:', error)
      setError('Fehler beim Schalten des Heizstabs')
    }
  }

  const toggleAutoMode = async () => {
    try {
      const response = await fetch('/api/auto-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !autoMode })
      })

      if (!response.ok) throw new Error('Fehler beim Umschalten des Auto-Modus')

      const data = await response.json()
      if (data && data.heaters) {
        setHeaters(data.heaters)
        setAutoMode(!!data.auto_mode)
      }
    } catch (error) {
      console.error('Failed to toggle auto mode:', error)
      setError('Fehler beim Umschalten des Auto-Modus')
    }
  }

  const updatePvSettings = async (key: keyof PVSettingsType, value: number) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Einstellungen');
      }

      const updatedSettings = await response.json();
      setPvSettings(updatedSettings);
      setError(null);
    } catch (error) {
      console.error('Failed to update setting:', error);
      setError('Fehler beim Speichern der Einstellung');
      throw error;
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastUserInteraction
      if (timeSinceLastInteraction >= 5000) {
        fetchData()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchData, lastUserInteraction])

  return (
      <div className="container mx-auto p-4">
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

        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
        )}

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