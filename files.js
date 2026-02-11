//les fichiers

 fs = require('fs'); //module
const path = require('path');//module
const defaultFile = 'index.html'; // Fichier par défaut 

const frontDir = './front';
const mimeTypes = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.md': 'text/plain',
    'default': 'application/octet-stream'
};


function manageRequest(request, response) {
    try {
        const reqUrl = new URL(request.url, 'https://fakeWebsite.com');
        let filePath = path.join(frontDir, reqUrl.pathname);

        if (fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, defaultFile);
        }

        /*if (filePath.endsWith(path.sep)) {
            filePath = path.join(filePath, 'index.html');
        }
        fs.statSync(filePath);*/
        fs.readFile(filePath, (error, data) => {
            if (error) {
                response.statusCode = 500;
                response.setHeader('Content-Type', 'text/plain');
                response.end('Erreur interne du serveur');
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = mimeTypes[ext] || mimeTypes['default'];
            response.statusCode = 200;
            response.setHeader('Content-Type', mimeType);
            response.end(data);
        });

    } catch (err) {
        response.statusCode = 404;
        /*response.setHeader('Content-Type', 'text/plain')*/
        /*response.end('Fichier non trouvé')*/
        response.setHeader('Content-Type', 'text/html');
         response.end(`
            <html>
                <head>
                    <title>404 Not Found</title>
                    <meta charset="UTF-8"></head>
                <body>
                    <h1>404 - Page non trouvée</h1>
                    <p>Désolé, le fichier demandé n'existe pas.</p>
                </body>
            </html>
        `);
    }
}

exports.manage = manageRequest;
