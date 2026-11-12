# EasyFood API

API de restaurantes construída com Node.js, Express, Prisma e PostgreSQL.
Autenticação via JWT.

## Requisitos

- Node.js 18.18 ou superior.
- PostgreSQL em execução.
- Banco de dados criado para a aplicação.

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie o arquivo `.env` a partir do `.env.example` e preencha os valores.

3. Gere o Prisma Client e aplique as migrations:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
   Para ambiente de desenvolvimento, com novas migrations, use `npx prisma migrate dev`.

4. Inicie o servidor:
   ```bash
   npm start
   ```

## Endpoints

- `GET  /restaurants` — lista restaurantes (público)
- `POST /restaurants` — cadastra restaurante (exige token)
- `POST /auth/register` — cadastra usuário
- `POST /auth/login` — faz login e devolve um token JWT
- `GET  /auth/me` — dados do usuário logado (exige token)
## Atividade 8 — Upload de imagens

### Dependências adicionadas

- `multer`: recebe arquivos enviados em `multipart/form-data` (campo `image`).
- `sharp`: valida, redimensiona e converte imagens para WebP.

Instale as dependências e gere o Prisma Client:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm start
```

A aplicação espera `DATABASE_URL` e `JWT_SECRET` no arquivo `.env`. A migração `20261111000100_add_user_profile_image` adiciona `User.imageUrl`. O campo `Dish.imageUrl` já existia no schema.

### Endpoints

- `POST /restaurants/:restaurantId/dishes` — cadastra um prato. Requer JWT de quem é dono do restaurante. Retorna `201`.
- `POST /auth/me/image` — atualiza a imagem do usuário autenticado. Requer JWT.
- `POST /dishes/:dishId/image` — atualiza a imagem de um prato. Requer JWT e que o usuário seja dono do restaurante associado.
- `GET /auth/me` — retorna os dados do usuário autenticado, incluindo `imageUrl`.
- `GET /restaurants/:restaurantId/dishes` e `GET /dishes/:dishId` — retornam os pratos com `imageUrl`.

Para os dois uploads, envie `multipart/form-data`, com o arquivo no campo `image`. São aceitos JPEG, PNG e WebP, com tamanho máximo de 5 MB. A imagem é otimizada e salva em `public/uploads/users` ou `public/uploads/dishes`; o caminho público retornado pode ser aberto no navegador, por exemplo `http://localhost:3000/uploads/users/arquivo.webp`.

Exemplo de upload do perfil:

```bash
curl -X POST http://localhost:3000/auth/me/image \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "image=@./minha-foto.jpg"
```

Exemplo de upload de imagem do prato:

```bash
curl -X POST http://localhost:3000/dishes/1/image \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "image=@./foto-prato.png"
```

### Organização e responsabilidades

- `upload.middleware.js`: recebe o arquivo, limita tamanho e filtra tipos MIME.
- `image.service.js`: valida o conteúdo real com Sharp, redimensiona, converte para WebP e grava o arquivo. É compartilhado por usuários e pratos.
- Controllers: recebem os dados da requisição, chamam os serviços e montam as respostas HTTP.
- Services de domínio: verificam existência/permissão, coordenam o processamento e persistem o caminho no PostgreSQL via Prisma.
- `auth.middleware.js`: valida o JWT e fornece o ID do usuário autenticado; o ID não é aceito do corpo da requisição para definir o dono do perfil.

Se o arquivo não for uma imagem válida ou o processamento falhar, a operação retorna erro e não atualiza o caminho no banco. Se a gravação no banco falhar depois do processamento, o arquivo novo é removido para evitar arquivo órfão. Imagens antigas também são removidas após a substituição bem-sucedida.

### Sobre a correção do cadastro de pratos

Nesta cópia recebida, o serviço de pratos já contém validação dos campos e do identificador, consulta de existência do restaurante, verificação de propriedade pelo usuário autenticado e criação do prato associado por `restaurantId`. Como não foi fornecida uma cópia anterior do projeto nem o repositório-base do professor, não é possível afirmar quais linhas foram alteradas pelo professor nem fazer uma comparação histórica. O comportamento atual pode ser conferido em `src/modules/dishes/dish.service.js` e `src/modules/dishes/dish.controller.js`.


### Testes realizados e roteiro de validação

A validação estática deve ser executada com:

```bash
node --check server.js
find src -name "*.js" -print0 | xargs -0 -n1 node --check
```

Para validar o funcionamento completo, configure o PostgreSQL e o `.env`, inicie a API e teste os endpoints com Postman ou Insomnia. Verifique pelo menos:

1. Upload de perfil com token válido e imagem JPEG/PNG/WebP: resposta `200` e `imageUrl` preenchido.
2. Upload de prato com token do proprietário: resposta `200` e `imageUrl` preenchido.
3. Upload sem token ou com token inválido: resposta `401`.
4. Upload sem arquivo, com formato inválido ou arquivo acima de 5 MB: resposta `400` ou `413`, conforme o caso.
5. Upload de prato inexistente: resposta `404`.
6. Usuário que não é proprietário tentando alterar a imagem do prato: resposta `403`.
7. Consultas de pratos: confirmar que o campo `imageUrl` aparece no retorno.

**Limitação desta entrega:** a sintaxe JavaScript pode ser verificada localmente, mas os testes integrados dependem de um PostgreSQL acessível e de credenciais reais no `.env`. Não foram simuladas respostas de banco nem declarados como aprovados testes que dependem desse ambiente.
