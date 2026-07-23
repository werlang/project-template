/**
 * Translator
 * Client-side i18n wrapper around i18next + TemplateVar resources.
 *
 * Usage:
 *   const translator = new Translator();
 *   translator.translate('title', 'index');
 *   translator.translateApiError(errorPayload, 'api-responses');
 *   Translator.bindLanguageSwitcher();
 */

import { Cookie } from './cookies.js';
import i18next from 'i18next';
import { TemplateVar } from './template-var.js';

class Translator {

    static cache = {};
    static loaded = false;

    constructor() {
        const allowedLanguages = ['en', 'pt'];
        const navigatorLanguage = typeof navigator !== 'undefined' && navigator.language
            ? navigator.language.split('-')[0]
            : 'en';
        const cookieLanguage = typeof document !== 'undefined' ? new Cookie('language').get() : null;

        this.languages = [cookieLanguage || (allowedLanguages.includes(navigatorLanguage) ? navigatorLanguage : allowedLanguages[0])];

        if (!cookieLanguage && typeof document !== 'undefined') {
            new Cookie('language').set(this.languages[0], 365);
        }

        if (Translator.loaded) {
            const translations = TemplateVar.get('translations') || {};
            const lang = this.languages[0];
            for (const ns of Object.keys(translations)) {
                i18next.addResourceBundle(lang, ns, translations[ns], true, true);
            }
        }
    }

    static currentLanguage() {
        return i18next.language;
    }

    // bind the language switcher
    static bindLanguageSwitcher() {
        if (typeof document === 'undefined') return;
        document.querySelectorAll('footer #language a').forEach(e => e.addEventListener('click', () => {
            new Cookie('language').set(e.id, 365);
            location.reload();
        }));
    }

    init() {
        if (!Translator.loaded) {
            i18next.init({
                fallbackLng: 'en',
                resources: {
                    [this.languages[0]]: TemplateVar.get('translations') || {},
                },
            });
            i18next.changeLanguage(this.getLanguage());
            Translator.loaded = true;
        } else {
            const translations = TemplateVar.get('translations') || {};
            const lang = this.languages[0];
            for (const ns of Object.keys(translations)) {
                i18next.addResourceBundle(lang, ns, translations[ns], true, true);
            }
        }
        return (key, ns, modifiers) => this.translate(key, ns, modifiers);
    }

    getLanguage() {
        if (typeof document !== 'undefined') {
            const cookieLang = new Cookie('language').get();
            if (cookieLang) return cookieLang;
        }
        if (typeof navigator !== 'undefined' && navigator.language) {
            return navigator.language.split('-')[0];
        }
        return 'en';
    }

    translate(key, ns, modifiers = {}) {
        if (!Translator.loaded) {
            this.init();
        }

        return i18next.t(key, { ns, ...modifiers });
    }

    /**
     * Translates an API error object or payload using its error code or message code.
     *
     * @param {Object|Error|string} errorPayload - Error response object, Error instance, or code.
     * @param {string} [defaultNamespace='api-responses'] - i18n namespace to search.
     * @param {Object} [modifiers={}] - Interpolation variables for i18next.
     * @returns {string} Localized error message or human-readable fallback.
     */
    translateApiError(errorPayload, defaultNamespace = 'api-responses', modifiers = {}) {
        if (!errorPayload) {
            return '';
        }

        const data = errorPayload?.data || errorPayload || {};
        const code = data.code || data.messageCode || data.errorCode || errorPayload?.code || (typeof errorPayload === 'string' ? errorPayload : null);
        const fallbackMessage = data.message || errorPayload?.message || data.error || (typeof errorPayload === 'string' ? errorPayload : null);

        if (code) {
            const translated = this.translate(code, defaultNamespace, modifiers);
            if (translated && translated !== code) {
                return translated;
            }
        }

        if (fallbackMessage) {
            const translated = this.translate(fallbackMessage, defaultNamespace, modifiers);
            if (translated && translated !== fallbackMessage) {
                return translated;
            }
            return fallbackMessage;
        }

        return '';
    }

}

export { Translator };
