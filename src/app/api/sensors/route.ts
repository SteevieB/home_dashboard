// app/api/sensors/route.ts
import { NextResponse } from 'next/server'
import { getLatestSensorData } from '@/lib/db'
import { SensorType } from '@/components/types'

export async function GET() {
    try {
        const sensorData = await getLatestSensorData();

        if (!sensorData) {
            return NextResponse.json({
                error: "Fehler beim Abrufen der Sensor-Daten"
            }, { status: 500 });
        }

        return NextResponse.json(sensorData);

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({
            error: "Interner Server-Fehler"
        }, { status: 500 });
    }
}