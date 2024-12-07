"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Sun, Droplet, Thermometer } from 'lucide-react'

// Mock-Daten für die Demonstration
const sensorData = [
  { id: 1, name: "Boiler 1", temperature: 55.0 },
  { id: 2, name: "Boiler 2", temperature: 50.5 },
  { id: 3, name: "Wohnzimmer", temperature: 22.5 },
  { id: 4, name: "Schlafzimmer", temperature: 21.0 },
  { id: 5, name: "Küche", temperature: 23.5 },
]

const waterHeaters = [
  { id: 1, name: "Warmwasserbereiter 1", state: false },
  { id: 2, name: "Warmwasserbereiter 2", state: false },
  { id: 3, name: "Warmwasserbereiter 3", state: false },
  { id: 4, name: "Warmwasserbereiter 4", state: false },
  { id: 5, name: "Warmwasserbereiter 5", state: false },
  { id: 6, name: "Warmwasserbereiter 6", state: false },
]

const solarStats = {
  currentPower: 3.2,
  dailyEnergy: 18.5,
  totalEnergy: 1250,
}

export default function HomeAutomationDashboard() {
  const [heaters, setHeaters] = useState(waterHeaters)
  const [pvSettings, setPvSettings] = useState({
    minPower: 5,
    incrementPower: 2,
    maxTemp1: 60,
    maxTemp2: 55
  })

  const toggleHeater = (id: number) => {
    setHeaters(heaters.map(heater => 
      heater.id === id ? { ...heater, state: !heater.state } : heater
    ))
  }

  const updatePvSettings = (setting: string, value: number) => {
    setPvSettings(prev => ({ ...prev, [setting]: value }))
  }

  useEffect(() => {
    const activeHeaters = Math.floor((solarStats.currentPower - pvSettings.minPower) / pvSettings.incrementPower)
    const newHeaters = heaters.map((heater, index) => ({
      ...heater,
      state: index < activeHeaters && 
        (index < 3 ? sensorData[0].temperature < pvSettings.maxTemp1 : sensorData[1].temperature < pvSettings.maxTemp2)
    }))
    setHeaters(newHeaters)
  }, [solarStats.currentPower, pvSettings, sensorData])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Hausautomatisierungs-Dashboard</h1>
      
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
                {sensorData.map((sensor) => (
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
                  <Sun className="mr-2" size={20} />
                  Aktuelle Leistung
                </span>
                <span className="font-bold">{solarStats.currentPower} kW</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Sun className="mr-2" size={20} />
                  Tagesenergie
                </span>
                <span className="font-bold">{solarStats.dailyEnergy} kWh</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Sun className="mr-2" size={20} />
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

