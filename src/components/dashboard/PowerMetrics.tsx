// PowerMetrics.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type PowerMetricsType = {
    aktuelle_leistung: number;
    verbrauch: number;
    einspeisung: number;
}

type PowerMetricsProps = {
    data: PowerMetricsType;
    isLoading: boolean;
}

export const PowerMetrics = ({ data, isLoading }: PowerMetricsProps) => {
    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
          <span className="flex items-center">
            <Zap className="mr-2" size={20} />
            Aktueller Verbrauch
          </span>
                    <span className="font-bold text-xl">
            {Math.abs(data.aktuelle_leistung)} W
          </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-sm text-gray-600">
                        <ArrowDownRight className="mr-1 text-red-500" size={16} />
                        Verbrauch
                    </div>
                    <div className="font-bold text-lg">{data.verbrauch.toFixed(2)} kWh</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-sm text-gray-600">
                        <ArrowUpRight className="mr-1 text-green-500" size={16} />
                        Einspeisung
                    </div>
                    <div className="font-bold text-lg">{data.einspeisung.toFixed(2)} kWh</div>
                </div>
            </div>
        </div>
    );
};

export default PowerMetrics;