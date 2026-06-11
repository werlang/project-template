import CustomError from './error.js';

/**
 * Fetch wrapper with JSON defaults and consistent error mapping.
 */
export default class Request {
    /**
     * @param {{ url: string, headers?: HeadersInit, options?: Record<string, unknown> }} config
     */
    constructor({ url, headers, options }) {
        this.url = url.replace(/\/$/, '');
        this.options = options || {};
        this.headers = new Headers(headers || {});
    }

    /**
     * Sets a default header for future requests.
     *
     * @param {string} key
     * @param {string} value
     */
    setHeader(key, value) {
        this.headers.set(key, value);
    }

    get(endpoint, args) {
        return this.request('GET', endpoint, args);
    }

    post(endpoint, args) {
        return this.request('POST', endpoint, args);
    }

    put(endpoint, args) {
        return this.request('PUT', endpoint, args);
    }

    delete(endpoint, args) {
        return this.request('DELETE', endpoint, args);
    }

    /**
     * Sends a request and parses the configured response mode.
     *
     * @param {'GET'|'POST'|'PUT'|'DELETE'} method
     * @param {string} endpoint
     * @param {Record<string, unknown>} data
     * @param {{ responseMode?: string }} options
     * @returns {Promise<unknown>}
     */
    async request(method, endpoint, data = {}, options = {}) {
        const fetchOptions = {
            method,
            headers: this.headers,
        };

        let targetEndpoint = endpoint.replace(/^\//, '');
        if (method === 'POST' || method === 'PUT') {
            fetchOptions.body = JSON.stringify(data);
            this.headers.set('Content-Type', 'application/json');
        }
        if (method === 'GET' && Object.keys(data).length) {
            targetEndpoint += `?${new URLSearchParams(data).toString()}`;
        }

        options = { ...this.options, ...options };
        const responseMode = options.responseMode || 'json';
        const response = await fetch(`${this.url}/${targetEndpoint}`, fetchOptions);

        if (!response.ok) {
            let payload = {};
            try {
                payload = await response.json();
            }
            catch {
                payload = { message: response.statusText };
            }
            throw new CustomError(
                response.status,
                payload.message || 'Request failed',
                payload
            );
        }

        if (response.status === 204) {
            return null;
        }

        return response[responseMode]();
    }
}
