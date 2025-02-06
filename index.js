// const dynamoose = require("dynamoose");
// const wrapModel = require("./dynamooseWrapper");
//
// function model(name, schema, options) {
//     const originalModel = dynamoose.model(name, schema, options);
//     return wrapModel(originalModel);
// }
//
// module.exports = { ...dynamoose, model, Schema: dynamoose.Schema };

const dynamoose = require("dynamoose");

class DB {
    constructor(model, schema, config = {}) {
        if (!config.region && !config.accessKeyId && !config.secretAccessKey) {
            throw new Error("Bad AWS config.");
        }
        dynamoose.aws.ddb.set(new dynamoose.aws.ddb.DynamoDB(config));
        this.schema = new dynamoose.Schema(schema);
        this.model = dynamoose.model(model, this.schema);

        this.uniqueFields = Object.keys(schema).filter(
            key => schema[key].unique
        );

    }

    async create(item) {
        await this._checkUniqueFields(item);
        return this.model.create(item);
    }

    async save(item) {
        await this._checkUniqueFields(item, item.id);
        return this.model.update(item);
    }

    async _checkUniqueFields(item, excludeId = null) {
        for (const field of this.uniqueFields) {
            const value = item[field];
            if (value) {
                const existingItem = await this.model.scan({ [field]: value }).exec();
                if (existingItem.length > 0 && (!excludeId || existingItem[0].id !== excludeId)) {
                    throw new Error(`O valor '${value}' para o campo '${field}' já existe.`);
                }
            }
        }
    }
}

module.exports = {DB};
