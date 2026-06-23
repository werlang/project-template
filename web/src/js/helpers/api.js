import { Request } from './request.js';
import { TemplateVar } from './template-var.js';

/**
 * API client factory used by frontend models.
 */
export class Api {
    /**
     * @param {{ token?: string, auth?: boolean, options?: Record<string, unknown>, timeout?: number }} config
     */
    constructor({ token, auth = false, options, timeout } = {}) {
        this.token = token;
        this.auth = auth;
        this.options = options || {};
        this.timeout = timeout;
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
            timeout: this.timeout,
        });
    }

    get(endpoint, data, options) {
        return this.requestInstance.get(endpoint, data, options);
    }

    post(endpoint, data, options) {
        return this.requestInstance.post(endpoint, data, options);
    }

    put(endpoint, data, options) {
        return this.requestInstance.put(endpoint, data, options);
    }

    delete(endpoint, data, options) {
        return this.requestInstance.delete(endpoint, data, options);
    }
}
