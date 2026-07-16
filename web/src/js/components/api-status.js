/**
 * DOM component that displays API availability.
 */
export class ApiStatus {
    /**
     * @param {{ element: HTMLElement }} options
     */
    constructor({ element }) {
        this.element = element;
        this.text = element.querySelector('[data-role="api-status"]');
    }

    /**
     * Updates status text and visual state.
     *
     * @param {'loading'|'ready'|'error'} state
     * @param {string} message
     */
    set(state, message) {
        this.element.classList.remove('status-pill--ready', 'status-pill--error');
        if (state === 'ready') {
            this.element.classList.add('status-pill--ready');
        }
        else if (state === 'error') {
            this.element.classList.add('status-pill--error');
        }
        this.text.textContent = message;
    }
}
