import request from 'supertest';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { Mysql } from '../../helpers/mysql.js';
import { User } from '../../model/user.js';
import { app } from '../../app.js';

async function resetWithRetry(attempts = 20) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            await Mysql.resetTables(['items', 'users']);
            return;
        }
        catch (error) {
            if (attempt === attempts) throw error;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}

describe('API integration', () => {
    beforeEach(async () => {
        await resetWithRetry();
        await new User({
            name: 'Template User',
            email: 'user@example.com',
            password: 'secret',
        }).insert();
    });

    afterAll(async () => {
        await Mysql.close();
    });

    test('reports readiness', async () => {
        const response = await request(app).get('/ready');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('API is ready.');
    });

    test('rejects invalid login credentials', async () => {
        const response = await request(app).post('/login').send({
            email: 'user@example.com',
            password: 'wrong',
        });

        expect(response.status).toBe(401);
    });

    test('logs in and returns a bearer token', async () => {
        const response = await request(app).post('/login').send({
            email: 'user@example.com',
            password: 'secret',
        });

        expect(response.status).toBe(200);
        expect(response.body.token).toBeTruthy();
        expect(response.body.user.email).toBe('user@example.com');
    });

    test('creates, lists, updates, and deletes sample items', async () => {
        const createResponse = await request(app).post('/items').send({
            name: 'Sample item',
            description: 'Created from integration test',
        });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.item.name).toBe('Sample item');

        const id = createResponse.body.item.id;
        const listResponse = await request(app).get('/items');
        expect(listResponse.body.items).toHaveLength(1);

        const updateResponse = await request(app).put(`/items/${id}`).send({
            name: 'Updated item',
        });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.item.name).toBe('Updated item');

        const deleteResponse = await request(app).delete(`/items/${id}`);
        expect(deleteResponse.status).toBe(204);

        const finalListResponse = await request(app).get('/items');
        expect(finalListResponse.body.items).toHaveLength(0);
    });
});
