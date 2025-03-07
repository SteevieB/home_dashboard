// SensorTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {SensorType} from "@/components/types";
import {LoadingSpinner} from "@/components/ui/LoadingSpinner";

type SensorTableProps = {
  sensors: SensorType[]
  isLoading: boolean
}

export const SensorTable = ({ sensors, isLoading }: SensorTableProps) => {
  if (isLoading) return <LoadingSpinner />

  return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sensor</TableHead>
            <TableHead>Temperatur</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sensors.map((sensor) => (
              <TableRow key={sensor.id}>
                <TableCell>{sensor.name}</TableCell>
                <TableCell>{sensor.temperature}°C</TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>
  )
}