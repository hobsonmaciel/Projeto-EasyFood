# ADR-003: Implementação da Persistência com Prisma ORM

## Status
Aceita e em produção

## Data
30/08/2026

## Responsável
Equipe EasyFood

## Contexto
Com a adoção do SQLite para resolver o problema de perda de dados ao reiniciar a API da EasyFood (ADR-002), precisávamos definir a melhor forma da aplicação Node.js se comunicar com o banco de dados.

### Desafios Iniciais
- **Complexidade de SQL Puro**: Escrever consultas SQL diretamente nas rotas usando drivers nativos tornaria o código complexo, de difícil manutenção e suscetível a erros.
- **Gestão Manual de Schema**: Necessidade de criar e manter manualmente a estrutura das tabelas sem histórico de alterações.
- **Relacionamentos Complexos**: Implementar relacionamentos entre `User` e `Restaurant` seria verboso e propenso a bugs.
- **Falta de Tipagem**: JavaScript puro oferece pouca segurança de tipos ao trabalhar com dados do banco.

### Evolução do Projeto
O projeto evoluiu para incluir:
- ✅ Autenticação JWT (User model)
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Relacionamento 1-N (User possui múltiplos Restaurants)
- ✅ Operações protegidas (apenas owner pode editar/deletar)
- ✅ Integridade referencial (cascade delete)
- ✅ Seed inicial de dados
- ✅ Frontend integrado (não apenas API)

## Alternativas Consideradas

1. **Driver Nativo (`sqlite3`)**: 
   - Execução de comandos SQL puros.
   - ❌ Descartado: alta verbosidade, falta de tipagem, gestão manual de schema.
   - Exemplo de complexidade: `db.prepare("SELECT * FROM Restaurant WHERE userId = ?").all(userId)`

2. **Query Builders (ex: Knex.js)**:
   - Ferramentas que constroem queries SQL usando sintaxe JavaScript.
   - ❌ Descartado: Melhor que SQL puro, mas ainda exigem gestão manual de migrations e relacionamentos.
   - Exemplo: `knex('restaurants').where('userId', userId).select()`

3. **TypeORM**:
   - ORM robusto com suporte a múltiplos bancos.
   - ❌ Descartado: Excesso de funcionalidades para MVP, requer decorators e typescript.
   - Overhead para prototipagem rápida.

4. **Prisma ORM**:
   - ORM moderno com schema declarativo, migrations automáticas e cliente type-safe.
   - ✅ **Escolhido**: Melhor balance entre produtividade, segurança e simplicity.

## Decisão
Escolhemos adotar o **Prisma ORM** como a ferramenta oficial para:
- Modelagem de dados (`schema.prisma`)
- Gestão de migrações (`prisma migrate`)
- Manipulação de dados (`PrismaClient`)
- Relacionamentos entre entidades

## Justificativa

### 1. Abstração Clara
```prisma
// Schema declarativo e legível
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  restaurants Restaurant[]  // Relacionamento automático
}

model Restaurant {
  id        Int     @id @default(autoincrement())
  name      String
  category  String
  userId    Int
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 2. Código Cliente Seguro
```javascript
// Antes (SQL puro) - suscetível a SQL Injection
const sql = `SELECT * FROM restaurants WHERE id = ${id}`;

// Com Prisma - type-safe e seguro
const restaurant = await prisma.restaurant.findUnique({ where: { id } });
```

### 3. Migrations Automáticas
- Comando único: `npx prisma migrate dev --name nome-descritivo`
- Histórico versionado em `prisma/migrations/`
- Reversão segura disponível

### 4. Relacionamentos Simplificados
```javascript
// Criar restaurante associado ao usuário
const restaurant = await prisma.restaurant.create({
  data: {
    name: "Pizzaria",
    category: "Italiana",
    userId: req.user.id  // Associação automática
  }
});

// Buscar todos os restaurantes do usuário
const restaurants = await prisma.restaurant.findMany({
  where: { userId: req.user.id },
  include: { user: true }  // Inclui dados do usuário
});

// Deletar restaurante com integridade referencial
await prisma.restaurant.delete({ where: { id } });
```

### 5. Produtividade
- Menos código (sem strings de SQL).
- Melhor legibilidade.
- Erros de compilação em tempo de desenvolvimento (com TypeScript).
- Autocompletar no IDE.

### 6. Seed de Dados
- Arquivo `prisma/seed.js` dedicado.
- Dados iniciais para testes sem necessidade de POST manual.

## Consequências

### Positivas
- ✅ **Código Limpo e Legível**: Separação clara entre lógica de rota e banco de dados.
- ✅ **Segurança**: Proteção automática contra SQL Injection.
- ✅ **Histórico de Alterações**: Migrations rastreiam evoluções do schema.
- ✅ **Relacionamentos Simples**: Relacionamentos 1-N, N-N implementados sem verbosidade.
- ✅ **Prisma Studio**: Interface visual para inspecionar/editar dados (`npx prisma studio`).
- ✅ **Tipagem (com TypeScript futuro)**: Prisma gera tipos automáticos.
- ✅ **Integridade Referencial**: `ON DELETE CASCADE` garante consistência de dados.

### Negativas / Trade-offs
- ⚠️ **Curva de Aprendizado**: Equipe precisa dedicar tempo inicial para aprender `schema.prisma` e CLI commands.
  - **Mitigação**: Documentação excelente, comunidade ativa, e aprendizado rápido em 1-2 dias.

- ⚠️ **Peso do Projeto**: Adiciona `prisma` e `@prisma/client` ao `node_modules`.
  - **Mitigação**: Aumento negligenciável (~50MB), compensado pela produtividade ganha.

- ⚠️ **Abstração Pode Esconder Performance**: Queries complexas podem ser geradas de forma subótima.
  - **Mitigação**: Prisma oferece `$queryRaw()` para queries críticas, se necessário.

- ⚠️ **Versionamento do Schema**: Migrações podem ser trabalhosas em equipes grandes com merge conflicts.
  - **Mitigação**: Para MVP, não é problema. Equipes grandes usam strategies diferentes (ex: PostgreSQL com Liquibase).

## Implementação Realizada
O Prisma foi implementado com sucesso:

### Schema (`prisma/schema.prisma`)
```
✅ Model User com autenticação JWT
✅ Model Restaurant com relacionamento User
✅ Relacionamento 1-N (User → Restaurants)
✅ Cascade delete para manter integridade
```

### Migrations
```
✅ create_user_table (initial)
✅ add_userId_to_restaurant
✅ add_restaurant_fields (address, phone, description, rating)
```

### Funcionalidades
```
✅ register: criar usuário
✅ login: autenticar e retornar JWT
✅ GET /restaurants: listar todos
✅ GET /my-restaurants: listar restaurantes do usuário (protegido)
✅ POST /restaurants: criar restaurante (protegido)
✅ PUT /restaurants/:id: editar restaurante (apenas owner)
✅ DELETE /restaurants/:id: deletar restaurante (apenas owner)
```

### Seed de Dados
```
✅ prisma/seed.js cria usuários e restaurantes iniciais
✅ npm run seed popula banco para testes
```

## Arquitetura Resultante
```
Frontend (HTML/CSS/JS)
          ↓
    Express Routes
          ↓
    Controllers (validação, autenticação)
          ↓
    Services (lógica de negócio)
          ↓
    Prisma ORM (abstração segura)
          ↓
    SQLite (persistência)
```

## Critérios de Revisão
Esta decisão deverá ser reavaliada caso:

1. **Migração de Banco**: Se EasyFood migrar para PostgreSQL (devido a escala), Prisma mantém compatibilidade.
   - **Indicador**: Necessidade de múltiplas instâncias ou backups automáticos.
   - **Ação**: Mudar apenas `datasource db.provider` de "sqlite" para "postgresql".

2. **Queries com Performance Crítica**: Se análises complexas exigirem otimizações em nível de SQL.
   - **Indicador**: Perfis de query revelam gargalos.
   - **Ação**: Usar `prisma.$queryRaw()` para queries otimizadas.

3. **Mudança para TypeScript**: Se projeto evoluir com tipagem forte.
   - **Indicador**: Crescimento da equipe ou complexidade.
   - **Ação**: Prisma gera tipos automaticamente, facilitando transição.

## Boas Práticas Adotadas
- ✅ Validação em Controller (antes de chamar Service)
- ✅ Tratamento de erros em camadas apropriadas
- ✅ Transactions para operações críticas (quando necessário)
- ✅ Seed para dados de teste/desenvolvimento
- ✅ Migrations versionadas e auditáveis

## Próximos Passos
- **Adicionar validação com Zod/Joi** se volume de dados crescer
- **Implementar soft deletes** (marcar como deletado ao invés de remover)
- **Auditoria** (rastrear quem criou/editou cada restaurante)
- **Índices de performance** conforme volume crescer
- **Backups automáticos** se entrar em produção

## Conclusão
O Prisma ORM foi escolha excelente para a EasyFood. Permitiu:
- Desenvolvimento rápido e seguro ✅
- Relacionamentos complexos implementados simplesmente ✅
- Código legível e manutenível ✅
- Preparação para escalabilidade futura ✅
- Caminho claro para migração (banco, TypeScript, etc) ✅

A decisão de Prisma + SQLite (ADR-002) + Arquitetura em Camadas criou uma base sólida para a evolução contínua da EasyFood.
