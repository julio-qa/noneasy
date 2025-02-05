async function checkUniqueFields(model, data) {
    const schema = model.Model.schema;

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