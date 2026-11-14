const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");

const GRID = 20;
const SIZE = 400;

let snake, food, bonusFood;
let direction, nextDirection;
let score = 0;
let best = Number(localStorage.getItem("snakeBest")) || 0;
let timer;
let running = false;
let paused = false;
let soundOn = true;
let foodCount = 0;
let bonusExpiry = 0;

const colors = {
    green: "#39ff88",
    blue: "#32c8ff",
    red: "#ff4565"
};

let snakeColor = colors.green;

bestEl.textContent = best;

function resetGame() {
    snake = [
        {x: 200, y: 200},
        {x: 180, y: 200},
        {x: 160, y: 200}
    ];

    direction = {x: 20, y: 0};
    nextDirection = {x: 20, y: 0};

    score = 0;
    foodCount = 0;
    bonusFood = null;

    scoreEl.textContent = score;
    spawnFood();
    draw();
}

function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * 20) * GRID,
            y: Math.floor(Math.random() * 20) * GRID
        };
    } while (snake.some(p => p.x === food.x && p.y === food.y));
}

function spawnBonus() {
    do {
        bonusFood = {
            x: Math.floor(Math.random() * 20) * GRID,
            y: Math.floor(Math.random() * 20) * GRID
        };
    } while (
        snake.some(p => p.x === bonusFood.x && p.y === bonusFood.y) ||
        (bonusFood.x === food.x && bonusFood.y === food.y)
    );

    bonusExpiry = Date.now() + 5000;
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, 16, 16, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function draw() {
    ctx.fillStyle = "#07110c";
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.strokeStyle = "#14271b";

    for (let i = 0; i <= SIZE; i += GRID) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(SIZE, i);
        ctx.stroke();
    }

    drawCell(food.x, food.y, "#ff5364");

    if (bonusFood && Date.now() < bonusExpiry) {
        drawCell(bonusFood.x, bonusFood.y, "#ffd447");
    }

    snake.forEach((p, i) => {
        drawCell(p.x, p.y, i === 0 ? "#ffffff" : snakeColor);
    });
}

function playSound(freq) {
    if (!soundOn) return;

    try {
        const audio = new AudioContext();
        const osc = audio.createOscillator();
        const gain = audio.createGain();

        osc.frequency.value = freq;
        gain.gain.value = 0.04;

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start();
        osc.stop(audio.currentTime + 0.08);
        osc.onended = () => audio.close();
    } catch (e) {}
}

function update() {
    if (!running || paused) return;

    direction = nextDirection;

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    const eating = head.x === food.x && head.y === food.y;

    const eatingBonus = bonusFood &&
        Date.now() < bonusExpiry &&
        head.x === bonusFood.x &&
        head.y === bonusFood.y;

    const body = eating || eatingBonus ? snake : snake.slice(0, -1);

    if (
        head.x < 0 || head.x >= SIZE ||
        head.y < 0 || head.y >= SIZE ||
        body.some(p => p.x === head.x && p.y === head.y)
    ) {
        gameOver();
        return;
    }

    snake.unshift(head);

    if (eating) {
        score += 10;
        foodCount++;
        playSound(550);
        spawnFood();

        if (foodCount % 5 === 0) spawnBonus();

    } else if (eatingBonus) {
        score += 50;
        bonusFood = null;
        playSound(850);
    } else {
        snake.pop();
    }

    if (bonusFood && Date.now() >= bonusExpiry) {
        bonusFood = null;
    }

    scoreEl.textContent = score;

    if (score > best) {
        best = score;
        bestEl.textContent = best;
        localStorage.setItem("snakeBest", best);
    }

    draw();
}

function startGame() {
    clearInterval(timer);
    resetGame();

    running = true;
    paused = false;

    overlay.style.display = "none";
    document.getElementById("pauseBtn").textContent = "PAUSE";

    timer = setInterval(
        update,
        Number(document.getElementById("difficulty").value)
    );
}

function gameOver() {
    running = false;
    clearInterval(timer);

    document.getElementById("overlayTitle").textContent = "GAME OVER";
    document.getElementById("overlayText").textContent =
        "Your Score: " + score;

    document.getElementById("startBtn").textContent = "PLAY AGAIN";
    overlay.style.display = "flex";

    playSound(180);
}

function pauseGame() {
    if (!running) return;

    paused = !paused;

    document.getElementById("pauseBtn").textContent =
        paused ? "RESUME" : "PAUSE";

    if (paused) {
        document.getElementById("overlayTitle").textContent = "PAUSED";
        document.getElementById("overlayText").textContent = "Take a break!";
        document.getElementById("startBtn").textContent = "RESUME";
        overlay.style.display = "flex";
    } else {
        overlay.style.display = "none";
    }
}

function changeDirection(dir) {
    const directions = {
        up: {x: 0, y: -20},
        down: {x: 0, y: 20},
        left: {x: -20, y: 0},
        right: {x: 20, y: 0}
    };

    const chosen = directions[dir];

    if (!chosen || !running || paused) return;

    if (
        chosen.x === -direction.x &&
        chosen.y === -direction.y
    ) return;

    nextDirection = chosen;
}

document.addEventListener("keydown", e => {
    const keys = {
        ArrowUp: "up", w: "up", W: "up",
        ArrowDown: "down", s: "down", S: "down",
        ArrowLeft: "left", a: "left", A: "left",
        ArrowRight: "right", d: "right", D: "right"
    };

    if (keys[e.key]) {
        e.preventDefault();
        changeDirection(keys[e.key]);
    }

    if (e.code === "Space") {
        e.preventDefault();
        pauseGame();
    }
});

document.querySelectorAll("[data-dir]").forEach(btn => {
    btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        changeDirection(btn.dataset.dir);
    });
});

document.getElementById("startBtn").onclick = () => {
    if (running && paused) {
        paused = false;
        overlay.style.display = "none";
        document.getElementById("pauseBtn").textContent = "PAUSE";
    } else {
        startGame();
    }
};

document.getElementById("pauseBtn").onclick = pauseGame;
document.getElementById("restartBtn").onclick = startGame;

document.getElementById("soundBtn").onclick = function() {
    soundOn = !soundOn;
    this.textContent = soundOn ? "SOUND: ON" : "SOUND: OFF";
};

document.getElementById("theme").onchange = e => {
    snakeColor = colors[e.target.value];
    draw();
};

document.getElementById("difficulty").onchange = () => {
    if (running) {
        clearInterval(timer);
        timer = setInterval(update,
            Number(document.getElementById("difficulty").value));
    }
};

resetGame();