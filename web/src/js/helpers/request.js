import { CustomError } from './error.js';

/**
 * Fetch wrapper with JSON defaults, timeout handling, and consistent error mapping.
 */
export class Request {
    /**
     * @param {{ url?: string, baseURL?: string, headers?: HeadersInit, options?: Record<string, unknown>, timeout?: number }} config
     */
    constructor({ url, baseURL, headers, options, timeout } = {}) {
        this.url = String(baseURL || url || '').replace(/\/$/, '');
        this.options = options || {};
        this.headers = new Headers(headers || {});
        this.timeout = Number(timeout || this.options.timeout || 30000);
    }

    /**
     * Sets a default header for future requests.
     *
     * @param {string} key
     * @param {string} value
     */
    setHeader(key, value) {
        this.headers.set(key, value);
        return this;
    }

    get(endpoint, args, options) {
        return this.request('GET', endpoint, args, options);
    }

    post(endpoint, args, options) {
        return this.request('POST', endpoint, args, options);
    }

    put(endpoint, args, options) {
        return this.request('PUT', endpoint, args, options);
    }

    delete(endpoint, args, options) {
        return this.request('DELETE', endpoint, args, options);
    }

    /**
     * Sends a request and parses the configured response mode.
     *
     * @param {'GET'|'POST'|'PUT'|'DELETE'} method
     * @param {string} endpoint
     * @param {Record<string, unknown>} data
     * @param {{ responseMode?: string, timeout?: number, headers?: HeadersInit }} options
     * @returns {Promise<unknown>}
     */
    async request(method, endpoint, data = {}, options = {}) {
        options = { ...this.options, ...options };
        const controller = new AbortController();
        const timeout = Number(options.timeout || this.timeout);
        const timeoutId = Number.isFinite(timeout) && timeout > 0
            ? globalThis.setTimeout(() => controller.abort(), timeout)
            : null;
        const headers = new Headers(this.headers);
        if (options.headers) {
            new Headers(options.headers).forEach((value, key) => headers.set(key, value));
        }
        const fetchOptions = {
            method,
            headers,
            signal: controller.signal,
        };

        let targetEndpoint = endpoint.replace(/^\//, '');
        if (method === 'POST' || method === 'PUT') {
            headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
            fetchOptions.body = JSON.stringify(data);
        }
        if (method === 'GET' && Object.keys(data).length) {
            targetEndpoint += `?${new URLSearchParams(data).toString()}`;
        }

        try {
            const response = await fetch(`${this.url}/${targetEndpoint}`, fetchOptions);
            const payload = await this.#parseResponse(response, options.responseMode);

            if (!response.ok) {
                const message = payload?.message || response.statusText || 'Request failed';
                const code = payload?.code;
                throw new CustomError(response.status, message, payload, code);
            }

            return payload;
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new CustomError(408, 'Request timeout', { timeout }, 'REQUEST_TIMEOUT');
            }
            throw error;
        }
        finally {
            if (timeoutId) {
                globalThis.clearTimeout(timeoutId);
            }
        }
    }

    /**
     * Parses a response using content type unless a mode is explicitly requested.
     *
     * @param {Response} response
     * @param {string} responseMode
     * @returns {Promise<unknown>}
     */
    async #parseResponse(response, responseMode) {
        if (response.status === 204) {
            return null;
        }

        const mode = responseMode || this.#inferResponseMode(response);
        if (mode === 'none') {
            return null;
        }

        try {
            return await response[mode]();
        }
        catch {
            return null;
        }
    }

    /**
     * Infers the response parser from the content type.
     *
     * @param {Response} response
     * @returns {'json'|'text'|'blob'|'arrayBuffer'|'none'}
     */
    #inferResponseMode(response) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return 'json';
        }
        if (contentType.startsWith('text/')) {
            return 'text';
        }
        if (contentType) {
            return 'blob';
        }
        return 'none';
    }
}
