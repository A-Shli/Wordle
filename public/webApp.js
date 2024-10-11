const tileDisplay = document.querySelector('.tile-container');
const keyboard = document.querySelector('.key-container');
const messageDisplay = document.querySelector('.message-container');
const endMessage = document.querySelector('.end-message');
let isProcessingGuess = false;
let isPopupClosed = false; // Add flag to control input based on popup

let currentSession = '';

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

    // Handle theme loading here
    const selectedTheme = localStorage.getItem('theme');
    if (selectedTheme) {
      document.body.classList.add(selectedTheme);
    } else {
      // Set Minimalist Light as the default theme if no theme is stored
      document.body.classList.add('minimalist-light');
      localStorage.setItem('theme', 'minimalist-light');
    }

    // Show instructions popup after 1 second
    setTimeout(() => {
      const popup = document.querySelector('.popup');
      popup.style.display = 'block';
      popup.classList.add('open-popup'); // Add class for animation
    }, 1000);
  } catch (error) {
    showMessage('Error initializing session');
    console.error(error);
  }
});

// Function to animate tile flipping for popup tiles
function flipPopupTiles() {
  const tiles = document.querySelectorAll('.popup-tile');
  tiles.forEach((tile, index) => {
      setTimeout(() => {
          tile.classList.add('flip');
      }, index * 500);  // Delay each tile flip by 500ms
  });
}

// Trigger the flip animation after the popup opens
function openPopup() {
  const popup = document.querySelector('.popup');
  popup.style.display = 'block';  // Show popup
  setTimeout(() => {
      popup.classList.add('open-popup');  // Add class for opening animation
      flipPopupTiles();  // Start flipping tiles after opening
  }, 10);
}

// Event listener to close the popup
function closePopup() {
  const popup = document.querySelector('.popup');
  popup.classList.remove('open-popup');  // Close the popup
  setTimeout(() => {
      popup.style.display = 'none';
  }, 300);  // Wait for the closing animation to finish
}


document.querySelector('#startGame').addEventListener('click', () => {
  const popup = document.querySelector('.popup');
  popup.classList.remove('open-popup');
  popup.classList.add('close-popup'); // Add closing animation class
  setTimeout(() => {
    popup.style.display = 'none';
    isPopupClosed = true; // Allow input after the popup is closed
    popup.classList.remove('close-popup'); // Reset after animation
  }, 300); // Delay to match the closing animation duration
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

// Variables for the settings panel
const settingsIcon = document.getElementById('settingsIcon');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettings');

// Open the settings panel when the icon is clicked
settingsIcon.addEventListener('click', () => {
  settingsPanel.classList.add('open');
});

// Close the settings panel
closeSettingsBtn.addEventListener('click', () => {
  settingsPanel.classList.remove('open');
});

// Theme selection function
function setTheme(theme) {
  document.body.classList.remove('neon', 'retro', 'minimalist-light');
  document.body.classList.add(theme);
  localStorage.setItem('theme', theme);
}

// Add event listener for the "Other Themes" button
document.getElementById('other-themes').addEventListener('click', function () {
  const themeOptions = document.getElementById('themeOptions');
  if (themeOptions.style.display === 'none' || themeOptions.style.display === '') {
      themeOptions.style.display = 'block';
  } else {
      themeOptions.style.display = 'none';
  }
});


// Event listeners for theme buttons
document.getElementById('neon-theme').addEventListener('click', () => setTheme('neon'));
document.getElementById('retro-theme').addEventListener('click', () => setTheme('retro'));
document.getElementById('minimalist-theme').addEventListener('click', () => setTheme('minimalist-light'));

// Toggle dark theme
document.getElementById('dark-mode').addEventListener('change', (e) => {
  if (e.target.checked) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
});

// Toggle showing definitions
document.getElementById('show-definitions').addEventListener('change', (e) => {
  localStorage.setItem('showDefinitions', e.target.checked);
});

// Create the game grid and keyboard
guessArr.forEach((guessRow, guessRowIndex) => {
  const row = document.createElement('div');
  row.setAttribute('id', `guessRow-${guessRowIndex}`);
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
  if (!isPopupClosed || isGameOver) return; // Prevent input if popup is open or game is over

  let key = e.key.toUpperCase();

  if (key.length === 1 && key >= 'A' && key <= 'Z') {
    addLetter(key);
  } else if (key === 'ENTER') {
    rowChecker();
  } else if (key === 'BACKSPACE') {
    removeLetter();
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
  if (!isPopupClosed || isGameOver) return;

  if (letter === 'DEL') {
    removeLetter();
  } else if (letter === 'ENTER') {
    rowChecker();
  } else {
    addLetter(letter);
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
  if (isProcessingGuess) return;

  let guess = guessArr[currentRow].join('').toLowerCase();
  if (currentTile > 4) {
    isProcessingGuess = true;
    validateGuess(guess).then(valid => {
      if (valid) {
        sendGuess(guess).finally(() => {
          isProcessingGuess = false;
        });
      } else {
        showMessage('Invalid Guess, try again');
        isProcessingGuess = false;
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

  const flipAnimationDuration = 500 * guess.length;
  return new Promise((resolve) => {
    setTimeout(resolve, flipAnimationDuration);
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

      await flipTile(data.result);

      guessCount++;
      guesses.push(word);
      resultOfGuess.push(data.result);

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
  const showDefinitions = localStorage.getItem('showDefinitions') === 'true';
  if (!showDefinitions) return;

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
      const wordOfTheDay = data.word;
      showEndMessage('You Win!', wordOfTheDay, winPercentage);
    } else {
      console.error('Failed to fetch the word of the day');
      showEndMessage('You Win!', 'Unknown', winPercentage);
    }
  } catch (error) {
    console.error('Error fetching the word of the day:', error);
    showEndMessage('You Win!', 'Unknown', winPercentage);
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
      const wordOfTheDay = data.word;
      showEndMessage('You Lose!', wordOfTheDay, winPercentage);
    } else {
      console.error('Failed to fetch the word of the day');
      showEndMessage('You Lose!', 'Unknown', winPercentage);
    }
  } catch (error) {
    console.error('Error fetching the word of the day:', error);
    showEndMessage('You Lose!', 'Unknown', winPercentage);
  }
}

// Show the end game message
const showEndMessage = (result, word, winPercentage) => {
  // Clear any existing content in the end message container
  endMessage.innerHTML = '';

  // Create elements for each line of the message
  const iconElement = document.createElement('div');
  iconElement.classList.add('icon');

  const resultElement = document.createElement('h2');
  resultElement.textContent = result;
  resultElement.style.fontWeight = 'bold';

  const wordElement = document.createElement('p');
  wordElement.textContent = `Today's Word: ${word}`;
  
  const winPercentageElement = document.createElement('p');
  winPercentageElement.textContent = `Win Percentage: ${winPercentage}%`;

  const highScoreElement = document.createElement('p');
  highScoreElement.textContent = `High Score: ${highScore}`;

  const streakElement = document.createElement('p');
  streakElement.textContent = `Current Streak: ${streak}`;

  const winsElement = document.createElement('p');
  winsElement.textContent = `Wins: ${wins}`;

  const lossesElement = document.createElement('p');
  lossesElement.textContent = `Losses: ${losses}`;

  // Append each element to the endMessage container
  endMessage.appendChild(iconElement);
  endMessage.appendChild(resultElement);
  endMessage.appendChild(wordElement);
  endMessage.appendChild(winPercentageElement);
  endMessage.appendChild(highScoreElement);
  endMessage.appendChild(streakElement);
  endMessage.appendChild(winsElement);
  endMessage.appendChild(lossesElement);

  // Change the icon based on the result
  if (result === 'You Win!') {
      iconElement.innerHTML = '🏆';  // Trophy icon for win
      endMessage.classList.add('win');
  } else {
      iconElement.innerHTML = '😢';  // Sad face icon for lose
      endMessage.classList.add('lose');
  }

  // Display the end message container
  endMessage.style.display = 'block';
};


// Ensure session ID is obtained 
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

  if (localStorage.getItem('SessionID') !== currentSession) {
    localStorage.setItem('CurrentGame', JSON.stringify({
      resultOfGuess: [],
    }));
    localStorage.setItem('SessionID', currentSession);
  }
}
