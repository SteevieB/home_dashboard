// app/api/power-metrics/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = await getDb();

        const result = await db.get(`
            SELECT 
                aktuelle_leistung,
                verbrauch,
                einspeisung
            FROM power_metrics 
            ORDER BY timestamp DESC 
            LIMIT 1
        `);

        if (!result) {
            return NextResponse.json(
                {
                    aktuelle_leistung: 0,
                    verbrauch: 0,
                    einspeisung: 0,
                    error: 'Keine Daten verfügbar'
                },
                { status: 404 }
            );
        }

        // Format the response data
        const metrics = {
            aktuelle_leistung: Math.round(Number(result.aktuelle_leistung)),
            verbrauch: Number(result.verbrauch),
            einspeisung: Number(result.einspeisung)
        };

        return NextResponse.json(metrics);

    } catch (error) {
        console.error('Failed to fetch power metrics:', error);

        return NextResponse.json(
            {
                aktuelle_leistung: 0,
                verbrauch: 0,
                einspeisung: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}