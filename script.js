const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const grid = 20;
const size = 400;

let snake, food, direction, nextDirection;
let score = 0;
let best = Number(localStorage.getItem("snakeBest")) || 0;
let gameLoop = null;
let running = false;
let gameOver = false;

document.getElementById("best").textContent = best;

function reset() {
    snake = [
        {x: 200, y: 200},
        {x: 180, y: 200},
        {x: 160, y: 200}
    ];

    direction = "RIGHT";
    nextDirection = "RIGHT";
    score = 0;
    gameOver = false;

    document.getElementById("score").textContent = score;
    createFood();
    draw();
}

function createFood() {
    do {
        food = {
            x: Math.floor(Math.random() * 20) * grid,
            y: Math.floor(Math.random() * 20) * grid
        };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function drawSnake() {
    snake.forEach((part, i) => {
        const isHead = i === 0;

        const gradient = ctx.createLinearGradient(
            part.x, part.y,
            part.x + grid, part.y + grid
        );

        gradient.addColorStop(0, isHead ? "#b5ff8a" : "#65ed75");
        gradient.addColorStop(0.5, "#20b957");
        gradient.addColorStop(1, "#087b39");

        ctx.fillStyle = gradient;
        ctx.shadowColor = "#36ff70";
        ctx.shadowBlur = 7;

        ctx.beginPath();
        ctx.roundRect(
            part.x + 1,
            part.y + 1,
            grid - 2,
            grid - 2,
            isHead ? 9 : 8
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHead) {
            drawEyes(part);
        } else {
            ctx.fillStyle = "#b4ffb0";
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(part.x + 7, part.y + 6, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });
}

function drawEyes(head) {
    ctx.fillStyle = "white";

    let eyes;

    if (direction === "RIGHT") {
        eyes = [[14, 5], [14, 14]];
    } else if (direction === "LEFT") {
        eyes = [[5, 5], [5, 14]];
    } else if (direction === "UP") {
        eyes = [[5, 5], [14, 5]];
    } else {
        eyes = [[5, 14], [14, 14]];
    }

    eyes.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(head.x + x, head.y + y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#102016";
        ctx.beginPath();
        ctx.arc(head.x + x, head.y + y, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
    });
}

function drawFood() {
    const x = food.x + 10;
    const y = food.y + 10;

    ctx.shadowColor = "#ff3838";
    ctx.shadowBlur = 12;

    const g = ctx.createRadialGradient(
        x - 4, y - 4, 1, x, y, 10
    );

    g.addColorStop(0, "#ffaaaa");
    g.addColorStop(0.5, "#ff3333");
    g.addColorStop(1, "#a90000");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function draw() {
    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = "#ffffff0b";
    for (let i = 0; i <= size; i += grid) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
    }

    drawFood();
    drawSnake();
}

function update() {
    direction = nextDirection;

    const head = {...snake[0]};

    if (direction === "UP") head.y -= grid;
    if (direction === "DOWN") head.y += grid;
    if (direction === "LEFT") head.x -= grid;
    if (direction === "RIGHT") head.x += grid;

    const eating = head.x === food.x && head.y === food.y;
    const body = eating ? snake : snake.slice(0, -1);

    if (
        head.x < 0 || head.x >= size ||
        head.y < 0 || head.y >= size ||
        body.some(p => p.x === head.x && p.y === head.y)
    ) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (eating) {
        score += 10;
        document.getElementById("score").textContent = score;

        if (score > best) {
            best = score;
            localStorage.setItem("snakeBest", best);
            document.getElementById("best").textContent = best;
        }

        createFood();

        clearInterval(gameLoop);
        gameLoop = setInterval(update, Math.max(65, 130 - score));
    } else {
        snake.pop();
    }

    draw();
}

function startGame() {
    if (running || gameOver) return;

    running = true;
    document.getElementById("message").textContent = "Game Running!";
    gameLoop = setInterval(update, 130);
}

function pauseGame() {
    if (!running) return;

    clearInterval(gameLoop);
    running = false;
    document.getElementById("message").textContent = "Paused";
}

function endGame() {
    clearInterval(gameLoop);
    running = false;
    gameOver = true;
    document.getElementById("message").textContent =
        "Game Over! Score: " + score;
}

function restartGame() {
    clearInterval(gameLoop);
    running = false;
    reset();
    document.getElementById("message").textContent =
        "Press Start to Play";
}

document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    const controls = {
        arrowup: "UP", w: "UP",
        arrowdown: "DOWN", s: "DOWN",
        arrowleft: "LEFT", a: "LEFT",
        arrowright: "RIGHT", d: "RIGHT"
    };

    const newDir = controls[key];
    if (!newDir) return;

    e.preventDefault();

    if (
        (newDir === "UP" && direction !== "DOWN") ||
        (newDir === "DOWN" && direction !== "UP") ||
        (newDir === "LEFT" && direction !== "RIGHT") ||
        (newDir === "RIGHT" && direction !== "LEFT")
    ) {
        nextDirection = newDir;
    }
});

reset();