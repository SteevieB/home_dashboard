// SolarStatistics.tsx
import { Sun } from 'lucide-react'
import {SolarStatsType} from "@/components/types";
import {LoadingSpinner} from "@/components/ui/LoadingSpinner";

type SolarStatisticsProps = {
    stats: SolarStatsType
    isLoading: boolean
}

export const SolarStatistics = ({ stats, isLoading }: SolarStatisticsProps) => {
    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
          <span className="flex items-center">
            <Sun className="mr-2" size={20} />
            Aktuelle Leistung
          </span>
                    <span className="font-bold text-xl">
            {stats.currentPower} {stats.currentPowerUnit}
          </span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Tagesenergie</div>
                    <div className="font-bold text-lg">{stats.dailyEnergy} kWh</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Gesamtenergie</div>
                    <div className="font-bold text-lg">{stats.totalEnergy} kWh</div>
                </div>
            </div>
        </div>
    )
}