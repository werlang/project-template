import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Mysql } from '../../../helpers/mysql.js';
import { migrate, splitSqlStatements } from '../../../scripts/migrate.js';

describe('Migrate Script', () => {
    let mockPool;

    beforeEach(() => {
        mockPool = {
            query: vi.fn().mockImplementation(async (sql) => {
                if (sql.includes('SELECT version FROM schema_migrations')) {
                    return [[{ version: 1 }]];
                }
                return [[]];
            }),
        };
        vi.spyOn(Mysql, 'connect').mockResolvedValue(Mysql);
        Mysql.connection = mockPool;
        vi.spyOn(Mysql, 'withTransaction').mockImplementation(async (fn) => {
            await fn({ connection: mockPool });
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('splits SQL statements correctly', () => {
        const sql = `
            -- Header comment
            CREATE TABLE foo (id INT);
            -- Mid comment
            INSERT INTO foo VALUES (1);
        `;
        const statements = splitSqlStatements(sql);
        expect(statements).toEqual([
            'CREATE TABLE foo (id INT)',
            'INSERT INTO foo VALUES (1)',
        ]);
    });

    it('acquires advisory lock, creates schema_migrations, applies pending migrations, and releases lock', async () => {
        await migrate();

        expect(mockPool.query).toHaveBeenCalledWith('SELECT GET_LOCK(?, ?)', ['schema_migrations_lock', 10]);
        expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_migrations'));
        expect(mockPool.query).toHaveBeenCalledWith('SELECT RELEASE_LOCK(?)', ['schema_migrations_lock']);
    });
});
