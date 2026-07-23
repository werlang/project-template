import { Form } from './form.js';
import { Translator } from '../helpers/translate.js';

/**
 * DOM component for the sample item form.
 */
export class ItemForm {
    /**
     * @param {{ element: HTMLFormElement }} options
     */
    constructor({ element }) {
        this.form = new Form(element, {
            autoSave: {
                enabled: true,
                key: 'template:item-form-draft',
                include: ['name', 'description'],
            },
        });
        this.translator = new Translator();
    }

    /**
     * Reads the current form data.
     *
     * @returns {{ name: string, description: string }}
     */
    getData() {
        const data = this.form.getData();
        return {
            name: String(data.name || '').trim(),
            description: String(data.description || '').trim(),
        };
    }

    /**
     * Resets the form inputs.
     */
    clear() {
        this.form.clear();
    }

    /**
     * Binds guarded submit behavior.
     *
     * @param {(data: { name: string, description: string }) => Promise<void>|void} callback
     */
    submit(callback) {
        this.form.submit(async () => {
            const validation = this.form.validate([
                {
                    id: 'name',
                    rule: value => String(value || '').trim().length > 0,
                    message: this.translator.translate('NAME_REQUIRED', 'api-responses'),
                },
            ]);

            if (validation.fail.total) {
                return callback(this.getData(), validation);
            }

            return callback(this.getData(), validation);
        });
    }
}
