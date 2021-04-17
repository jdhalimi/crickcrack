const INIT = "init";
const SPLASH = "splash";
const RUNNING = "running";
const END = "end";
const WAIT = "wait";

const GAME_CD = 300;
const SPLASH_CD = 3;
const CORRECTION_CD = 1
const CHANCES_NB = 3;

const PAGES = ["init_page", "countdown_page", "game_page", "end_page"];
const OK_MESSAGES = ["super", "bravo", "youpi", "cool", "bien"];
const KO_MESSAGES = ["zut", "c'est faux", "dommage", "mince alors", "courage"];

const ALL_NUMBERS = [0, 1, 2, 3, 5, 6, 7, 8, 9, 10];
const ALL_DURATIONS = [1, 2, 3, 5];
const ALL_TABLES = [2, 3, 4, 5, 6, 7, 8, 9];
const ALL_OPERATIONS = ['+', '-', '/', 'x'];


var splashCountDown = SPLASH_CD;
let gameCountDown = GAME_CD;
let statusCountDown = 0;
let currentInput = "";
let timeElapsed = 0;
let chancesCount = CHANCES_NB;

let currentScore = 0;
let questionsCount = 0;

let selectedDurations = [1];
let selectedTables = [2, 3, 4];
let selectedOperations = ['+'];
let questions = [];

let currentQuestion = "";
let currentAnswer = 0;

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function initButtons(id, allElements, selection, single = false) {
    let div = document.getElementById(id + "s");
    allElements.forEach(function (n) {
        let button = document.createElement('button');
        button.id = id + "-" + n;
        button.innerHTML = n;
        button.className = "not-selected";
        button.addEventListener('click', function () {
            if (single)
                selection.splice(0, selection.length)
            let i = selection.indexOf(n);
            if (i >= 0) {
                removeElement(selection, n);
            } else {
                selection.push(n);
            }
            initRefreshDisplay();
        });
        div.appendChild(button);
    })
}

function refreshButtons(id, allElements, selection) {
    allElements.forEach(function (x) {
        document.getElementById(id + "-" + x).className = (selection.indexOf(x) >= 0) ? "selected" : "not-selected";
    });
}

function initRefreshDisplay() {
    refreshButtons("duration", ALL_DURATIONS, selectedDurations);
    refreshButtons("table", ALL_TABLES, selectedTables);
    refreshButtons("operation", ALL_OPERATIONS, selectedOperations);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function choose(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}

function pad(x) {
    return (x < 10) ? ("0" + x) : x;
}

function formatDuration(s) {
    var hour = Math.floor(s / 3600);
    var minute = Math.floor((s - hour * 3600) / 60);
    var seconds = s - (hour * 3600 + minute * 60);
    return pad(minute) + ":" + pad(seconds)
}

function clearInput() {
    currentInput = "";
    displayOperation("");
}

function removeElement(a, n) {
    let index = a.indexOf(n);
    a.splice(index, 1);
}

function inputDigit(digit) {
    currentInput = currentInput + digit;
    displayOperation(currentInput);
    let current = parseInt(currentInput);
    if (currentAnswer.toString().length == current.toString().length) {
        checkInput();
    }
}

function displayOperation(input) {
    let operationCtrl = document.getElementById("operation");
    operationCtrl.innerHTML = currentQuestion + input;
}


function updateScore() {
    document.getElementById("score").innerHTML = currentScore + "/" + n;
}

function splashStatus(msg, classname) {
    let status = document.getElementById("status");
    status.innerHTML = msg;
    sleep(500).then(function () {
        operation.className = "";
        status.innerHTML = formatDuration(gameCountDown);
    })
}

function checkInput() {
    let inputValue = parseInt(currentInput);
    let operation = document.getElementById("operation");
    let status = document.getElementById("status");
    let ok = (currentAnswer == inputValue);
    let msg = "";
    displayOperation(currentInput)
    if (ok) {
        currentScore = currentScore + 1;
        operation.className = "success";
        msg = choose(OK_MESSAGES);
    } else {
        operation.className = "error";
        msg = choose(KO_MESSAGES);
    }
    splashStatus(msg);
    sleep(500).then(function () {
        operation.className = "";
        nextTurn();
    });
}

function activatePage(page) {
    console.log("activate page " + page)
    PAGES.forEach(element => {
        document.getElementById(element).hidden = (page != element);
    });
}

function initGame() {
    state = INIT;
    gameCountDown = GAME_CD;
    activatePage("init_page")
}

function startGame() {
    let x = 0;
    let y = 0;
    let z = 0;
    console.log('operations:' + selectedOperations);
    console.log("tables " + selectedTables);
    questions.splice(0, questions.length);
    ALL_NUMBERS.forEach(function (a) {
        selectedTables.forEach(function (b) {
            selectedOperations.forEach(function (o) {
                let n = getRandomInt(2);
                switch (o) {
                    case '+':
                        x = n ? a : b;
                        y = n ? b : a;
                        z = a + b;
                        break;
                    case '-':
                        x = a + b;
                        y = b;
                        z = a;
                        break;
                    case 'x':
                        x = n ? a : b;
                        y = n ? b : a;
                        z = a * b;
                        break;
                    case '/':
                        x = a * b;
                        y = b;
                        z = a
                        break;
                }
                questions.push([x + "" + o + "" + y + "=", z]);
            });
        })
    });
    console.log(questions);


    state = SPLASH;
    activatePage("countdown_page");
    splashCountDown = SPLASH_CD;
}

function runSplash() {
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

function passTurn() {
    if (chancesCount > 0) {
        chancesCount--;
        nextTurn();
        if (chancesCount > 0) {
            splashStatus("Il reste " + chancesCount + " Jokers");
        }
    } else {
        splashStatus("Aucun Joker")
    }
}

function startRunning() {
    state = RUNNING;
    questionsCount = 0;
    currentScore = 0;
    chancesCount = CHANCES_NB;
    gameCountDown = selectedDurations[0] * 60;
    console.log('cd:' + gameCountDown);
    activatePage("game_page");
    nextTurn();
    runGame();
}

function runGame() {

    if (statusCountDown) {
        statusCountDown--;
    }
    else {
        document.getElementById("status").innerHTML = formatDuration(gameCountDown);
    }
    if (gameCountDown) {
        gameCountDown--;
    }
    else {
        endGame();
    }
}

function endGame() {
    state = END
    activatePage("end_page");

    document.getElementById("final_score").innerHTML = currentScore + "/" + questionsCount;
}

function nextTurn() {
    currentInput = "";
    questionsCount = questionsCount + 1;
    let choice = choose(questions);
    currentQuestion = choice[0];
    currentAnswer = choice[1];
    displayOperation("");
}

function gameLoop() {
    console.log('state ' + state);
    switch (state) {
        case INIT:
            break;

        case SPLASH:
            runSplash();
            break;

        case RUNNING:
            runGame();
            break;
    }
}

var timerVar = setInterval(gameLoop, 1000);

window.addEventListener('load', function () {
    initButtons('duration', ALL_DURATIONS, selectedDurations, single = true);
    initButtons('table', ALL_TABLES, selectedTables);
    initButtons('operation', ALL_OPERATIONS, selectedOperations);
    initRefreshDisplay();
    initGame();
});
