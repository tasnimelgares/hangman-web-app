const fs = require('fs');
const jwt = require('jsonwebtoken');

//const bcrypt = require('bcrypt'); pas la peine

const SECRET_KEY = "clehypersecretehaha"; 

const users = {};  
const games = {}; 

let wordLists = []; 

const difficultySettings = {
  easy: { minLetters: 8, maxLetters: 10, timeLimit: 60 },
  medium: { minLetters: 5, maxLetters: 7,timeLimit: 40 },
  hard: { minLetters: 3, maxLetters: 4, timeLimit: 25 }
};

// Fonction d'authentification
function authenticate(request) {
    const token = request.headers.token;
    if (!token) {
        throw new Error("Token manquant");
    }
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded.username;
    } catch (error) {
        throw new Error("Token invalide");
    }
}


// Lecture et traitement du fichier Les Misérables
fs.readFile('lesmiserables.txt', 'utf8', (err, data) => {
    if (!err) {
        const words = data.split(/[\s,.\r\n]+/);
        for (let word of words) {
            word = word.toLowerCase();
            if (/^[a-z]+$/.test(word)) {
                const len = word.length;
                if (!wordLists[len]) {
                    wordLists[len] = [];
                }
                if (!wordLists[len].includes(word)) {
                    wordLists[len].push(word);
                }
            }
        }
        console.log("Fichier chargé. Mots triés par longueur.");
    } else {
        console.error(err);
    }
});

//Classe Game obligatoire
class Game {
  constructor(level = 'easy', wordLists, maxErrors = 7) {
    this.difficultySettings = {
        easy: { minLetters: 8, maxLetters: 10, timeLimit: 60 },
        medium: { minLetters: 5, maxLetters: 7,timeLimit: 40 },
        hard: { minLetters: 3, maxLetters: 4, timeLimit: 25 }
      
    };
    const settings = this.difficultySettings[level] || this.difficultySettings.easy;
    this.level = level;
    this.timeLimit = settings.timeLimit;
    this.maxErrors = maxErrors;

    let candidates = [];
    for (let i = settings.minLetters; i <= settings.maxLetters; i++) {
      if (wordLists[i]) {
        candidates = candidates.concat(wordLists[i]);
      }
    }
    if (candidates.length === 0) {
      throw new Error("Aucun mot disponible pour ce niveau");
    }
    this.currentWord = candidates[Math.floor(Math.random() * candidates.length)];

    this.currentErrors = 0;
    this.guessedLetters = [];
    this.correctLetters = Array(this.currentWord.length).fill("_");
    this.incorrectLetters = [];
    this.startTime = Date.now();
    this.status = "inProgress"; 
  }

    testLetter(letter) {
    letter = letter.toLowerCase();

    if (this.guessedLetters.includes(letter)) {
      return { error: "Lettre déjà proposée." };
    }
    this.guessedLetters.push(letter);

    const positions = [];
    for (let i = 0; i < this.currentWord.length; i++) {
      if (this.currentWord[i] === letter) {
        positions.push(i);
        this.correctLetters[i] = letter;
      }
    }

    if (positions.length === 0) {
      this.incorrectLetters.push(letter);
      this.currentErrors++;
    }

    if (this.currentErrors >= this.maxErrors) { // Vérifier état de la partie
      this.status = "lost";
    } else if (!this.correctLetters.includes("_")) {
      this.status = "won";
    }

    return {
      isCorrect: positions.length > 0,
      positions: positions,
      errors: this.currentErrors,
      guessed: this.guessedLetters,
      isGameOver: this.status !== "inProgress",
      wordLength: this.currentWord.length,
      status: this.status,
      word: this.status !== "inProgress" ? this.currentWord : undefined
    };
  }
}



// Fonction pour gérer les requêtes API
function manageRequest(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;
    const parts = pathname.split('/'); 

    if (parts[1] === 'api') {
        switch (parts[2]) {
            case 'newGame':
                try {
                    const username = authenticate(request);
                    const level = url.searchParams.get('level') || 'easy'; 
                    games[username] = new Game(level, wordLists);
                    const game = games[username];
                    response.statusCode = 200;
                    response.setHeader('Content-Type', 'application/json');
                    response.end(JSON.stringify({
                        length: game.currentWord.length,
                        timeLimit: game.timeLimit,
                        level: game.level
                    }));
                    console.log(`Mot choisi (${level}) pour ${username}: ${game.currentWord}`);
                } catch (error) {
                    response.statusCode = 401;
                    response.setHeader('Content-Type', 'application/json');
                    response.end("Non autorisé");
                }
                break;

            case 'testLetter':
                try {
                    const username = authenticate(request);
                    const letter = url.searchParams.get('letter');
                    if (!letter || letter.length !== 1 || !/[a-z]/i.test(letter)) {
                        response.statusCode = 400;
                        response.end("Lettre invalide.");
                        return;
                    }
                    const game = games[username];
                    if (!game) {
                        response.statusCode = 400;
                        response.end("Aucune partie en cours.");
                        return;
                    }
                    const result = game.testLetter(letter);

                    if (result.isGameOver) { // Supprimer la partie si terminée!!
                        delete games[username];
                        console.log(`Partie terminée pour ${username}, suppression de la partie.`);
                    }
                    
                    const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
                    if (elapsed > game.timeLimit) {
                        game.status = "lost";
                    }

                    response.statusCode = 200;
                    response.setHeader('Content-Type', 'application/json');
                    response.end(JSON.stringify(result));

                } catch (error) {
                    response.statusCode = 401;
                    response.setHeader('Content-Type', 'application/json');
                    response.end("Non autorisé" );
                }
                break;
                
            case 'getWord':
                const mini = parseInt(url.searchParams.get('minLetters'), 10);
                const maxi = parseInt(url.searchParams.get('maxLetters'), 10);
                if (isNaN(mini) || isNaN(maxi)) {
                    response.statusCode = 400;
                    response.end("Erreur : minLetters et maxLetters doivent être des nombres.");
                    return;
                }
                if (mini > maxi) {
                    response.statusCode = 400;
                    response.end("Erreur : minLetters ne peut pas être supérieur à maxLetters.");
                    return;
                }
                let candidats = []; // récupère tous les mots entre min et max
                for (let i = mini; i <= maxi; i++) {
                    if (wordLists[i]) {
                        candidats = candidats.concat(wordLists[i]); //concat et pas push!
                    }
                }
                if (candidats.length === 0) {
                    response.statusCode = 404;
                    response.end("Aucun mot trouvé dans cette plage de longueur.");
                    return;
                }
                
                const randomWord = candidats[Math.floor(Math.random() * candidats.length)]; // un mot aléatoire
                response.statusCode = 200;
                response.setHeader('Content-Type', 'text/plain');
                response.end(randomWord);
                break;

            case 'register':
                if (request.method !== 'POST') {
                    response.statusCode = 405;
                    return response.end("Méthode non autorisée");
                }
                let body = '';
                request.on('data', chunk => { body += chunk; });
                request.on('end', async () => {
                    let data = JSON.parse(body);
                    if (users[data.username]) {
                        response.statusCode = 409; // user existe déjà
                        return response.end("Nom d'utilisateur déjà pris.");
                    } else {
                        users[data.username] = data.password;
                        console.log("Utilisateur enregistré :", users);
                        response.statusCode = 201;
                        return response.end("Inscription réussie.");
                    }
                }) 
                break;

            case 'login':
                if (request.method !== 'POST') {
                    response.statusCode = 405;
                    return response.end("Méthode non autorisée");
                }
                let loginBody = '';
                request.on('data', chunk => { loginBody += chunk; });
                request.on('end', async () => {
                    let data;
                    try {
                        data = JSON.parse(loginBody);
                    } catch (e) {
                        response.statusCode = 400;
                        return response.end( "Requête invalide." );
                    }

                    const { username, password } = data;
                    if (!users[username]) {
                        response.statusCode = 401;
                        return response.end("Nom d'utilisateur ou mot de passe incorrect.");
                    }

                    const isPasswordValid = (password === users[username]);
                    if (!isPasswordValid) {
                        response.statusCode = 401;
                        return response.end("Nom d'utilisateur ou mot de passe incorrect.");
                    }
                    const token = jwt.sign(
                        { username: username },
                        SECRET_KEY,
                        { expiresIn: "1d" }
                    );
                    console.log(" Tentative de connexion :", data.username);
                    console.log("Dictionnaire users :", users);

                    response.statusCode = 200;
                    response.setHeader('Content-Type', 'application/json');
                    return response.end(JSON.stringify({ token: token }));
                });
                break;

            case 'gameState': {
                try {
                    const username = authenticate(request);
                    const game = games[username];
                    if (!game) {
                        response.statusCode = 404;
                        response.end(JSON.stringify({ error: "Pas de partie en cours" }));
                        return;
                    }
                    let timeLeft = null;
                    if (game.timeLimit && game.startTime) {
                        const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
                        timeLeft = game.timeLimit - elapsed;
                        if (timeLeft < 0) timeLeft = 0;
                    }
                    // pour renvoyer infos utiles pour restaurer la partie coté client
                    response.setHeader("Content-Type", "application/json");
                    response.end(JSON.stringify({
                        word: game.currentWord,
                        correctLetters: game.correctLetters,   
                        incorrectLetters: game.incorrectLetters, 
                        errors: game.currentErrors,
                        level: game.level,
                        timeRemaining: timeLeft,
                        gameStatus: game.status //"inProgress", "won", "lost"
                    }));
                } catch (error) {
                    response.statusCode = 401;
                    response.end(JSON.stringify({ error: error.message }));
                }
                break;    
            }

            default:
                response.statusCode = 404;
                response.end("Route API inconnue.");
        }
    } else {
        response.statusCode = 400;
        response.end("Requête mal formée.");
    }
}


exports.manage = manageRequest;





/* pas besoin hasher 
function stringToHash(string) {
    let hash = 0;
    if (string.length == 0) return hash;
    for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}*/



//http://localhost:8000/index.html et pas user/tasnim.... ->!!CORS

//http://localhost:8000/api/newGame?minLetters=5&maxLetters=7
//http://localhost:8000/api/testLetter?letter=r
//http://localhost:8000/api/newGame?level=easy

