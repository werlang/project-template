import { describe, expect, test, vi } from 'vitest';
import { errorMiddleware } from '../../../middleware/error.js';
import { CustomError } from '../../../helpers/error.js';

describe('error middleware', () => {
    test('formats CustomError responses', () => {
        const res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        };

        errorMiddleware(new CustomError(400, 'Invalid input.', 'INVALID_INPUT', { field: 'name' }), {}, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            error: true,
            status: 400,
            type: 'Bad Request',
            code: 'INVALID_INPUT',
            message: 'Invalid input.',
            data: { field: 'name' },
        });
    });

    test('falls back to default code and status 500 for unknown errors', () => {
        const res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        };

        errorMiddleware(new Error('Boom'), {}, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            status: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Boom',
        }));
    });
});
