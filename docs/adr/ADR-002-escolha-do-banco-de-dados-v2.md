# ADR-002: Escolha do Banco de Dados para a EasyFood

## Status
Aceita e em produção

## Data
25/08/2026

## Responsável
Equipe EasyFood

## Contexto
A API da EasyFood armazenava inicialmente os dados dos restaurantes em um array volátil na memória (ADR-001). Como resultado dessa abordagem, todas as informações cadastradas eram perdidas sempre que o servidor sofria um reinício.

Com a evolução do projeto, surgiram novos requisitos:
- **Autenticação de usuários** via JWT
- **Associação User-Restaurant**: cada usuário deve ter seus próprios restaurantes
- **Operações CRUD completas**: não apenas consultas (GET) e criação (POST), mas também edição (PUT) e exclusão (DELETE)
- **Relacionamentos entre entidades**: usuários possuem restaurantes
- **Integridade referencial**: garantir que restaurantes não órfãos após exclusão de usuário

Precisávamos de uma solução de persistência confiável que mantivesse os dados salvos em disco, suportasse relacionamentos entre tabelas e tivesse simplicidade de implementação para o estágio atual do projeto.

## Alternativas Consideradas
1. **PostgreSQL / MySQL**: Bancos relacionais robustos baseados em cliente-servidor. Oferem excelente suporte a múltiplas conexões simultâneas e escalabilidade, mas exigem configuração de servidor separado, infraestrutura externa ou Docker.

2. **MongoDB**: Banco de dados NoSQL orientado a documentos. Flexível para dados não estruturados, mas uma solução relacional simples se adequa melhor ao modelo atual (usuários e restaurantes com relacionamento 1-N).

3. **SQLite**: Banco de dados relacional leve que armazena todo o conteúdo em um único arquivo local. Suporta SQL padrão, relacionamentos (chaves estrangeiras), integridade referencial e transações, tudo sem exigir servidor separado.

4. **Firebase / AWS Amplify**: Soluções cloud com autenticação integrada, mas agregam custo e dependência de fornecedor externo.

## Decisão
Escolhemos adotar o **SQLite** como o banco de dados oficial da API EasyFood em seu estágio de desenvolvimento e MVP.

## Justificativa
- **Persistência Confiável**: Os dados cadastrados via POST/PUT agora sobrevivem a reinicializações do servidor.
- **Suporte a Relacionamentos**: SQLite suporta chaves estrangeiras e integridade referencial, essencial para a associação User-Restaurant.
- **Simplicidade de Configuração**: Serverless - não requer instalação ou execução de servidor de banco de dados separado.
- **Portabilidade**: Todo o banco de dados está contido em um único arquivo (`database.db`), facilitando backup, versionamento e compartilhamento.
- **Ecossistema Node.js**: Integração perfeita com Prisma ORM (ver ADR-003), que abstrai a complexidade do SQL.
- **Custo Zero**: Sem custos de infraestrutura ou serviços cloud.
- **Perfeito para MVP**: Adequado para prototipagem, desenvolvimento e testes com volume de dados moderado.

## Consequências

### Positivas
- ✅ **Persistência de Dados**: Dados cadastrados via POST/PUT/DELETE agora são permanentes.
- ✅ **Relacionamentos**: Suporte a chaves estrangeiras permite associação User-Restaurant.
- ✅ **Integridade Referencial**: Banco garante que relacionamentos sejam válidos (ex: `ON DELETE CASCADE`).
- ✅ **Transações**: Suporte a transações ACID para operações críticas.
- ✅ **Facilidade de Desenvolvimento**: Arquivo único facilita compartilhamento entre desenvolvedores.
- ✅ **Sem Overhead de Configuração**: Desenvolvedor novo começa em minutos, não horas.

### Negativas / Trade-offs
- ⚠️ **Concorrência Limitada**: SQLite não é ideal para aplicações com altíssimo volume de escritas simultâneas. Ideal para até ~5-10 conexões concorrentes.
- ⚠️ **Sem Escalabilidade Horizontal**: Não é adequado para múltiplos servidores distribuídos em nuvem (arquivos locais não são compartilhados).
- ⚠️ **Performance em Grande Escala**: Consultas complexas em datasets muito grandes podem ser mais lentas que em PostgreSQL otimizado.
- ⚠️ **Sem Autenticação Nativa**: Banco não oferece mecanismos de permissões/roles como PostgreSQL.

## Implementação Realizada
O SQLite foi implementado com sucesso na EasyFood:
- ✅ Tabelas `User` e `Restaurant` criadas via Prisma migrations.
- ✅ Relacionamento 1-N implementado (User tem muitos Restaurants).
- ✅ Integridade referencial com `ON DELETE CASCADE`.
- ✅ Seed initial data com restaurantes de exemplo.
- ✅ Todas as operações CRUD funcionando corretamente.

## Critérios de Revisão
Esta decisão deverá ser reavaliada caso:

1. **Escala de Produção**: EasyFood migrar para produção com múltiplos servidores ou cloud (AWS, GCP, Vercel).
   - **Indicador**: Necessidade de mais de 1 instância simultânea da API.
   - **Solução Alternativa**: Migrar para PostgreSQL em um serviço gerenciado (RDS, Heroku Postgres).

2. **Volume de Dados**: O volume de restaurantes e usuários ultrapassar o que é razoável em SQLite.
   - **Indicador**: Mais de 100k registros com query lenta (>1s).
   - **Solução Alternativa**: PostgreSQL oferece melhores índices e query planner.

3. **Concorrência**: A aplicação precisar lidar com milhares de requisições simultâneas.
   - **Indicador**: Muitos erros de "database is locked".
   - **Solução Alternativa**: PostgreSQL com pool de conexões.

4. **Recursos Avançados**: Necessidade de autenticação no nível de banco, replicação ou backups automáticos.
   - **Indicador**: Perda de dados sensível, necessidade de redundância.
   - **Solução Alternativa**: PostgreSQL com backups automáticos ou Firebase.

## Próximos Passos
- **Curto Prazo**: Manter SQLite durante fase de desenvolvimento e MVP.
- **Médio Prazo**: Se a aplicação evoluir para produção real, avaliar migração para PostgreSQL.
- **Longo Prazo**: Implementar abstração de banco (já parcialmente feita com Prisma) para facilitar migração futura.

## Notas
O SQLite foi uma escolha excelente para esta fase da EasyFood. Permitiu:
- Desenvolvimento rápido e descomplicado.
- Implementação de relacionamentos (User-Restaurant).
- Suporte a operações CRUD completas.
- Zero configuração de infraestrutura.

A decisão de usar **Prisma ORM** (ADR-003) complementa esta decisão, pois abstrai as especificidades do SQLite, facilitando migração futura para outro banco se necessário.
