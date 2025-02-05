const dynamoose = require("dynamoose");
const wrapModel = require("./dynamooseWrapper");

function model(name, schema, options) {
    const originalModel = dynamoose.model(name, schema, options);
    return wrapModel(originalModel);
}

module.exports = { ...dynamoose, model, Schema: dynamoose.Schema };
