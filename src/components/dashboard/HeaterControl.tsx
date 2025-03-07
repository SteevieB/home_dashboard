import { Switch } from "@/components/ui/switch"
import { HeaterType } from "@/components/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type HeaterControlProps = {
    heaters: HeaterType[]
    autoMode: boolean
    isLoading: boolean
    error: string | null
    onToggleHeater: (id: number) => void
    onToggleAutoMode: () => void
}

export const HeaterControl = ({
                                  heaters,
                                  autoMode,
                                  isLoading,
                                  error,
                                  onToggleHeater,
                                  onToggleAutoMode
                              }: HeaterControlProps) => {
    if (isLoading) return <LoadingSpinner />

    // Gruppiere Heizstäbe nach ihrer Nummer
    const heater1 = heaters.filter(h => h.id <= 3)
    const heater2 = heaters.filter(h => h.id > 3)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <span>Automatische Steuerung</span>
                <Switch
                    checked={autoMode}
                    onCheckedChange={onToggleAutoMode}
                />
            </div>

            {autoMode && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md mb-4">
                    Automatische Steuerung ist aktiv. Manuelle Steuerung ist deaktiviert.
                </div>
            )}

            <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Heizstab 1</h3>
                    <div className="space-y-3">
                        {heater1.map((heater) => (
                            <div key={heater.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <span>{heater.name.replace('Heizstab 1 - ', '')}</span>
                                <Switch
                                    checked={heater.state}
                                    onCheckedChange={() => onToggleHeater(heater.id)}
                                    disabled={autoMode}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Heizstab 2</h3>
                    <div className="space-y-3">
                        {heater2.map((heater) => (
                            <div key={heater.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <span>{heater.name.replace('Heizstab 2 - ', '')}</span>
                                <Switch
                                    checked={heater.state}
                                    onCheckedChange={() => onToggleHeater(heater.id)}
                                    disabled={autoMode}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}