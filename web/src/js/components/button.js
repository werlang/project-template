/**
 * DOM component for async-safe buttons.
 */
export default class Button {
    /**
     * @param {{ element?: HTMLButtonElement, text?: string, icon?: string, title?: string }} options
     */
    constructor({ element, text, icon, title } = {}) {
        this.element = element || document.createElement('button');

        if (icon) {
            text = `<i class="fa-solid fa-${icon}"></i> ${text || ''}`;
        }
        if (text) {
            this.element.innerHTML = text;
        }
        if (title) {
            this.element.setAttribute('title', title);
        }
        if (this.element.disabled) {
            this.disable(false);
        }
    }

    get() {
        return this.element;
    }

    /**
     * Disables the button and optionally shows a spinner.
     *
     * @param {boolean} spin
     * @returns {Button}
     */
    disable(spin = true) {
        const width = this.element.offsetWidth;
        this.element.setAttribute('disabled', true);
        if (!this.isDisabled) {
            this.oldHTML = this.element.innerHTML;
        }
        if (spin) {
            this.element.style.width = `${width}px`;
            this.element.innerHTML = '<i class="fa-solid fa-spinner fa-spin-pulse"></i>';
        }
        this.isDisabled = true;
        return this;
    }

    /**
     * Restores the button after a disabled state.
     *
     * @returns {Button}
     */
    enable() {
        this.element.removeAttribute('style');
        if (!this.isDisabled) return this;
        this.element.innerHTML = this.oldHTML;
        this.element.removeAttribute('disabled');
        this.isDisabled = false;
        return this;
    }

    /**
     * Binds a guarded async click callback.
     *
     * @param {(event: MouseEvent, button: Button) => Promise<void>|void} callback
     * @returns {Button}
     */
    click(callback) {
        if (!callback) {
            this.get().click();
            return this;
        }

        this.get().addEventListener('click', async event => {
            if (this.isDisabled) return;
            try {
                this.disable();
                await callback(event, this);
            }
            finally {
                this.enable();
            }
        });
        return this;
    }
}
