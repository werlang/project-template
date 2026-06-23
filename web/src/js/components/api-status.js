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
        this.element.dataset.status = state;
        this.text.textContent = message;
    }
}
