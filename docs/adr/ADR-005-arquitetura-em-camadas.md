# ADR-005: Arquitetura em Camadas (Layered Architecture)

## Status
Aceita e em produção

## Data
20/09/2026

## Responsável
Equipe EasyFood

## Contexto
Conforme a EasyFood evoluiu, o código começou a crescer. O `server.js` original concentrava várias responsabilidades:

```javascript
// ❌ Problema: tudo junto
server.js
├── Inicializar Express
├── Configurar middlewares
├── Definir rotas
├── Validar dados
├── Acessar banco de dados
├── Implementar lógica de negócio
└── Ligar servidor
```

### Desafios
- 📁 Arquivo único crescendo e ficando ilegível
- 🔧 Difícil localizar código específico
- 🧪 Difícil testar (todas as dependências acopladas)
- 👥 Novos desenvolvedores demoram a entender
- 🔄 Difícil reutilizar código em diferentes contextos
- 📈 Não escalável conforme adicionar novos domínios (auth, payments, etc)

### Motivação para Refatoração
Com os requisitos evoluindo (autenticação, CRUD completo, múltiplos usuários), precisávamos de uma estrutura que permitisse:
- ✅ Adicionar novos módulos (ex: payments, notifications)
- ✅ Testar camadas independentemente
- ✅ Separar responsabilidades claramente
- ✅ Facilitar onboarding de novos desenvolvedores

## Alternativas Consideradas

### 1. **Monolito Único (sem mudança)**
```
server.js (5000+ linhas)
```
- ✅ Simples inicialmente
- ❌ Impraticável conforme cresce
- ❌ Difícil de manter
- ❌ Difícil de testar

### 2. **Arquitetura em Camadas (Chosen)**
```
Routes → Controller → Service → Database
```
- ✅ Separação clara de responsabilidades
- ✅ Fácil de testar
- ✅ Escalável
- ✅ Padrão da indústria

### 3. **Arquitetura Hexagonal (Clean Architecture)**
```
Domain ↔ Ports ↔ Adapters
```
- ✅ Muito flexível
- ✅ Independente de frameworks
- ❌ Complexidade desnecessária para MVP
- ❌ Curva de aprendizado steeper

### 4. **CQRS (Command Query Responsibility Segregation)**
```
Commands → Events → Queries
```
- ✅ Ótimo para sistemas complexos
- ❌ Overcomplicated para MVP
- ❌ Requer event sourcing

## Decisão
Implementar **Arquitetura em Camadas** separando as responsabilidades em:
1. **Routes** - Definir endpoints HTTP
2. **Controller** - Receber requisição, validar, coordenar
3. **Service** - Lógica de negócio
4. **Database** - Acesso a dados

## Justificativa

### 1. Separação de Responsabilidades
```
┌─────────────────────────────────┐
│   HTTP / Express / Requisições  │  Routes
├─────────────────────────────────┤
│   Validação / Autorização       │  Controller
├─────────────────────────────────┤
│   Lógica de Negócio             │  Service
├─────────────────────────────────┤
│   Acesso ao Banco / Prisma      │  Database
├─────────────────────────────────┤
│   SQLite Persistência           │  DB
└─────────────────────────────────┘
```

Cada camada tem uma responsabilidade clara:
- **Routes**: Mapear URLs para funções
- **Controller**: Validar entrada e chamar service
- **Service**: Implementar regras de negócio
- **Database**: Isolar Prisma do resto da aplicação

### 2. Testabilidade

**Sem camadas** (acoplado):
```javascript
// ❌ Difícil testar porque tudo junto
app.post('/restaurants', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "..." });
  
  const restaurant = prisma.restaurant.create({ data: { name, ... } });
  res.status(201).json(restaurant);
});
// Como testar sem iniciar servidor + banco?
```

**Com camadas** (desacoplado):
```javascript
// ✅ Fácil testar cada camada
function validateRestaurant(data) { /* ... */ }
async function createRestaurant(data) { /* ... */ }
async function handleCreate(req, res) { /* ... */ }

// Testes
test('validateRestaurant rejeita sem nome', () => {
  const result = validateRestaurant({ category: "..." });
  expect(result.error).toBeDefined();
});

test('createRestaurant salva no banco', async () => {
  const restaurant = await createRestaurant({ name: "...", ... });
  expect(restaurant.id).toBeDefined();
});
```

### 3. Reutilização de Código

**Sem camadas**:
```javascript
// Lógica duplicada em múltiplas rotas
app.get('/users/:id/restaurants', (req, res) => {
  const restaurants = prisma.restaurant.findMany({
    where: { userId: req.params.id }
  });
  // ... processing
});

app.get('/admin/restaurants', (req, res) => {
  const restaurants = prisma.restaurant.findMany({
    // Mesma lógica duplicada aqui
  });
});
```

**Com camadas**:
```javascript
// ✅ Lógica centralizada em Service
async function getRestaurantsByUser(userId) {
  return prisma.restaurant.findMany({
    where: { userId }
  });
}

// Reutilizado em múltiplas rotas
router.get('/users/:id/restaurants', async (req, res) => {
  const restaurants = await getRestaurantsByUser(req.params.id);
  res.json(restaurants);
});

router.get('/admin/restaurants', async (req, res) => {
  const restaurants = await getRestaurantsByUser(req.user.id);
  res.json(restaurants);
});
```

### 4. Escalabilidade para Novos Módulos

```
src/
├── modules/
│   ├── restaurants/          ← Módulo 1
│   │   ├── restaurant.routes.js
│   │   ├── restaurant.controller.js
│   │   └── restaurant.service.js
│   │
│   ├── auth/                 ← Módulo 2
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   └── auth.service.js
│   │
│   ├── payments/             ← Módulo 3 (futuro)
│   │   ├── payment.routes.js
│   │   ├── payment.controller.js
│   │   └── payment.service.js
│   │
│   └── notifications/        ← Módulo 4 (futuro)
│       ├── notification.routes.js
│       ├── notification.controller.js
│       └── notification.service.js
│
├── database/
│   └── prisma.js
│
├── middleware/
│   └── authMiddleware.js
│
├── app.js
└── server.js
```

Adicionar novo módulo é repetir o mesmo padrão.

### 5. Facilita Testes de Integração

```javascript
// Testar fluxo completo
test('Usuário pode criar e listar seus restaurantes', async () => {
  // 1. Registrar usuário
  const user = await userService.register({
    email: "test@test.com",
    password: "123456"
  });

  // 2. Criar restaurante
  const restaurant = await restaurantService.createRestaurant({
    name: "Teste",
    userId: user.id
  });

  // 3. Listar restaurantes
  const restaurants = await restaurantService.getRestaurantsByUser(user.id);
  
  // 4. Validar
  expect(restaurants).toHaveLength(1);
  expect(restaurants[0].name).toBe("Teste");
});
```

## Implementação na EasyFood

### Estrutura Final

```
easy-food/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js    ← Recebe POST /register, /login
│   │   │   ├── auth.service.js       ← Lógica: hash senha, gerar JWT
│   │   │   ├── auth.routes.js        ← Define /auth/register, /auth/login
│   │   │   └── auth.middleware.js    ← Middleware verifyJWT
│   │   │
│   │   └── restaurants/
│   │       ├── restaurant.controller.js    ← Recebe GET/POST/PUT/DELETE
│   │       ├── restaurant.service.js       ← CRUD + lógica de negócio
│   │       └── restaurant.routes.js        ← Define /restaurants endpoints
│   │
│   ├── database/
│   │   └── prisma.js                  ← Conexão Prisma
│   │
│   ├── middleware/
│   │   └── authMiddleware.js          ← JWT verification
│   │
│   ├── app.js                         ← Configuração Express
│   └── server.js                      ← Ligar servidor (2 linhas!)
│
├── prisma/
│   ├── schema.prisma                  ← Modelos do banco
│   └── seed.js                        ← Dados iniciais
│
├── public/
│   ├── index.html                     ← Frontend
│   ├── css/
│   │   └── app.css
│   └── js/
│       └── app.js
│
├── docs/
│   └── adr/                           ← Decisões arquiteturais
│       ├── ADR-001.md
│       ├── ADR-002.md
│       ├── ADR-003.md
│       ├── ADR-004.md
│       └── ADR-005.md
│
└── package.json
```

### Fluxo de uma Requisição

```
1. Cliente faz POST /restaurants
   ↓
2. app.js direciona para restaurant.routes.js
   ↓
3. restaurant.routes.js → restaurant.controller.js
   ↓
4. restaurant.controller.js
   ├── Recebe requisição
   ├── Valida dados (name, category, rating)
   ├── Verifica autenticação (req.user)
   ├── Chama restaurant.service.create()
   └── Envia resposta 201
   ↓
5. restaurant.service.js
   ├── Verifica regras de negócio
   ├── Cria objeto novo
   ├── Chama prisma.restaurant.create()
   └── Retorna restaurante criado
   ↓
6. Prisma
   ├── Monta query SQL
   ├── Envia ao SQLite
   ├── SQLite persiste
   └── Retorna registro criado
   ↓
7. Resposta volta pelas camadas
   ↓
8. Cliente recebe 201 + JSON
```

## Consequências

### Positivas
- ✅ **Código Organizado**: Fácil localizar código específico
- ✅ **Testável**: Cada camada pode ser testada isoladamente
- ✅ **Reutilizável**: Funções de service podem ser chamadas de múltiplos controllers
- ✅ **Escalável**: Novos módulos seguem mesmo padrão
- ✅ **Manutenível**: Novos desenvolvedores entendem estrutura rapidamente
- ✅ **Reduz Acoplamento**: Mudanças em uma camada não afetam outras
- ✅ **Preparado para Testes**: Fácil mockar banco para testes de controller
- ✅ **Facilita Debugging**: Rastrear erro por camada

### Negativas / Trade-offs
- ⚠️ **Mais Arquivos**: Ao invés de 1 arquivo, temos 4-5 por funcionalidade
  - **Mitigação**: Organização clara, IDEs facilitam navegação

- ⚠️ **Indireção**: Requisição passa por várias camadas
  - **Mitigação**: Performance não é impactada, legibilidade ganha

- ⚠️ **Verbosidade Inicial**: Código pode parecer mais extenso para casos simples
  - **Mitigação**: Benefício em funcionalidades complexas compensa

- ⚠️ **Curva de Aprendizado**: Novo desenvolvedor precisa entender padrão
  - **Mitigação**: Padrão é explicável em 1-2 horas

## Padrão de Desenvolvimento

### Adicionar Nova Funcionalidade

Para adicionar DELETE /restaurants/:id, o processo é:

1. **Database** (prisma.schema)
   ```prisma
   model Restaurant { ... }
   // Já tem deleteRestaurant automático no Prisma
   ```

2. **Service** (restaurant.service.js)
   ```javascript
   async function deleteRestaurant(id) {
     return prisma.restaurant.delete({ where: { id } });
   }
   ```

3. **Controller** (restaurant.controller.js)
   ```javascript
   async function delete(req, res) {
     const id = parseInt(req.params.id);
     const restaurant = await restaurantService.deleteRestaurant(id);
     res.json({ message: "Deletado", restaurant });
   }
   ```

4. **Routes** (restaurant.routes.js)
   ```javascript
   router.delete('/:id', verifyJWT, controller.delete);
   ```

Pronto! Nova funcionalidade implementada seguindo padrão.

## Critérios de Revisão

Esta decisão deverá ser reavaliada caso:

1. **Performance**: Se passar por múltiplas camadas virar gargalo (improvável)
   - **Indicador**: Benchmarks mostram overhead significativo
   - **Ação**: Consolidar camadas para funcionalidades críticas

2. **Complexidade Excessiva**: Se o projeto virar muito complexo (>20 módulos)
   - **Indicador**: Dificuldade em navegar estrutura
   - **Ação**: Evoluir para Arquitetura Hexagonal ou Microserviços

3. **Equipe Grande**: Se múltiplas equipes trabalharem independentemente
   - **Indicador**: Conflitos frequentes, precisa isolamento melhor
   - **Ação**: Considerar Monorepo ou Microserviços

4. **Testes Obrigatórios**: Se testes forem críticos (ex: fintech)
   - **Indicador**: Coverage <80%
   - **Ação**: Adicionar camada de testes dedicada

## Boas Práticas Adotadas
- ✅ Cada camada tem responsabilidade clara
- ✅ Service não conhece Express (req/res)
- ✅ Controller não acessa Prisma diretamente
- ✅ Routes apenas mapeia endpoints
- ✅ Database é abstração sobre Prisma
- ✅ Middleware separado e reutilizável
- ✅ Documentação (ADRs) do projeto

## Próximos Passos

### Curto Prazo
- ✅ Implementado e funcionando

### Médio Prazo
- ⏳ Adicionar testes unitários (Jest)
- ⏳ Adicionar testes de integração
- ⏳ Adicionar testes E2E (Playwright/Cypress)
- ⏳ Adicionar linting (ESLint)

### Longo Prazo
- ⏳ Se crescer: Arquitetura Hexagonal
- ⏳ Se evoluir muito: Considerar Microserviços
- ⏳ Se múltiplas equipes: Monorepo (Nx, Turborepo)

## Conclusão

A Arquitetura em Camadas foi fundamental para a EasyFood evoluir de um protótipo a uma aplicação estruturada.

Benefícios realizados:
- ✅ Código organizado e legível
- ✅ Facilita adição de novos módulos (Auth, Payments, etc)
- ✅ Preparado para testes
- ✅ Padrão escalável
- ✅ Facilita onboarding de novos devs

A escolha de iniciar com camadas (ao invés de overcomplicate com Hexagonal/CQRS) foi acertada.
Preparou a base sólida para futuras evoluções conforme a complexidade crescer.

Relacionado:
- **ADR-002**: SQLite + Banco de Dados
- **ADR-003**: Prisma ORM para integração
- **ADR-004**: JWT para autenticação separada
