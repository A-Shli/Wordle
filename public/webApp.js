// WebApp.js

const tileDisplay = document.querySelector('.tile-container');
const keyboard = document.querySelector('.key-container');
const messageDisplay = document.querySelector('.message-container');
const endMessage = document.querySelector('.end-message');
let currentSession = '';
let isProcessingGuess = false;

// Game state variables
let currentRow = 0;
let currentTile = 0;
let isGameOver = false;

let streak = 0;
let highScore = 0;
let gamesPlayed = 0;
let wins = 0;
let losses = 0;
let guessCount = 0;
let guesses = [];
let resultOfGuess = [];

// Key configuration
const keys = [
  'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
  'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
  'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL',
];

// Grid for guesses
const guessArr = Array(6).fill().map(() => Array(5).fill(''));

// Initialize the page and start session
window.addEventListener('load', async () => {
  try {
    currentSession = await getSessionID();
    localStorageInitialise();
    pause();
    setTimeout(() => {
      document.querySelector('.popup').style.display = 'block';
    }, 1000);
  } catch (error) {
    showMessage('Error initializing session');
    console.error(error);
  }
});

// Handle popup close
document.querySelector('#close').addEventListener('click', () => {
  document.querySelector('.popup').style.display = 'none';
});

// Initialize localStorage for session management
async function localStorageInitialise() {
  if (!localStorage.getItem('currentSession')) {
    localStorage.setItem('currentSession', JSON.stringify({
      currentRow: 0,
      currentTile: 0,
      resultOfGuess: [],
    }));
  }

  if (!localStorage.getItem('SessionID')) {
    localStorage.setItem('SessionID', await getSessionID());
  }
}

// Create the game grid and keyboard
guessArr.forEach((guessRow, guessRowIndex) => {
  const row = document.createElement('div');
  row.setAttribute('id', 'guessRow-' + guessRowIndex);
  guessRow.forEach((_, guessIndex) => {
    const tileElement = document.createElement('div');
    tileElement.setAttribute('id', `guessRow-${guessRowIndex}-tile-${guessIndex}`);
    tileElement.classList.add('tile');
    row.append(tileElement);
  });
  tileDisplay.append(row);
});

// Create keyboard buttons
keys.forEach(key => {
  const btn = document.createElement('button');
  btn.textContent = key;
  btn.setAttribute('id', key);
  btn.addEventListener('click', () => clickHandler(key));
  keyboard.append(btn);
});

// Handle keyboard and user input
document.addEventListener('keydown', (e) => {
  if (!isGameOver) {
    let key = e.key.toUpperCase();

    // Check if the key is a single letter from A-Z or a control key like Enter or Backspace
    if (key.length === 1 && key >= 'A' && key <= 'Z') {
      addLetter(key);
    } else if (key === 'ENTER') {
      rowChecker();
    } else if (key === 'BACKSPACE') {
      removeLetter();
    }
  }
});


// Add letter to the grid
const addLetter = (letter) => {
  if (!isGameOver && currentTile < 5 && currentRow < 6) {
    const tile = document.querySelector(`#guessRow-${currentRow}-tile-${currentTile}`);
    tile.textContent = letter;
    guessArr[currentRow][currentTile] = letter;
    tile.setAttribute('data', letter);
    currentTile++;
  }
};

// Remove the last letter
const removeLetter = () => {
  if (currentTile > 0) {
    currentTile--;
    const tile = document.querySelector(`#guessRow-${currentRow}-tile-${currentTile}`);
    tile.textContent = '';
    guessArr[currentRow][currentTile] = '';
    tile.setAttribute('data', '');
  }
};

// Handle button clicks on virtual keyboard
const clickHandler = (letter) => {
  if (!isGameOver) {
    if (letter === 'DEL') {
      removeLetter();
    } else if (letter === 'ENTER') {
      rowChecker();
    } else {
      addLetter(letter);
    }
  }
};

// Show messages to the user
const showMessage = (message) => {
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  messageDisplay.append(messageElement);
  setTimeout(() => messageDisplay.removeChild(messageElement), 3000);
};

// Handle game row submission and check word validity
const rowChecker = () => {
  if (isProcessingGuess) return; // Prevent multiple submissions if already processing a guess

  let guess = guessArr[currentRow].join('').toLowerCase();
  if (currentTile > 4) {
    isProcessingGuess = true; // Set the flag to true when processing starts
    validateGuess(guess).then(valid => {
      if (valid) {
        sendGuess(guess).finally(() => {
          isProcessingGuess = false; // Reset the flag after processing is complete
        });
      } else {
        showMessage('Invalid Guess, try again');
        isProcessingGuess = false; // Reset the flag if the guess is invalid
      }
    });
  }
};


// Add color to the key based on guess result
const addColorToKey = (keyLetter, color) => {
  const key = document.getElementById(keyLetter);
  key.classList.add(color);
};

// Flip tile after guess
const flipTile = (guessedWord) => {
  if (!Array.isArray(guessedWord)) {
    console.error("Expected an array for guessedWord:", guessedWord);
    return;
  }

  const rowTiles = document.querySelector(`#guessRow-${currentRow}`).childNodes;
  const guess = guessedWord.map((result, index) => ({
    letter: guessArr[currentRow][index],
    color: result === '2' ? 'green-overlay' : result === '1' ? 'yellow-overlay' : 'grey-overlay',
  }));

  rowTiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add('flip');
      tile.classList.add(guess[index].color);
      addColorToKey(guess[index].letter, guess[index].color);
    }, 500 * index);
  });
};


// Submit guess to server and process the result
async function sendGuess(word) {
  const payload = { guess: word };
  try {
    const response = await fetch('/checkWord', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.result.length === 0) {
        showMessage('Not a word!');
        return;
      }

      flipTile(data.result); // Ensure you pass the array part of the response to flipTile
      guessCount++;
      guesses.push(word);
      resultOfGuess.push(data.result);

      // Fetch and display the word definition
      await fetchAndDisplayDefinition(word);

      if (checkWinner(data.result)) {
        winGame();
      } else if (guessCount === 6) {
        loseGame();
      } else {
        currentRow++;
        currentTile = 0;
      }
    } else {
      showMessage('Error processing guess');
    }
  } catch (error) {
    showMessage('Network error');
    console.error(error);
  }
}


// Fetch and display the word definition
async function fetchAndDisplayDefinition(word) {
  try {
    const response = await fetch(`/validate/${word}`);
    if (response.ok) {
      const data = await response.json();
      if (data.definition) {
        showMessage(`Definition of ${word}: ${data.definition}`);
      }
    }
  } catch (error) {
    console.error('Error fetching definition:', error);
  }
}

// Validate the guessed word against the dictionary
async function validateGuess(guess) {
  try {
    const response = await fetch(`/validate/${guess}`);
    if (response.ok) {
      const data = await response.json();
      return data.valid;
    }
  } catch (error) {
    console.error('Error validating guess:', error);
  }
  return false;
}

// Check if the guess matches the word
function checkWinner(data) {
  return data.every(letter => letter === '2');
}

// Win game function
async function winGame() {
  isGameOver = true;
  streak++;
  highScore = Math.max(streak, highScore);
  wins++;
  gamesPlayed++;
  const winPercentage = ((wins / gamesPlayed) * 100).toFixed(2);
  try {
      const response = await fetch('/getWordOfTheDay');
      if (response.ok) {
          const data = await response.json();
          const wordOfTheDay = data.word; // Extract the word correctly
          showEndMessage('You Win!', wordOfTheDay, winPercentage);
      } else {
          console.error('Failed to fetch the word of the day');
          showEndMessage('You Win!', 'Unknown', winPercentage); // Fallback in case of an error
      }
  } catch (error) {
      console.error('Error fetching the word of the day:', error);
      showEndMessage('You Win!', 'Unknown', winPercentage); // Fallback in case of an error
  }
}

// Lose game function
async function loseGame() {
  isGameOver = true;
  streak = 0;
  losses++;
  gamesPlayed++;
  const winPercentage = ((wins / gamesPlayed) * 100).toFixed(2);
  try {
      const response = await fetch('/getWordOfTheDay');
      if (response.ok) {
          const data = await response.json();
          const wordOfTheDay = data.word; // Extract the word correctly
          showEndMessage('You Lose!', wordOfTheDay, winPercentage);
      } else {
          console.error('Failed to fetch the word of the day');
          showEndMessage('You Lose!', 'Unknown', winPercentage); // Fallback in case of an error
      }
  } catch (error) {
      console.error('Error fetching the word of the day:', error);
      showEndMessage('You Lose!', 'Unknown', winPercentage); // Fallback in case of an error
  }
}


// Show the end game message
const showEndMessage = (result, word, winPercentage) => {
  const message = `
    ${result}
    Today's Word: ${word}
    Win Percentage: ${winPercentage}%
    High Score: ${highScore}
    Current Streak: ${streak}
    Wins: ${wins}
    Losses: ${losses}
  `;
  endMessage.textContent = message;
  endMessage.style.display = 'block';
};

// Get Session ID from server
async function getSessionID() {
  try {
    const response = await fetch('/checkSession');
    if (response.ok) {
      const data = await response.json();
      return data.sessionId;
    }
  } catch (error) {
    console.error('Error fetching session ID:', error);
  }
  return null;
}

function pause() {
  const localGame = JSON.parse(localStorage.getItem('currentSession'));
  currentRow = localGame.currentRow;
  resultOfGuess = localGame.resultOfGuess || [];

  // Reset the game if session has changed
  if (localStorage.getItem('SessionID') !== currentSession) {
    localStorage.setItem('CurrentGame', JSON.stringify({
      resultOfGuess: [],
    }));
    localStorage.setItem('SessionID', currentSession);
  }
}
