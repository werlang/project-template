/**
 * DOM component that renders the sample item collection.
 */
export class ItemList {
    /**
     * @param {{ element: HTMLElement }} options
     */
    constructor({ element }) {
        this.element = element;
    }

    /**
     * Renders loading copy while data is being fetched.
     */
    loading() {
        this.element.innerHTML = '<p class="muted">Loading items...</p>';
    }

    /**
     * Renders an empty state.
     */
    empty() {
        this.element.innerHTML = '<p class="muted">No items yet.</p>';
    }

    /**
     * Renders item cards from model instances.
     *
     * @param {{ id?: number, name?: string, description?: string }[]} items
     */
    render(items) {
        if (!items.length) {
            this.empty();
            return;
        }

        this.element.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('article');
            row.classList.add('item-row', 'surface-subtle');
            row.innerHTML = `
                <div>
                    <h3></h3>
                    <p></p>
                </div>
                <span class="item-id"></span>
            `;
            row.querySelector('h3').textContent = item.name;
            row.querySelector('p').textContent = item.description || 'No description';
            row.querySelector('.item-id').textContent = item.id ? `#${item.id}` : '';
            this.element.appendChild(row);
        });
    }

    /**
     * Renders an error state.
     *
     * @param {string} message
     */
    error(message) {
        this.element.innerHTML = `<p class="error"></p>`;
        this.element.querySelector('.error').textContent = message;
    }
}
