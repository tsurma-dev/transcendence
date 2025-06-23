export default async function pongRoutes(fastify) {
  let players = [];
  let ball = {
    x: 300,
    y: 200,
    dx: 4,
    dy: 3,
    radius: 8
  };

  let gameInterval;

  fastify.get('/pong', async (req, reply) => {
    return reply.type('text/html').send(pongHTML);
  });

  fastify.get('/ws/pong', { websocket: true }, (socket, req) => {
    if (players.length >= 2) {
      socket.send(JSON.stringify({ type: 'error', message: 'Room full' }));
      socket.close();
      return;
    }

    const playerId = players.length;
    players.push({ socket, y: 200, id: playerId });

    socket.send(JSON.stringify({ type: 'init', playerId }));

    socket.on('message', (msg) => {
      let data;
      try {
        data = JSON.parse(msg);
      } catch (err) {
        console.error('Invalid JSON:', msg.toString());
        return;
      }

      if (data.type === 'paddle') {
        players[playerId].y = data.y;
      }
    });

    socket.on('close', () => {
      players = players.filter(p => p.id !== playerId);
      if (players.length < 2 && gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
      }
    });

    if (players.length === 2 && !gameInterval) {
      gameLoop();
    }
  });

  function gameLoop() {
    gameInterval = setInterval(() => {
      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Bounce on top/bottom
      if (ball.y <= 0 || ball.y >= 400) {
        ball.dy *= -1;
      }

      // Paddle collision
      players.forEach((p, index) => {
        const paddleX = index === 0 ? 20 : 560;
        if (
          ball.x >= paddleX && ball.x <= paddleX + 20 &&
          ball.y >= p.y && ball.y <= p.y + 80
        ) {
          ball.dx *= -1;
        }
      });

      // Score check
      if (ball.x < 0 || ball.x > 600) {
        ball = { x: 300, y: 200, dx: 4, dy: 3, radius: 8 };
      }

      // Broadcast update
      players.forEach(p => {
        p.socket.send(JSON.stringify({
          type: 'update',
          ball,
          paddles: players.map(p => p.y)
        }));
      });
    }, 1000 / 60);
  }
}

const pongHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Pong</title>
  <style>
    canvas { background: #000; display: block; margin: auto; }
  </style>
</head>
<body>
  <canvas width="600" height="400" id="game"></canvas>
  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let playerId = null;
    let paddles = [200, 200];
    let ball = { x: 300, y: 200 };

    const socket = new WebSocket("wss://localhost:8443/ws/pong");

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = event => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error("Invalid JSON from server:", event.data);
        return;
      }

      if (data.type === 'init') {
        playerId = data.playerId;
      }
      if (data.type === 'update') {
        ball = data.ball;
        paddles = data.paddles;
      }
    };

    canvas.addEventListener('mousemove', e => {
      const y = e.offsetY;
      if (playerId !== null) {
        socket.send(JSON.stringify({ type: 'paddle', y }));
      }
    });

    function draw() {
      ctx.clearRect(0, 0, 600, 400);
      // Ball
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Paddles
      paddles.forEach((y, i) => {
        ctx.fillRect(i === 0 ? 20 : 560, y, 20, 80);
      });

      requestAnimationFrame(draw);
    }

    draw();
  </script>
</body>
</html>
`;
