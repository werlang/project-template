import express from 'express';
import mustacheExpress from 'mustache-express';
import cookieParser from 'cookie-parser';
import renderMiddleware from './middleware/render.js';

const port = 3000;
const host = '0.0.0.0';

const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', `${import.meta.dirname}/view/`);

app.use(renderMiddleware({
    apiurl: process.env.API_URL,
    appName: 'Template App',
    year: new Date().getFullYear(),
}));

app.get('/', (req, res) => {
    res.templateRender('index', {
        pageTitle: 'Template App',
        heading: 'Template App',
    });
});

app.get('/ready', (req, res) => {
    res.status(200).send({ message: 'Web is ready.' });
});

app.get('/health', (req, res) => {
    res.status(200).send({ message: 'Web is healthy.' });
});

app.use(express.static(`${import.meta.dirname}/public/`));

app.use((req, res) => {
    res.status(404).templateRender('notfound', {
        pageTitle: 'Page not found',
        heading: 'Page not found',
    });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, host, () => {
        console.log(`Web server running at http://${host}:${port}/`);
    });
}

export default app;
