# Wordle
UP202661 Wordle


### Key features

* The keyboard can be used both physically and virtually.

* The enter button submits the word to the server, and checks against the randomly selected word from the SQlite database, before sent back to the client. Backspace removes the character from the tile.

* The letters from each word input by the user is checked against the word to guess and based on the placement or whether the letter is in the word or not, the tile flips and displays the corresponding colours (green if correct letter and placement, yellow if correct letter and wrong placement, grey if the letter is wrong).

* The randomly selected word stays the same whether the user decides to leave the game and come back to it later, or refreshes the page. 

* SQlite database contains all the words where the current word is randomly selected from. 

* After 6 guesses or when the user reaches the correct word the game is over. When the game is over, the statistics display pops up telling the player if they win or lose, their streak, and number of wins.

* The user interface for the game has been designed so that it is playable on both desktop and mobile. 


### Some future improvements

* Some bugs to be fixed, such as, after the user enters a word and presses enter twice it can sometimes use up two rows instead of one. 

* Local storage to store the state of the game and statistics for when the user leaves the game and comes back. 

* more polished statistics and instructions. 