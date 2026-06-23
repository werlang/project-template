/**
 * API error with an HTTP status code and optional details.
 */
export class CustomError extends Error {
    /**
     * @param {number} code
     * @param {string} message
     * @param {unknown} data
     */
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
    }
}
