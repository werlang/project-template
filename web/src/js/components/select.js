import { BaseComponent } from './base-component.js';

/**
 * Native select wrapper with the same validation and event API as Input.
 */
export class Select extends BaseComponent {
    /**
     * @param {HTMLSelectElement} element
     */
    constructor(element) {
        super(element || document.createElement('select'));
        this.value = this.get().value || '';
        this.on(this.get(), 'change', event => {
            this.value = event.target.value;
            this.clearError();
        });
    }

    /**
     * Sets the selected value and dispatches a native change event.
     *
     * @param {string} value
     * @returns {Select}
     */
    set(value) {
        this.get().value = value == null ? '' : String(value);
        this.value = this.get().value;
        this.get().dispatchEvent(new Event('change', { bubbles: true }));
        return this;
    }

    /**
     * Adds one option to the select.
     *
     * @param {string} value
     * @param {string} text
     * @param {Record<string, string>} attributes
     * @returns {Select}
     */
    addOption(value, text, attributes = {}) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        Object.entries(attributes).forEach(([key, attributeValue]) => {
            option.setAttribute(key, attributeValue);
        });
        this.get().appendChild(option);
        return this;
    }

    /**
     * Replaces the select options.
     *
     * @param {{ value: string, text: string, attributes?: Record<string, string> }[]} options
     * @returns {Select}
     */
    addOptions(options = []) {
        this.clear();
        options.forEach(option => this.addOption(option.value, option.text, option.attributes || option.options || {}));
        return this;
    }

    /**
     * Removes every option.
     *
     * @returns {Select}
     */
    clear() {
        this.get().replaceChildren();
        return this;
    }

    /**
     * Registers a change callback.
     *
     * @param {(event: Event, value: string, select: Select) => void} callback
     * @returns {Select}
     */
    change(callback) {
        this.on(this.get(), 'change', event => callback(event, this.get().value, this));
        return this;
    }

    /**
     * Marks the select invalid and focuses it.
     *
     * @param {string} message
     * @returns {Select}
     */
    setError(message) {
        this.get().classList.add('error');
        this.get().setAttribute('aria-invalid', 'true');
        if (message) {
            this.get().setAttribute('data-error', message);
        }
        this.get().focus();
        return this;
    }

    /**
     * Clears the invalid state.
     *
     * @returns {Select}
     */
    clearError() {
        this.get().classList.remove('error');
        this.get().removeAttribute('aria-invalid');
        this.get().removeAttribute('data-error');
        return this;
    }
}
