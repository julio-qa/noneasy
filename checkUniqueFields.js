/**
 * Verifica automaticamente se um campo com `unique: true` já existe antes de salvar no DynamoDB.
 *
 * @param {Object} model - O modelo do Dynamoose.
 * @param {Object} data - O objeto que será salvo.
 * @returns {Promise<void>} - Retorna erro se houver duplicação.
 */
async function checkUniqueFields(model, data) {
    if (!model.Model || !model.Model.schema) {
        throw new Error("⚠️ O esquema (schema) do modelo não foi encontrado.");
    }

    const schema = model.Model.schema;

    for (const field in schema.attributes) {
        const attribute = schema.attributes[field];

        if (attribute.unique) {
            if (!data[field]) continue; // Ignora se o campo não estiver presente

            const result = await model.query(field).eq(data[field]).exec();
            if (result.length > 0) {
                throw new Error(`⚠️ Erro: O campo "${field}" com valor "${data[field]}" já está em uso!`);
            }
        }
    }
}

module.exports = checkUniqueFields;
