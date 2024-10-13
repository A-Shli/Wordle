// server.js

import express from 'express';
import schedule from 'node-schedule';
import { v4 as uuidv4 } from 'uuid';
import * as db from './sqlData.js';  // Using the updated PostgreSQL and API logic

const app = express();
let todaysWord, todaysSession;

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the public/docs folder
app.use(express.static('docs'));

// Initialize the database and choose the Word of the Day
db.init().then(() => {
  db.chooseWordOfTheDay().then((word) => {
    todaysWord = word;
    todaysSession = uuidv4();
    console.log(`Word of the Day: ${todaysWord}`);  // For debugging
    app.listen(8080, () => console.log('Server is running on port 8080'));
  });
});

// Route: Validate a word and fetch its definition
app.get('/validate/:word', async (req, res) => {
  const { word } = req.params;
  const validationResult = await db.validateAndFetchDefinition(word);

  if (validationResult.valid) {
    return res.status(200).json({ valid: true, source: validationResult.source, definition: validationResult.definition });
  } else {
    return res.status(404).json({ valid: false });
  }
});

// Route: Get the Word of the Day
app.get('/getWordOfTheDay', (req, res) => {
  res.json({ word: todaysWord });
});

// Route: Handle word checking request
app.post('/checkWord', async (req, res) => {
  const { guess } = req.body;
  if (!guess || guess.length !== 5) {
    return res.status(400).json({ error: 'Invalid guess format' });
  }

  // Validate and fetch definition
  const validationResult = await db.validateAndFetchDefinition(guess);
  if (!validationResult.valid) {
    return res.status(404).json({ valid: false });
  }

  // Compare guess with today's word and generate result
  const result = compareWords(guess.toUpperCase(), todaysWord.toUpperCase());
  return res.json({ result, definition: validationResult.definition });
});

// Route: Check the current session
app.get('/checkSession', (req, res) => {
  res.json({ sessionId: todaysSession });
});

// Helper function to compare guessed word with the word of the day
function compareWords(guess, actual) {
  return guess.split('').map((char, index) => {
    if (char === actual[index]) return '2'; // Correct letter and position
    else if (actual.includes(char)) return '1'; // Correct letter, wrong position
    else return '0'; // Incorrect letter
  });
}
