import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('mysql2/promise', () => ({
    default: {
        createPool: vi.fn(),
    },
}));

const mysql = (await import('mysql2/promise')).default;
const Mysql = (await import('../../../helpers/mysql.js')).default;

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

    test('rejects empty update data', async () => {
        await expect(Mysql.update('items', {}, 1)).rejects.toThrow('No data to update.');
    });
});
