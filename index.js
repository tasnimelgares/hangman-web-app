// gère toutes les requêtes HTTP reçues, et les redirige soit vers api.js soit vers files.js
const http = require('http');
const api = require('./api.js');
const files = require('./files.js');

http.createServer((request, response) => {
    const parts = request.url.split('/'); //coupe l'url
    if (parts[1] === 'api') {
        api.manage(request, response);
    } else {
        files.manage(request, response);
    }
}).listen(8000, () => {
    console.log('Serveur en écoute sur http://localhost:8000');//console du serveur pas du nav
});
