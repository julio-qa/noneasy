# Noneasy 🚀

Biblioteca para **DynamoDB** utilizando **Dynamoose** que adiciona suporte automático para verificação de campos `unique: true`.

## 📌 Instalação
```sh
npm install noneasy
```

## 🚀 Como usar

### Exemplo com um modelo Dynamoose:
```javascript
const { model, Schema } = require("noneasy");
const { v4: uuidv4 } = require("uuid");

const userSchema = new Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4(),
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: { global: true },
    },
    username: {
        type: String,
        required: true,
        unique: true,
        index: { global: true },
    },
});

const User = model("Users", userSchema);

async function createUser(userData) {
    try {
        const user = await User.create(userData);
        console.log("✅ Usuário criado:", user.toJSON());
    } catch (error) {
        console.error("❌ Erro ao criar usuário:", error.message);
    }
}

createUser({ email: "mail@julio.qa", username: "juliosantos" });
