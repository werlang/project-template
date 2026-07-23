# Comment Patterns for Project Template

Use these patterns when touched code in `web/` or `api/` needs to explain logic beyond what variable names and syntax reveal.

## Good JSDoc Focus

Document inputs, returns, mutations, side-effects, and thrown errors (`CustomError`) accurately.

### Weak JSDoc (API Model)

```js
/**
 * Gets user by id.
 * @param {number} id
 */
async findById(id) {
  return await db.query('SELECT * FROM users WHERE id = ?', [id]);
}
```

### Better JSDoc (API Model)

```js
/**
 * Fetches a single user record by primary key, omitting sensitive hash fields.
 *
 * @param {number|string} id Unique user ID.
 * @returns {Promise<Object|null>} Normalized user object in camelCase, or null if not found.
 * @throws {CustomError} 500 DB query execution failure.
 */
async findById(id) {
  // ...
}
```

---

## Good Section & Intent Comment Focus

Explain **why** specific logic, ordering, or validation constraints exist rather than repeating the code line.

### Weak Line Comment

```js
// Check if user is null
if (!user) {
  throw new CustomError(404, 'User not found', 'USER_NOT_FOUND');
}
```

### Better Intent Comment

```js
// Guard against inactive or soft-deleted accounts before generating authentication tokens.
if (!user || user.isArchived) {
  throw new CustomError(404, 'User not found', 'USER_NOT_FOUND');
}
```

---

## Frontend DOM & Model Comments (`web/src/js/`)

Explain DOM selector state guarantees and Map lookup data structures (per project conventions avoiding `data-*` attributes).

### Better DOM Interaction Comment

```js
// Use an in-memory lookup map keyed by item ID to avoid storing application data in DOM attributes.
const itemData = this.itemsMap.get(selectedId);
if (!itemData) {
  return;
}
```

---

## Multi-Phase Logic Headers

When a route handler or helper function performs multiple steps (e.g., validation, DB transaction, side effects), label each phase clearly:

```js
// Phase 1: Validate payload schema and resolve localized field constraints.
// ...

// Phase 2: Execute atomic MySQL mutation with optimistic locking.
// ...

// Phase 3: Format camelCase response payload for client consumption.
// ...
```

---

## Final Check

Before completing any task:

1. Remove comments that merely restate standard JavaScript syntax.
2. Ensure JSDoc types, params, `@returns`, and `@throws` match the updated function signature.
3. Verify comments accurately reflect true runtime behavior.
