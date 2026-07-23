import { CustomError } from '../helpers/error.js';
import { Mysql as Db } from '../helpers/mysql.js';
import { Relation } from './relation.js';

/**
 * Base entity model that wraps generic CRUD behavior.
 */
export class Model {
    #allowUpdate = [];
    #insertFields = [];
    #sanitizeFields = [];
    #tableName = '';
    relations = {};

    /**
     * @param {string} tableName
     * @param {{ fields: Record<string, unknown>, allowUpdate: string[], insertFields: string[], sanitizeFields?: string[] }} config
     */
    constructor(tableName, { fields, allowUpdate, insertFields, sanitizeFields = [] }) {
        this.#tableName = tableName;
        this.#allowUpdate = allowUpdate;
        this.#insertFields = insertFields;
        this.#sanitizeFields = sanitizeFields;
        Object.assign(this, fields);
    }

    /**
     * Normalizes field values before persistence.
     *
     * @param {string} field
     * @param {unknown} value
     * @returns {unknown}
     */
    sanitizeWriteValue(field, value) {
        if (!this.#sanitizeFields.includes(field) || typeof value !== 'string') {
            return value;
        }

        return value.trim();
    }

    /**
     * Loads all records from a table.
     *
     * @param {string} tableName
     * @param {Record<string, unknown>} filter
     * @returns {Promise<unknown[]>}
     */
    static async getAll(tableName, filter = {}) {
        return Db.find(tableName, { filter });
    }

    /**
     * Loads all records for this model's table.
     *
     * @param {Record<string, unknown>} filter
     * @returns {Promise<unknown[]>}
     */
    async getAll(filter = {}) {
        return Db.find(this.#tableName, { filter });
    }

    /**
     * Inserts this model and reloads the created record.
     *
     * @returns {Promise<Model>}
     */
    async insert() {
        const insertData = {};
        for (const field of this.#insertFields) {
            const value = this.sanitizeWriteValue(field, this[field]);
            if (value !== undefined) {
                insertData[field] = value;
            }
        }

        const result = await Db.insert(this.#tableName, insertData);
        this.id = result[0].insertId;
        return this.get();
    }

    /**
     * Loads this model by a specific field.
     *
     * @param {string} field
     * @param {Record<string, unknown>} additionalFilters
     * @returns {Promise<Model>}
     */
    async getBy(field = 'id', additionalFilters = {}) {
        if (!this[field]) {
            throw new CustomError(400, 'Invalid field.', 'INVALID_FIELD');
        }

        const items = await Db.find(this.#tableName, {
            filter: {
                [field]: this[field],
                ...additionalFilters,
            },
            opt: { limit: 1 },
        });

        if (!items.length) {
            throw new CustomError(404, 'Item not found.', 'ITEM_NOT_FOUND');
        }

        Object.assign(this, items[0]);
        return this;
    }

    /**
     * Loads this model by id.
     *
     * @returns {Promise<Model>}
     */
    async get() {
        return this.getBy();
    }

    /**
     * Updates allowed fields and reloads the model.
     *
     * @param {Record<string, unknown>} fields
     * @returns {Promise<Model>}
     */
    async update(fields) {
        const toChange = {};
        for (const key of Object.keys(fields)) {
            if (this.#allowUpdate.includes(key) && fields[key] !== undefined) {
                toChange[key] = this.sanitizeWriteValue(key, fields[key]);
            }
        }

        await Db.update(this.#tableName, toChange, this.id);
        return this.get();
    }

    /**
     * Deletes this model by id.
     *
     * @returns {Promise<unknown>}
     */
    async delete() {
        return Db.delete(this.#tableName, this.id);
    }

    /**
     * Registers a relation helper for this model instance.
     *
     * @param {string} relationName
     * @param {string} tableName
     * @param {string} nativeField
     * @param {string} relatedField
     */
    addRelation(relationName, tableName, nativeField, relatedField) {
        this.relations[relationName] = new Relation(tableName, { [nativeField]: this.id }, relatedField);
    }

    async insertRelation(name, value) {
        if (!this.relations[name]) {
            throw new CustomError(400, 'Relation not found.', 'RELATION_NOT_FOUND');
        }
        return this.relations[name].insert(value);
    }

    async deleteRelation(name, value) {
        if (!this.relations[name]) {
            throw new CustomError(400, 'Relation not found.', 'RELATION_NOT_FOUND');
        }
        return this.relations[name].delete(value);
    }

    async getRelation(name) {
        if (!this.relations[name]) {
            throw new CustomError(400, 'Relation not found.', 'RELATION_NOT_FOUND');
        }
        return this.relations[name].get();
    }

    async updateRelation(name, value, data) {
        if (!this.relations[name]) {
            throw new CustomError(400, 'Relation not found.', 'RELATION_NOT_FOUND');
        }
        return this.relations[name].update(value, data);
    }
}
