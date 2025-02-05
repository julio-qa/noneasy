const checkUniqueFields = require("./checkUniqueFields");

/**
 * Wrapper para o modelo do Dynamoose, interceptando `create()` e `save()`.
 */
function wrapModel(model) {
    return new Proxy(model, {
        get(target, prop) {
            if (!target.Model || !target.Model.schema) {
                throw new Error("⚠️ O esquema (schema) do modelo não foi encontrado.");
            }

            if (prop === "create") {
                return async (data, options) => {
                    await checkUniqueFields(target, data); // 🚀 Verificação automática de unicidade
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
