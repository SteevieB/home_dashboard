// types.ts
export type HeaterType = {
    id: number
    name: string
    state: boolean
}

export type SensorType = {
    id: number
    name: string
    temperature: number
}

export type PVSettingsType = {
    minPower: number
    incrementPower: number
    maxTemp1: number
    maxTemp2: number
}

export type SolarStatsType = {
    currentPower: number
    currentPowerUnit: string
    dailyEnergy: number
    totalEnergy: number
}