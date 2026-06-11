import Request from './request.js';
import TemplateVar from './template-var.js';

/**
 * API client factory used by frontend models.
 */
export default class Api {
    /**
     * @param {{ token?: string, auth?: boolean, options?: Record<string, unknown> }} config
     */
    constructor({ token, auth = false, options } = {}) {
        this.token = token;
        this.auth = auth;
        this.options = options || {};
        this.requestInstance = this.setInstance();
    }

    /**
     * Builds the request wrapper with runtime API URL and optional bearer auth.
     *
     * @returns {Request}
     */
    setInstance() {
        const headers = {};
        if (this.auth && this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        return new Request({
            url: TemplateVar.get('apiurl'),
            headers,
            options: this.options,
        });
    }

    get(endpoint, data) {
        return this.requestInstance.get(endpoint, data);
    }

    post(endpoint, data) {
        return this.requestInstance.post(endpoint, data);
    }

    put(endpoint, data) {
        return this.requestInstance.put(endpoint, data);
    }

    delete(endpoint, data) {
        return this.requestInstance.delete(endpoint, data);
    }
}
