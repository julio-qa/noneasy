# Noneasy 🚀

Biblioteca para **DynamoDB** utilizando **Dynamoose** que adiciona suporte automático para verificação de campos `unique: true`.

## 📌 Instalação
```sh
npm install noneasy
```

## 🚀 Como usar

### Exemplo com um modelo Dynamoose:
```javascript
const { Manager } = require("noneasy");
const { v4: uuidv4 } = require("uuid");

const userSchema = {
    id: {
        type: String,
        hashKey: true,
        readonly: true,
        default: () => uuid.v4(),
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: { global: true, project: true, },
    },
};
const schemaOption = {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    },
};

const awsConfig = {
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_DEFAULT_REGION,
};

Manager.configure(awsConfig);
const User = Manager.define("Users", userSchema, schemaOption);

async function createUser(userData) {
    try {
        const user = await User.create(userData);
        console.log("✅ Usuário criado:", user.toJSON());
    } catch (error) {
        console.error("❌ Erro ao criar usuário:", error.message);
    }
}

createUser({ email: "mail@julio.qa", username: "juliosantos" });
