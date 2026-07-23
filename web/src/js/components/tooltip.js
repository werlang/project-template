const TOOLTIP_VISIBLE_CLASS = 'tooltip--visible';
const TOOLTIP_GAP = 14;
const TOOLTIP_VIEWPORT_PADDING = 18;
const TOOLTIP_OPEN_DELAY = 1000;
let tooltipTokenCounter = 0;

/**
 * CSS selector matching elements whose `title` attribute should be promoted to
 * a custom tooltip. Form controls, media, and embeds are excluded because their
 * `title` is primarily an accessibility label rather than hover guidance.
 */
const TITLE_SELECTOR = '[title]:not(iframe):not(img):not(input):not(select):not(textarea):not(.tooltip__bubble)';

/**
 * Returns a trimmed string when the provided value is usable.
 */
function readText(value, fallback = '') {
    const normalizedValue = typeof value === 'string' ? value.trim() : '';
    return normalizedValue || fallback;
}

/**
 * Normalizes class name input into a flat array of class tokens.
 */
function normalizeClassList(value) {
    if (Array.isArray(value)) {
        return value.flatMap((item) => normalizeClassList(item));
    }

    if (typeof value !== 'string' || !value.trim()) {
        return [];
    }

    return value.trim().split(/\s+/);
}

/**
 * Expands a Font Awesome icon descriptor into concrete class names.
 */
function normalizeIconClasses(icon) {
    const normalizedIcon = readText(icon, 'circle-question');

    if (normalizedIcon.includes(' ')) {
        return normalizedIcon.split(/\s+/);
    }

    return ['fa-solid', `fa-${normalizedIcon}`];
}

/**
 * Resolves the placement modifier applied to the tooltip root.
 */
function readPlacement(placement) {
    return readText(placement, 'top').toLowerCase() === 'bottom'
        ? 'bottom'
        : 'top';
}

/**
 * Reports whether a focus target remains inside the current tooltip.
 */
function isWithinTooltip(root, target) {
    return Boolean(root && target instanceof Node && root.contains(target));
}

/**
 * Creates a unique DOM id for one tooltip bubble.
 */
function createTooltipToken() {
    tooltipTokenCounter += 1;
    return `tooltip-${tooltipTokenCounter}`;
}

export class Tooltip {
    #element;
    #subscriptions = [];
    #trigger;
    #bubble;
    #content;
    #placement;
    #root;
    #openDelay = 0;
    #closeDelay = 0;
    #openTimer = null;
    #closeTimer = null;
    #usesHostTrigger = false;
    #standalone = false;
    #visible = false;
    #hasContent = false;
    #destroyed = false;

    static tooltipList = [];
    static disconnectObserver = null;

    /**
     * Elements already promoted from a native `title` attribute, tracked to
     * avoid creating duplicate tooltip instances for the same host.
     */
    static boundElements = new WeakSet();

    /**
     * Observer that promotes `title` attributes on dynamically inserted nodes.
     */
    static bindObserver = null;

    /**
     * Creates a reusable tooltip cue with hover and focus behavior.
     */
    constructor({
        element = null,
        content = '',
        label = 'Show help',
        icon = 'circle-info',
        placement = 'top',
        openDelay = TOOLTIP_OPEN_DELAY,
        closeDelay = 0,
        customClass,
        useHostTrigger = false,
    } = {}) {
        const hasExistingElement = element instanceof HTMLElement;
        const shouldUseHostTrigger = hasExistingElement && Boolean(useHostTrigger);

        if (element instanceof HTMLElement && element.hasAttribute('title')) {
            if (!readText(content)) {
                content = readText(element.getAttribute('title'), '');
            }
            element.removeAttribute('title');
        }

        const rootElement = hasExistingElement
            ? element
            : document.createElement('span');

        this.#element = rootElement;
        this.#standalone = !hasExistingElement;
        this.#root = rootElement;
        this.#usesHostTrigger = shouldUseHostTrigger;

        rootElement.classList.add(shouldUseHostTrigger ? 'tooltip--host-trigger' : 'tooltip');

        const trigger = shouldUseHostTrigger
            ? rootElement
            : document.createElement('button');

        if (!shouldUseHostTrigger) {
            trigger.type = 'button';
            trigger.className = 'tooltip__trigger';

            const iconElement = document.createElement('i');
            iconElement.classList.add(...normalizeIconClasses(icon));
            iconElement.setAttribute('aria-hidden', 'true');
            trigger.appendChild(iconElement);
        }
        else if (!trigger.hasAttribute('tabindex')) {
            trigger.tabIndex = 0;
        }

        const bubble = document.createElement('span');
        bubble.className = 'tooltip__bubble';
        bubble.id = createTooltipToken();
        bubble.setAttribute('role', 'tooltip');

        const contentElement = document.createElement('span');
        contentElement.className = 'tooltip__content';
        bubble.appendChild(contentElement);

        if (!shouldUseHostTrigger) {
            rootElement.appendChild(trigger);
        }

        this.#trigger = trigger;
        this.#bubble = bubble;
        this.#content = contentElement;
        this.#placement = readPlacement(placement);
        this.#openDelay = Math.max(0, Number(openDelay) || 0);
        this.#closeDelay = Math.max(0, Number(closeDelay) || 0);

        normalizeClassList(customClass).forEach((className) => {
            rootElement.classList.add(className);
        });

        this.#mountBubble();
        this.#applyBubblePlacementClass(this.#placement);
        this.#suppressNativeTitle();

        this.setLabel(label);
        this.setContent(content);

        this.on(trigger, 'mouseenter', () => this.#scheduleOpen());
        this.on(trigger, 'mouseleave', () => {
            this.#clearOpenSchedule();
            this.#scheduleClose();
        });
        this.on(trigger, 'focus', () => this.#scheduleOpen());
        this.on(trigger, 'blur', (event) => {
            this.#clearOpenSchedule();
            if (!isWithinTooltip(trigger, event.relatedTarget)) {
                this.#scheduleClose();
            }
        });
        this.on(trigger, 'keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.#clearTimers();
                this.close();
                this.#trigger.focus();
            }
        });
        this.on(window, 'resize', () => this.#syncPosition());
        this.on(document, 'scroll', () => this.#syncPosition(), true);

        Tooltip.#register(this);
    }

    /**
     * Returns the wrapped DOM element managed by this tooltip.
     */
    get() {
        return this.#element;
    }

    /**
     * Replaces the wrapped DOM element used by the tooltip.
     */
    setElement(element) {
        this.#element = element;
        return this;
    }

    /**
     * Reports whether the tooltip currently has a usable root element.
     */
    isReady() {
        return Boolean(this.#element);
    }

    /**
     * Registers a DOM event listener that is automatically removed on destroy.
     */
    on(target, eventName, listener, options) {
        if (!target || typeof target.addEventListener !== 'function' || typeof listener !== 'function') {
            return this;
        }

        target.addEventListener(eventName, listener, options);
        this.#subscriptions.push({ target, eventName, listener, options });
        return this;
    }

    /**
     * Removes every listener registered by this tooltip instance.
     */
    clearListeners() {
        this.#subscriptions.forEach(({ target, eventName, listener, options }) => {
            target.removeEventListener(eventName, listener, options);
        });

        this.#subscriptions = [];
        return this;
    }

    /**
     * Replaces the wrapped element text content when a root is available.
     */
    setText(text = '') {
        if (this.isReady()) {
            this.#element.textContent = text;
        }

        return this;
    }

    /**
     * Shows or hides the wrapped root element.
     */
    setHidden(hidden) {
        if (this.isReady()) {
            this.#element.hidden = Boolean(hidden);
        }

        return this;
    }

    /**
     * Toggles a CSS class on the wrapped root element.
     */
    toggleClass(className, force) {
        if (this.isReady()) {
            this.#element.classList.toggle(className, force);
        }

        return this;
    }

    /**
     * Returns the interactive cue button used by the tooltip.
     */
    getTrigger() {
        return this.#trigger;
    }

    /**
     * Updates the tooltip message and hides the cue when empty.
     */
    setContent(content = '') {
        const normalizedContent = readText(content);
        this.#hasContent = Boolean(normalizedContent);
        this.#content.textContent = normalizedContent;
        if (!this.#usesHostTrigger) {
            this.#trigger.hidden = !this.#hasContent;
        }

        if (this.#standalone) {
            this.get().hidden = !this.#hasContent;
        }

        if (!this.#hasContent) {
            this.#clearTimers();
            this.close();
        }

        return this;
    }

    /**
     * Updates the accessible label announced for the tooltip cue.
     */
    setLabel(label = 'Show help') {
        this.#trigger.setAttribute('aria-describedby', this.#bubble.id);

        if (!this.#usesHostTrigger) {
            this.#trigger.setAttribute('aria-label', readText(label, 'Show help'));
        }

        return this;
    }

    /**
     * Reports whether the tooltip bubble is currently visible.
     */
    isOpen() {
        return this.#visible;
    }

    /**
     * Shows the tooltip bubble when content is available.
     */
    open() {
        if (this.#destroyed || !this.#hasContent) {
            return this;
        }

        this.#clearCloseSchedule();
        this.#suppressNativeTitle();
        this.#visible = true;
        this.#mountBubble();
        this.#syncPosition();
        this.get().classList.add(TOOLTIP_VISIBLE_CLASS);
        this.#bubble.classList.add(TOOLTIP_VISIBLE_CLASS);
        return this;
    }

    /**
     * Hides the tooltip bubble.
     */
    close() {
        if (this.#destroyed) {
            return this;
        }

        this.#clearOpenSchedule();
        this.#visible = false;
        this.get().classList.remove(TOOLTIP_VISIBLE_CLASS);
        this.#bubble.classList.remove(TOOLTIP_VISIBLE_CLASS);
        return this;
    }

    /**
     * Clears listeners and resets visibility before disposal.
     */
    destroy() {
        if (this.#destroyed) {
            return this;
        }

        this.#clearTimers();
        this.close();
        this.#destroyed = true;
        if (!this.#usesHostTrigger && this.#trigger?.isConnected) {
            this.#trigger.remove();
        }
        if (this.#bubble?.isConnected) {
            this.#bubble.remove();
        }

        Tooltip.#unregister(this);

        return this.clearListeners();
    }

    /**
     * Mounts the floating bubble at the document level to avoid clipping.
     */
    #mountBubble() {
        if (!this.#bubble.isConnected) {
            document.body.appendChild(this.#bubble);
        }
    }

    /**
     * Synchronizes the floating bubble position with the trigger geometry.
     */
    #syncPosition() {
        if (!this.#visible || !this.#bubble.isConnected) {
            return;
        }

        const triggerRect = this.#trigger.getBoundingClientRect();
        const bubbleRect = this.#bubble.getBoundingClientRect();
        const bubbleWidth = bubbleRect.width;
        const bubbleHeight = bubbleRect.height;
        const centerX = triggerRect.left + (triggerRect.width / 2);

        const unclampedLeft = centerX - (bubbleWidth / 2);
        const left = Math.min(
            Math.max(unclampedLeft, TOOLTIP_VIEWPORT_PADDING),
            window.innerWidth - TOOLTIP_VIEWPORT_PADDING - bubbleWidth,
        );

        const preferredPlacement = this.#placement;
        const canShowAbove = triggerRect.top - bubbleHeight - TOOLTIP_GAP >= TOOLTIP_VIEWPORT_PADDING;
        const canShowBelow = triggerRect.bottom + bubbleHeight + TOOLTIP_GAP <= window.innerHeight - TOOLTIP_VIEWPORT_PADDING;
        const resolvedPlacement = preferredPlacement === 'top'
            ? (canShowAbove || !canShowBelow ? 'top' : 'bottom')
            : (canShowBelow || !canShowAbove ? 'bottom' : 'top');

        const top = resolvedPlacement === 'top'
            ? triggerRect.top - bubbleHeight - TOOLTIP_GAP
            : triggerRect.bottom + TOOLTIP_GAP;
        const arrowLeft = Math.min(
            Math.max(centerX - left, 18),
            bubbleWidth - 18,
        );

        this.#applyBubblePlacementClass(resolvedPlacement);
        this.#bubble.style.left = `${Math.round(left)}px`;
        this.#bubble.style.top = `${Math.round(top)}px`;
        this.#bubble.style.setProperty('--tooltip-arrow-left', `${Math.round(arrowLeft)}px`);
    }

    /**
     * Applies the active placement modifier to the floating bubble element.
     */
    #applyBubblePlacementClass(placement) {
        this.#bubble.classList.toggle('tooltip__bubble--top', placement === 'top');
        this.#bubble.classList.toggle('tooltip__bubble--bottom', placement === 'bottom');
    }

    /**
     * Delays tooltip opening so guidance stays available without flashing during casual movement.
     */
    #scheduleOpen() {
        if (!this.#hasContent) {
            return;
        }

        this.#clearCloseSchedule();
        this.#suppressNativeTitle();

        if (this.#visible) {
            return;
        }

        this.#clearOpenSchedule();

        if (this.#openDelay === 0) {
            this.open();
            return;
        }

        this.#openTimer = window.setTimeout(() => {
            this.#openTimer = null;
            this.open();
        }, this.#openDelay);
    }

    /**
     * Delays tooltip closing slightly so small movements do not make the guidance flicker.
     */
    #scheduleClose() {
        this.#clearOpenSchedule();

        if (!this.#visible) {
            return;
        }

        this.#clearCloseSchedule();

        if (this.#closeDelay === 0) {
            this.close();
            return;
        }

        this.#closeTimer = window.setTimeout(() => {
            this.#closeTimer = null;
            this.close();
        }, this.#closeDelay);
    }

    /**
     * Removes any native browser title tooltip so the custom tooltip remains the only hover guidance.
     */
    #suppressNativeTitle() {
        if (!(this.#element instanceof HTMLElement) || !this.#element.hasAttribute('title')) {
            return;
        }

        if (!this.#hasContent) {
            this.setContent(this.#element.getAttribute('title'));
        }

        this.#element.removeAttribute('title');
    }

    #clearOpenSchedule() {
        if (this.#openTimer) {
            window.clearTimeout(this.#openTimer);
            this.#openTimer = null;
        }
    }

    #clearCloseSchedule() {
        if (this.#closeTimer) {
            window.clearTimeout(this.#closeTimer);
            this.#closeTimer = null;
        }
    }

    #clearTimers() {
        this.#clearOpenSchedule();
        this.#clearCloseSchedule();
    }

    /**
     * Registers one tooltip instance with the shared disconnection observer.
     *
     * @param {Tooltip} instance
     */
    static #register(instance) {
        Tooltip.tooltipList.push(instance);
        Tooltip.#ensureDisconnectObserver();
    }

    /**
     * Removes a tooltip instance from the shared registry and tears down observation when unused.
     *
     * @param {Tooltip} instance
     */
    static #unregister(instance) {
        Tooltip.tooltipList = Tooltip.tooltipList.filter((tooltip) => tooltip !== instance);

        if (Tooltip.tooltipList.length === 0 && Tooltip.disconnectObserver) {
            Tooltip.disconnectObserver.disconnect();
            Tooltip.disconnectObserver = null;
        }
    }

    /**
     * Keeps transient tooltips honest by destroying instances as soon as their host element leaves the DOM.
     */
    static #ensureDisconnectObserver() {
        if (Tooltip.disconnectObserver || !document.body) {
            return;
        }

        Tooltip.disconnectObserver = new MutationObserver(() => {
            Tooltip.tooltipList
                .filter((instance) => !instance.#destroyed && !instance.#root?.isConnected)
                .forEach((instance) => instance.destroy());
        });

        Tooltip.disconnectObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Promotes every eligible `title` attribute inside the given root into a
     * custom tooltip, then observes the document for future additions so
     * dynamically inserted content is handled automatically.
     *
     * Call once per page from the page entry module. Safe to call repeatedly:
     * already-bound elements are skipped and the observer is created only once.
     *
     * @param {ParentNode} [root=document.body] - Subtree to scan initially.
     * @returns {typeof Tooltip} The class itself for chaining.
     */
    static bindAll(root = document.body) {
        Tooltip.#bindExistingTitles(root);
        Tooltip.#ensureBindObserver();
        return Tooltip;
    }

    /**
     * Creates host-trigger tooltips for every unbound `[title]` element under root.
     *
     * @param {ParentNode} root
     */
    static #bindExistingTitles(root) {
        if (!root || !root.querySelectorAll) {
            return;
        }

        const elements = root.matches?.(TITLE_SELECTOR)
            ? [root, ...root.querySelectorAll(TITLE_SELECTOR)]
            : [...root.querySelectorAll(TITLE_SELECTOR)];

        for (const element of elements) {
            if (Tooltip.boundElements.has(element)) {
                continue;
            }

            Tooltip.boundElements.add(element);
            new Tooltip({ element, useHostTrigger: true });
        }
    }

    /**
     * Watches the document body for nodes that gain a `title` attribute or are
     * inserted with one, promoting them to custom tooltips on the fly.
     */
    static #ensureBindObserver() {
        if (Tooltip.bindObserver || !document.body) {
            return;
        }

        Tooltip.bindObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
                    const target = mutation.target;
                    if (target instanceof HTMLElement && target.matches(TITLE_SELECTOR)) {
                        Tooltip.#bindExistingTitles(target);
                    }
                    continue;
                }

                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node instanceof HTMLElement) {
                            Tooltip.#bindExistingTitles(node);
                        }
                    }
                }
            }
        });

        Tooltip.bindObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['title'],
        });
    }
}
