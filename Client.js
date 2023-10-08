const net = require('net');
const readline = require('readline');

const SERVER_HOST = process.env.SERVER_HOST || 'localhost';
const SERVER_PORT = process.env.SERVER_PORT || 3000;

const client = new net.Socket();

client.connect(SERVER_PORT, SERVER_HOST, () => {
  console.log('Connected to server');
  let isReady = false; // 클라이언트가 준비 상태 여부

  client.on('data', (data) => {
    const message = data.toString().trim();

    if (message === 'Problem') {
      isReady = true; // 문제를 받으면 준비 상태로 변경
      console.log('Received Problem: ' + message);
    } else if (isReady) {
      const problem = message;
      console.log('Received Problem: ' + problem);

      // 계산 로직 구현
      const answer = calculateAnswer(problem);

      // 임의의 시간(1~5초) 이후에 결과를 서버로 전송
      setTimeout(() => {
        client.write(answer.toString());
        console.log(`Sent Answer: ${answer}`);
        isReady = false; // 답을 보내면 준비 상태 해제
      }, getRandomTime());
    }
  });
});

client.on('close', () => {
  console.log('Connection closed');
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function calculateAnswer(problem) {
  // 여기에 연산 로직을 구현하세요.
  // problem은 "숫자 연산자 숫자" 형식의 문자열입니다.
  const [num1, operator, num2] = problem.split(' ');
  const n1 = parseInt(num1);
  const n2 = parseInt(num2);

  switch (operator) {
    case '+':
      return n1 + n2;
    case '-':
      return n1 - n2;
    case '*':
      return n1 * n2;
    case '/':
      return n1 / n2;
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
}

function getRandomTime() {
  return Math.floor(Math.random() * 4000) + 1000; // 1~5초 사이의 랜덤 시간(밀리초)을 반환
}