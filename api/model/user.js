import bcrypt from 'bcrypt';
import { Model } from './model.js';

/**
 * User entity used by the sample JWT login flow.
 */
export class User extends Model {
    /**
     * @param {{ id?: number|string, public_id?: string, name?: string, email?: string, password?: string, created_at?: string }} fields
     */
    constructor({ id, public_id, name, email, password, created_at } = {}) {
        super('users', {
            fields: {
                id,
                public_id,
                created_at,
                name,
                email,
                password,
            },
            allowUpdate: ['name', 'email', 'password'],
            insertFields: ['public_id', 'name', 'email', 'password'],
            sanitizeFields: ['name', 'email'],
        });
    }

    /**
     * Lists user records.
     *
     * @param {Record<string, unknown>} filter
     * @returns {Promise<unknown[]>}
     */
    static async getAll(filter = {}) {
        return Model.getAll('users', filter);
    }

    /**
     * Hashes a clear text password.
     *
     * @param {string} password
     * @returns {Promise<string>}
     */
    static async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }

    /**
     * Hashes the password before creating the user.
     *
     * @returns {Promise<User>}
     */
    async insert() {
        if (this.password && !this.password.startsWith('$2')) {
            this.password = await User.hashPassword(this.password);
        }
        await super.insert();
        return this;
    }

    /**
     * Updates the password hash when the password is changed.
     *
     * @param {Record<string, unknown>} fields
     * @returns {Promise<User>}
     */
    async update(fields) {
        if (fields.password && !fields.password.startsWith('$2')) {
            fields.password = await User.hashPassword(fields.password);
        }
        await super.update(fields);
        return this;
    }

    /**
     * Returns a public JSON shape with 14-character NanoID public identifier.
     *
     * @returns {{ id: string, publicId: string, name: string, email: string, createdAt: string }}
     */
    toJSON() {
        return {
            id: this.public_id,
            publicId: this.public_id,
            name: this.name,
            email: this.email,
            createdAt: this.created_at,
        };
    }
}
