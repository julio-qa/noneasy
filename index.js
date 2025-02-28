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

    static #ensureConfigured() {
        if (!Manager.#configured) {
            throw new Error("Connection is not configured. Call Manager.configure() first.");
        }
    }

    static async describeTable(tableName) {
        Manager.#ensureConfigured();

        const ddb = dynamoose.aws.ddb();
        try {
            const tableInfo = await ddb.describeTable({ TableName: tableName });
            return { table: tableInfo.Table, error: null };
        } catch (error) {
            if (error.name === "ResourceNotFoundException") {
                return { table: null, error: "Table not found" };
            }
            throw error;
        }
    }

    static define(modelName, schema, options = {}) {
        Manager.#ensureConfigured();

        if (Manager.#models[modelName]) {
            return Manager.#models[modelName];
        }
        const schemaInstance = new dynamoose.Schema(schema, options);
        const model = dynamoose.model(modelName, schemaInstance);
        const customMethods = {
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

                /**
                 * @template T
                 * @type {T & Partial<T>}
                 */
                const updatedItem = {
                    ...existingItem.toJSON(),
                    ...updateData,
                    updatedAt: Date.now(),
                };
                return model.update(updatedItem);
            },
            delete: async (id) => {
                return model.delete(id);
            },
        };

        const modelAPI = new Proxy(model, {
            get(target, prop, receiver) {
                if (prop in customMethods) {
                    return customMethods[prop];
                }
                return Reflect.get(target, prop, receiver);
            },
        });

        Manager.#models[modelName] = modelAPI;
        return modelAPI;
    }

    static async #checkUniqueFields(model, schema, item, excludeId = null) {
        const uniqueFields = Object.keys(schema).filter(key => schema[key].unique);

        for (const field of uniqueFields) {
            const value = item[field];
            if (value) {
                const existingItem = await model.scan({[field]: value}).exec();
                if (existingItem.length > 0 && (!excludeId || existingItem[0].id !== excludeId)) {
                    const error = new Error(`O valor '${value}' para o campo '${field}' já existe.`);
                    error.code = 10001;
                    throw error;
                }
            }
        }
    }

}

module.exports = {Manager};
