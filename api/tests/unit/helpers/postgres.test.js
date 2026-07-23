import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('pg', () => {
    const Pool = vi.fn();
    return {
        default: { Pool },
        Pool,
    };
});

const pg = (await import('pg')).default;
const Postgres = (await import('../../../helpers/postgres.js')).Postgres;

describe('Postgres helper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Postgres.connected = false;
        Postgres.connection = null;
    });

    test('connects with the configured pool', async () => {
        const pool = { query: vi.fn(), end: vi.fn() };
        pg.Pool.mockReturnValue(pool);

        await Postgres.connect();

        expect(pg.Pool).toHaveBeenCalled();
        expect(Postgres.connection).toBe(pool);
        expect(Postgres.connected).toBe(true);
    });

    test('builds parameterized insert statements with returning clause', async () => {
        const pool = { query: vi.fn().mockResolvedValue({ rows: [{ id: 1, name: 'Sample', description: 'Text' }] }) };
        Postgres.connection = pool;
        Postgres.connected = true;

        await Postgres.insert('items', { name: 'Sample', description: 'Text' });

        expect(pool.query).toHaveBeenCalledWith(
            'INSERT INTO "items" ("name","description") VALUES ($1,$2) RETURNING *',
            ['Sample', 'Text']
        );
    });

    test('builds find filters with safe positional placeholders', async () => {
        const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
        Postgres.connection = pool;
        Postgres.connected = true;

        await Postgres.find('items', {
            filter: {
                name: Postgres.like('amp'),
                id: Postgres.gte(1),
            },
            opt: {
                order: { id: -1 },
                limit: 5,
            },
        });

        expect(pool.query).toHaveBeenCalledWith(
            'SELECT * FROM "items" WHERE "name" LIKE $1 AND "id" >= $2 ORDER BY "id" DESC LIMIT 5',
            ['%amp%', 1]
        );
    });

    test('builds upsert statements with conflict updates', async () => {
        const pool = { query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }) };
        Postgres.connection = pool;
        Postgres.connected = true;

        await Postgres.upsert('items', {
            slug: 'sample',
            name: 'Sample',
            description: 'Text',
        }, {
            conflictFields: ['slug'],
            updateFields: ['name', 'description'],
        });

        expect(pool.query).toHaveBeenCalledWith(
            'INSERT INTO "items" ("slug","name","description") VALUES ($1,$2,$3) ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description" RETURNING *',
            ['sample', 'Sample', 'Text']
        );
    });

    test('supports multi-column ordering, row locks, and findOne', async () => {
        const pool = { query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }) };
        Postgres.connection = pool;
        Postgres.connected = true;

        const row = await Postgres.findOne('items', {
            filter: { id: 1 },
            opt: {
                order: { name: 1, id: -1 },
                forUpdate: true,
            },
        });

        expect(row.id).toBe(1);
        expect(pool.query).toHaveBeenCalledWith(
            'SELECT * FROM "items" WHERE "id" = $1 ORDER BY "name" ASC, "id" DESC LIMIT 1 FOR UPDATE',
            [1]
        );
    });

    test('supports raw update fragments without binding them as data', async () => {
        const pool = { query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }) };
        Postgres.connection = pool;
        Postgres.connected = true;

        await Postgres.update('items', {
            updated_at: Postgres.raw('NOW()'),
            name: 'Updated',
        }, 1);

        expect(pool.query).toHaveBeenCalledWith(
            'UPDATE "items" SET "updated_at" = NOW(), "name" = $1 WHERE "id" = $2 RETURNING *',
            ['Updated', 1]
        );
    });

    test('runs operations inside a transaction context', async () => {
        const client = {
            query: vi.fn().mockResolvedValue({ rows: [] }),
            release: vi.fn(),
        };
        const pool = {
            connect: vi.fn().mockResolvedValue(client),
        };
        Postgres.connection = pool;
        Postgres.connected = true;

        await Postgres.withTransaction(async context => {
            await Postgres.delete('items', { id: 1 }, {}, context);
        });

        expect(client.query).toHaveBeenCalledWith('BEGIN');
        expect(client.query).toHaveBeenCalledWith(
            'DELETE FROM "items" WHERE "id" = $1',
            [1]
        );
        expect(client.query).toHaveBeenCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalled();
    });

    test('rejects empty update data', async () => {
        await expect(Postgres.update('items', {}, 1)).rejects.toThrow('No data to update.');
    });
});
