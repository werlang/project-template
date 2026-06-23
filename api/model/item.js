import { Model } from './model.js';

/**
 * Sample entity showing how project models should wrap persistence.
 */
export class Item extends Model {
    /**
     * @param {{ id?: number, name?: string, description?: string, owner?: number, created_at?: string }} fields
     */
    constructor({ id, name, description, owner, created_at } = {}) {
        super('items', {
            fields: {
                id,
                created_at,
                name,
                description,
                owner,
            },
            allowUpdate: ['name', 'description', 'owner'],
            insertFields: ['name', 'description', 'owner'],
            sanitizeFields: ['name', 'description'],
        });
    }

    /**
     * Lists sample item records as model instances.
     *
     * @param {Record<string, unknown>} filter
     * @returns {Promise<Item[]>}
     */
    static async getAll(filter = {}) {
        const items = await Model.getAll('items', filter);
        return items.map(item => new Item(item));
    }

    /**
     * Returns a public JSON shape.
     *
     * @returns {{ id: number, name: string, description: string, owner: number, createdAt: string }}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            owner: this.owner,
            createdAt: this.created_at,
        };
    }
}
