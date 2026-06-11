/**
 * Reads server-rendered runtime values from the `template-vars` script tag.
 */
export default class TemplateVar {
    static vars = {};
    static isBuilt = false;

    /**
     * Parses and removes the runtime variable script tag.
     */
    static build() {
        const script = document.querySelector('#template-vars');
        if (!script) return;

        try {
            TemplateVar.vars = JSON.parse(script.textContent || '{}');
        }
        catch (error) {
            console.error('Error parsing template variables:', error);
            TemplateVar.vars = {};
        }

        script.remove();
        TemplateVar.isBuilt = true;
    }

    /**
     * Returns one runtime value, or the full runtime object when no key is provided.
     *
     * @param {string} key
     * @returns {unknown}
     */
    static get(key) {
        if (!TemplateVar.isBuilt) {
            TemplateVar.build();
        }
        if (!key) {
            return TemplateVar.vars;
        }
        return TemplateVar.vars[key];
    }
}
