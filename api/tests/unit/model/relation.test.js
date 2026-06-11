import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../../helpers/mysql.js', () => ({
    default: {
        find: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

const Db = (await import('../../../helpers/mysql.js')).default;
const Relation = (await import('../../../model/relation.js')).default;

describe('Relation model helper', () => {
    let relation;

    beforeEach(() => {
        relation = new Relation('item_tags', { item: 1 }, 'tag');
    });

    test('inserts a missing relation', async () => {
        Db.find.mockResolvedValue([]);
        Db.insert.mockResolvedValue([{ insertId: 1 }]);

        await relation.insert(2);

        expect(Db.insert).toHaveBeenCalledWith('item_tags', { item: 1, tag: 2 });
    });

    test('rejects duplicate relations', async () => {
        Db.find.mockResolvedValue([{ item: 1, tag: 2 }]);

        await expect(relation.insert(2)).rejects.toThrow('Relation already exists.');
    });

    test('updates an existing relation', async () => {
        Db.find.mockResolvedValue([{ item: 1, tag: 2 }]);
        Db.update.mockResolvedValue({});

        await relation.update(2, { order: 1 });

        expect(Db.update).toHaveBeenCalledWith('item_tags', { order: 1 }, { item: 1, tag: 2 });
    });
});
