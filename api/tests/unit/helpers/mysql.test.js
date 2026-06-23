import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('mysql2/promise', () => ({
    default: {
        createPool: vi.fn(),
    },
}));

const mysql = (await import('mysql2/promise')).default;
const Mysql = (await import('../../../helpers/mysql.js')).Mysql;

describe('Mysql helper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Mysql.connected = false;
        Mysql.connection = null;
    });

    test('connects with the configured pool', async () => {
        const pool = { execute: vi.fn(), end: vi.fn() };
        mysql.createPool.mockReturnValue(pool);

        await Mysql.connect();

        expect(mysql.createPool).toHaveBeenCalled();
        expect(Mysql.connection).toBe(pool);
        expect(Mysql.connected).toBe(true);
    });

    test('builds parameterized insert statements', async () => {
        const pool = { execute: vi.fn().mockResolvedValue([{ insertId: 1 }]) };
        Mysql.connection = pool;
        Mysql.connected = true;

        await Mysql.insert('items', { name: 'Sample', description: 'Text' });

        expect(pool.execute).toHaveBeenCalledWith(
            'INSERT INTO `items` (`name`,`description`) VALUES (?,?)',
            ['Sample', 'Text']
        );
    });

    test('builds find filters with safe placeholders', async () => {
        const pool = { execute: vi.fn().mockResolvedValue([[]]) };
        Mysql.connection = pool;
        Mysql.connected = true;

        await Mysql.find('items', {
            filter: {
                name: Mysql.like('amp'),
                id: Mysql.gte(1),
            },
            opt: {
                order: { id: -1 },
                limit: 5,
            },
        });

        expect(pool.execute).toHaveBeenCalledWith(
            'SELECT * FROM `items` WHERE `name` LIKE ? AND `id` >= ? ORDER BY `id` DESC LIMIT 5',
            ['%amp%', 1]
        );
    });

    test('builds upsert statements with duplicate-key updates', async () => {
        const pool = { execute: vi.fn().mockResolvedValue([{ affectedRows: 1 }]) };
        Mysql.connection = pool;
        Mysql.connected = true;

        await Mysql.upsert('items', {
            slug: 'sample',
            name: 'Sample',
            description: 'Text',
        }, {
            conflictFields: ['slug'],
            updateFields: ['name', 'description'],
        });

        expect(pool.execute).toHaveBeenCalledWith(
            'INSERT INTO `items` (`slug`,`name`,`description`) VALUES (?,?,?) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`)',
            ['sample', 'Sample', 'Text']
        );
    });

    test('supports multi-column ordering, row locks, and findOne', async () => {
        const pool = { execute: vi.fn().mockResolvedValue([[{ id: 1 }]]) };
        Mysql.connection = pool;
        Mysql.connected = true;

        const row = await Mysql.findOne('items', {
            filter: { id: 1 },
            opt: {
                order: { name: 1, id: -1 },
                forUpdate: true,
            },
        });

        expect(row).toEqual({ id: 1 });
        expect(pool.execute).toHaveBeenCalledWith(
            'SELECT * FROM `items` WHERE `id` = ? ORDER BY `name` ASC, `id` DESC LIMIT 1 FOR UPDATE',
            [1]
        );
    });

    test('supports raw update fragments without binding them as data', async () => {
        const pool = { execute: vi.fn().mockResolvedValue([{ affectedRows: 1 }]) };
        Mysql.connection = pool;
        Mysql.connected = true;

        await Mysql.update('items', {
            updated_at: Mysql.raw('NOW()'),
            name: 'Updated',
        }, 1);

        expect(pool.execute).toHaveBeenCalledWith(
            'UPDATE `items` SET `updated_at` = NOW(), `name` = ? WHERE `id` = ?',
            ['Updated', 1]
        );
    });

    test('runs operations inside a transaction context', async () => {
        const connection = {
            beginTransaction: vi.fn(),
            commit: vi.fn(),
            rollback: vi.fn(),
            release: vi.fn(),
            execute: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
        };
        const pool = {
            getConnection: vi.fn().mockResolvedValue(connection),
        };
        Mysql.connection = pool;
        Mysql.connected = true;

        await Mysql.withTransaction(async context => {
            await Mysql.delete('items', { id: 1 }, {}, context);
        });

        expect(connection.beginTransaction).toHaveBeenCalled();
        expect(connection.execute).toHaveBeenCalledWith(
            'DELETE FROM `items` WHERE `id` = ?',
            [1]
        );
        expect(connection.commit).toHaveBeenCalled();
        expect(connection.release).toHaveBeenCalled();
    });

    test('rejects empty update data', async () => {
        await expect(Mysql.update('items', {}, 1)).rejects.toThrow('No data to update.');
    });
});
