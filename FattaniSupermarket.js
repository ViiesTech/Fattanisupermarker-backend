const express = require('express');
const path = require("path");
const Database = require('./database/Database');
const routes = require('./Routes');
const adminRoutes = require('./routes/admin');
require('dotenv').config();
// const { swaggerUi, swaggerSpec } = require('./swagger'); // Import Swagger

const app = express(); // ✅ create express app instance
const PORT = process.env.PORT || 3000;

// Connect to database
Database();

app.use(express.json());
// ✅ Swagger docs route
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Your API routes
app.use('/api', routes);
app.use('/admin', adminRoutes);


app.get('/', (req, res) => {
  res.send('Fattani Supermarket API is running');
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app;
