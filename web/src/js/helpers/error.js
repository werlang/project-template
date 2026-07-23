/**
 * Error type used by frontend request helpers.
 */
export class CustomError extends Error {
    /**
     * @param {number} status - HTTP status code
     * @param {string} message - Error message
     * @param {unknown} [data] - Error payload data
     * @param {string} [code] - Error code string
     */
    constructor(status, message, data, code) {
        super(message);
        this.status = status;
        this.data = data;
        this.code = code || (typeof data === 'object' && data !== null ? data.code : undefined) || (typeof status === 'string' ? status : undefined);
    }
}
