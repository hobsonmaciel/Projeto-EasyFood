# EasyFood — Rotas previstas

## Páginas

- `GET /` → Home protegida pelo guard do frontend.
- `GET /auth` → redireciona para `/auth/login`.
- `GET /auth/login` → tela de login.
- `GET /auth/register` → tela de cadastro.

## API

- `POST /auth/login` → autenticação e emissão do JWT.
- `POST /auth/register` → criação de usuário.
- `GET /auth/me` → validação do JWT e retorno do usuário atual.
- `GET /restaurants` → listagem pública.
- `POST /restaurants` → criação protegida por JWT.
- `GET /health` → health check.

Rotas não previstas retornam `404` e não são redirecionadas para a Home.
