/**
 * Small localStorage wrapper with optional expiration support.
 */
export default class LocalData {
    /**
     * @param {{ id?: string, data?: unknown, expires?: string|number|Date|false }} options
     */
    constructor({ id, data, expires } = {}) {
        this.id = id;
        this.data = data;
        this.expires = expires || false;
    }

    /**
     * Loads the saved value and removes it when expired.
     *
     * @returns {unknown}
     */
    get() {
        const loadedData = localStorage.getItem(this.id);
        if (loadedData) {
            const { data, expires } = JSON.parse(loadedData);
            this.data = data;
            this.expires = expires;
            this.check();
        }
        return this.data;
    }

    /**
     * Saves the current value.
     *
     * @param {{ id?: string, data?: unknown, expires?: string|number|Date|false }} options
     * @returns {boolean}
     */
    set({ id, data, expires } = {}) {
        if (id) this.id = id;
        if (data !== undefined) this.data = data;
        if (expires !== undefined) this.expires = expires;
        if (this.expires) {
            this.expires = this.formatExpires(this.expires);
        }

        localStorage.setItem(this.id, JSON.stringify({
            data: this.data,
            expires: this.expires,
        }));
        return true;
    }

    /**
     * Checks whether the current value is still valid.
     *
     * @returns {boolean}
     */
    check() {
        if (!this.data) return false;

        if (this.expires === false || this.expires > Date.now()) {
            return true;
        }

        this.remove();
        return false;
    }

    /**
     * Removes the stored value.
     */
    remove() {
        this.data = null;
        localStorage.removeItem(this.id);
    }

    /**
     * Converts relative or absolute expiration values to a timestamp.
     *
     * @param {string|number|Date} expires
     * @returns {number}
     */
    formatExpires(expires) {
        if (typeof expires === 'string') {
            const value = parseInt(expires.slice(0, -1), 10);
            const unit = expires.slice(-1);

            if (Number.isNaN(value)) {
                throw new Error('Invalid expiration time');
            }

            const multipliers = {
                s: 1000,
                m: 1000 * 60,
                h: 1000 * 60 * 60,
                d: 1000 * 60 * 60 * 24,
                w: 1000 * 60 * 60 * 24 * 7,
            };

            if (!multipliers[unit]) {
                throw new Error('Invalid expiration time');
            }

            return Date.now() + value * multipliers[unit];
        }

        if (expires instanceof Date) {
            return expires.getTime();
        }

        if (typeof expires === 'number') {
            return parseInt(expires, 10);
        }

        throw new Error('Invalid expiration time');
    }
}
