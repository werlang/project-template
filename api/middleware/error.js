/**
 * Converts thrown errors into the API's JSON error response format.
 */
export const errorMiddleware = (err, req, res, next) => {
    if (!err) {
        next();
        return;
    }

    const status = Number.isInteger(err.code) ? err.code : 500;
    const knownTypes = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        409: 'Conflict',
        500: 'Internal Server Error',
    };

    res.status(knownTypes[status] ? status : 500).send({
        error: true,
        status: knownTypes[status] ? status : 500,
        type: knownTypes[status] || 'Internal Server Error',
        message: err.message || 'An unexpected error occurred.',
        data: err.data,
    });
};
