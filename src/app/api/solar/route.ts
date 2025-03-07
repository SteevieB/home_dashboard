// app/api/solar/route.ts
import { NextResponse } from 'next/server'
import { getLatestSolarStats } from '@/lib/db'
import { SolarStatsType } from '@/components/types'

export async function GET() {
    try {
        const solarStats = await getLatestSolarStats();

        if (!solarStats) {
            // Fallback-Werte wenn keine Daten verfügbar
            const errorData: SolarStatsType = {
                currentPower: 0,
                currentPowerUnit: 'W',
                dailyEnergy: 0,
                totalEnergy: 0
            };
            return NextResponse.json({ ...errorData, error: 'Keine Daten verfügbar' }, { status: 404 });
        }

        return NextResponse.json(solarStats);

    } catch (error) {
        console.error('Failed to fetch solar data:', error);

        const errorData: SolarStatsType = {
            currentPower: 0,
            currentPowerUnit: 'W',
            dailyEnergy: 0,
            totalEnergy: 0
        };

        return NextResponse.json(
            {
                ...errorData,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}