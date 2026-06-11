import Button from './button.js';

/**
 * DOM component for the sample item form.
 */
export default class ItemForm {
    /**
     * @param {{ element: HTMLFormElement }} options
     */
    constructor({ element }) {
        this.element = element;
        this.submitButton = new Button({
            element: element.querySelector('button[type="submit"]'),
        });
    }

    /**
     * Reads the current form data.
     *
     * @returns {{ name: string, description: string }}
     */
    getData() {
        const data = new FormData(this.element);
        return {
            name: String(data.get('name') || '').trim(),
            description: String(data.get('description') || '').trim(),
        };
    }

    /**
     * Resets the form inputs.
     */
    clear() {
        this.element.reset();
        this.element.querySelector('input, textarea')?.focus();
    }

    /**
     * Binds guarded submit behavior.
     *
     * @param {(data: { name: string, description: string }) => Promise<void>|void} callback
     */
    submit(callback) {
        this.element.addEventListener('submit', async event => {
            event.preventDefault();
            try {
                this.submitButton.disable();
                await callback(this.getData());
            }
            finally {
                this.submitButton.enable();
            }
        });
    }
}
