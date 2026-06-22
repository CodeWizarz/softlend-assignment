const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

const specPath = path.join(__dirname, '..', '..', 'swagger', 'openapi.yml');
const spec = fs.readFileSync(specPath, 'utf8');

const swaggerDocument = (() => {
  try {
    const yaml = require('js-yaml');
    return yaml.load(spec);
  } catch {
    const YAML = require('yaml');
    return YAML.parse(spec);
  }
})();

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Softlend API Docs',
    customfavIcon: 'https://img.icons8.com/color/48/finance.png',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  app.get('/api/docs.json', (_req, res) => {
    res.json(swaggerDocument);
  });

  console.log('Swagger UI: http://localhost:3000/api/docs');
}

module.exports = setupSwagger;
