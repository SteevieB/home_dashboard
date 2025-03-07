// PVSettingsForm.tsx
import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PVSettingsType } from "@/components/types"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface PVSettingsFormProps {
    settings: PVSettingsType
    isLoading: boolean
    error?: string | null
    onUpdateSettings: (key: keyof PVSettingsType, value: number) => Promise<void>
    onUserInteraction?: () => void  // Neuer Callback für User-Interaktion
}

export const PVSettingsForm = ({
                                   settings,
                                   isLoading,
                                   error,
                                   onUpdateSettings,
                                   onUserInteraction
                               }: PVSettingsFormProps) => {
    const [localSettings, setLocalSettings] = useState(settings)
    const [updating, setUpdating] = useState<{ [key: string]: boolean }>({})
    const [lastUpdate, setLastUpdate] = useState<{ [key: string]: number }>({})

    useEffect(() => {
        setLocalSettings(settings)
    }, [settings])

    const handleValueChange = async (key: keyof PVSettingsType, value: string, isArrowKey = false) => {
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return

        setLocalSettings(prev => ({
            ...prev,
            [key]: value
        }))

        if (isArrowKey) {
            const now = Date.now()
            // Prüfe ob seit dem letzten Update mindestens 500ms vergangen sind
            if (!lastUpdate[key] || now - lastUpdate[key] >= 500) {
                await handleUpdate(key, numValue)
                setLastUpdate(prev => ({ ...prev, [key]: now }))
            }
        }
    }

    const handleUpdate = async (key: keyof PVSettingsType, value?: number) => {
        const updateValue = value ?? parseFloat(localSettings[key] as unknown as string)
        if (isNaN(updateValue)) {
            setLocalSettings(prev => ({ ...prev, [key]: settings[key] }))
            return
        }

        if (onUserInteraction) {
            onUserInteraction()
        }

        try {
            setUpdating(prev => ({ ...prev, [key]: true }))
            await onUpdateSettings(key, updateValue)
        } catch (error) {
            setLocalSettings(prev => ({ ...prev, [key]: settings[key] }))
        } finally {
            setUpdating(prev => ({ ...prev, [key]: false }))
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, key: keyof PVSettingsType) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur()
            handleUpdate(key)
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const currentValue = parseFloat(localSettings[key] as unknown as string) || 0
            const newValue = e.key === 'ArrowUp' ? currentValue + 1 : currentValue - 1
            handleValueChange(key, newValue.toString(), true)
        }
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                    {error}
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="minPower">Mindestleistung (kW)</Label>
                <Input
                    id="minPower"
                    type="number"
                    value={localSettings.minPower}
                    onChange={(e) => handleValueChange('minPower', e.target.value)}
                    onBlur={() => handleUpdate('minPower')}
                    onKeyDown={(e) => handleKeyDown(e, 'minPower')}
                    className={`w-full ${updating.minPower ? 'opacity-50' : ''}`}
                    disabled={updating.minPower}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="incrementPower">Leistungsinkrement (kW)</Label>
                <Input
                    id="incrementPower"
                    type="number"
                    value={localSettings.incrementPower}
                    onChange={(e) => handleValueChange('incrementPower', e.target.value)}
                    onBlur={() => handleUpdate('incrementPower')}
                    onKeyDown={(e) => handleKeyDown(e, 'incrementPower')}
                    className={`w-full ${updating.incrementPower ? 'opacity-50' : ''}`}
                    disabled={updating.incrementPower}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="maxTemp1">Max. Temp. Boiler 1 (°C)</Label>
                <Input
                    id="maxTemp1"
                    type="number"
                    value={localSettings.maxTemp1}
                    onChange={(e) => handleValueChange('maxTemp1', e.target.value)}
                    onBlur={() => handleUpdate('maxTemp1')}
                    onKeyDown={(e) => handleKeyDown(e, 'maxTemp1')}
                    className={`w-full ${updating.maxTemp1 ? 'opacity-50' : ''}`}
                    disabled={updating.maxTemp1}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="maxTemp2">Max. Temp. Boiler 2 (°C)</Label>
                <Input
                    id="maxTemp2"
                    type="number"
                    value={localSettings.maxTemp2}
                    onChange={(e) => handleValueChange('maxTemp2', e.target.value)}
                    onBlur={() => handleUpdate('maxTemp2')}
                    onKeyDown={(e) => handleKeyDown(e, 'maxTemp2')}
                    className={`w-full ${updating.maxTemp2 ? 'opacity-50' : ''}`}
                    disabled={updating.maxTemp2}
                />
            </div>
        </div>
    )
}