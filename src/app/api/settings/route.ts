// app/api/settings/route.ts
import { NextResponse } from 'next/server'

let pvSettings = {
    minPower: 3,
    incrementPower: 2,
    maxTemp1: 60,
    maxTemp2: 55
}

export async function GET() {
    return NextResponse.json(pvSettings)
}

export async function PATCH(request: Request) {
    const data = await request.json()
    pvSettings = { ...pvSettings, ...data }
    return NextResponse.json(pvSettings)
}