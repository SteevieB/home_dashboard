// app/api/solar/route.ts
import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
    try {
        // Execute Python script and get output
        const { stdout } = await execAsync('python src/scripts/piko_scraper.py --once')
        const data = JSON.parse(stdout)
        return NextResponse.json(data)
    } catch (error) {
        console.error('Failed to fetch solar data:', error)
        return NextResponse.json({
            currentPower: 0,
            dailyEnergy: 0,
            totalEnergy: 0,
            error: 'Failed to fetch solar data'
        }, { status: 500 })
    }
}