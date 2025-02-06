const dynamoose = require("dynamoose");

class Manager {
    static #configured = false;
    static #models = {};

    static configure(config) {
        if (Manager.#configured) return;

        if (!config || !config.region || !config.credentials?.accessKeyId || !config.credentials?.secretAccessKey) {
            throw new Error("Invalid AWS configuration.");
        }

        dynamoose.aws.ddb.set(new dynamoose.aws.ddb.DynamoDB(config));
        Manager.#configured = true;
    }

    static define(modelName, schema, options = {}) {
        if (!Manager.#configured) {
            throw new Error("Connection is not configured. Call Model.configure() first.");
        }
        if (Manager.#models[modelName]) {
            return Manager.#models[modelName];
        }
        const schemaInstance = new dynamoose.Schema(schema, options);
        const model = dynamoose.model(modelName, schemaInstance);
        const modelAPI = {
            create: async (item) => {
                await Manager.#checkUniqueFields(model, schema, item);
                return model.create(item);
            },
            save: async (item) => {
                await Manager.#checkUniqueFields(model, schema, item, item.id);
                return model.update(item);
            },
            get: async (id) => {
                return model.get(id);
            },
            update: async (id, updateData) => {
                if (!id) throw new Error("ID is required for updating.");
                const existingItem = await model.get(id);
                if (!existingItem) throw new Error("Item not found.");

                const updatedItem = { ...existingItem.toJSON(), ...updateData };
                return model.update(updatedItem);
            },
            delete: async (id) => {
                return model.delete(id);
            },
            raw: () => model,
        };

        Manager.#models[modelName] = modelAPI;
        return modelAPI;
    }

    static async #checkUniqueFields(model, schema, item, excludeId = null) {
        const uniqueFields = Object.keys(schema).filter(key => schema[key].unique);

        for (const field of uniqueFields) {
            const value = item[field];
            if (value) {
                const existingItem = await model.scan({ [field]: value }).exec();
                if (existingItem.length > 0 && (!excludeId || existingItem[0].id !== excludeId)) {
                    throw new Error(`O valor '${value}' para o campo '${field}' já existe.`);
                }
            }
        }
    }

}

module.exports = { Model: Manager };
