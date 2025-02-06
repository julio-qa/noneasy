const dynamoose = require("dynamoose");

class Model {
    static #configured = false;
    static #models = {};

    static configure(config) {
        if (Model.#configured) return;

        if (!config || !config.region || !config.credentials?.accessKeyId || !config.credentials?.secretAccessKey) {
            throw new Error("Invalid AWS configuration.");
        }

        dynamoose.aws.ddb.set(new dynamoose.aws.ddb.DynamoDB(config));
        Model.#configured = true;
    }

    static define(modelName, schema, options = {}) {
        if (!Model.#configured) {
            throw new Error("Connection is not configured. Call Model.configure() first.");
        }
        if (Model.#models[modelName]) {
            return Model.#models[modelName];
        }
        const schemaInstance = new dynamoose.Schema(schema, options);
        const model = dynamoose.model(modelName, schemaInstance);
        const modelAPI = {
            create: async (item) => {
                await Model.#checkUniqueFields(model, schema, item);
                return model.create(item);
            },
            save: async (item) => {
                await Model.#checkUniqueFields(model, schema, item, item.id);
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
                await Model.#checkUniqueFields(model, schema, updatedItem, id);

                return model.update(updatedItem);
            },
            delete: async (id) => {
                return model.delete(id);
            }
        };

        Model.#models[modelName] = modelAPI;
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

module.exports = { Model };

// const dynamoose = require("dynamoose");
//
// class NonEasy {
//     constructor(config) {
//         if (!NonEasy.instance) {
//             if (!config || !config.region || !config.credentials?.accessKeyId || !config.credentials?.secretAccessKey) {
//                 throw new Error("Invalid AWS configuration.");
//             }
//
//             // Configura DynamoDB apenas uma vez
//             dynamoose.aws.ddb.set(new dynamoose.aws.ddb.DynamoDB(config));
//
//             this.models = {};
//             NonEasy.instance = this;
//         }
//         return NonEasy.instance;
//     }
//
//     getModel(name, schema, options = {}) {
//         if (!this.models[name]) {
//             this.models[name] = dynamoose.model(name, new dynamoose.Schema(schema, options));
//         }
//         return this.models[name];
//     }
// }
//
// let nonEasyInstance;
// function initNonEasy(config) {
//     if (!nonEasyInstance) {
//         nonEasyInstance = new NonEasy(config);
//     }
//     return nonEasyInstance;
// }
//
// module.exports = { initNonEasy };
//



// const dynamoose = require("dynamoose");
//
// class DB {
//     constructor(model, schema, option, config = {}) {
//         if (!config.region && !config.accessKeyId && !config.secretAccessKey) {
//             throw new Error("Bad AWS config.");
//         }
//         dynamoose.aws.ddb.set(new dynamoose.aws.ddb.DynamoDB(config));
//         this.schema = new dynamoose.Schema(schema, option);
//         this.model = dynamoose.model(model, this.schema);
//
//         this.uniqueFields = Object.keys(schema).filter(
//             key => schema[key].unique
//         );
//
//     }
//
//     async create(item) {
//         await this._checkUniqueFields(item);
//         return this.model.create(item);
//     }
//
//     async save(item) {
//         await this._checkUniqueFields(item, item.id);
//         return this.model.update(item);
//     }
//
//     async _checkUniqueFields(item, excludeId = null) {
//         for (const field of this.uniqueFields) {
//             const value = item[field];
//             if (value) {
//                 const existingItem = await this.model.scan({ [field]: value }).exec();
//                 if (existingItem.length > 0 && (!excludeId || existingItem[0].id !== excludeId)) {
//                     throw new Error(`O valor '${value}' para o campo '${field}' já existe.`);
//                 }
//             }
//         }
//     }
// }
//
// module.exports = {DB};


