import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../../helpers/postgres.js', () => ({
    Postgres: {
        insert: vi.fn(),
        find: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

const Db = (await import('../../../helpers/postgres.js')).Postgres;
const Model = (await import('../../../model/model.js')).Model;

describe('Model base class', () => {
    let model;

    beforeEach(() => {
        model = new Model('sample_table', {
            fields: {
                id: 1,
                name: ' Sample ',
                locked: 'secret',
            },
            allowUpdate: ['name'],
            insertFields: ['name', 'locked'],
            sanitizeFields: ['name'],
        });
    });

    test('inserts configured fields and refreshes the model', async () => {
        Db.insert.mockResolvedValue([{ id: 7 }]);
        Db.find.mockResolvedValue([{ id: 7, name: 'Sample', locked: 'secret' }]);

        await model.insert();

        expect(Db.insert).toHaveBeenCalledWith('sample_table', {
            name: 'Sample',
            locked: 'secret',
        });
        expect(model.id).toBe(7);
    });

    test('automatically generates 14-char public_id when included in insertFields', async () => {
        const publicModel = new Model('sample_table', {
            fields: { name: 'Test' },
            allowUpdate: ['name'],
            insertFields: ['public_id', 'name'],
        });

        let savedPublicId;
        Db.insert.mockImplementation(async (table, data) => {
            savedPublicId = data.public_id;
            return [{ id: 10, public_id: savedPublicId }];
        });
        Db.find.mockImplementation(async () => [{ id: 10, public_id: savedPublicId, name: 'Test' }]);

        await publicModel.insert();

        expect(publicModel.public_id).toBeDefined();
        expect(typeof publicModel.public_id).toBe('string');
        expect(publicModel.public_id).toHaveLength(14);
        expect(publicModel.public_id).toMatch(/^[0-9A-Za-z]{14}$/);
    });

    test('loads by custom field', async () => {
        Db.find.mockResolvedValue([{ id: 1, name: 'Loaded' }]);

        await model.getBy('name');

        expect(Db.find).toHaveBeenCalledWith('sample_table', {
            filter: { name: ' Sample ' },
            opt: { limit: 1 },
        });
        expect(model.name).toBe('Loaded');
    });

    test('updates only allowed fields', async () => {
        Db.update.mockResolvedValue({});
        Db.find.mockResolvedValue([{ id: 1, name: 'Updated', locked: 'secret' }]);

        await model.update({ name: ' Updated ', locked: 'changed' });

        expect(Db.update).toHaveBeenCalledWith('sample_table', { name: 'Updated' }, 1);
    });

    test('throws when a relation does not exist', async () => {
        await expect(model.getRelation('missing')).rejects.toThrow('Relation not found.');
    });
});
