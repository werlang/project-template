import { describe, expect, test, vi } from 'vitest';

const createdItem = {
    id: 1,
    public_id: '4fK9zX2mL8pQ1w',
    name: 'Created item',
    description: 'Created description',
    owner: null,
    created_at: '2026-01-01T00:00:00.000Z',
    toJSON() {
        return {
            id: this.public_id,
            publicId: this.public_id,
            name: this.name,
            description: this.description,
            owner: this.owner,
            createdAt: this.created_at,
        };
    },
};

vi.mock('../../../middleware/auth.js', () => ({
    auth: () => (req, res, next) => {
        req.user = null;
        next();
    },
}));

vi.mock('../../../model/item.js', () => ({
    Item: class Item {
        constructor(fields = {}) {
            Object.assign(this, fields);
        }

        static async getAll() {
            return [createdItem];
        }

        async getBy(field) {
            Object.assign(this, createdItem);
            return this;
        }

        async get() {
            Object.assign(this, createdItem);
            return this;
        }

        async insert() {
            Object.assign(this, createdItem);
            return this;
        }

        async update() {
            Object.assign(this, createdItem);
            return this;
        }

        async delete() {
            return {};
        }

        toJSON() {
            return createdItem.toJSON.call(this);
        }
    },
}));

const itemsRouter = (await import('../../../route/items.js')).itemsRouter;

function getRouteHandlers(method, path) {
    const routeMethod = method.toLowerCase();
    const route = itemsRouter.stack.find(layer => (
        layer.route
        && layer.route.path === path
        && layer.route.methods[routeMethod]
    ));

    if (!route) {
        throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
    }

    return route.route.stack.map(layer => layer.handle);
}

function createResponse() {
    const response = {
        statusCode: 200,
        body: undefined,
    };

    response.status = vi.fn(code => {
        response.statusCode = code;
        return response;
    });
    response.send = vi.fn(payload => {
        response.body = payload;
        return response;
    });
    response.json = response.send;

    return response;
}

async function invoke(method, path, body = {}) {
    const req = {
        method,
        url: path,
        headers: {},
        body,
        params: {},
        query: {},
    };
    const res = createResponse();

    const handlers = getRouteHandlers(method, path);

    const runHandlers = async routeHandlers => {
        for (const handler of routeHandlers) {
            await new Promise((resolve, reject) => {
                let settled = false;

                const next = error => {
                    if (settled) return;
                    settled = true;
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                };

                try {
                    const result = handler(req, res, next);
                    if (result && typeof result.then === 'function') {
                        result.then(() => {
                            if (!settled) {
                                settled = true;
                                resolve();
                            }
                        }).catch(error => {
                            if (!settled) {
                                settled = true;
                                reject(error);
                            }
                        });
                    }
                    else if (handler.length < 3 && !settled) {
                        settled = true;
                        resolve();
                    }
                }
                catch (error) {
                    settled = true;
                    reject(error);
                }
            });
        }
    };

    try {
        await runHandlers(handlers);
    }
    catch (error) {
        res.status(error.status || (Number.isInteger(error.code) ? error.code : 500)).send({ message: error.message, code: error.code });
    }

    return res;
}

describe('items route', () => {
    test('lists sample items', async () => {
        const response = await invoke('GET', '/');

        expect(response.statusCode).toBe(200);
        expect(response.body.items).toHaveLength(1);
    });

    test('validates item creation', async () => {
        const response = await invoke('POST', '/', { name: '' });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Name is required.');
    });

    test('creates sample items', async () => {
        const response = await invoke('POST', '/', {
            name: 'Created item',
            description: 'Created description',
        });

        expect(response.statusCode).toBe(201);
        expect(response.body.item.name).toBe('Created item');
    });
});
