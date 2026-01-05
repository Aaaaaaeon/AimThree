import './style.css'
import { Game } from './Game.js'

try {
    console.log("Initializing App...");
    const app = document.querySelector('#app');
    if (!app) throw new Error("App element not found!");
    
    app.innerHTML = `<div id="game-container"></div>`;
    
    console.log("Creating Game instance...");
    const game = new Game(document.querySelector('#game-container'));
    
    console.log("Starting Game...");
    game.start();
} catch (error) {
    console.error("Critical Game Error:", error);
    document.body.innerHTML += `<div style="color: red; padding: 20px;">Error: ${error.message}</div>`;
}
