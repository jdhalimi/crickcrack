const INIT = "init";
const SPLASH = "splash";
const RUNNING = "running";
const END = "end";
const WAIT = "wait";

const GAME_CD = 300;
const SPLASH_CD = 3;
const CORRECTION_CD = 1
const CHANCES_NB = 3;

const ALL_PAGES = [
    "init_page", 
    "countdown_page", 
    "game_page", 
    "end_page"];

const OK_MESSAGES = [
    "c'est exact", 
    "bravo", 
    "c'est bon",  
    "c'est bien"];

const KO_MESSAGES = [
    "non, c'est raté", 
    "c'est faux", 
    "encore raté"];

const OP_PLUS = "plus";
const OP_TIMES = "times";
const OP_MINUS = "minus";
const OP_DIVIDE = "divide";
const OP_EQUAL = "equals";

const ALL_NUMBERS = [0, 1, 2, 3, 5, 6, 7, 8, 9, 10];
const ALL_DURATIONS = [1, 2, 3, 5];
const ALL_TABLES = [2, 3, 4, 5, 6, 7, 8, 9];
const ALL_OPERATIONS = [OP_PLUS, OP_MINUS, OP_DIVIDE, OP_TIMES];

var splashCountDown = SPLASH_CD;
let gameCountDown = GAME_CD;
let inGame = true;
let statusCountDown = 0;
let currentInput = "";
let timeElapsed = 0;
let chancesCount = CHANCES_NB;

let currentScore = 0;
let questionsCount = 0;

let selectedDurations = [1];
let selectedTables = [2, 3, 4];
let selectedOperations = [OP_PLUS];
let allQuestions = [];
let answers = [];

let currentQuestion = "";
let currentAnswer = 0;

// --------------------------
// utility functions
// --------------------------

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function sleep2000() {
    return sleep(2000);
}

function sleep500() {
    return sleep(500);
}

function removeElement(a, n) {
    let index = a.indexOf(n);
    a.splice(index, 1);
}

function choose(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}

function pad(x) {
    return (x < 10) ? ("0" + x) : x;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function formatDuration(s) {
    var hour = Math.floor(s / 3600);
    var minute = Math.floor((s - hour * 3600) / 60);
    var seconds = s - (hour * 3600 + minute * 60);
    return pad(minute) + ":" + pad(seconds)
}

function printMessage(id, message) {
    let dest = document.getElementById(id);
    let html = "";
    for (var i = 0; i < message.length; i++) {
        html += message[i];
    }
    dest.innerHTML = html;
}

function printMessageByLetter(id, message, speed) {
    return new Promise(resolve => {
        let dest = document.getElementById(id);
        let html = "";
        var i = 0;
        var interval = setInterval(function () {
            if (i >= message.length) {
                clearInterval(interval);
                resolve();
            } else {
                html += message[i];
                dest.innerHTML = html;
                i++;
            }
        }, speed);
    });
}

// --------------------------
// pages
// --------------------------
function activatePage(id) {
    ALL_PAGES.forEach(element => {
        document.getElementById(element).hidden = (id != element);
    });
}

// --------------------------
// introduction page
// --------------------------
function createIntroButtons(id, allElements, selection, single = false) {
    let div = document.getElementById(id + "s");
    allElements.forEach(function (n) {
        let button = document.createElement('button');
        button.id = id + "-" + n;
        button.className = "digit-" + id + " not-selected";

        button.addEventListener('click', function () {
            if (single)
                selection.splice(0, selection.length)
            let i = selection.indexOf(n);
            if (i >= 0) {
                removeElement(selection, n);
            } else {
                selection.push(n);
            }
            refreshIntroButtonsState(id, allElements, selection);
        });
        div.appendChild(button);
    })

    // update current state
    refreshIntroButtonsState(id, allElements, selection);
}

function refreshIntroButtonsState(id, allElements, selection) {
    allElements.forEach(function (x) {
        document.getElementById(id + "-" + x).className = (id + "-button " +
            "digit-" + x + " " +
            ((selection.indexOf(x) >= 0) ? "selected" : "not-selected"));
    });
}

// --------------------------
// count down page
// --------------------------

function countDownPage() {
    console.log('run splash ' + splashCountDown);
    if (splashCountDown >= 0) {
        text = (splashCountDown == 0) ? "Partez !" : splashCountDown + " ...";
        document.getElementById("countdown").innerHTML = text;
        splashCountDown--;
    }
    else {
        startRunning();
    }
}

// --------------------------
// training page
// --------------------------

function createQuestionLetters(question, input) {
    let x = question.operand1.toString();
    let o = question.operation;
    let y = question.operand2.toString();

    let letters = [];
    let html = "";
    id = "operation"
    for (var i = 0; i < x.length; i++) {
        letters.push('<button class="digit-' + x[i] + '"> </button>');
    }
    letters.push('<button class="digit-' + o + '"> </button>');
    for (var i = 0; i < y.length; i++) {
        letters.push('<button class="digit-' + y[i] + '"> </button>');
    }
    letters.push('<button class="digit-equals"> </button>');

    if (input.length) {
        for (var i = 0; i < input.length; i++) {
            letters.push('<button class="digit-' + input[i] + '"> </button>');
        }
    }

    return letters;
}

function displayOperation(input, byletter = false) {
    return new Promise(resolve => {
        let letters = createQuestionLetters(currentQuestion, input);
        
        if (byletter) {
            printMessageByLetter("operation", letters, speed=100)
                .then(resolve)
        }
        else {
            printMessage("operation", letters)
            resolve();
        }
    });
}

function displayAnswer() {
    let label = document.getElementById("label");
    label.innerHTML = "le bon resultat est"
    return displayOperation(currentAnswer.toString(), byletter = true)
}

function showKeyboard() {
    let keyboard = document.getElementById("keyboard")
    keyboard.hidden = false;
    inGame = true;
}

function hideKeyboard() {
    let keyboard = document.getElementById("keyboard")
    keyboard.hidden = true;
    inGame = false;
}

function inputClear() {
    currentInput = "";

    let label = document.getElementById("label");
    label.innerHTML = "trouve le resultat de"
    return displayOperation("", byletter = true);
}

function inputDigit(digit) {
    currentInput = currentInput + digit;
    let current = parseInt(currentInput);
    let verify = (currentAnswer.toString().length == current.toString().length);
    displayOperation(currentInput).then(verify ? inputCheck : null)
}

function flashStatus(msg, classname = "") {
    return new Promise(resolve => {
        let status = document.getElementById("status");
        status.innerHTML = msg;
        status.hidden = false;
        status.className = classname;
        sleep(1000).then(function () {
            status.hidden = true;
        })
        resolve();
    });
}

function inputOK() {
    currentScore = currentScore + 1;
    msg = choose(OK_MESSAGES);
    answers.push([currentQuestion, currentAnswer, currentInput])

    hideKeyboard();

    return flashStatus(msg, "success")
        .then(sleep2000)
        .then(nextQuestion)
        .then(sleep500)
        .then(showKeyboard)
}

function inputKO() {
    msg = choose(KO_MESSAGES);
    answers.push([currentQuestion, currentAnswer, currentInput])

    hideKeyboard();

    return flashStatus(msg, "error")
        .then(sleep2000)
        .then(displayAnswer)
        .then(sleep2000)
        .then(nextQuestion)
        .then(sleep500)
        .then(showKeyboard)
}

function inputCheck() {
    let inputValue = parseInt(currentInput);
    let ok = (currentAnswer == inputValue);

    return displayOperation(currentInput, byletter = false)
        .then(ok ? inputOK : inputKO);
}

function passTurn() {
    if (chancesCount > 0) {
        chancesCount--;
        hideKeyboard();
        return flashStatus("Il reste " + chancesCount + " Jokers")
            .then(nextQuestion)
            .then(showKeyboard)
    } else {
        hideKeyboard();
        return flashStatus("Aucun Joker")
            .then(nextQuestion)
            .then(showKeyboard)
    }
}

function nextQuestion() {
    currentInput = "";
    questionsCount += 1;
    currentQuestion = choose(allQuestions);
    currentAnswer = currentQuestion.answser;

    return inputClear();
}

// -------------------------
// game steps
// -------------------------

function createQuestions(tables, operations) {
    allQuestions.splice(0, allQuestions.length);
    
    ALL_NUMBERS.forEach(function (a) {
        selectedTables.forEach(function (b) {
            selectedOperations.forEach(function (o) {
                let n = getRandomInt(2);
                switch (o) {
                    case OP_PLUS:
                        x = n ? a : b;
                        y = n ? b : a;
                        z = a + b;
                        break;
                    case OP_MINUS:
                        x = a + b;
                        y = b;
                        z = a;
                        break;
                    case OP_TIMES:
                        x = n ? a : b;
                        y = n ? b : a;
                        z = a * b;
                        break;
                    case OP_DIVIDE:
                        x = a * b;
                        y = b;
                        z = a
                        break;
                }
                allQuestions.push({operand1: x, operation: o, operand2: y, answser: z});
            });
        })
    });
}

function initGame() {
    state = INIT;
    gameCountDown = GAME_CD;
    activatePage("init_page")
}

function startGame() {
    createQuestions(selectedTables, selectedOperations);
    answers.splice(0, answers.length);
    state = SPLASH;
    activatePage("countdown_page");
    splashCountDown = SPLASH_CD;
}

function startRunning() {
    state = RUNNING;
    questionsCount = 0;
    currentScore = 0;
    chancesCount = CHANCES_NB;
    gameCountDown = selectedDurations[0] * 60;
    activatePage("game_page");
    runGame();

    hideKeyboard();
    nextQuestion()
        .then(showKeyboard);
}

function runGame() {
    if (statusCountDown) {
        statusCountDown--;
    }
    else {
        document.getElementById("timer").innerHTML = formatDuration(gameCountDown);
    }
    if (gameCountDown) {
        if (inGame) {
            gameCountDown--;
        }
    }
    else {
        endGame();
    }
}

function endGame() {
    state = END
    activatePage("end_page");

    document.getElementById("final_score").innerHTML = currentScore + "/" + questionsCount;
    let list_anwsers = document.getElementById("answers");
}

function gameLoop() {
    console.log('state ' + state);
    switch (state) {
        case INIT:
            break;

        case SPLASH:
            countDownPage();
            break;

        case RUNNING:
            runGame();
            break;
    }
}

var timerVar = setInterval(gameLoop, 1000);

window.addEventListener('load', function () {
    createIntroButtons('duration', ALL_DURATIONS, selectedDurations, single = true);
    createIntroButtons('table', ALL_TABLES, selectedTables);
    createIntroButtons('operation', ALL_OPERATIONS, selectedOperations);

    initGame();
});

window.addEventListener('keydown', function (e) {
    if (state == RUNNING) {
        if (/^[0-9]$/i.test(e.key)) {
            inputDigit(e.key);
        }
    }
});
