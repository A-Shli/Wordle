// sqlData.js
import pkg from 'pg';
import fetch from 'node-fetch';
const { Pool } = pkg;

// PostgreSQL connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wordle',
  password: 'Queen123', // Replace this with your database password
  port: 5432,
});

const WORDS_API_KEY = '3e74e188a3mshc300bf57d1c56aap15e2efjsn03e8d8640906'; // Replace with your WordsAPI key
const WORDS_API_BASE_URL = 'https://wordsapiv1.p.rapidapi.com/words';

// Initialize the database
export async function init() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL', err);
  }
}

// Get a random Word of the Day from the internal list
export async function chooseWordOfTheDay() {
  const result = await pool.query('SELECT word FROM words ORDER BY RANDOM() LIMIT 1');
  return result.rows[0].word;
}

// Check if the word exists in the internal list
export async function wordChecker(word) {
  const result = await pool.query('SELECT * FROM words WHERE word ILIKE $1', [word.toUpperCase()]);
  return result.rowCount > 0;
}

// Fetch word definition from WordsAPI
async function fetchDefinitionFromAPI(word) {
  try {
    const response = await fetch(`${WORDS_API_BASE_URL}/${word}`, {
      headers: {
        'X-RapidAPI-Key': WORDS_API_KEY,
        'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].definition; // Return the first definition found
      }
    }
  } catch (error) {
    console.error('Error fetching definition from API:', error);
  }
  return null; // Return null if no definition found or there's an error
}

// Validate a word and fetch its definition (if available)
export async function validateAndFetchDefinition(word) {
  // Check if the word exists in the internal list
  const isWordInList = await wordChecker(word);

  if (isWordInList) {
    const definition = await fetchDefinitionFromAPI(word); // Fetch definition from API
    return { valid: true, source: 'internal', definition };
  } else {
    // If not found, check using WordsAPI
    const definition = await fetchDefinitionFromAPI(word);
    return { valid: definition !== null, source: 'external', definition };
  }
}
