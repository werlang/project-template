import { Model } from './model.js';

/**
 * Sample entity showing how project models should wrap persistence.
 */
export class Item extends Model {
    /**
     * @param {{ id?: number|string, public_id?: string, name?: string, description?: string, owner?: number|string, created_at?: string }} fields
     */
    constructor({ id, public_id, name, description, owner, created_at } = {}) {
        super('items', {
            fields: {
                id,
                public_id,
                created_at,
                name,
                description,
                owner,
            },
            allowUpdate: ['name', 'description', 'owner'],
            insertFields: ['public_id', 'name', 'description', 'owner'],
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
     * Returns a public JSON shape with 14-character NanoID public identifier.
     *
     * @returns {{ id: string, publicId: string, name: string, description: string, owner: number|string, createdAt: string }}
     */
    toJSON() {
        return {
            id: this.public_id,
            publicId: this.public_id,
            name: this.name,
            description: this.description,
            owner: this.owner,
            createdAt: this.created_at,
        };
    }
}
