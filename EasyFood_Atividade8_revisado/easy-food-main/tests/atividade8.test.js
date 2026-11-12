const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('endpoint de imagem de perfil exige autenticação e recebe arquivo', () => {
  const routes = read('src/modules/auth/auth.routes.js');
  assert.match(routes, /router\.post\("\/me\/image",\s*authenticate,\s*receiveImage,\s*controller\.uploadProfileImage\)/);
});

test('endpoint de imagem de prato exige autenticação e recebe arquivo', () => {
  const routes = read('src/modules/dishes/dish.routes.js');
  assert.match(routes, /router\.post\("\/dishes\/:dishId\/image",\s*authenticate,\s*receiveImage,\s*controller\.uploadImage\)/);
});

test('os dois módulos usam o serviço compartilhado de imagens', () => {
  assert.match(read('src/modules/auth/auth.service.js'), /require\("\.\.\/shared\/image\.service"\)/);
  assert.match(read('src/modules/dishes/dish.service.js'), /require\("\.\.\/shared\/image\.service"\)/);
});

test('o upload limita tamanho e aceita apenas JPEG, PNG e WebP', () => {
  const middleware = read('src/modules/shared/upload.middleware.js');
  assert.match(middleware, /fileSize:\s*5\s*\*\s*1024\s*\*\s*1024/);
  assert.match(middleware, /image\/jpeg/);
  assert.match(middleware, /image\/png/);
  assert.match(middleware, /image\/webp/);
});

test('o caminho da imagem está previsto no banco e nas consultas de pratos', () => {
  assert.match(read('prisma/schema.prisma'), /imageUrl\s+String\s*$/m);
  assert.match(read('src/modules/dishes/dish.service.js'), /prisma\.dish\.findMany/);
});
