import fs from 'fs/promises';
import path from 'path';
import Mustache from 'mustache';

const LANGUAGE_MIDDLEWARE_PATH = path.join(import.meta.dirname, './language.js');
const VIEW_PATH = path.join(import.meta.dirname, '../view');

const defaultOptions = {
    sendToClient: true,
    language: false,
    cache: true,
};

/**
 * Loads the optional language middleware only for render middleware instances
 * that explicitly enable language support.
 *
 * @returns {Promise<{loadLocale: Function, listen: Function}>}
 */
const loadLanguageMiddleware = async () => {
    const module = await import(LANGUAGE_MIDDLEWARE_PATH);
    return module.languageMiddleware;
};

/**
 * Adds a template-aware render helper that merges shared view variables with
 * per-route values and optional namespace-scoped translations.
 *
 * @param {Record<string, unknown>} fixedVars Variables applied to every view.
 * @param {{sendToClient?: boolean, language?: boolean, cache?: boolean}} options Rendering options.
 * @returns {(req: object, res: object, next: Function) => void}
 */
export const renderMiddleware = (fixedVars = {}, options = {}) => {
    const renderOptions = {
        ...defaultOptions,
        ...options,
    };
    const templateCache = new Map();
    let languageMiddlewarePromise;

    /**
     * Reads a Mustache template and optionally stores it for future renders.
     *
     * @param {string} view View name without extension.
     * @returns {Promise<string>}
     */
    const readTemplate = async view => {
        const templatePath = path.join(VIEW_PATH, `${view}.html`);

        if (!renderOptions.cache) {
            return fs.readFile(templatePath, 'utf8');
        }

        if (!templateCache.has(templatePath)) {
            templateCache.set(templatePath, await fs.readFile(templatePath, 'utf8'));
        }

        return templateCache.get(templatePath);
    };

    /**
     * Clears one cached template or the complete render template cache.
     *
     * @param {string} [view] Optional view name without extension.
     * @returns {void}
     */
    const clearRenderCache = view => {
        if (view) {
            const templatePath = path.join(VIEW_PATH, `${view}.html`);
            templateCache.delete(templatePath);
            return;
        }

        templateCache.clear();
    };

    return (req, res, next) => {
        const attachRender = languageMiddleware => {
            res.templateRender = async (view, templateVars = {}, languageNamespaces = []) => {
                const runtimeVars = {
                    ...fixedVars,
                    ...templateVars,
                };

                let translations = {};
                if (renderOptions.language) {
                    const language = req.language;
                    for (const namespace of languageNamespaces) {
                        const translation = await languageMiddleware.loadLocale(language, namespace);
                        translations = {
                            ...translations,
                            ...translation[language],
                        };
                    }
                }

                const viewVars = {
                    ...runtimeVars,
                    ...translations,
                };

                for (const key in viewVars) {
                    if (viewVars[key] === undefined) {
                        delete viewVars[key];
                    }
                }

                const clientVars = renderOptions.sendToClient
                    ? {
                        'template-vars': `<script id="template-vars" type="application/json">${JSON.stringify(viewVars)}</script>`,
                    }
                    : {};

                const template = await readTemplate(view);
                const rendered = Mustache.render(template, {
                    ...viewVars,
                    ...clientVars,
                });

                res.send(rendered);
            };

            res.render = res.templateRender;
            res.clearRenderCache = clearRenderCache;
            next();
        };

        if (renderOptions.language) {
            languageMiddlewarePromise ??= loadLanguageMiddleware();
            languageMiddlewarePromise
                .then(languageMiddleware => {
                    languageMiddleware.listen()(req, res, () => attachRender(languageMiddleware));
                })
                .catch(next);
            return;
        }

        attachRender();
    };
};

export default renderMiddleware;
