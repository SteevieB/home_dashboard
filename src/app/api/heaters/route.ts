// app/api/heaters/route.ts
import { NextResponse } from 'next/server'

let waterHeaters = [
    { id: 1, name: "Warmwasserbereiter 1", state: false },
    { id: 2, name: "Warmwasserbereiter 2", state: false },
    { id: 3, name: "Warmwasserbereiter 3", state: false },
    { id: 4, name: "Warmwasserbereiter 4", state: false },
    { id: 5, name: "Warmwasserbereiter 5", state: false },
    { id: 6, name: "Warmwasserbereiter 6", state: false },
]

export async function GET() {
    return NextResponse.json(waterHeaters)
}

export async function PATCH(request: Request) {
    const data = await request.json()
    waterHeaters = waterHeaters.map(heater =>
        heater.id === data.id ? { ...heater, state: data.state } : heater
    )
    return NextResponse.json(waterHeaters)
}