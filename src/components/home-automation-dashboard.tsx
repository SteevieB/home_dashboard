"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Sun, Droplet, Thermometer, RefreshCw } from 'lucide-react'

export default function HomeAutomationDashboard() {
  const [sensors, setSensors] = useState([])
  const [heaters, setHeaters] = useState([])
  const [solarStats, setSolarStats] = useState({
    currentPower: 0,
    dailyEnergy: 0,
    totalEnergy: 0
  })
  const [pvSettings, setPvSettings] = useState({
    minPower: 5,
    incrementPower: 2,
    maxTemp1: 60,
    maxTemp2: 55
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>()

  const fetchData = useCallback(async () => {
    try {
      const [sensorsRes, heatersRes, solarRes, settingsRes] = await Promise.all([
        fetch('/api/sensors'),
        fetch('/api/heaters'),
        fetch('/api/solar'),
        fetch('/api/settings')
      ])

      const [sensorsData, heatersData, solarData, settingsData] = await Promise.all([
        sensorsRes.json(),
        heatersRes.json(),
        solarRes.json(),
        settingsRes.json()
      ])

      setSensors(sensorsData)
      setHeaters(heatersData)
      setSolarStats(solarData)
      setPvSettings(settingsData)
      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }, [])

  // Initial load and auto-refresh
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const toggleHeater = async (id: number) => {
    try {
      const heater = heaters.find(h => h.id === id)
      const response = await fetch('/api/heaters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, state: !heater?.state })
      })

      if (response.ok) {
        const updatedHeaters = await response.json()
        setHeaters(updatedHeaters)
      }
    } catch (error) {
      console.error('Failed to toggle heater:', error)
    }
  }

  const updatePvSettings = async (setting: string, value: number) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [setting]: value })
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setPvSettings(updatedSettings)
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
        </div>
    )
  }

  return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Hausautomatisierungs-Dashboard</h1>
          <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Letztes Update: {lastUpdate?.toLocaleTimeString()}
          </span>
            <Button
                onClick={fetchData}
                className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4"/>
              Aktualisieren
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Temperatursensoren */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Temperatursensoren</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sensor</TableHead>
                    <TableHead>Temperatur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sensors.map((sensor) => (  // Changed from sensorData to sensors
                      <TableRow key={sensor.id}>
                        <TableCell>{sensor.name}</TableCell>
                        <TableCell>{sensor.temperature}°C</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Warmwasserbereiter-Steuerung */}
          <Card>
            <CardHeader>
              <CardTitle>Warmwasserbereiter-Steuerung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {heaters.map((heater) => (
                    <div key={heater.id} className="flex items-center justify-between">
                      <span>{heater.name}</span>
                      <Switch
                          checked={heater.state}
                          onCheckedChange={() => toggleHeater(heater.id)}
                      />
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Solaranlagen-Statistiken */}
          <Card>
            <CardHeader>
              <CardTitle>Solaranlagen-Statistiken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Sun className="mr-2" size={20}/>
                  Aktuelle Leistung
                </span>
                  <span className="font-bold">{solarStats.currentPower} kW</span>
                </div>
                <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Sun className="mr-2" size={20}/>
                  Tagesenergie
                </span>
                  <span className="font-bold">{solarStats.dailyEnergy} kWh</span>
                </div>
                <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Sun className="mr-2" size={20}/>
                  Gesamtenergie
                </span>
                  <span className="font-bold">{solarStats.totalEnergy} kWh</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PV-Steuerungseinstellungen */}
          <Card>
            <CardHeader>
              <CardTitle>PV-Steuerungseinstellungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Mindestleistung (kW)</span>
                  <input
                      type="number"
                      value={pvSettings.minPower}
                      onChange={(e) => updatePvSettings('minPower', parseFloat(e.target.value))}
                      className="w-20 p-1 border rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Leistungsinkrement (kW)</span>
                  <input
                      type="number"
                      value={pvSettings.incrementPower}
                      onChange={(e) => updatePvSettings('incrementPower', parseFloat(e.target.value))}
                      className="w-20 p-1 border rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Max. Temp. Boiler 1 (°C)</span>
                  <input
                      type="number"
                      value={pvSettings.maxTemp1}
                      onChange={(e) => updatePvSettings('maxTemp1', parseFloat(e.target.value))}
                      className="w-20 p-1 border rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Max. Temp. Boiler 2 (°C)</span>
                  <input
                      type="number"
                      value={pvSettings.maxTemp2}
                      onChange={(e) => updatePvSettings('maxTemp2', parseFloat(e.target.value))}
                      className="w-20 p-1 border rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}