// app/api/sensors/route.ts
import { NextResponse } from 'next/server'

const sensorData = [
    { id: 1, name: "Boiler 1", temperature: 55.0 },
    { id: 2, name: "Boiler 2", temperature: 50.5 },
    { id: 3, name: "Wohnzimmer", temperature: 22.5 },
    { id: 4, name: "Schlafzimmer", temperature: 21.0 },
    { id: 5, name: "Küche", temperature: 23.5 },
]

export async function GET() {
    return NextResponse.json(sensorData)
}