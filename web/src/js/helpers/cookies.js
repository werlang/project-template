/**
 * Cookie
 * Small helper for JSON-serialized cookies.
 *
 * Usage:
 *   const cookie = new Cookie('language');
 *   cookie.set('pt', 365);
 *   const value = cookie.get();
 */

export class Cookie {

    constructor(key, value, days) {
        this.key = key;
        this.value = value;
        this.days = days || 30;
    }

    set(value, days) {
        value = value || this.value;
        days = days || this.days;

        value = JSON.stringify(value);

        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${this.key}=${value}; expires=${expires}; path=/`;
    }

    append(value, days) {
        const existingValue = this.get() || {};
        const newValue = { ...existingValue, ...value };
        this.set(newValue, days);
    }

    get(key) {
        key = key || this.key;
        const cookieArray = document.cookie.split(';');
        for (let cookie of cookieArray) {
            cookie = cookie.trim();
            if (cookie.startsWith(`${key}=`)) {
                try {
                    const value = cookie.split('=')[1];
                    return JSON.parse(value);
                }
                catch {
                    return null;
                }
            }
        }
        return null;
    }

    delete() {
        document.cookie = `${this.key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
}