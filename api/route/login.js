import { Router } from 'express';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/', auth({ 'user:password': true }), async (req, res, next) => {
    try {
        res.send({
            message: 'Login successful.',
            user: req.user.toJSON(),
            token: req.user.token,
        });
    }
    catch (error) {
        next(error);
    }
});

export const loginRouter = router;
