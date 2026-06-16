import Button from './button.js';
import Input from './input.js';
import Select from './select.js';
import LocalData from '../helpers/local-data.js';

const DEFAULT_AUTOSAVE_DELAY = 500;

/**
 * Generic form component with grouped field reads, validation, autosave, and guarded submit.
 */
export default class Form {
    #submitHandler = null;

    /**
     * @param {HTMLFormElement|HTMLElement} element
     * @param {{ autoSave?: { enabled?: boolean, key?: string, exclude?: string[], include?: string[], expires?: string|number|Date, delay?: number }, focusFirst?: boolean }} options
     */
    constructor(element, { autoSave = {}, focusFirst = true } = {}) {
        if (!element) {
            throw new Error('Form component requires an element.');
        }

        this.dom = element;
        if (this.dom instanceof HTMLFormElement) {
            this.dom.noValidate = true;
        }
        this.autoSave = { enabled: false, ...autoSave };
        this.buttons = Object.fromEntries(
            Array.from(element.querySelectorAll('button[id]')).map(button => [button.id, new Button({ element: button })])
        );
        this.inputs = {};
        this.selects = {};

        element.querySelectorAll('input, textarea').forEach(element => this.#registerInput(element));
        element.querySelectorAll('select').forEach(element => {
            this.selects[element.id || element.name] = new Select(element);
        });

        this.#bindEnterToDefaultButton();
        this.loadAutoSave();
        this.#bindAutoSave();

        if (focusFirst) {
            this.getFieldList(this.inputs)[0]?.get().focus();
        }
    }

    /**
     * Registers validation rules and returns grouped pass/fail information.
     *
     * @param {{ id: string, rule: (value: unknown, fields: Record<string, Input|Input[]>) => boolean, message: string }[]} rules
     * @param {{ silent?: boolean }} options
     * @returns {{ success: { total: number, list: string[] }, fail: { total: number, list: string[], messages: Record<string, string> } }}
     */
    validate(rules = [], { silent = false } = {}) {
        const response = {
            success: { total: 0, list: [] },
            fail: { total: 0, list: [], messages: {} },
        };

        for (const { id, rule, message } of rules) {
            const fields = this.#asArray(this.getInput(id) || this.getSelect(id));
            if (!fields.length) {
                continue;
            }

            const value = this.#readFieldValue(id);
            const valid = Boolean(rule(value, this.inputs));

            if (valid) {
                fields.forEach(field => field.clearError());
                response.success.total += 1;
                response.success.list.push(id);
                continue;
            }

            if (!silent) {
                fields[0].setError(message);
            }
            response.fail.total += 1;
            response.fail.list.push(id);
            response.fail.messages[id] = message;
            break;
        }

        return response;
    }

    /**
     * Returns every button or one button by id.
     *
     * @param {string} id
     * @returns {Button|Button[]|false}
     */
    getButton(id) {
        if (!id) {
            return Object.values(this.buttons);
        }
        return this.buttons[id] || false;
    }

    /**
     * Returns every input or one input/group by id or name.
     *
     * @param {string} id
     * @returns {Input|Input[]|false}
     */
    getInput(id) {
        if (!id) {
            return Object.values(this.inputs);
        }
        return this.inputs[id] || false;
    }

    /**
     * Returns every select or one select by id/name.
     *
     * @param {string} id
     * @returns {Select|Select[]|false}
     */
    getSelect(id) {
        if (!id) {
            return Object.values(this.selects);
        }
        return this.selects[id] || false;
    }

    /**
     * Queries inside the form or returns the form element.
     *
     * @param {string} selector
     * @returns {Element|HTMLElement|null}
     */
    get(selector) {
        return selector ? this.dom.querySelector(selector) : this.dom;
    }

    /**
     * Reads all form data, preserving multi-value field names as arrays.
     *
     * @returns {Record<string, FormDataEntryValue|FormDataEntryValue[]>}
     */
    getData() {
        const data = {};
        for (const [key, value] of new FormData(this.dom).entries()) {
            if (data[key] === undefined) {
                data[key] = value;
                continue;
            }

            data[key] = Array.isArray(data[key])
                ? [...data[key], value]
                : [data[key], value];
        }
        return data;
    }

    /**
     * Adds guarded submit behavior with automatic button restore.
     *
     * @param {(data: Record<string, FormDataEntryValue|FormDataEntryValue[]>, form: Form, event: SubmitEvent) => Promise<void>|void} callback
     * @param {{ reset?: boolean }} options
     * @returns {Form}
     */
    submit(callback, { reset = false } = {}) {
        if (this.#submitHandler) {
            this.dom.removeEventListener('submit', this.#submitHandler);
        }

        this.#submitHandler = async event => {
            event.preventDefault();
            const button = this.#getSubmitButton();

            try {
                button?.disable();
                await callback(this.getData(), this, event);
                if (reset) {
                    this.clear();
                }
                else if (this.autoSave.enabled) {
                    this.#storage().remove();
                }
            }
            finally {
                button?.enable();
            }
        };

        this.dom.addEventListener('submit', this.#submitHandler);
        return this;
    }

    /**
     * Loads autosaved data into matching controls.
     *
     * @returns {Record<string, unknown>|false}
     */
    loadAutoSave() {
        if (!this.autoSave.enabled || !this.autoSave.key) {
            return false;
        }

        const savedData = this.#storage().get();
        if (!savedData || typeof savedData !== 'object') {
            return false;
        }

        Object.entries(savedData).forEach(([key, value]) => {
            const inputs = this.#asArray(this.getInput(key));
            if (inputs.length) {
                inputs.forEach(input => input.setValue(value));
            }

            const select = this.getSelect(key);
            if (select) {
                select.set(value);
            }
        });

        return savedData;
    }

    /**
     * Saves selected fields into local storage when autosave is enabled.
     *
     * @param {Record<string, unknown>} fields
     * @returns {Form}
     */
    save(fields = {}) {
        if (!this.autoSave.enabled || !this.autoSave.key) {
            return this;
        }

        const storage = this.#storage();
        const data = storage.get() || {};
        Object.entries(fields).forEach(([key, value]) => {
            data[key] = value;
        });
        storage.set({ data, expires: this.autoSave.expires || '1d' });
        return this;
    }

    /**
     * Resets controls and removes autosaved data.
     *
     * @returns {Form}
     */
    clear() {
        this.dom.reset();
        this.getFieldList(this.inputs).forEach(input => {
            input.setValue(input.get().type === 'checkbox' ? input.get().checked : input.get().value);
            input.clearError();
        });
        this.getFieldList(this.selects).forEach(select => select.clearError());
        if (this.autoSave.enabled && this.autoSave.key) {
            this.#storage().remove();
        }
        this.getFieldList(this.inputs)[0]?.get().focus();
        return this;
    }

    /**
     * Flattens a map of fields into a list.
     *
     * @param {Record<string, Input|Input[]|Select|Select[]>} fields
     * @returns {(Input|Select)[]}
     */
    getFieldList(fields) {
        return Object.values(fields).flatMap(field => this.#asArray(field));
    }

    /**
     * Registers an input under id or name, grouping duplicate names.
     *
     * @param {HTMLInputElement|HTMLTextAreaElement} element
     */
    #registerInput(element) {
        const key = element.id || element.name;
        if (!key) {
            return;
        }

        const input = new Input(element);
        if (element.name && !element.id) {
            this.inputs[element.name] = [...this.#asArray(this.inputs[element.name]), input];
            return;
        }

        this.inputs[key] = input;
    }

    /**
     * Binds Enter to the default button for non-form containers.
     */
    #bindEnterToDefaultButton() {
        if (this.dom.tagName === 'FORM') {
            return;
        }

        this.getFieldList(this.inputs).forEach(input => {
            if (input.get().tagName === 'TEXTAREA' || input.get().type === 'checkbox') {
                return;
            }

            input.keyDown(event => {
                if (event.key === 'Enter') {
                    this.getButton().find(button => button.get().classList.contains('default'))?.click();
                }
            });
        });
    }

    /**
     * Binds debounced autosave listeners for configured fields.
     */
    #bindAutoSave() {
        if (!this.autoSave.enabled || !this.autoSave.key) {
            return;
        }

        let timeoutId = null;
        let pendingData = {};
        const delay = Number(this.autoSave.delay || DEFAULT_AUTOSAVE_DELAY);
        const queueSave = (key, value) => {
            pendingData[key] = value;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.save(pendingData);
                pendingData = {};
            }, delay);
        };

        Object.entries(this.inputs).forEach(([key, field]) => {
            if (!this.#shouldAutoSave(key)) {
                return;
            }

            this.#asArray(field).forEach(input => input.input(() => queueSave(key, this.#readFieldValue(key))));
        });

        Object.entries(this.selects).forEach(([key, select]) => {
            if (this.#shouldAutoSave(key)) {
                select.change(() => queueSave(key, select.get().value));
            }
        });
    }

    /**
     * Reports whether one field is included by autosave filters.
     *
     * @param {string} key
     * @returns {boolean}
     */
    #shouldAutoSave(key) {
        if (this.autoSave.exclude?.includes(key)) {
            return false;
        }
        if (this.autoSave.include) {
            return this.autoSave.include.includes(key);
        }
        return true;
    }

    /**
     * Reads a field value, including grouped checkboxes/radios.
     *
     * @param {string} key
     * @returns {unknown}
     */
    #readFieldValue(key) {
        const fields = this.#asArray(this.getInput(key) || this.getSelect(key));
        if (!fields.length) {
            return undefined;
        }

        if (fields.length === 1) {
            return fields[0].getValue ? fields[0].getValue() : fields[0].get().value;
        }

        const checkedValues = fields
            .filter(field => field.get().checked)
            .map(field => field.get().value);
        return checkedValues;
    }

    /**
     * Finds the submit button, preferring the native submit control.
     *
     * @returns {Button|undefined}
     */
    #getSubmitButton() {
        return this.getButton().find(button => button.get().type === 'submit');
    }

    /**
     * Creates the local-storage adapter for this form.
     *
     * @returns {LocalData}
     */
    #storage() {
        return new LocalData({ id: this.autoSave.key });
    }

    /**
     * Normalizes a field or field group into an array.
     *
     * @param {unknown} value
     * @returns {Array}
     */
    #asArray(value) {
        if (!value) {
            return [];
        }
        return Array.isArray(value) ? value : [value];
    }
}
