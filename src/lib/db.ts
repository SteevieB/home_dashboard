// lib/db.ts
import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import { HeaterType, SensorType, PVSettingsType, SolarStatsType } from '@/components/types'

let db: Database | null = null;

export async function getDb() {
    if (db) {
        return db;
    }

    db = await open({
        filename: path.join(process.cwd(), 'src', '..', 'data', 'test.db'),
        driver: sqlite3.Database
    });

    // Initialize settings table if needed
    await initializeSettingsTable(db);

    return db;
}

async function initializeSettingsTable(db: Database) {
    // Erstellen der Settings-Tabelle, falls nicht vorhanden
    await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
                                                key TEXT PRIMARY KEY,
                                                value REAL NOT NULL,
                                                description TEXT,
                                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Default-Werte einfügen, falls nicht vorhanden
    const defaultSettings = [
        { key: 'minPower', value: 3, description: 'Minimale PV-Leistung in kW' },
        { key: 'incrementPower', value: 2, description: 'Leistungsinkrement in kW' },
        { key: 'maxTemp1', value: 60, description: 'Maximale Temperatur Boiler 1 in °C' },
        { key: 'maxTemp2', value: 55, description: 'Maximale Temperatur Boiler 2 in °C' }
    ];

    for (const setting of defaultSettings) {
        await db.run(`
            INSERT OR IGNORE INTO settings (key, value, description)
            VALUES (?, ?, ?)
        `, [setting.key, setting.value, setting.description]);
    }
}

export async function closeDb() {
    if (db) {
        await db.close();
        db = null;
    }
}

// Settings Operations
export async function getSettings(): Promise<PVSettingsType> {
    try {
        const db = await getDb();
        const settings = await db.all('SELECT key, value FROM settings');

        // Konvertiere Array von Einträgen in ein Objekt
        return settings.reduce((acc, curr) => ({
            ...acc,
            [curr.key]: curr.value
        }), {} as PVSettingsType);

    } catch (error) {
        console.error('Error fetching settings:', error);
        throw error;
    }
}

export async function updateSettings(updates: Partial<PVSettingsType>): Promise<boolean> {
    try {
        const db = await getDb();
        await db.run('BEGIN TRANSACTION');

        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === 'number') {
                await db.run(`
                    UPDATE settings
                    SET value = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE key = ?
                `, [value, key]);
            }
        }

        await db.run('COMMIT');
        return true;

    } catch (error) {
        const db = await getDb();
        await db.run('ROLLBACK');
        console.error('Error updating settings:', error);
        return false;
    }
}

// Heater Operations
export async function getLatestHeaterStates(): Promise<HeaterType[] | null> {
    try {
        const db = await getDb();
        const result = await db.get(`
            SELECT * FROM heater_states
            ORDER BY timestamp DESC
                LIMIT 1
        `);

        if (!result) {
            return null;
        }

        return [
            { id: 1, name: "Heizstab 1 - Phase 1", state: Boolean(result.heater1_phase1) },
            { id: 2, name: "Heizstab 1 - Phase 2", state: Boolean(result.heater1_phase2) },
            { id: 3, name: "Heizstab 1 - Phase 3", state: Boolean(result.heater1_phase3) },
            { id: 4, name: "Heizstab 2 - Phase 1", state: Boolean(result.heater2_phase1) },
            { id: 5, name: "Heizstab 2 - Phase 2", state: Boolean(result.heater2_phase2) },
            { id: 6, name: "Heizstab 2 - Phase 3", state: Boolean(result.heater2_phase3) }
        ];
    } catch (error) {
        console.error('Database error:', error);
        return null;
    }
}

export async function updateHeaterState(id: number, state: boolean): Promise<boolean> {
    try {
        const db = await getDb();
        const columnMapping: { [key: number]: string } = {
            1: 'heater1_phase1',
            2: 'heater1_phase2',
            3: 'heater1_phase3',
            4: 'heater2_phase1',
            5: 'heater2_phase2',
            6: 'heater2_phase3'
        };

        const column = columnMapping[id];
        if (!column) {
            throw new Error('Ungültige Heizstab-ID');
        }

        await db.run(`
            INSERT INTO heater_states (
                timestamp,
                ${column},
                heater1_phase1,
                heater1_phase2,
                heater1_phase3,
                heater2_phase1,
                heater2_phase2,
                heater2_phase3
            )
            SELECT
                datetime('now'),
                ?,
                COALESCE(CASE WHEN '${column}' = 'heater1_phase1' THEN ? ELSE heater1_phase1 END, 0),
                COALESCE(CASE WHEN '${column}' = 'heater1_phase2' THEN ? ELSE heater1_phase2 END, 0),
                COALESCE(CASE WHEN '${column}' = 'heater1_phase3' THEN ? ELSE heater1_phase3 END, 0),
                COALESCE(CASE WHEN '${column}' = 'heater2_phase1' THEN ? ELSE heater2_phase1 END, 0),
                COALESCE(CASE WHEN '${column}' = 'heater2_phase2' THEN ? ELSE heater2_phase2 END, 0),
                COALESCE(CASE WHEN '${column}' = 'heater2_phase3' THEN ? ELSE heater2_phase3 END, 0)
            FROM heater_states
            ORDER BY timestamp DESC
                LIMIT 1
        `, [state ? 1 : 0, state ? 1 : 0, state ? 1 : 0, state ? 1 : 0, state ? 1 : 0, state ? 1 : 0, state ? 1 : 0]);

        return true;
    } catch (error) {
        console.error('Database error:', error);
        return false;
    }
}

// Sensor Operations
const staticSensorData: SensorType[] = [
    { id: 3, name: "Wohnzimmer", temperature: 22.5 },
    { id: 4, name: "Schlafzimmer", temperature: 21.0 },
    { id: 5, name: "Küche", temperature: 23.5 },
];

export async function getLatestSensorData(): Promise<SensorType[] | null> {
    try {
        const db = await getDb();
        const result = await db.get(`
            SELECT boiler1_temp, boiler2_temp
            FROM boiler_temps
            ORDER BY timestamp DESC
                LIMIT 1
        `);

        if (!result) {
            return null;
        }

        const boilerData: SensorType[] = [
            { id: 1, name: "Boiler 1", temperature: result.boiler1_temp },
            { id: 2, name: "Boiler 2", temperature: result.boiler2_temp }
        ];

        // Kombiniere Boiler-Daten mit statischen Sensor-Daten
        return [...boilerData, ...staticSensorData];


    } catch (error) {
        console.error('Database error:', error);
        return null;
    }
}

// Solar Operations
export async function getLatestSolarStats(): Promise<SolarStatsType | null> {
    try {
        const db = await getDb();

        const latestPower = await db.get(`
            SELECT 
                power_kw,
                timestamp,
                (
                    SELECT SUM(power_kw) / 60.0  -- Umrechnung von kW pro Minute in kWh
                    FROM pv_power 
                    WHERE DATE(timestamp) = DATE('now', 'localtime')
                ) as daily_energy,
                (
                    SELECT SUM(power_kw) / 60.0  -- Gesamtenergie in kWh
                    FROM pv_power
                ) as total_energy
            FROM pv_power 
            ORDER BY timestamp DESC 
            LIMIT 1
        `);

        if (!latestPower) {
            return null;
        }

        return {
            currentPower: latestPower.power_kw * 1000, // Umrechnung von kW in W
            currentPowerUnit: 'W',
            dailyEnergy: Number(latestPower.daily_energy.toFixed(2)),
            totalEnergy: Number(latestPower.total_energy.toFixed(2))
        };

    } catch (error) {
        console.error('Database error:', error);
        return null;
    }
}
