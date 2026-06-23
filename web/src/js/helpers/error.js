/**
 * Error type used by frontend request helpers.
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
