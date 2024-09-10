const path = require('path');

// Функція для створення повного шляху до файлу EJS
const createPath = (page) => path.resolve(__dirname, '../views', `${page}.ejs`);

module.exports = createPath;
