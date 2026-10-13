// 直接使用您的 Google 試算表發布 CSV 連結
let sheetCSVUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS3PvVutHVsV6wX5FmSpJkgpuf0TkRBKxvClf2UgwWVSxnEcG7nS-IF2WfV7WPUp8xGd7P0-8nva-FV/pub?gid=372177550&single=true&output=csv';

// 內建備用題庫（若網路連線失敗或試算表尚未發布時自動啟用）
let fallbackQuestions = [
  { question: "1. 在 p5.js 中，設定畫布大小的指令是什麼？", options: ["A) resizeCanvas()", "B) createCanvas()", "C) setCanvas()", "D) newCanvas()"], correct: 1 },
  { question: "2. 哪一個函式會在程式啟動時「只執行一次」？", options: ["A) draw()", "B) start()", "C) setup()", "D) init()"], correct: 2 },
  { question: "3. 若要繪製一個圓形，應該使用哪一個指令？", options: ["A) circle()", "B) rect()", "C) line()", "D) square()"], correct: 0 },
  { question: "4. 設定填滿顏色的指令是哪一個？", options: ["A) stroke()", "B) color()", "C) background()", "D) fill()"], correct: 3 },
  { question: "5. 哪一個系統變數可以取得目前滑鼠的 X 軸座標？", options: ["A) mouseX", "B) mouseY", "C) posX", "D) clickX"], correct: 0 },
  { question: "6. 哪一個函式負責在 p5.js 中持續重複繪製畫面？", options: ["A) update()", "B) loop()", "C) draw()", "D) render()"], correct: 2 },
  { question: "7. 設定線條外框顏色的指令是哪一個？", options: ["A) stroke()", "B) fill()", "C) color()", "D) line()"], correct: 0 },
  { question: "8. 若要清除畫布上的圖形並重新填滿背景，通常會呼叫什麼函式？", options: ["A) clear()", "B) background()", "C) reset()", "D) wipe()"], correct: 1 },
  { question: "9. 哪一個系統變數可以用來取得視窗的總寬度？", options: ["A) screenWidth", "B) windowWidth", "C) docWidth", "D) pageWidth"], correct: 1 },
  { question: "10. 想要在畫布上繪製一個矩形，應使用哪一個指令？", options: ["A) box()", "B) rect()", "C) rectangle()", "D) quad()"], correct: 1 },
  { question: "11. 哪一個系統變數可以取得目前滑鼠的按鍵狀態或是否按下？", options: ["A) mouseIsPressed", "B) mouseClick", "C) isPressed", "D) mousePress"], correct: 0 },
  { question: "12. 若要關閉圖形的外框線，應使用下列哪一個指令？", options: ["A) noFill()", "B) noStroke()", "C) borderOff()", "D) strokeNone()"], correct: 1 },
  { question: "13. 哪一個函式可用來載入外部圖片檔案？", options: ["A) getImage()", "B) loadImg()", "C) loadImage()", "D) fetchImage()"], correct: 2 },
  { question: "14. p5.js 是基於哪一種程式語言所延伸開發的？", options: ["A) Python", "B) Java", "C) C++", "D) JavaScript"], correct: 3 },
  { question: "15. 若要產生一個介於 0 到 10 之間的隨機亂數（不含 10），應使用哪一個函式？", options: ["A) random(10)", "B) rand(10)", "C) math.random(10)", "D) roll(10)"], correct: 0 }
];

let allQuestions = [];
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = -1;
let isAnswered = false;
let jumpOffset = 0;
let isLoading = true;

function preload() {
  // 直接透過 fetch 讀取線上 Google 試算表 CSV
  fetch(sheetCSVUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('無法載入 Google 試算表 (狀態碼: ' + response.status + ')');
      }
      return response.text();
    })
    .then(data => {
      parseCSV(data);
      isLoading = false;
      initQuiz();
    })
    .catch(error => {
      console.warn('線上試算表讀取失敗，自動切換至內建備用題庫:', error);
      allQuestions = [...fallbackQuestions];
      isLoading = false;
      initQuiz();
    });
}

function parseCSV(text) {
  let lines = text.split(/\r\n|\n/);
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    let row = [];
    let insideQuote = false;
    let currentVal = "";
    
    for (let c = 0; c < line.length; c++) {
      let char = line[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
    row.push(currentVal.trim().replace(/^"|"$/g, ''));

    if (row.length >= 6) {
      allQuestions.push({
        question: row[0],
        options: [row[1], row[2], row[3], row[4]],
        correct: int(row[5])
      });
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textFont("LXGW WenKai Mono TC, Chiron Sung HK");
}

function initQuiz() {
  if (allQuestions.length === 0) return;

  let tempQuestions = [...allQuestions];
  shuffle(tempQuestions, true);
  questions = tempQuestions.slice(0, 5);

  currentQuestionIndex = 0;
  score = 0;
  selectedOption = -1;
  isAnswered = false;
}

function draw() {
  background(245);

  if (isLoading) {
    fill(50);
    textSize(28);
    text("正在從雲端載入題庫，請稍候...", width / 2, height / 2);
    return;
  }

  if (currentQuestionIndex >= questions.length) {
    drawScoreScreen();
  } else {
    drawQuizScreen();
  }
}

function drawQuizScreen() {
  let q = questions[currentQuestionIndex];

  fill(30);
  textSize(32);
  text(q.question, width / 2, height * 0.18);

  let optionWidth = min(width * 0.7, 550);
  let optionHeight = 60;
  let startY = height * 0.32;
  let spacing = 75;

  if (isAnswered && selectedOption !== q.correct) {
    jumpOffset = sin(frameCount * 0.2) * 10;
  } else {
    jumpOffset = 0;
  }

  for (let i = 0; i < q.options.length; i++) {
    let x = width / 2 - optionWidth / 2;
    let y = startY + i * spacing;
    let currentY = y;

    if (isAnswered) {
      if (i === q.correct) {
        if (selectedOption === q.correct) {
          fill("#a8e6cf");
        } else {
          fill("#caf0f8");
          currentY += jumpOffset;
        }
      } else if (i === selectedOption) {
        fill("#ffaaa5");
      } else {
        fill(255);
      }
    } else {
      fill(255);
    }

    stroke(200);
    strokeWeight(2);
    rect(x, currentY, optionWidth, optionHeight, 12);

    noStroke();
    fill(40);
    textSize(24);
    text(q.options[i], width / 2, currentY + optionHeight / 2);
  }

  if (isAnswered) {
    let btnW = 180;
    let btnH = 55;
    let btnX = width / 2 - btnW / 2;
    let btnY = startY + 4 * spacing + 15;

    fill("#4d96ff");
    rect(btnX, btnY, btnW, btnH, 10);

    fill(255);
    textSize(22);
    text("下一題", width / 2, btnY + btnH / 2);
  }
}

function drawScoreScreen() {
  fill(30);
  noStroke();

  textSize(44);
  text("測驗結束！", width / 2, height * 0.35);

  textSize(32);
  text(`您的總得分為：${score} / ${questions.length} 題`, width / 2, height * 0.48);

  let btnW = 200;
  let btnH = 60;
  let btnX = width / 2 - btnW / 2;
  let btnY = height * 0.62;

  fill("#6c5ce7");
  rect(btnX, btnY, btnW, btnH, 10);

  fill(255);
  textSize(22);
  text("再測驗一次", width / 2, btnY + btnH / 2);
}

function mousePressed() {
  if (isLoading) return;

  if (currentQuestionIndex >= questions.length) {
    let btnW = 200;
    let btnH = 60;
    let btnX = width / 2 - btnW / 2;
    let btnY = height * 0.62;

    if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      initQuiz();
    }
    return;
  }

  let optionWidth = min(width * 0.7, 550);
  let optionHeight = 60;
  let startY = height * 0.32;
  let spacing = 75;

  if (!isAnswered) {
    for (let i = 0; i < 4; i++) {
      let x = width / 2 - optionWidth / 2;
      let y = startY + i * spacing;

      if (mouseX > x && mouseX < x + optionWidth && mouseY > y && mouseY < y + optionHeight) {
        selectedOption = i;
        isAnswered = true;

        if (selectedOption === questions[currentQuestionIndex].correct) {
          score++;
        }
        break;
      }
    }
  } else {
    let btnW = 180;
    let btnH = 55;
    let btnX = width / 2 - btnW / 2;
    let btnY = startY + 4 * spacing + 15;

    if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      currentQuestionIndex++;
      selectedOption = -1;
      isAnswered = false;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}