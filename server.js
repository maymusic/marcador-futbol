const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    maxHttpBufferSize: 1e7
});

app.use(express.static('public'));

let gameState = {
    showScoreboard: true, mainColor: '#1a1a2e',
    homeName: 'RAC', homeFullName: 'RACING DE VERACRUZ',
    awayName: 'VIS', awayFullName: 'VISITANTE FC',
    homeScore: 0, awayScore: 0,
    homeColor: '#0044cc', awayColor: '#cc0000',
    homeLogo: '', awayLogo: '',
    homeReds: 0, awayReds: 0,
    minutes: 0, seconds: 0, addedTime: 0, isRunning: false
};

let timerInterval;

function startTimer() {
    if (!timerInterval) {
        gameState.isRunning = true;
        timerInterval = setInterval(() => {
            gameState.seconds++;
            if (gameState.seconds >= 60) { gameState.seconds = 0; gameState.minutes++; }
            io.emit('updateTimer', { minutes: gameState.minutes, seconds: gameState.seconds });
        }, 1000);
    }
}

function stopTimer() {
    gameState.isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
}

io.on('connection', (socket) => {
    socket.emit('stateUpdate', gameState);
    socket.emit('updateTimer', { minutes: gameState.minutes, seconds: gameState.seconds });

    socket.on('toggleScoreboard', (v) => { gameState.showScoreboard = v; io.emit('stateUpdate', gameState); });
    socket.on('updateScore', (d) => { gameState.homeScore = d.homeScore; gameState.awayScore = d.awayScore; io.emit('stateUpdate', gameState); });
    socket.on('updateTeamInfo', (d) => {
        gameState.mainColor = d.mainColor; gameState.homeName = d.homeName; gameState.homeFullName = d.homeFullName;
        gameState.awayName = d.awayName; gameState.awayFullName = d.awayFullName;
        gameState.homeColor = d.homeColor; gameState.awayColor = d.awayColor;
        if(d.homeLogo) gameState.homeLogo = d.homeLogo;
        if(d.awayLogo) gameState.awayLogo = d.awayLogo;
        io.emit('stateUpdate', gameState);
    });
    socket.on('updateAddedTime', (t) => { gameState.addedTime = t; io.emit('stateUpdate', gameState); });
    socket.on('updateCards', (d) => { gameState.homeReds = d.homeReds; gameState.awayReds = d.awayReds; io.emit('stateUpdate', gameState); });
    socket.on('triggerSubstitution', (d) => { io.emit('showSubstitution', d); });
    socket.on('timerControl', (c) => {
        if (c.action === 'start') startTimer();
        else if (c.action === 'pause') stopTimer();
        else if (c.action === 'reset') { stopTimer(); gameState.minutes = 0; gameState.seconds = 0; gameState.addedTime = 0; io.emit('updateTimer', { minutes: 0, seconds: 0 }); }
        else if (c.action === 'set') { gameState.minutes = parseInt(c.minutes) || 0; gameState.seconds = 0; io.emit('updateTimer', { minutes: gameState.minutes, seconds: gameState.seconds }); }
        io.emit('stateUpdate', gameState);
    });
});

server.listen(process.env.PORT || 3000, () => console.log('Servidor en línea'));