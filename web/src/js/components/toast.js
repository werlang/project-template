/**
 * DOM component for small transient messages.
 */
export default class Toast {
    /**
     * @param {string} text
     * @param {{ timeOut?: number, type?: string }} options
     */
    constructor(text, { timeOut, type } = {}) {
        let container = document.querySelector('#toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.append(container);
        }

        this.element = document.createElement('div');
        this.element.classList.add('toast');
        if (type) {
            this.element.classList.add(type);
        }
        this.element.textContent = text;
        container.prepend(this.element);

        this.timeOut = timeOut === undefined ? 5000 : timeOut;
        if (this.timeOut > 0) {
            this.fade();
        }
    }

    /**
     * Fades and removes the toast.
     *
     * @param {number} timeOut
     */
    fade(timeOut = this.timeOut) {
        setTimeout(() => this.element.classList.add('fade'), Math.max(timeOut - 1000, 0));
        setTimeout(() => {
            this.element.remove();
            const container = document.querySelector('#toast-container');
            if (container && !container.querySelector('.toast')) {
                container.remove();
            }
        }, timeOut);
    }
}
