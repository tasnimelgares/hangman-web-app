// ==============================
// Variables globales
// ==============================
let word = "";                // Mot à découvrir
let errorCount = 0;             // Compteur d'erreurs
let testedLetters =[];         // Lettres déjà testées
let foundLetters =[];          // Lettres trouvées ("_" pour non découvertes)
let currentDifficulty = 'auto';
let chronoTimer = null;         // Timer du chrono
let timeRemaining = null;       // Temps restant (sec)
let token = null;           // Token utilisateur
let gameOver = false;           // État de la partie

// ===================
// Sélecteurs DOM
// ===================
const playBtn = document.getElementById("play");
const replayBtn = document.getElementById("replay");
const continueBtn = document.getElementById("continue");
const difficultySelector = document.getElementById("difficulty");
const letterInput = document.getElementById("letterInput");
const testLetterBtn = document.getElementById("testLetter");
const wordDisplay = document.getElementById("mot");
const messageDiv = document.getElementById("message");
const popup = document.getElementById("popup");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const changeDifficultyBtn = document.getElementById("changeDifficultyBtn");
const loader = document.getElementById("loader");
const logoutBtn = document.getElementById("logoutBtn");

// Configuration des difficultés
const difficultySettings = {
    easy:   { timeLimit: 60 },
    medium: { timeLimit: 40 },
    hard:   { timeLimit: 25 },
};

// ===================
// Écouteurs d'événements
// ===================
playBtn.addEventListener("click", async () => {
    console.log("nouvelle partie");
   loader.style.display = "inline";  // afficher le loader

    console.log("Loader activé");
  try {
    await newGame();
  } catch (error) {
    console.error("Erreur lors du lancement de la partie:", error);
    alert("Erreur lors du lancement de la partie.");
  }
  finally {
        loader.style.display = "none";
    }
});
replayBtn.addEventListener("click", newGame);
continueBtn.addEventListener("click", continueGame);
changeDifficultyBtn.addEventListener("click", onChangeDifficulty);

testLetterBtn.addEventListener("click", () => {
    const letter = letterInput.value.toUpperCase();
    letterInput.value = "";

    if (gameOver) return;

    if (letter.length === 1 && letter.match(/[A-Z]/)) {
        clicSurUneLettre(letter);
    } else {
        alert("Veuillez entrer une lettre valide (A-Z).");
    }
});

letterInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        testLetterBtn.click();
    }
});
loginBtn.addEventListener("click", loginUser);
registerBtn.addEventListener("click", registerUser);

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    token = null;
    clearInterval(chronoTimer);
    popup.style.display = "block"; // Ré-afficher la popup de login
    document.getElementById("usernameDisplay").textContent = "Invité"; // Remettre le nom par défaut
    console.log("Déconnecté avec succès.");
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("registerUsername").value = "";
    document.getElementById("registerPassword").value = "";
    document.getElementById("loginMessage").textContent = "";
    document.getElementById("registerMessage").textContent = "";

});
// Connexion avec touche Entrée
document.getElementById("loginPassword").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        loginUser();
    }
});
document.getElementById("loginUsername").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        loginUser();
    }
});

// Inscription avec touche Entrée
document.getElementById("registerPassword").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        registerUser();
    }
});
document.getElementById("registerUsername").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        registerUser();
    }
});

// ===================
// Fonctions
// ===================
function setupWordDisplay() {
    wordDisplay.innerHTML = "_ ".repeat(word.length);
}

function updateWordDisplay() {
    wordDisplay.innerHTML = foundLetters.join(' ');
}

function formatTime(sec) {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, '0')}`;
}
function resetGameUI() {
    messageDiv.textContent = "";
    messageDiv.className = "";
    replayBtn.style.display = "none";
    replayBtn.disabled = true;
    errorCount = 0;
    document.getElementById("erreurCount").textContent = "0";
    // Cache pendu
    for (let i = 1; i <= 7; i++) {
        document.getElementById("i" + i).style.display = "none";
    }
    testedLetters = [];
    document.querySelectorAll("#lettres span").forEach(span => {
        span.classList.remove("correct", "incorrect");
    });
}
function onChangeDifficulty() {
    gameOver = true;
    letterInput.disabled = true;
    testLetterBtn.disabled = true;
    replayBtn.style.display = "none";
    changeDifficultyBtn.style.display = "none";
    document.body.classList.add("modeConfig");
    difficultySelector.disabled = false;
    continueBtn.style.display = "none";

    wordDisplay.innerHTML = "";
    messageDiv.textContent = "";
    messageDiv.className = "";

    for (let i = 1; i <= 7; i++) {
        document.getElementById("i" + i).style.display = "none";
    }

    if (chronoTimer) {
        clearInterval(chronoTimer);
        chronoTimer = null;
    }
}

// Gestion du chrono
function startChrono(duration) {
    const chronoDisplay = document.getElementById("chronoTime");
    const chronoBar = document.getElementById("chronoBar");

    let remaining = duration;

    const updateTime = () => {
        if (gameOver) {
            clearInterval(chronoTimer);
            return;
        }

        const percentage = (remaining / duration) * 100;
        chronoBar.style.width = `${percentage}%`;
        chronoDisplay.textContent = formatTime(remaining);
        localStorage.setItem("savedTimeRemaining", remaining.toString());
        timeRemaining=remaining;
        if (remaining <= 0) {
    clearInterval(chronoTimer);
    endGame(false, "Temps écoulé ! Vous avez perdu !");
}
 else {
            remaining--;
        }
    };
    updateTime();
    chronoTimer = setInterval(updateTime, 1000);
}
// ===================
// fonctions asynchrones 
// ===================
async function newGame() { 
  gameOver = false;
  replayBtn.disabled = true;
  replayBtn.style.display = "none";
  letterInput.disabled = false;
  testLetterBtn.disabled = false;
  document.body.classList.remove("modeConfig");
  currentDifficulty = difficultySelector.value;
  difficultySelector.disabled = true;
  if (chronoTimer !== null) {
    clearInterval(chronoTimer);
    chronoTimer = null;
  }
  console.log(`Nouvelle partie démarrée avec difficulté : ${currentDifficulty}`);
  await getNewWord();  
}

async function getNewWord() {
  try {
     if (currentDifficulty === "auto") currentDifficulty = "easy";

   
    let url = "http://localhost:8000/api/newGame?level=" + currentDifficulty;

    const token = localStorage.getItem("token"); // récupère le token

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'token': token // envoie le token dans les headers
      }
    });

    if (!response.ok) {
        messageDiv.textContent = "Erreur serveur lors de la récupération du mot.";
        messageDiv.className = "error";
        return;
    }

    const data = await response.json();
    word = "_".repeat(data.length);
    foundLetters = word.split("");
    timeRemaining = data.timeLimit;
    setupWordDisplay();

    if (timeRemaining !== null) {
        startChrono(timeRemaining);
    }
    console.log(`Mot récupéré depuis l'API (longueur : ${data.length} lettres). Chrono : ${data.timeLimit} secondes`);

  } catch (error) {
    console.error("Erreur lors de la connexion à l'API :", error);
    messageDiv.textContent = "Erreur réseau, veuillez réessayer plus tard.";
    messageDiv.className = "error";
    word = "TEST";
    foundLetters = ["_", "_", "_", "_"];
    setupWordDisplay();
  }
  resetGameUI();
}

async function clicSurUneLettre(letter) {
  if (gameOver || testedLetters.includes(letter)) return;
  testedLetters.push(letter);
  try {
    const token = localStorage.getItem("token"); // récupère le token
    console.log(`Lettre testée : ${letter}`);

    const response = await fetch(`http://localhost:8000/api/testLetter?letter=${letter.toLowerCase()}`, {
      method: 'GET',
      headers: {
        'token': token // envoie le token dans les headers
      }
    });

    if (!response.ok) {
        messageDiv.textContent = "Erreur serveur lors de la vérification de la lettre.";
        messageDiv.className = "error";
        return;
    }
    const data = await response.json();
    console.log(data.isCorrect ? `Bonne lettre trouvée à ${data.positions.length} position(s)` : "Lettre incorrecte");

    const letterSpan = document.getElementById(letter);
    if (data.isCorrect) {
        data.positions.forEach(pos => {
            foundLetters[pos] = letter;
        });
        updateWordDisplay();
        letterSpan.classList.add("correct");

        if (!foundLetters.includes("_")) {
            endGame(true, "Bravo, vous avez gagné !");
        }
    } else {
        errorCount = data.errors;
        document.getElementById("erreurCount").textContent = errorCount;
        letterSpan.classList.add("incorrect");

        const hangmanPart = document.getElementById("i" + errorCount);
        if (hangmanPart) hangmanPart.style.display = "inline";

        if (errorCount >= 7) {
            endGame(false, `Désolé, vous avez perdu ! Le mot était : ${data.word}`);
        }
    }
  } catch (error) {
    console.error("Erreur lors du test de lettre :", error);
    messageDiv.textContent = "Erreur réseau, veuillez réessayer.";
    messageDiv.className = "error";
  }
}
async function endGame(hasWon, message) {
  gameOver = true;
  letterInput.disabled = true;
  testLetterBtn.disabled = true;
  difficultySelector.disabled = false;
  replayBtn.style.display = "inline";
  replayBtn.disabled = false;
  changeDifficultyBtn.style.display = "inline";
  messageDiv.textContent = message;
  messageDiv.className = hasWon ? "success" : "error";
  if (chronoTimer) {
    clearInterval(chronoTimer);
    chronoTimer = null;
  }
  console.log(hasWon ? "Partie gagnée !" : "Partie perdue.");
}

async function continueGame() {
  if (!token) {
      alert("Vous devez être connecté pour continuer une partie.");
      return;
  }
  try {
      difficultySelector.disabled = true;
      const response = await fetch("http://localhost:8000/api/gameState", {
          headers: { "token": token }
      });

      if (response.status === 401) {
          alert("Session expirée, veuillez vous reconnecter.");
          return;
      }

      if (!response.ok) {
          alert("Aucune partie en cours à reprendre.");
          return;
      }
     
      const data = await response.json();
        if (data.gameStatus === "won") {
            alert("La partie précédente était gagnée ! Le mot était : " + data.word);
            return;
        }
        if (data.gameStatus === "lost") {
            alert("La partie précédente était perdue ! Le mot était : " + data.word);
            return;
        }
    document.body.classList.remove("modeConfig");

      console.log("Partie chargée avec succès. Erreurs :", errorCount, "Lettres testées :", testedLetters.join(", "));
      word = data.word;
      foundLetters = data.correctLetters.map(l => l === "_" ? "_" : l.toUpperCase());
      testedLetters = [
          ...data.correctLetters.filter(l => l !== "_"),
          ...data.incorrectLetters
      ];
      errorCount = data.errors || data.incorrectLetters.length;


      updateWordDisplay();
      document.getElementById("erreurCount").textContent = errorCount;

      for (let i = 1; i <= 7; i++) {
          document.getElementById("i" + i).style.display = (i <= errorCount) ? "inline" : "none";
      }

      document.querySelectorAll("#lettres span").forEach(span => {
          const letter = span.textContent.toUpperCase();
          span.classList.remove("correct", "incorrect");

          if (data.correctLetters.map(l => l.toUpperCase()).includes(letter)) {
              span.classList.add("correct");
          } else if (data.incorrectLetters.map(l => l.toUpperCase()).includes(letter)) {
              span.classList.add("incorrect");
          }
      });

        if (typeof data.timeRemaining === "number") {
            startChrono(data.timeRemaining);
        } else {
            const savedTime = parseInt(localStorage.getItem("savedTimeRemaining"));
            if (!isNaN(savedTime)) {
                startChrono(savedTime);
            }
        }

      letterInput.disabled = false;
      testLetterBtn.disabled = false;
      replayBtn.style.display = "none";
      replayBtn.disabled = true;
      difficultySelector.disabled = true;
      gameOver = false;
  } catch (error) {
      console.error("Erreur lors de la récupération de la partie :", error);
      alert("Erreur réseau lors du chargement de la partie, veuillez réessayer.");
  }
}

// ===================
// Gestion Authentification 
// ===================
async function registerUser (){
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const message = document.getElementById('registerMessage');

    if (!username || !password) {
        message.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    if (!/^[a-zA-Z]+$/.test(username)) {
        message.textContent = "Nom d'utilisateur invalide (seules les lettres sont autorisées).";
        return;
    }

    if (password.length < 8) {
        message.textContent = "Le mot de passe doit contenir au moins 8 caractères, au moins une lettre et au moins un chiffre.";
        return;
    }
    if (!/[a-zA-Z]/.test(password)) {
        message.textContent = "Le mot de passe doit contenir au moins une lettre.";
        return;
    }
    if (!/[0-9]/.test(password)) {
        message.textContent = "Le mot de passe doit contenir au moins un chiffre.";
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const contentType = response.headers.get("Content-Type");
            let errorMessage = "Erreur inconnue lors de l'inscription.";
            
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } else {
                errorMessage = await response.text() || errorMessage;
            }
            
            message.textContent = errorMessage;
            return;
        }
        
        message.textContent = "Inscription réussie ! Veuillez vous connecter.";
    } catch (error) {
        console.error("Erreur réseau pendant l'inscription :", error);
        message.textContent = "Erreur de connexion au serveur.";
    }
};

async function loginUser() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const message = document.getElementById('loginMessage');

    if (!username || !password) {
        message.textContent = "Veuillez remplir les deux champs pour vous connecter.";
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const contentType = response.headers.get("Content-Type");
            let errorMessage = "Erreur inconnue lors de la connexion.";

            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } else {
                errorMessage = await response.text() || errorMessage;
            }
            message.textContent = errorMessage;
            return;
        }
        const responseData = await response.json();
        token = responseData.token;
        localStorage.setItem("token", token);   
        localStorage.setItem("username", username);
        document.getElementById("usernameDisplay").textContent = username;

        message.textContent = "Connexion réussie !";
        popup.style.display = "none";
        document.body.classList.add("modeConfig");

    } catch (error) {
        console.error("Erreur réseau pendant la connexion :", error);
        message.textContent = "Erreur de connexion au serveur.";
    }
}

//maintenir une session utilisateur même après un rechargement de page
token = localStorage.getItem("token");
const savedUsername = localStorage.getItem("username");

if (token && savedUsername) {
    popup.style.display = "none";
    document.getElementById("usernameDisplay").textContent = savedUsername;
    console.log("Utilisateur déjà connecté avec un token.");
}