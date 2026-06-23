import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { CustomError } from '../helpers/error.js';
import { Item } from '../model/item.js';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const items = await Item.getAll();
        res.send({ items: items.map(item => item.toJSON()) });
    }
    catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const item = await new Item({ id: req.params.id }).get();
        res.send({ item: item.toJSON() });
    }
    catch (error) {
        next(error);
    }
});

router.post('/', auth({ 'user:optional': true }), async (req, res, next) => {
    try {
        if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
            throw new CustomError(400, 'Name is required.');
        }
        if (req.body.name.trim().length > 255) {
            throw new CustomError(400, 'Name exceeds maximum length.');
        }

        const item = await new Item({
            name: req.body.name,
            description: req.body.description || '',
            owner: req.user?.id || null,
        }).insert();

        res.status(201).send({
            message: 'Item created.',
            item: item.toJSON(),
        });
    }
    catch (error) {
        next(error);
    }
});

router.put('/:id', auth({ 'user:optional': true }), async (req, res, next) => {
    try {
        const item = await new Item({ id: req.params.id }).get();
        const toUpdate = {};

        if (req.body.name !== undefined) {
            if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
                throw new CustomError(400, 'Name is required.');
            }
            if (req.body.name.trim().length > 255) {
                throw new CustomError(400, 'Name exceeds maximum length.');
            }
            toUpdate.name = req.body.name;
        }

        if (req.body.description !== undefined) {
            toUpdate.description = req.body.description;
        }

        await item.update(toUpdate);
        res.send({
            message: 'Item updated.',
            item: item.toJSON(),
        });
    }
    catch (error) {
        next(error);
    }
});

router.delete('/:id', auth({ 'user:optional': true }), async (req, res, next) => {
    try {
        const item = await new Item({ id: req.params.id }).get();
        await item.delete();
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});

export const itemsRouter = router;
