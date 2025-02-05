/**
 * Verifica automaticamente se um campo com `unique: true` já existe antes de salvar no DynamoDB.
 *
 * @param {Object} model - O modelo do Dynamoose.
 * @param {Object} data - O objeto que será salvo.
 * @returns {Promise<void>} - Retorna erro se houver duplicação.
 */
async function checkUniqueFields(model, data) {
    const schema = model.schema;

    if (!schema) {
        throw new Error("⚠️ O esquema (schema) do modelo não foi encontrado.");
    }

    for (const field in schema.attributes) {
        const attribute = schema.attributes[field];

        if (attribute.unique) {
            const result = await model.query(field).eq(data[field]).exec();
            if (result.length > 0) {
                throw new Error(`⚠️ Erro: O campo "${field}" com valor "${data[field]}" já está em uso!`);
            }
        }
    }
}

module.exports = checkUniqueFields;
