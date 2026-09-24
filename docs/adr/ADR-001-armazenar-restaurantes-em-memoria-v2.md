# ADR-001 - Armazenar restaurantes em memória

## Status
~~Aceita~~ **Substituída** (veja ADR-002 e ADR-003)

## Data
20/08/2026

## Responsável
Equipe EasyFood

## Contexto
Estamos desenvolvendo a primeira versão da API da EasyFood.
Neste momento, a aplicação precisa permitir:
- consultar restaurantes;
- cadastrar novos restaurantes.

O produto ainda está em fase de prototipação, teste e validação.
A prioridade desta primeira versão é validar o fluxo da aplicação de forma rápida e simples antes de aumentar a complexidade da arquitetura.

## Alternativas consideradas
1. Array em memória
2. PostgreSQL
3. MongoDB
4. SQLite
5. Firebase
6. Arquivo JSON

## Decisão
Adotar um array em memória como mecanismo de armazenamento dos restaurantes na versão inicial do serviço.

## Justificativa
- Permite maior velocidade no desenvolvimento.
- Facilita os primeiros testes da API.
- Possui baixa complexidade.
- Não exige configuração de infraestrutura.
- Não possui custo adicional para esta fase do projeto.

## Consequências

### Positivas
- Desenvolvimento mais rápido.
- Facilidade para testar GET e POST.
- Menor complexidade inicial.
- Permite validar o conceito da aplicação rapidamente.

### Negativas
- Os dados são perdidos quando o servidor reinicia.
- Não existe persistência dos dados.
- Não é adequado para múltiplas instâncias da aplicação.
- Possui limitações para consultas e análises mais complexas.
- Não oferece os mesmos mecanismos de integridade disponíveis em um banco de dados.
- Impossibilita implementar relacionamentos entre entidades (ex: User-Restaurant).

## Critérios de revisão
Esta decisão deverá ser reavaliada quando:
1. O MVP for validado e houver decisão de avançar para produção. ✅ **Realizado**
2. Houver necessidade de manter os dados entre reinicializações e deploys. ✅ **Realizado**
3. O volume de dados ultrapassar o que é razoável manter em memória. ✅ **Realizado**
4. For necessário realizar consultas mais complexas. ✅ **Realizado**
5. Surgirem relacionamentos entre diferentes entidades da aplicação. ✅ **Realizado (User-Restaurant)**

## Evolução
Esta decisão foi **substituída** quando a EasyFood evoluiu com:
- **Autenticação de usuários** (JWT)
- **Associação User-Restaurant** (cada usuário possui seus restaurantes)
- **Operações CRUD completas** (Create, Read, Update, Delete)
- **Banco de dados persistente** (SQLite + Prisma)

Consulte **ADR-002** e **ADR-003** para entender as decisões subsequentes.

## Notas
Esta foi uma decisão arquitetural crucial para validar rapidamente o conceito da EasyFood.
Permitiu que a equipe entendesse os fluxos HTTP, estrutura de código e requisitos do sistema antes de adicionar complexidade de persistência e autenticação.

A decisão de evoluir para um banco de dados foi bem fundamentada e bem executada.
