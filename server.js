const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 80;
const GAME_DURATION = 600000; // 10 minutes in milliseconds

let systemClock = 0;
let totalSum = 0;

function generateProblem() {
  const num1 = Math.floor(Math.random() * 101);
  const num2 = Math.floor(Math.random() * 101);
  const num3 = Math.floor(Math.random() * 101);
  const operators = ['+', '-', '*', '/'];
  const operator1 = operators[Math.floor(Math.random() * operators.length)];
  const operator2 = operators[Math.floor(Math.random() * operators.length)];

  const problem = `${num1} ${operator1} ${num2} ${operator2} ${num3}`;
  return problem;
}

function calculateResult(problem) {
  // 연산자 우선 순위를 고려하여 연산을 수행합니다.
  const parts = problem.split(' ');
  const num1 = parseInt(parts[0]);
  const operator1 = parts[1];
  const num2 = parseInt(parts[2]);
  const operator2 = parts[3];
  const num3 = parseInt(parts[4]);

  let result = 0;

  // 먼저 operator1과 num2 사이의 연산을 수행합니다.
  switch (operator1) {
    case '+':
      result = num1 + num2;
      break;
    case '-':
      result = num1 - num2;
      break;
    case '*':
      result = num1 * num2;
      break;
    case '/':
      result = num1 / num2;
      break;
    default:
      return NaN;
  }

  // 그 후 operator2와 num3 사이의 연산을 수행합니다.
  switch (operator2) {
    case '+':
      result = result + num3;
      break;
    case '-':
      result = result - num3;
      break;
    case '*':
      result = result * num3;
      break;
    case '/':
      result = result / num3;
      break;
    default:
      return NaN;
  }

  return result;
}
io.on('connection', (socket) => {
  console.log('Client connected');

  // 클라이언트 데이터 초기화
  const clientData = {
    totalSum: 0,
    currentProblem: generateProblem(),
    lastAnswerTime: null, // 마지막 정답 제출 시간
    nextProblemTimer: null, // 다음 문제 출제를 위한 타이머
  };

  // 문제를 클라이언트에게 전송
  socket.emit('problem', clientData.currentProblem);

  socket.on('answer', (response) => {
    const currentTime = new Date().getTime();

    if (checkAnswer(clientData.currentProblem, response)) {
      clientData.totalSum += parseFloat(response);
      console.log(`Correct! Total Sum for Client: ${clientData.totalSum}`);
    
      // 정답인 경우, 5초 이내의 랜덤한 시간 후에 새로운 문제 출제
      const delay = Math.floor(Math.random() * 5000); // 0부터 5000 밀리초 (5초) 사이의 랜덤한 시간

      // 이전에 설정된 타이머를 제거
      if (clientData.nextProblemTimer) {
        clearInterval(clientData.nextProblemTimer);
      }

      clientData.nextProblemTimer = setInterval(() => {
        clientData.currentProblem = generateProblem();
        socket.emit('problem', clientData.currentProblem);
        clientData.lastAnswerTime = currentTime;
        clearInterval(clientData.nextProblemTimer); // 타이머 종료
      }, delay);
    } else {
      console.log('Incorrect! Try again.');

      // 오답인 경우, 바로 다시 이전 문제를 클라이언트에게 전송
      socket.emit('problem', clientData.currentProblem);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

function checkAnswer(problem, response) {
  const result = calculateResult(problem);
  return parseFloat(response) === result;
}

// Game loop using setInterval
const gameLoop = setInterval(() => {
  systemClock += 1000; // 1초씩 증가

  if (systemClock >= GAME_DURATION) {
    clearInterval(gameLoop);
    console.log('Game Over');

    // 모든 클라이언트의 결과 출력 및 누적 합계 계산
    let finalTotalSum = 0;
    io.sockets.clients().sockets.forEach((client) => {
      const clientData = clientData[client.id];
      console.log(`Client ${client.id}: Total Sum - ${clientData.totalSum}`);
      finalTotalSum += clientData.totalSum;
    });

    console.log(`Final Total Sum: ${finalTotalSum}`);
    io.emit('gameOver', finalTotalSum);
    http.close(); // 서버 종료
  }
}, 1000);

// Express.js route to serve HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Serve static files from a public directory
app.use(express.static('public'));

http.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});