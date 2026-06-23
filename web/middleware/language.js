import i18next from 'i18next';
import path from 'path';
import fs from 'fs/promises';

const LOCALE_PATH = path.join(import.meta.dirname, '../locales');

const languageMiddleware = {

    fallbackLng: 'en',
    supportedLanguages: ['en', 'pt'],

    // Function to load a single translation file
    loadLocale: async function(lng, ns) {
        if (i18next.isInitialized) {
            const bundle = i18next.getResourceBundle(lng, ns);
            if (bundle) {
                return { [lng]: { [ns]: bundle } };
            }
        }
        const filePath = path.join(LOCALE_PATH, lng, `${ns}.json`);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const file = JSON.parse(content);
            return { [lng]: { [ns]: file } };
        }
        catch (error) {
            console.error(`Could not load translation file for ${lng} at ${filePath}: ${error.message}`);
            return { [lng]: { [ns]: {} } };
        }
    },

    // Function to load translation files
    loadLocales: async function(languages, namespaces) {
        const languageList = {};
        for (let lng of languages) {
            languageList[lng] = namespaces;
        }

        const translations = {};
        for (let lng in languageList) {
            const namespaces = languageList[lng];
            for (let ns of namespaces) {
                const translation = await this.loadLocale(lng, ns);
                translations[lng] = { ...translations[lng], ...translation[lng] };
            }
        }
        // console.log(translations);
        return translations;
    },

    init: async function({languages, namespaces}) {
        await i18next.init({
            fallbackLng: this.fallbackLng,
            supportedLngs: this.supportedLanguages,
            resources: await this.loadLocales(languages, namespaces),
            // debug: true,
        });
    },

    detectLanguage: function(req) {
        const cookieLanguage = req.cookies?.language;
        if (this.supportedLanguages.includes(cookieLanguage)) {
            return cookieLanguage;
        }

        const headerLanguage = req.acceptsLanguages?.(this.supportedLanguages);
        return headerLanguage || this.fallbackLng;
    },

    listen: function() {
        return (req, res, next) => {
            req.language = this.detectLanguage(req);
            req.t = i18next.getFixedT(req.language);
            res.locals.t = req.t;
            next();
        };
    },

}

export { languageMiddleware };