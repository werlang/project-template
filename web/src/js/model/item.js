import { Api } from '../helpers/api.js';

/**
 * Frontend model for the sample item API resource.
 */
export class Item {
    /**
     * @param {{ id?: number, name?: string, description?: string }} fields
     */
    constructor({ id, name, description } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    /**
     * Loads all sample items from the API.
     *
     * @returns {Promise<Item[]>}
     */
    static async getAll() {
        const { items } = await new Api().get('items');
        return items.map(item => new Item(item));
    }

    /**
     * Creates this item through the API.
     *
     * @returns {Promise<Item>}
     */
    async create() {
        const { item } = await new Api().post('items', {
            name: this.name,
            description: this.description,
        });
        Object.assign(this, item);
        return this;
    }
}
