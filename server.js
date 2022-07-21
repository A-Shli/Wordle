// use the Express.js framework https://expressjs.com/
import express from 'express';
import bodyParser from 'body-parser';
import schedule from 'node-schedule';
import * as mb from './sqlData.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
let todaysWord , todaysSession;
mb.chooseWordOfTheDay().then((word) => {
    todaysWord = word;
    todaysSession = uuidv4();
    app.listen(8080);
});


app.use(express.static('public'));

app.post('/checkWord', express.json(), async (req,res) => {
    let result = [];
    if (await mb.checkWord(req.body.guess) === false) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(result));
        return;
      }
      result = wordChecker(req.body.guess, todaysWord.toUpperCase());
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(result));

});

app.get('/getWordOfTheDay', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(todaysWord));
  });
  
  // Send sessionId to client
  app.get('/checkSession', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(todaysSession));
  });
  
  // change word and sessionId every 24 hours
  schedule.scheduleJob('0 0 * * *', async function () {
    word = await wordDb.chooseWord();
    sessionId = uuidv4();

  });

// app.set('content-type', 'text/json')
// app.use(bodyParser.urlencoded({ extended: true}));
// app.use(bodyParser.json());


// Check the guessed word against the word of the day
function wordChecker(guessWord, correctWord) {
    const numArr = ['0','0','0','0','0'];
    guessWord = guessWord.toUpperCase();
    const guessArr = guessWord.split('');
    const wordOfTheDayArr = correctWord.split('');
    checkCharInWordPos(guessArr, wordOfTheDayArr, numArr);
    checkCharInWordExists(guessArr, wordOfTheDayArr, numArr);
    return numArr;
   
}

// Check if character is in correct position
function checkCharInWordPos(guessWordArr, wordOfTheDayArr, numArr) {
    for( let i = 0; i < wordOfTheDayArr.length; i++ ) {
        if(wordOfTheDayArr[i] === guessWordArr[i]) {
            numArr[i] = '2';
            wordOfTheDayArr[i] = '';
            guessWordArr[i] = '';
        }
    }
}

// Check if character is in word
function checkCharInWordExists(guessWordArr, wordOfTheDayArr, numArr) {
    for(let i = 0; i < wordOfTheDayArr.length; i++) {
        if(guessWordArr[i] != '' && wordOfTheDayArr.includes(guessWordArr[i])) {
            numArr[i] = '1';
            let char = guessWordArr[i];
            let index = wordOfTheDayArr.indexOf(char);
            wordOfTheDayArr[index] = '';
            guessWordArr[i] = '';
        }
    }
}
