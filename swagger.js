const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fattani Supermarket API',
      version: '1.0.0',
      description: 'API documentation for Fattani Supermarket',
    },
    servers: [
      {
        url: 'http://localhost:4001', // replace with your actual server URL
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: ['./Routes.js'], // Assuming routes are in /routes
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = { swaggerUi, swaggerSpec };
