# ADR-004: Autenticação com JWT (JSON Web Tokens)

## Status
Aceita e em produção

## Data
15/09/2026

## Responsável
Equipe EasyFood

## Contexto
Com a evolução da EasyFood para suportar múltiplos usuários, surgiu um requisito crítico: 
**controlar o acesso aos recursos com base no usuário autenticado**.

### Necessidades Identificadas
- ✅ Cada usuário deve ter seus próprios restaurantes
- ✅ Um usuário não deve conseguir editar/deletar restaurantes de outro usuário
- ✅ Operações sensíveis devem estar protegidas (logout não autenticado)
- ✅ A aplicação deve "lembrar" do usuário entre requisições

### Requisitos de Negócio
1. **Registro de Usuário**: criar nova conta com email e senha
2. **Login**: autenticar e obter acesso
3. **Persistência**: manter usuário autenticado sem solicitar senha a cada requisição
4. **Autorização**: apenas o dono pode editar/deletar seus restaurantes
5. **Logout**: invalidar acesso

## Alternativas Consideradas

### 1. **Session-Based (Express-Session + Redis/PostgreSQL)**
```
Cliente → Login → Cria Session → Armazena em Backend → Cookie com Session ID
```
- ✅ Tradicional, bem suportado
- ❌ Requer store de sessão (Redis/DB)
- ❌ Difícil para Mobile/PWA
- ❌ Acoplamento com servidor

### 2. **JWT (JSON Web Tokens)**
```
Cliente → Login → Recebe Token JWT → Armazena Localmente → Envia em cada requisição
```
- ✅ Stateless (sem estado no servidor)
- ✅ Funciona com Mobile, PWA, SPAs
- ✅ Mais simples para iniciar
- ❌ Token inválido não é revogado instantaneamente
- ❌ Requer cuidado com expiração

### 3. **OAuth 2.0 (Google, GitHub, etc)**
- ✅ Terceiros responsáveis pela autenticação
- ❌ Adiciona dependência externa
- ❌ Overcomplicated para MVP
- ❌ Requer configuração em plataformas externas

### 4. **API Keys Simples**
- ✅ Muito simples
- ❌ Inseguro para dados sensíveis
- ❌ Não oferece identificação de usuário
- ❌ Sem controle de expiração

## Decisão
Escolhemos **JWT (JSON Web Tokens)** como mecanismo de autenticação.

## Justificativa

### 1. Stateless (Perfeito para APIs)
- Servidor não precisa manter estado de sessão
- Escalável horizontalmente (múltiplos servidores)
- Facilita testes automatizados

### 2. Universal
- Funciona em web, mobile, desktop
- Suportado nativamente em navegadores modernos (localStorage)
- Padrão da indústria para SPAs e APIs

### 3. Segurança
- Assinado digitalmente (HMAC/RSA)
- Payload pode ser verificado, não forjado
- Inclui expiração (exp claim)
- Pode ser revogado (blacklist se necessário)

### 4. Simplicidade para MVP
- Biblioteca `jsonwebtoken` é pequena e madura
- Implementação rápida (~30 minutos)
- Sem dependências externas pesadas

### 5. Flexibilidade
- Fácil migração para OAuth 2.0 futuro
- Suporta refresh tokens
- Informações (claims) podem ser personalizadas

## Implementação na EasyFood

### Estrutura de Autenticação

```javascript
// 1. Registro (POST /auth/register)
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
→ Cria User no banco
→ Hash de senha com bcrypt

// 2. Login (POST /auth/login)
{
  "email": "joao@email.com",
  "password": "senha123"
}
→ Valida credenciais
→ Gera JWT
→ Retorna token

// 3. Token JWT contém:
{
  "id": 1,
  "email": "joao@email.com",
  "iat": 1234567890,
  "exp": 1234571490  // expira em ~1 hora
}
(Assinado com SECRET_KEY)

// 4. Requisições Autenticadas
GET /restaurants
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
→ Middleware valida token
→ Extrai user.id
→ Autoriza operação
```

### Middleware de Autenticação

```javascript
function verifyJWT(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
```

### Proteção de Rotas

```javascript
// Pública
router.get('/restaurants', getRestaurants);

// Protegida - requer autenticação
router.get('/my-restaurants', verifyJWT, getUserRestaurants);
router.post('/restaurants', verifyJWT, postRestaurant);

// Protegida + Autorização - requer ownership
router.put('/restaurants/:id', verifyJWT, authorizarOwner, putRestaurant);
router.delete('/restaurants/:id', verifyJWT, authorizarOwner, deleteRestaurant);
```

### Fluxo Frontend

```javascript
// 1. Registro/Login → obter token
const token = localStorage.getItem('token');

// 2. Requisição com token
fetch('/my-restaurants', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 3. Logout → limpar token
localStorage.removeItem('token');
```

## Consequências

### Positivas
- ✅ **Segurança Implementada**: Usuários separados, dados isolados
- ✅ **Autorização Clara**: Cada operação verifica ownership
- ✅ **Stateless**: Servidor não precisa guardar sessões
- ✅ **Escalável**: Funciona com múltiplas instâncias
- ✅ **Mobile-Ready**: Funciona em qualquer cliente HTTP
- ✅ **Logout Automático**: Token expira em ~1 hora
- ✅ **Auditoria Simples**: Saber quem criou/editou é trivial

### Negativas / Trade-offs
- ⚠️ **Token Inválido Não é Revogado Instantaneamente**
  - **Mitigação**: Usar refresh tokens, implementar blacklist em produção
  - **Aceito para MVP**: 1 hora de validade é razoável

- ⚠️ **Segurança Depende de SECRET_KEY**
  - **Mitigação**: Usar variável de ambiente, nunca commitar no git
  - **Aceito**: Seguindo boas práticas

- ⚠️ **Token Visível no Frontend (localStorage)**
  - **Mitigação**: Usar HTTPS, HttpOnly cookies em produção
  - **Aceito para MVP**: localStorage funciona, cookies virão depois

- ⚠️ **CORS Pode Ser Complexo**
  - **Mitigação**: Configurar CORS corretamente no Express
  - **Aceito**: Problema resolvido com middleware simples

## Segurança Implementada

### ✅ Checklist de Segurança
- ✅ Senhas hasheadas com bcrypt (não armazenar plain text)
- ✅ JWT assinado com SECRET_KEY
- ✅ Expiração de token (1 hora)
- ✅ Verificação de ownership (não editar restaurante alheio)
- ✅ Middleware de autenticação em rotas sensíveis
- ✅ Validação de entrada (email, senha)
- ✅ Tratamento de erros sem expor detalhes
- ⚠️ HTTPS em produção (não implementado em dev)
- ⚠️ Rate limiting (futuro)
- ⚠️ CSRF tokens (futuro, se mudar para sessions)

## Critérios de Revisão

Esta decisão deverá ser reavaliada caso:

1. **Revogação Imediata Necessária**
   - **Indicador**: Usuário hackado precisa perder acesso agora
   - **Solução**: Implementar token blacklist em Redis

2. **Múltiplos Dispositivos**
   - **Indicador**: Usuário deseja logout em um dispositivo mas continuar em outro
   - **Solução**: Implementar refresh tokens + device IDs

3. **Compliance/Auditoria Rigorosa**
   - **Indicador**: Regulação exigindo logs de autenticação
   - **Solução**: Adicionar tabela de AuditLog

4. **Login Social Desejado**
   - **Indicador**: Usuários querem login com Google/GitHub
   - **Solução**: Integrar OAuth 2.0, emitir JWT após validação

5. **Performance de Verificação**
   - **Indicador**: Verificação JWT em cada requisição é gargalo
   - **Solução**: Adicionar cache de tokens validados

## Próximos Passos

### Curto Prazo
- ✅ Implementado e funcionando
- ✅ Testes manuais passando

### Médio Prazo
- ⏳ Implementar refresh tokens (renovar sem fazer login novamente)
- ⏳ Adicionar rate limiting (evitar brute force)
- ⏳ Implementar "Lembrar dispositivo"

### Longo Prazo (Produção)
- ⏳ HTTPS obrigatório
- ⏳ HttpOnly cookies ao invés de localStorage
- ⏳ Token blacklist em Redis
- ⏳ Integração com OAuth 2.0 (opcional)
- ⏳ Logs de segurança (audit trail)

## Boas Práticas Adotadas
- ✅ SECRET_KEY em variável de ambiente
- ✅ Senha hasheada com bcrypt (não plain text)
- ✅ Token com expiração
- ✅ Middleware reutilizável (verifyJWT)
- ✅ Autorização por ownership (não apenas autenticação)
- ✅ Validação de email e senha no input

## Conclusão

JWT foi a escolha certa para a EasyFood. Oferece:
- **Segurança adequada para MVP** ✅
- **Escalabilidade sem estado** ✅
- **Implementação simples** ✅
- **Caminho claro para evoluir** ✅

A autenticação agora permite que cada usuário tenha seus próprios restaurantes,
criando o conceito de **multi-tenancy leve** que torna a aplicação mais realista e valiosa.

Relacionado:
- **ADR-002**: Escolha do banco de dados (suporta User model)
- **ADR-003**: Prisma ORM (facilita model User + relacionamentos)
- **ADR-005**: (Futuro) Refresh tokens e segurança avançada
