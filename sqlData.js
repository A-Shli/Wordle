import sqlite3 from 'sqlite3';
import { open } from 'sqlite';


// Initialising the database
async function init() {
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database,
    });
    await db.migrate({
      force: true,
      migrationsPath: './migrations-sqlite',
    });
    return db;
}
    
const dbConnect = init();

// Get the amount of words in the database
async function dbWordCount(){
    const db = await dbConnect;
    const wordCount = await db.all('SELECT COUNT(*) FROM Words');
    return wordCount[0]['COUNT(*)'];
} 

export async function chooseWordOfTheDay() {
    return await new Promise((resolve) => {
      const latest = async () => {
        const db = await dbConnect;
        const wordCount = await dbWordCount();
        const selectRandWord = Math.floor(Math.random() * wordCount);
        const result = await db.all(`SELECT * FROM Words WHERE id = ${selectRandWord}`);
        const randWord = result[0].word;
        return randWord.toUpperCase();
      };
      latest().then((word) => {
        resolve(word);
      });
    });
}

// Check if word is in DB
export async function wordChecker(word) {
    word = word.toUpperCase();
    const db = await dbConnect;
    const result = await db.all(`SELECT * FROM Words WHERE word = '${word}'`);
    if (result.length > 0) {
        return true;
    } else {
        return false;
    }
}
