import useSWR from 'swr';
import { HeaterType, SensorType, PVSettingsType, SolarStatsType } from '@/components/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useSensors() {
    return useSWR<SensorType[]>('/api/sensors', fetcher, {
        refreshInterval: 10000,
        dedupingInterval: 5000
    });
}

interface HeaterResponse {
    heaters: HeaterType[];
    auto_mode: boolean;
}

export function useHeaters() {
    return useSWR<HeaterResponse>('/api/heaters', fetcher, {
        refreshInterval: 10000,
        dedupingInterval: 5000
    });
}

export function useSolarStats() {
    return useSWR<SolarStatsType>('/api/solar', fetcher, {
        refreshInterval: 10000,
        dedupingInterval: 5000
    });
}

export function usePowerMetrics() {
    return useSWR<{
        aktuelle_leistung: number;
        verbrauch: number;
        einspeisung: number;
    }>('/api/power-metrics', fetcher, {
        refreshInterval: 10000,
        dedupingInterval: 5000
    });
}

export function useSettings() {
    return useSWR<PVSettingsType>('/api/settings', fetcher, {
        refreshInterval: 60000,
        dedupingInterval: 30000
    });
}