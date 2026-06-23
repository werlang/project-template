import i18next from 'i18next';
import path from 'path';
import fs from 'fs/promises';

const languageMiddleware = {

    fallbackLng: 'en',

    // Function to load a single translation file
    loadLocale: async function(lng, ns) {
        const filePath = path.join(import.meta.dirname, '../locales/', lng, `${ns}.json`);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const file = JSON.parse(content);
            return { [lng]: { [ns]: file } };
        }
        catch (error) {
            console.error(`Could not load translation file for ${lng} at ${filePath}`);
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
        i18next.init({
            fallbackLng: this.fallbackLng,
            resources: await this.loadLocales(languages, namespaces),
            // debug: true,
        });
    },

    listen: function() {
        return async (req, res, next) => {
            // check if there are language cookies
            if (req.cookies.language) {
                req.language = req.cookies.language;
            }
            else {
                const header = req.headers['accept-language'];
                const language = header ? header.split(',')[0].split('-')[0] : this.fallbackLng;
                req.language = i18next.hasResourceBundle(language) ? language : this.fallbackLng;
            }
            
            i18next.changeLanguage(req.language);
            res.locals.t = i18next.t.bind(i18next);
            next();
        }
    },

}

export { languageMiddleware };