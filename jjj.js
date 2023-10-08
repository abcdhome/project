const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Simulated arithmetic problem generator
function generateProblem() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operator = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)];
    const expression = `${num1} ${operator} ${num2}`;
    const answer = eval(expression);
    return { problem: expression, answer };
}

app.use(bodyParser.json());

app.get('/problem', (req, res) => {
    const problem = generateProblem();
    res.json(problem);
});

app.post('/solve', (req, res) => {
    const { problem, answer } = req.body;
    const parsedAnswer = parseFloat(answer);
    const { answer: correctAnswer } = eval(problem);
    const isCorrect = parsedAnswer === correctAnswer;
    const result = isCorrect ? 'Your answer is correct!' : 'Incorrect answer. Try again.';
    res.json({ result });
});

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
