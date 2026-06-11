import express from 'express';
import cors from 'cors';
import errorMiddleware from './middleware/error.js';
import login from './route/login.js';
import items from './route/items.js';
import Mysql from './helpers/mysql.js';

const port = 3000;
const host = '0.0.0.0';

const app = express();

app.use(express.urlencoded({ extended: true, limit: `${process.env.REQUEST_LIMIT_KB || 1024}kb` }));
app.use(express.json({ limit: `${process.env.REQUEST_LIMIT_KB || 1024}kb` }));
app.use(cors());

app.get('/ready', (req, res) => {
    res.status(200).send({ message: 'API is ready.' });
});

app.use('/login', login);
app.use('/items', items);

app.use((req, res) => {
    res.status(404).send({
        error: true,
        status: 404,
        type: 'Not Found',
        message: 'Resource not found.',
    });
});

app.use(errorMiddleware);

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, host, () => {
        console.log(`API server running at http://${host}:${port}/`);
    });
}

app.on('close', async () => {
    await Mysql.close();
});

export default app;
