import './style.css'
import { Game } from './Game.js'

const app = document.querySelector('#app');
app.innerHTML = `<div id="game-container"></div>`;

const game = new Game(document.querySelector('#game-container'));
game.start();
