// app/api/settings/route.ts
import { NextResponse } from 'next/server'
import { getSettings, updateSettings } from '@/lib/db'
import { PVSettingsType } from '@/components/types'

export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const updates = await request.json() as Partial<PVSettingsType>;

        // Validierung der Eingabewerte
        for (const [key, value] of Object.entries(updates)) {
            if (typeof value !== 'number') {
                return NextResponse.json(
                    { error: `Invalid value for ${key}: must be a number` },
                    { status: 400 }
                );
            }
        }

        const success = await updateSettings(updates);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to update settings' },
                { status: 500 }
            );
        }

        const updatedSettings = await getSettings();
        return NextResponse.json(updatedSettings);

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}