import { CustomError } from '../helpers/error.js';
import { Mysql as Db } from '../helpers/mysql.js';

/**
 * Helper for many-to-many relation tables.
 */
export class Relation {
    /**
     * @param {string} tableName
     * @param {Record<string, unknown>} nativeObject
     * @param {string} relatedField
     */
    constructor(tableName, nativeObject, relatedField) {
        this.tableName = tableName;
        this.nativeObject = nativeObject;
        this.relatedField = relatedField;
    }

    /**
     * Checks whether the related value already exists.
     *
     * @param {unknown} fieldValue
     * @returns {Promise<boolean>}
     */
    async check(fieldValue) {
        const relation = (await this.get()).find(row => String(row[this.relatedField]) === String(fieldValue));
        return Boolean(relation);
    }

    /**
     * Inserts the relation when it does not exist.
     *
     * @param {unknown} fieldValue
     * @returns {Promise<unknown>}
     */
    async insert(fieldValue) {
        if (await this.check(fieldValue)) {
            throw new CustomError(400, 'Relation already exists.', 'RELATION_ALREADY_EXISTS');
        }

        return Db.insert(this.tableName, {
            ...this.nativeObject,
            [this.relatedField]: fieldValue,
        });
    }

    /**
     * Deletes the relation when present.
     *
     * @param {unknown} fieldValue
     * @returns {Promise<unknown>}
     */
    async delete(fieldValue) {
        if (!await this.check(fieldValue)) {
            throw new CustomError(404, 'Relation does not exist.', 'RELATION_NOT_FOUND');
        }

        return Db.delete(this.tableName, {
            ...this.nativeObject,
            [this.relatedField]: fieldValue,
        });
    }

    /**
     * Updates extra relation columns.
     *
     * @param {unknown} fieldValue
     * @param {Record<string, unknown>} data
     * @returns {Promise<unknown>}
     */
    async update(fieldValue, data) {
        if (!await this.check(fieldValue)) {
            throw new CustomError(404, 'Relation does not exist.', 'RELATION_NOT_FOUND');
        }

        return Db.update(this.tableName, data, {
            ...this.nativeObject,
            [this.relatedField]: fieldValue,
        });
    }

    /**
     * Lists rows matching the native side of the relation.
     *
     * @returns {Promise<unknown[]>}
     */
    async get() {
        return Db.find(this.tableName, {
            filter: {
                ...this.nativeObject,
            },
        });
    }
}
