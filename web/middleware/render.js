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
 * Helper to recursively flatten translations to ns:key.subkey notation.
 *
 * @param {Record<string, any>} translations
 * @returns {Record<string, string>}
 */
export const flattenTranslations = (translations) => {
    const flattened = {};

    const recurse = (obj, prefix) => {
        for (const key in obj) {
            const val = obj[key];
            const currentKey = `${prefix}.${key}`;
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                recurse(val, currentKey);
            } else {
                flattened[currentKey] = val;
            }
        }
    };

    for (const ns in translations) {
        const nsObj = translations[ns];
        if (nsObj && typeof nsObj === 'object' && !Array.isArray(nsObj)) {
            for (const key in nsObj) {
                const val = nsObj[key];
                const nsKey = `${ns}:${key}`;
                if (val && typeof val === 'object' && !Array.isArray(val)) {
                    recurse(val, nsKey);
                } else {
                    flattened[nsKey] = val;
                }
            }
        } else {
            flattened[ns] = nsObj;
        }
    }
    return flattened;
};

/**
 * Safely stringifies an object for embedding in a <script> tag to prevent XSS.
 *
 * @param {any} obj
 * @returns {string}
 */
export const safeJsonStringify = (obj) => {
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
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
    let cachedPartials = null;
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
            if (cachedPartials) {
                delete cachedPartials[view];
            }
            return;
        }

        templateCache.clear();
        cachedPartials = null;
    };

    /**
     * Reads all template files in the views directory to build the partials object.
     *
     * @returns {Promise<Record<string, string>>}
     */
    const loadPartials = async () => {
        if (renderOptions.cache && cachedPartials) {
            return cachedPartials;
        }

        const files = await fs.readdir(VIEW_PATH);
        const partials = {};
        for (const file of files) {
            if (file.endsWith('.html')) {
                const name = path.basename(file, '.html');
                partials[name] = await readTemplate(name);
            }
        }

        if (renderOptions.cache) {
            cachedPartials = partials;
        }

        return partials;
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

                const flattenedTranslations = flattenTranslations(translations);

                const viewVars = {
                    ...runtimeVars,
                    ...flattenedTranslations,
                };

                for (const key in viewVars) {
                    if (viewVars[key] === undefined) {
                        delete viewVars[key];
                    }
                }

                const clientVars = renderOptions.sendToClient
                    ? {
                        'template-vars': `<script id="template-vars" type="application/json">${safeJsonStringify({
                            ...viewVars,
                            translations,
                        })}</script>`,
                    }
                    : {};

                const template = await readTemplate(view);
                const partials = await loadPartials();
                const rendered = Mustache.render(template, {
                    ...viewVars,
                    ...clientVars,
                }, partials);

                res.send(rendered);
            };

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
