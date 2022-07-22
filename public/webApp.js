const tileDisplay = document.querySelector('.tile-container')
const keyboard = document.querySelector('.key-container')
const messageDisplay = document.querySelector('.message-container')
const endMessage = document.querySelector('.end-message')
let currentSession = '';
  // local variable word = RNG chosen word from wordchecker.js

let currentRow = 0
let currentTile = 0
let isGameOver = false

let streak = 0;
let highScore = 0;
let gamesPlayed = 0;
let wins = 0;
let losses = 0;

let guessCount = 0;
let guesses = [];
let resultOfGuess = [];


window.addEventListener("load", async() => {
    currentSession = await getSessionID();
    setTimeout(
        function open(event){
            document.querySelector(".popup").style.display = "block";
        },
        1000
    )
    localStorageInitialise();
    pause();
});
document.querySelector("#close").addEventListener("click", function(){
    document.querySelector(".popup").style.display = "none";
});

async function localStorageInitialise(){
    if (localStorage.getItem('currentSession') === null){
        localStorage.setItem('currentSession', JSON.stringify({
            currentRow : 0,
            currentTile : 0,
            resultOfGuess : [],
        }));
    }
    if (localStorage.getItem('SessionID') === null){
        localStorage.setItem('SessionID', await getSessionID());
    }
}

const keys = [
    'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
    'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
    'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL',
]

// array of arrays for each guess
const guessArr = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', '']
]



guessArr.forEach((guessRow, guessRowIndex) => {
    const row = document.createElement('div')
    row.setAttribute('id', 'guessRow-' + guessRowIndex)
    guessRow.forEach((_guess, guessIndex) => {
        const tileElement = document.createElement('div')
        tileElement.setAttribute('id', 'guessRow-' + guessRowIndex + '-tile-' + guessIndex)
        tileElement.classList.add('tile')
        row.append(tileElement)
    })
    tileDisplay.append(row)
})

keys.forEach(key => {
    const btn = document.createElement('button')
    btn.textContent = key
    btn.setAttribute('id', key)
    btn.addEventListener('click', () => clickHandler(key))
    keyboard.append(btn)
})


document.addEventListener("keydown", (e) => {
    if(!isGameOver){
        let pressKey = String(e.key.toUpperCase())
        if (pressKey === "ENTER") {
            rowChecker()
            return
        }
        if (pressKey === "BACKSPACE"){
            removeLetter()
            return
        }
        
        let found = pressKey.match(/[a-z]/gi)
        if (!found || found.length > 1) {
            return
        } else {
            addLetter(e.key.toUpperCase())
        }
    }}
)

const addLetter = (letter) => {
    if(!isGameOver){
        if (currentTile < 5 && currentRow < 6) {
        const tile = document.querySelector('#guessRow-' + currentRow + '-tile-' + currentTile)
        tile.textContent = letter
        guessArr[currentRow][currentTile] = letter
        tile.setAttribute('data', letter)
        currentTile++
    }}
}

const removeLetter = () => {
    if (currentTile > 0) {
        currentTile--
        const tile = document.querySelector('#guessRow-' + currentRow + '-tile-' + currentTile)
        tile.textContent = ''
        guessArr[currentRow][currentTile] = ''
        tile.setAttribute('data', '')
    }
}

const clickHandler = (letter) => {
    if (!isGameOver) {
        if (letter === 'DEL') {
            removeLetter()
            return
        }
        if (letter === 'ENTER') {
            rowChecker()
            return
        }
    }
    addLetter(letter)
}

const showMessage = (message) => {
    const messageElement = document.createElement('p')
    messageElement.textContent = message
    messageDisplay.append(messageElement)
    setTimeout(() => messageDisplay.removeChild(messageElement), 2000)
}

function delay(time){
    if(!isGameOver){
    return new Promise(resolve => setTimeout(resolve,time));
}}



const rowChecker = () => {
    let guess = guessArr[currentRow].join('')
    guess = guess.toLowerCase();

    if (currentTile > 4) {
        validateGuess(guess).then(valid =>{
            if (valid) {
                sendGuess(guess)
                if (currentRow > 7){
                    isGameOver = false
                    showMessage('Game Over!')
                    showMessage(wordle)
                    return
                }
                if (currentRow < 6){
                    currentRow++
                    currentTile = 0 
                }
                return;
            }
            else {
                showMessage('Invalid Guess, try again')
                return;
            }
        })        
    }
}


const addColorToKey = (keyLetter, color) => {
    const key = document.getElementById(keyLetter) 
    key.classList.add(color)
}

const flipTile = (guessedWord) => {
    let currRow = 0;
    if (currentRow <7) {
        
        const rowTiles = document.querySelector('#guessRow-' + (currentRow-1)).childNodes
        const guess = []
        // if (currentRow = 6){ isGameOver = true}
        
        rowTiles.forEach(tile => {
            let letterData = tile.getAttribute('data')
            guess.push({letter: letterData, color: 'grey-overlay'})
        })
        guess.forEach((guess, index) => {
        // for (let i = 0, tile = 0; i < guessedWord.length; i++, tile++) {
            if (guessedWord[index] === '2') {
                guess.color = 'green-overlay'
            }
            else if (guessedWord[index] === '1') {
                guess.color = 'yellow-overlay'
            }
        })

        rowTiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.classList.add('flip')
                tile.classList.add(guess[index].color)
                addColorToKey(guess[index].letter, guess[index].color)
            }, 500 * index)
        })
}
}


async function sendGuess(word) {
    const payload = {guess : word};
    const response = await fetch('/checkWord',{
        method:'POST',
        headers: { 'Content-type': 'application/json'},
        body: JSON.stringify(payload),
    });

    if (response.ok){
        const data = await response.json();
        if (data.length === 0){
            showMessage('Not a word!')
            return;
        }
        // else{
        console.log(currentRow);
        flipTile(data)
        guessCount ++;
        guesses += [word];
        resultOfGuess +=[data];

        if (checkWinner(data)){
            winGame();
            }
        if (guessCount ===6){
            loseGame();
        }
        
    }
}

let valid = true;
//checks the word is valid
async function validateGuess (guess){
    guess = guess;
    const response = await fetch ('https://dictionary-dot-sse-2020.nw.r.appspot.com/'+guess);
    if (response.status === 200){
        valid = true;
        return valid;
    } else {
        valid = false;
        return valid;
    }
}


function checkWinner(data){
    for (let i = 0; i < data.length; i++){
        if (data[i] === '0'){
            return false;
        }
    }
    return true;
}


function pause(){
    const localGame = JSON.parse(localStorage.getItem('currentSession'));
    const currentRow = localGame.currentRow;
    const currentGameGuessResults = localGame.resultOfGuess;

    // Resetting the game
    if (localStorage.getItem('SessionID') !== currentSession) {
        localStorage.setItem('CurrentGame', JSON.stringify({
            resultOfGuess: [],
        }));
        localStorage.setItem('SessionID', currentSession);
        return;
    }
}


async function getSessionID() {
    const response = await fetch('/checkSession');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  }

  //function for popup upon winning
async function winGame(){
    isGameOver = true;
    streak +=1;
    if (streak > highScore){ highScore = streak};
    wins +=1;
    gamesPlayed +=1;
    const winp = (wins / gamesPlayed) * 100;
    const response = await fetch('/getWordOfTheDay');
    const data = await response.json();
    const string = (`You Win!
    Today's Word is: ${data}
    You're win Percentage is ${winp}% 
    Your Highest Streak is ${highScore}
    Your Current Streak is ${streak}
    Your Losses are now at: ${losses}
    Your Wins      are  at: ${wins}`);
    let winPopUp = document.querySelector('.end-message')
    winPopUp.innerText = (string);
    winPopUp.style.display = "block";
}

//function for popup upon losing
async function loseGame(){
    isGameOver = true;

    streak === 0;
    if (streak > highScore){ highScore = streak};
    losses +=1;
    gamesPlayed +=1;
    const winp = (wins / gamesPlayed) * 100;
    const response = await fetch('/getWordOfTheDay');
    const data = await response.json();
    const string = (`You Lose!
    Today's Word is: ${data}
    You're win Percentage is ${winp}% 
    Your Highest Streak is ${highScore}
    Your Current Streak is ${streak}
    Your Losses are now at: ${losses}
    Your Wins      are  at: ${wins}`);
    let winPopUp = document.querySelector('.end-message')
    winPopUp.innerText = (string);
    winPopUp.style.display = "block";
}
