// app/api/heaters/route.ts
import { NextResponse } from 'next/server'
import { getLatestHeaterStates, updateHeaterState } from '@/lib/db'
import { HeaterType } from '@/components/types'

interface HeaterUpdateRequest {
    id: number;
    state: boolean;
}

interface HeaterResponse {
    heaters: HeaterType[];
    auto_mode: boolean;
}

export async function GET() {
    try {
        const heaterStates = await getLatestHeaterStates();

        if (!heaterStates) {
            return NextResponse.json({
                error: "Fehler beim Abrufen der Heizstab-Zustände"
            }, { status: 500 });
        }

        const response: HeaterResponse = {
            heaters: heaterStates,
            auto_mode: false
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({
            error: "Interner Server-Fehler"
        }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const data = await request.json() as HeaterUpdateRequest;

        if (typeof data.id !== 'number' || typeof data.state !== 'boolean') {
            return NextResponse.json({
                error: "Ungültige Eingabedaten"
            }, { status: 400 });
        }

        const success = await updateHeaterState(data.id, data.state);

        if (!success) {
            return NextResponse.json({
                error: "Fehler beim Aktualisieren des Heizstab-Zustands"
            }, { status: 500 });
        }

        const updatedStates = await getLatestHeaterStates();

        if (!updatedStates) {
            return NextResponse.json({
                error: "Fehler beim Abrufen der aktualisierten Zustände"
            }, { status: 500 });
        }

        const response: HeaterResponse = {
            heaters: updatedStates,
            auto_mode: false
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({
            error: "Interner Server-Fehler"
        }, { status: 500 });
    }
}