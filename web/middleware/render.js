/**
 * Creates a render middleware that injects fixed server values into every view.
 *
 * @param {Record<string, unknown>} fixedVars
 * @returns {import('express').RequestHandler}
 */
export default fixedVars => (req, res, next) => {
    res.templateRender = (view, templateVars = {}) => {
        const runtimeVars = {
            ...fixedVars,
            ...templateVars,
        };

        for (const key of Object.keys(runtimeVars)) {
            if (runtimeVars[key] === undefined || runtimeVars[key] === null) {
                delete runtimeVars[key];
            }
        }

        res.render(view, {
            ...runtimeVars,
            'template-vars': `<script id="template-vars" type="application/json">${JSON.stringify(runtimeVars)}</script>`,
        });
    };

    next();
};
