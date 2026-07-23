/**
 * Converts thrown errors into the API's JSON error response format.
 */
export const errorMiddleware = (err, req, res, next) => {
    if (!err) {
        next();
        return;
    }

    const status = Number.isInteger(err.status)
        ? err.status
        : (Number.isInteger(err.code) ? err.code : 500);

    const knownTypes = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        409: 'Conflict',
        500: 'Internal Server Error',
    };

    const defaultCodes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        500: 'INTERNAL_SERVER_ERROR',
    };

    const httpStatus = knownTypes[status] ? status : 500;
    const errorCode = (typeof err.code === 'string' && err.code)
        || (typeof err.errorCode === 'string' && err.errorCode)
        || defaultCodes[httpStatus]
        || 'INTERNAL_SERVER_ERROR';

    res.status(httpStatus).send({
        error: true,
        status: httpStatus,
        type: knownTypes[httpStatus] || 'Internal Server Error',
        code: errorCode,
        message: err.message || 'An unexpected error occurred.',
        data: err.data,
    });
};
