// lib/db.ts
import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import { HeaterType, SensorType, PVSettingsType, SolarStatsType } from '@/components/types'

// Database connection pool
let db: Database | null = null;
let dbInitialized = false;

// In-memory cache
const CACHE_TTL = 5000; // 5 seconds
const cache: {[key: string]: {data: unknown, timestamp: number}} = {};

/**
 * Get database connection with optimized settings
 */
export async function getDb() {
    if (db) {
        return db;
    }

    db = await open({
        filename: path.join(process.cwd(), 'src', '..', 'data', 'test.db'),
        driver: sqlite3.Database
    });

    // Optimize database settings if not done yet
    if (!dbInitialized) {
        // Performance optimizations
        await db.exec('PRAGMA journal_mode = WAL;'); // Write-Ahead Logging for better concurrency
        await db.exec('PRAGMA synchronous = NORMAL;'); // Less sync to disk
        await db.exec('PRAGMA cache_size = 10000;'); // Larger cache
        await db.exec('PRAGMA temp_store = MEMORY;'); // Store temp tables and indices in memory

        // Create indexes for commonly queried tables
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_heater_states_timestamp ON heater_states(timestamp);
            CREATE INDEX IF NOT EXISTS idx_boiler_temps_timestamp ON boiler_temps(timestamp);
            CREATE INDEX IF NOT EXISTS idx_pv_power_timestamp ON pv_power(timestamp);
            CREATE INDEX IF NOT EXISTS idx_power_metrics_timestamp ON power_metrics(timestamp);
        `);

        // Initialize settings table
        await initializeSettingsTable(db);

        dbInitialized = true;
    }

    return db;
}

/**
 * Initialize settings table with default values
 */
async function initializeSettingsTable(db: Database) {
    // Create settings table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value REAL NOT NULL,
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Insert default values if they don't exist
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

/**
 * Close database connection
 */
export async function closeDb() {
    if (db) {
        await db.close();
        db = null;
        dbInitialized = false;
    }
}

/**
 * Get cached data or fetch fresh data
 */
async function getCachedData<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cachedItem = cache[cacheKey];

    if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
        return cachedItem.data as T;
    }

    const data = await fetchFn();
    cache[cacheKey] = { data, timestamp: now };
    return data;
}

// Settings Operations
export async function getSettings(): Promise<PVSettingsType> {
    try {
        return await getCachedData('settings', async () => {
            const db = await getDb();
            const settings = await db.all('SELECT key, value FROM settings');

            // Convert array of entries to object
            return settings.reduce((acc, curr) => ({
                ...acc,
                [curr.key]: curr.value
            }), {} as PVSettingsType);
        });
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
            await db.run(`
                    UPDATE settings
                    SET value = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE key = ?
                `, [value, key]);
        }

        await db.run('COMMIT');

        // Invalidate cache
        delete cache['settings'];

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
        return await getCachedData('heaterStates', async () => {
            const db = await getDb();

            // Optimized query with LIMIT before ORDER BY
            const result = await db.get(`
                SELECT * FROM (
                    SELECT * FROM heater_states
                    ORDER BY timestamp DESC
                    LIMIT 1
                )
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
        });
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

        // Optimized query - only update the changed column
        await db.run(`
            INSERT INTO heater_states (
                timestamp,
                heater1_phase1,
                heater1_phase2,
                heater1_phase3,
                heater2_phase1,
                heater2_phase2,
                heater2_phase3
            )
            SELECT
                datetime('now'),
                CASE WHEN '${column}' = 'heater1_phase1' THEN ? ELSE heater1_phase1 END,
                CASE WHEN '${column}' = 'heater1_phase2' THEN ? ELSE heater1_phase2 END,
                CASE WHEN '${column}' = 'heater1_phase3' THEN ? ELSE heater1_phase3 END,
                CASE WHEN '${column}' = 'heater2_phase1' THEN ? ELSE heater2_phase1 END,
                CASE WHEN '${column}' = 'heater2_phase2' THEN ? ELSE heater2_phase2 END,
                CASE WHEN '${column}' = 'heater2_phase3' THEN ? ELSE heater2_phase3 END
            FROM heater_states
            ORDER BY timestamp DESC
            LIMIT 1
        `, [state ? 1 : 0, state ? 1 : 0, state ? 1 : 0, state ? 1 : 0, state ? 1 : 0, state ? 1 : 0]);

        // Invalidate cache
        delete cache['heaterStates'];

        return true;
    } catch (error) {
        console.error('Database error:', error);
        return false;
    }
}

// Sensor Operations
// Cached static sensor data
const staticSensorData: SensorType[] = [
    { id: 3, name: "Wohnzimmer", temperature: 22.5 },
    { id: 4, name: "Schlafzimmer", temperature: 21.0 },
    { id: 5, name: "Küche", temperature: 23.5 },
];

export async function getLatestSensorData(): Promise<SensorType[] | null> {
    try {
        return await getCachedData('sensorData', async () => {
            const db = await getDb();

            // Optimized query
            const result = await db.get(`
                SELECT boiler1_temp, boiler2_temp FROM (
                    SELECT boiler1_temp, boiler2_temp
                    FROM boiler_temps
                    ORDER BY timestamp DESC
                    LIMIT 1
                )
            `);

            if (!result) {
                return null;
            }

            const boilerData: SensorType[] = [
                { id: 1, name: "Boiler 1", temperature: result.boiler1_temp },
                { id: 2, name: "Boiler 2", temperature: result.boiler2_temp }
            ];

            // Combine boiler data with static sensor data
            return [...boilerData, ...staticSensorData];
        });
    } catch (error) {
        console.error('Database error:', error);
        return null;
    }
}

// Solar Operations
export async function getLatestSolarStats(): Promise<SolarStatsType | null> {
    try {
        return await getCachedData('solarStats', async () => {
            const db = await getDb();

            // Optimized query using a subquery
            const latestPower = await db.get(`
                WITH daily_sum AS (
                    SELECT SUM(power_kw) / 60.0 as daily_energy
                    FROM pv_power 
                    WHERE DATE(timestamp) = DATE('now', 'localtime')
                ),
                total_sum AS (
                    SELECT SUM(power_kw) / 60.0 as total_energy
                    FROM pv_power
                ),
                latest AS (
                    SELECT power_kw, timestamp
                    FROM pv_power 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                )
                SELECT 
                    latest.power_kw,
                    latest.timestamp,
                    daily_sum.daily_energy,
                    total_sum.total_energy
                FROM latest, daily_sum, total_sum
            `);

            if (!latestPower) {
                return null;
            }

            return {
                currentPower: latestPower.power_kw * 1000, // Convert kW to W
                currentPowerUnit: 'W',
                dailyEnergy: Number(latestPower.daily_energy.toFixed(2)),
                totalEnergy: Number(latestPower.total_energy.toFixed(2))
            };
        });
    } catch (error) {
        console.error('Database error:', error);
        return null;
    }
}

// Power Metrics
export async function getLatestPowerMetrics() {
    try {
        return await getCachedData('powerMetrics', async () => {
            const db = await getDb();

            const result = await db.get(`
                SELECT 
                    aktuelle_leistung,
                    verbrauch,
                    einspeisung
                FROM (
                    SELECT *
                    FROM power_metrics 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                )
            `);

            if (!result) {
                return {
                    aktuelle_leistung: 0,
                    verbrauch: 0,
                    einspeisung: 0
                };
            }

            return {
                aktuelle_leistung: Math.round(Number(result.aktuelle_leistung)),
                verbrauch: Number(result.verbrauch),
                einspeisung: Number(result.einspeisung)
            };
        });
    } catch (error) {
        console.error('Failed to fetch power metrics:', error);
        return {
            aktuelle_leistung: 0,
            verbrauch: 0,
            einspeisung: 0
        };
    }
}