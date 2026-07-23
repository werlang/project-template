import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Postgres } from '../helpers/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const LOCK_KEY = 987654321;

/**
 * Splits SQL script into individual non-empty statements.
 *
 * @param {string} sqlContent
 * @returns {string[]}
 */
export function splitSqlStatements(sqlContent) {
    return sqlContent
        .split(';')
        .map(stmt => stmt.replace(/--.*$/gm, '').trim())
        .filter(stmt => stmt.length > 0);
}

/**
 * Runs versioned database migrations.
 *
 * @returns {Promise<void>}
 */
export async function migrate() {
    await Postgres.connect();
    const pool = Postgres.connection;

    // Acquire PostgreSQL advisory lock to prevent concurrent migration runs
    await pool.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const { rows } = await pool.query('SELECT version FROM schema_migrations');
        const appliedVersions = new Set(rows.map(row => Number(row.version)));

        let files = [];
        try {
            files = await fs.readdir(MIGRATIONS_DIR);
        } catch {
            files = [];
        }

        const migrationFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        for (const file of migrationFiles) {
            const match = file.match(/^(\d+)_/);
            if (!match) continue;

            const version = parseInt(match[1], 10);
            if (appliedVersions.has(version)) {
                continue;
            }

            const filePath = path.join(MIGRATIONS_DIR, file);
            const sqlContent = await fs.readFile(filePath, 'utf-8');
            const statements = splitSqlStatements(sqlContent);

            console.log(`Applying migration ${file}...`);
            await Postgres.withTransaction(async ({ connection }) => {
                for (const statement of statements) {
                    await connection.query(statement);
                }
                await connection.query(
                    'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
                    [version, file]
                );
            });
            console.log(`Successfully applied migration ${file}.`);
        }
    } finally {
        await pool.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
    }
}

if (process.argv[1] === __filename) {
    migrate()
        .then(() => {
            console.log('Database migration completed successfully.');
            return Postgres.close();
        })
        .catch(async err => {
            console.error('Migration failed:', err);
            await Postgres.close();
            process.exit(1);
        });
}
