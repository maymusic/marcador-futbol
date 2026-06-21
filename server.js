const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let gameState = {
    showScoreboard: true,
    mainColor: '#1a1a2e',
    homeName: 'RAC',
    homeFullName: 'RACING DE VERACRUZ',
    awayName: 'VIS',
    awayFullName: 'VISITANTE FC',
    homeScore: 0,
    awayScore: 0,
    homeColor: '#0044cc',
    awayColor: '#cc0000',
    homeLogo: '', 
    awayLogo: '',
    homeReds: 0,
    awayReds: 0,
    minutes: 0,
    seconds: 0,
    addedTime: 0,
    isRunning: false
};

let timerInterval;

function startTimer() {
    if (!timerInterval) {
        gameState.isRunning = true;
        timerInterval = setInterval(() => {
            gameState.seconds++;
            if (gameState.seconds >= 60) {
                gameState.seconds = 0;
                gameState.minutes++;
            }
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

    socket.on('toggleScoreboard', (isVisible) => {
        gameState.showScoreboard = isVisible;
        io.emit('stateUpdate', gameState);
    });

    socket.on('updateScore', (data) => {
        gameState.homeScore = data.homeScore;
        gameState.awayScore = data.awayScore;
        io.emit('stateUpdate', gameState);
    });

    socket.on('updateTeamInfo', (data) => {
        gameState.mainColor = data.mainColor;
        gameState.homeName = data.homeName;
        gameState.homeFullName = data.homeFullName;
        gameState.awayName = data.awayName;
        gameState.awayFullName = data.awayFullName;
        gameState.homeColor = data.homeColor;
        gameState.awayColor = data.awayColor;
        if(data.homeLogo) gameState.homeLogo = data.homeLogo;
        if(data.awayLogo) gameState.awayLogo = data.awayLogo;
        io.emit('stateUpdate', gameState);
    });

    socket.on('updateAddedTime', (time) => {
        gameState.addedTime = time;
        io.emit('stateUpdate', gameState);
    });

    socket.on('updateCards', (data) => {
        gameState.homeReds = data.homeReds;
        gameState.awayReds = data.awayReds;
        io.emit('stateUpdate', gameState);
    });

    socket.on('triggerSubstitution', (data) => {
        io.emit('showSubstitution', data);
    });

    socket.on('timerControl', (command) => {
        if (command.action === 'start') startTimer();
        else if (command.action === 'pause') stopTimer();
        else if (command.action === 'reset') {
            stopTimer();
            gameState.minutes = 0;
            gameState.seconds = 0;
            gameState.addedTime = 0;
            io.emit('updateTimer', { minutes: 0, seconds: 0 });
        } else if (command.action === 'set') {
            gameState.minutes = parseInt(command.minutes) || 0;
            gameState.seconds = 0;
            io.emit('updateTimer', { minutes: gameState.minutes, seconds: gameState.seconds });
        }
        io.emit('stateUpdate', gameState);
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor en línea`);
});