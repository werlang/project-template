import '../css/index.css';

import { Button } from './components/button.js';
import { Toast } from './components/toast.js';
import { ItemList } from './components/item-list.js';
import { ItemForm } from './components/item-form.js';
import { ApiStatus } from './components/api-status.js';
import { Item } from './model/item.js';
import { LocalData } from './helpers/local-data.js';
import { Api } from './helpers/api.js';
import { Tooltip } from './components/tooltip.js';
import { Translator } from './helpers/translate.js';

Tooltip.bindAll();
const translator = new Translator();

const itemList = new ItemList({
    element: document.querySelector('#item-list'),
});
const itemForm = new ItemForm({
    element: document.querySelector('#item-form'),
});
const apiStatus = new ApiStatus({
    element: document.querySelector('.status-pill'),
});
const refreshButton = new Button({
    element: document.querySelector('#refresh-items'),
});
const lastRefresh = new LocalData({ id: 'template:last-refresh' });

Toast.consumeFlash();

/**
 * Loads and renders sample items through the frontend model boundary.
 */
async function loadItems() {
    itemList.loading();
    try {
        const items = await Item.getAll();
        itemList.render(items);
        lastRefresh.set({ data: Date.now(), expires: '1d' });
    }
    catch (error) {
        const message = translator.translateApiError(error);
        itemList.error(message);
        new Toast(message, { type: 'error' });
    }
}

/**
 * Checks the API readiness endpoint without bypassing the helper layer.
 */
async function checkApi() {
    try {
        await new Api().get('ready');
        apiStatus.set('ready', translator.translate('apiReady', 'index'));
    }
    catch {
        apiStatus.set('error', translator.translate('apiUnavailable', 'index'));
    }
}

itemForm.submit(async (data, validation) => {
    if (validation.fail.total) {
        new Toast(validation.fail.messages.name || translator.translate('checkFormFields', 'index'), {
            tone: 'error',
            group: 'item-form-validation',
        });
        return;
    }

    await new Item(data).create();
    itemForm.clear();
    new Toast(translator.translate('itemCreated', 'index'), { tone: 'success', group: 'item-form' });
    await loadItems();
});

refreshButton.click(loadItems);

checkApi();
loadItems();
