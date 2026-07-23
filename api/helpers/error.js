/**
 * API error with an HTTP status code, optional error code string, and optional details.
 */
export class CustomError extends Error {
    /**
     * @param {number} status - HTTP status code
     * @param {string} message - Error message
     * @param {string|unknown} [code] - Error code string or optional data if code omitted
     * @param {unknown} [data] - Optional error data payload
     */
    constructor(status, message, code, data) {
        super(message);
        this.status = status;
        if (typeof code === 'string') {
            this.code = code;
            this.data = data;
        } else {
            this.code = undefined;
            this.data = code !== undefined ? code : data;
        }
    }
}

