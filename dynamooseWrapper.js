const checkUniqueFields = require("./uniqueCheck");

function wrapModel(model) {
    return new Proxy(model, {
        get(target, prop) {
            if (prop === "create") {
                return async (data, options) => {
                    await checkUniqueFields(target, data);
                    return target.create(data, options);
                };
            }
            if (prop === "save") {
                return async function () {
                    await checkUniqueFields(target, this);
                    return target.prototype.save.apply(this, arguments);
                };
            }
            return target[prop];
        },
    });
}

module.exports = wrapModel;