import BaseComponent from './base-component.js';

/**
 * Lightweight form-field wrapper for inputs and textareas.
 */
export default class Input extends BaseComponent {
    /**
     * @param {HTMLInputElement|HTMLTextAreaElement} element
     */
    constructor(element) {
        super(element || document.createElement('input'));
        this.value = this.get().value || '';
        this.#syncFilledState();
        this.on(this.get(), 'input', () => {
            this.value = this.get().value;
            this.#syncFilledState();
            this.clearError();
        });
    }

    /**
     * Sets the field value and syncs its visual state.
     *
     * @param {unknown} value
     * @returns {Input}
     */
    setValue(value) {
        if (this.get().type === 'checkbox') {
            this.get().checked = Boolean(value);
            this.value = this.getValue();
            this.#syncFilledState();
            return this;
        }

        if (this.get().type === 'radio') {
            this.get().checked = String(this.get().value) === String(value);
            this.value = this.getValue();
            this.#syncFilledState();
            return this;
        }

        this.get().value = value == null ? '' : String(value);
        this.value = this.get().value;
        this.#syncFilledState();
        return this;
    }

    /**
     * Returns the value in the correct shape for the input type.
     *
     * @returns {string|boolean}
     */
    getValue() {
        if (this.get().type === 'checkbox') {
            return this.get().checked;
        }
        if (this.get().type === 'radio') {
            return this.get().checked ? this.get().value : '';
        }
        return this.get().value;
    }

    /**
     * Marks the field invalid and exposes the message to assistive tech.
     *
     * @param {string} message
     * @returns {Input}
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
     * Clears the field invalid state.
     *
     * @returns {Input}
     */
    clearError() {
        this.get().classList.remove('error');
        this.get().removeAttribute('aria-invalid');
        this.get().removeAttribute('data-error');
        return this;
    }

    /**
     * Registers an input event callback.
     *
     * @param {(event: Event, input: Input) => void} callback
     * @returns {Input}
     */
    input(callback) {
        this.on(this.get(), 'input', event => callback(event, this));
        return this;
    }

    /**
     * Registers a keydown event callback.
     *
     * @param {(event: KeyboardEvent, input: Input) => void} callback
     * @returns {Input}
     */
    keyDown(callback) {
        this.on(this.get(), 'keydown', event => callback(event, this));
        return this;
    }

    /**
     * Syncs the filled class without forcing project-specific markup.
     */
    #syncFilledState() {
        this.get().classList.toggle('filled', Boolean(this.getValue()));
    }
}
