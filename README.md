# 🍽️ EasyFood

> Uma aplicação web para gerenciar seus restaurantes favoritos com autenticação segura, persistência de dados e interface moderna.

![Node.js](https://img.shields.io/badge/Node.js-v22-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## 📸 Visão Geral

EasyFood é uma aplicação full-stack que permite aos usuários:
- ✅ **Registrar e fazer login** com autenticação JWT segura
- ✅ **Cadastrar restaurantes** com informações detalhadas (nome, categoria, endereço, telefone, avaliação)
- ✅ **Organizar catálogo pessoal** de restaurantes
- ✅ **Editar e deletar** restaurantes de forma rápida
- ✅ **Filtrar por categoria** para encontrar rapidamente
- ✅ **Visualizar estatísticas** (total, categorias, avaliação média)

## 🏗️ Arquitetura

### Stack Tecnológico
```
Frontend:  HTML5 + CSS3 + JavaScript Vanilla
Backend:   Node.js + Express
ORM:       Prisma
Banco:     SQLite
Auth:      JWT (JSON Web Tokens)
```

### Estrutura em Camadas
```
Routes → Controller → Service → Database → SQLite
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js >= v22
- npm >= 10
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/easyfood.git
cd easyfood
```

2. **Instale dependências**
```bash
npm install
```

3. **Configure variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Configure SECRET_KEY (importante para JWT!)
# Você pode gerar uma com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Prepare o banco de dados**
```bash
# Crie as tabelas (migrations)
npx prisma migrate dev --name initial

# Popule com dados de exemplo (opcional)
npm run seed
```

5. **Inicie o servidor**
```bash
npm run dev
```

6. **Acesse a aplicação**
```
http://localhost:3000
```

## 📚 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento |
| `npm run seed` | Popula banco com dados de exemplo |
| `npm run prisma:studio` | Abre Prisma Studio (interface visual do BD) |
| `npm run prisma:migrate` | Executa migrations |

## 📖 API Endpoints

### Autenticação
```
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Restaurantes (Públicos)
```
GET /restaurants              # Lista todos os restaurantes
```

### Restaurantes (Autenticado)
```
GET    /my-restaurants        # Restaurantes do usuário
POST   /restaurants           # Criar novo restaurante
PUT    /restaurants/:id       # Editar restaurante (owner only)
DELETE /restaurants/:id       # Deletar restaurante (owner only)
```

### Headers Necessários (Rotas Autenticadas)
```
Authorization: Bearer {token}
```

## 🔐 Segurança

- ✅ Senhas hasheadas com bcrypt
- ✅ JWT com expiração de 1 hora
- ✅ Autorização por ownership (apenas owner edita/deleta)
- ✅ Validação de entrada
- ✅ CORS configurado
- ✅ Proteção contra SQL Injection (via Prisma)

## 📂 Estrutura do Projeto

```
easy-food/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.middleware.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.service.js
│   │   └── restaurants/
│   │       ├── restaurant.controller.js
│   │       ├── restaurant.routes.js
│   │       └── restaurant.service.js
│   ├── database/
│   │   └── prisma.js
│   ├── app.js
│   └── server.js
│
├── public/
│   ├── auth/
│   │   ├── login.html
│   │   └── register.html
│   ├── css/
│   │   ├── app.css
│   │   └── auth.css
│   ├── js/
│   │   ├── app.js
│   │   └── auth.js
│   └── index.html
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
│
├── docs/
│   └── adr/
│       ├── ADR-001-armazenar-restaurantes-em-memoria.md
│       ├── ADR-002-escolha-do-banco-de-dados.md
│       ├── ADR-003-persistencia-com-sqlite.md
│       ├── ADR-004-autenticacao-com-jwt.md
│       └── ADR-005-arquitetura-em-camadas.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🎯 Decisões Arquiteturais

Todas as decisões importantes foram documentadas em ADRs (Architecture Decision Records).

Veja em `docs/adr/`:
- **ADR-001**: Por que começamos com array em memória?
- **ADR-002**: Por que SQLite?
- **ADR-003**: Por que Prisma ORM?
- **ADR-004**: Por que JWT?
- **ADR-005**: Por que arquitetura em camadas?

## 🧪 Teste a API

### Com curl

**Registrar**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

**Login**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

**Criar Restaurante** (substitua TOKEN)
```bash
curl -X POST http://localhost:3000/restaurants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Pizzaria Napoli",
    "category": "Italiana",
    "description": "Melhor pizza da cidade",
    "address": "Rua das Flores, 123",
    "phone": "(11) 99999-9999",
    "rating": 4.8
  }'
```

### Com Postman

1. Importe a URL: `http://localhost:3000`
2. Configure a coleção com:
   - POST /auth/register
   - POST /auth/login
   - GET /restaurants
   - POST /restaurants (com Bearer token)
   - PUT /restaurants/:id (com Bearer token)
   - DELETE /restaurants/:id (com Bearer token)

## 🌱 Seed de Dados

Para popular o banco com dados de exemplo:

```bash
npm run seed
```

Isso criará:
- 2 usuários de exemplo
- 3 restaurantes iniciais

## 🗄️ Banco de Dados

### Schema (Prisma)

**User**
- id (Int, PK)
- email (String, Unique)
- password (String, hashed)
- name (String)
- createdAt (DateTime)

**Restaurant**
- id (Int, PK)
- name (String)
- category (String)
- description (String, optional)
- address (String, optional)
- phone (String, optional)
- rating (Float, optional)
- userId (Int, FK → User)

### Visualizar dados

```bash
npx prisma studio
```

Isso abre uma interface visual em http://localhost:5555

## 📝 Variáveis de Ambiente

Crie `.env` baseado em `.env.example`:

```env
# Banco de dados
DATABASE_URL="file:./prisma/dev.db"

# JWT
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRATION="1h"

# Servidor
PORT=3000
NODE_ENV="development"
```

**⚠️ Importante**: Nunca commite `.env` com valores reais no git!

## 🐛 Troubleshooting

### Erro: "database is locked"
- Feche outras instâncias do servidor
- Delete `prisma/dev.db` se corrompido
- Execute `npx prisma migrate dev` novamente

### Erro: "JWT Token inválido"
- Verifique se o token foi enviado no header
- Verifique formato: `Authorization: Bearer {token}`
- Token expira em 1 hora, faça login novamente

### Erro: "Restaurante não encontrado"
- Verifique se o ID existe
- Verifique se você é o owner do restaurante

## 🚀 Próximos Passos / Roadmap

- [ ] Refresh tokens
- [ ] Rate limiting
- [ ] Testes unitários (Jest)
- [ ] Testes E2E (Playwright)
- [ ] Validação com Zod/Joi
- [ ] Soft deletes
- [ ] Audit trail (quem criou/editou)
- [ ] Avaliações e comentários
- [ ] Upload de fotos
- [ ] Notificações por email
- [ ] Filtros avançados
- [ ] Exportar catálogo (PDF/CSV)

## 📄 Licença

Este projeto está sob licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request


---

**Made with ❤️ by Cláudio Rodrigues**

Última atualização: Setembro 2026
