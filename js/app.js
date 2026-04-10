// ===== 恋爱人格测试 - 核心逻辑 =====

let currentQuestion = 0;
let answers = [];
let radarChart = null;

// ===== 初始化 =====
function init() {
  // 检查是否是分享链接
  const sharedAnswers = parseShareLink();
  if (sharedAnswers) {
    answers = sharedAnswers;
    showResult();
  } else {
    showPage('home');
    createHeartRain();
  }
}

// ===== 页面切换 =====
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  window.scrollTo(0, 0);
}

// ===== 心形雨效果 =====
function createHeartRain() {
  const container = document.getElementById('heartRain');
  const hearts = ['💔', '💗', '🖤', '💜', '❤️‍🔥', '♥️', '💕'];
  for (let i = 0; i < 15; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = Math.random() * 100 + '%';
    heart.style.animationDuration = (5 + Math.random() * 10) + 's';
    heart.style.animationDelay = (Math.random() * 10) + 's';
    heart.style.fontSize = (14 + Math.random() * 16) + 'px';
    container.appendChild(heart);
  }
}

// ===== 开始答题 =====
function startQuiz() {
  currentQuestion = 0;
  answers = new Array(questions.length).fill(-1);
  showPage('quiz');
  renderQuestion();
}

// ===== 渲染题目 =====
function renderQuestion() {
  const q = questions[currentQuestion];
  document.getElementById('questionNumber').textContent = `Q${currentQuestion + 1}`;
  document.getElementById('questionText').textContent = q.text;

  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn' + (answers[currentQuestion] === idx ? ' selected' : '');
    btn.textContent = opt.text;
    btn.onclick = () => selectOption(idx);
    container.appendChild(btn);
  });

  updateProgress();
}

// ===== 选择选项 =====
function selectOption(idx) {
  answers[currentQuestion] = idx;

  // 更新选中状态
  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', i === idx);
  });

  // 延迟跳到下一题
  setTimeout(() => {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      renderQuestion();
    } else {
      // 检查是否全部作答
      if (answers.includes(-1)) {
        const first = answers.indexOf(-1);
        currentQuestion = first;
        renderQuestion();
        shakeElement(document.querySelector('.quiz-content'));
      } else {
        showResult();
      }
    }
  }, 300);
}

// ===== 更新进度 =====
function updateProgress() {
  const answered = answers.filter(a => a !== -1).length;
  const percent = (answered / questions.length) * 100;
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('progressText').textContent = `${answered} / ${questions.length}`;
}

// ===== 抖动效果 =====
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.5s ease';
}

// ===== 计算结果 =====
function calculateResult() {
  // 计算各维度分数
  const dimScores = new Array(8).fill(0);
  const dimMax = new Array(8).fill(0);

  answers.forEach((ansIdx, qIdx) => {
    if (ansIdx === -1) return;
    const scores = questions[qIdx].options[ansIdx].scores;
    scores.forEach((s, d) => {
      dimMax[d]++;
      if (s) dimScores[d]++;
    });
  });

  // 归一化到 0-100
  const dimPercent = dimScores.map((s, i) => dimMax[i] > 0 ? Math.round((s / dimMax[i]) * 100) : 0);

  // 匹配人格类型
  let bestMatch = null;
  let bestScore = -1;

  personalities.forEach(p => {
    let score = 0;
    // 高维度得分
    p.keywords.high.forEach(d => { score += dimPercent[d]; });
    // 低维度反向得分
    p.keywords.low.forEach(d => { score += (100 - dimPercent[d]); });
    // 归一化匹配度
    score = Math.round(score / (p.keywords.high.length + p.keywords.low.length));
    if (score > bestScore) {
      bestScore = score;
      bestMatch = p;
    }
  });

  return {
    personality: bestMatch,
    matchPercent: Math.min(99, Math.max(60, bestScore)),
    dimensions: dimPercent
  };
}

// ===== 展示结果 =====
function showResult() {
  const result = calculateResult();
  const p = result.personality;

  document.getElementById('resultBadge').textContent = p.type;
  document.getElementById('resultType').innerHTML = `<span class="emoji">${p.emoji}</span> ${p.name}`;
  document.getElementById('matchPercent').textContent = result.matchPercent + '%';
  document.getElementById('resultDesc').textContent = p.description;
  document.getElementById('resultTip').textContent = '💡 ' + p.tip;

  // 随机备注
  const remarks = [
    '怎么样，被我拿捏了吧？',
    '别急着否认，你心里清楚得很。',
    '测完就跑是吧？至少把链接分享给对象啊。',
    '恭喜你，获得了一个新标签。',
    '建议截图发朋友圈，看看谁跟你一样。',
    '你的恋爱路还很长...或者很短。',
    '测完想分手的不关我事。',
    '这个结果不准！不准！不准！（大概准）'
  ];
  document.getElementById('resultRemark').textContent = '— ' + remarks[Math.floor(Math.random() * remarks.length)];

  // 渲染维度条
  renderDimensionBars(result.dimensions);

  showPage('result');

  // 延迟渲染雷达图（等页面可见）
  setTimeout(() => renderRadarChart(result.dimensions), 300);
}

// ===== 渲染维度条 =====
function renderDimensionBars(dimensions) {
  const container = document.getElementById('dimensionBars');
  container.innerHTML = '';

  dimensions.forEach((val, i) => {
    const item = document.createElement('div');
    item.className = 'dim-bar-item';
    item.innerHTML = `
      <span class="dim-label">${dimensionNames[i]}</span>
      <div class="dim-bar"><div class="dim-bar-fill" style="width: 0%"></div></div>
      <span class="dim-value">${val}%</span>
    `;
    container.appendChild(item);

    // 动画
    setTimeout(() => {
      item.querySelector('.dim-bar-fill').style.width = val + '%';
    }, 100 + i * 100);
  });
}

// ===== 渲染雷达图 =====
function renderRadarChart(dimensions) {
  const ctx = document.getElementById('radarChart').getContext('2d');

  if (radarChart) {
    radarChart.destroy();
  }

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: dimensionNames,
      datasets: [{
        label: '你的恋爱维度',
        data: dimensions,
        backgroundColor: 'rgba(255, 71, 87, 0.15)',
        borderColor: 'rgba(255, 71, 87, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: '#ff4757',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 25,
            color: '#6b6b7b',
            backdropColor: 'transparent',
            font: { size: 10 }
          },
          grid: {
            color: 'rgba(42, 42, 62, 0.8)'
          },
          angleLines: {
            color: 'rgba(42, 42, 62, 0.8)'
          },
          pointLabels: {
            color: '#e8e6e3',
            font: { size: 12, family: 'Noto Sans SC' }
          }
        }
      },
      plugins: {
        legend: { display: false }
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      }
    }
  });
}

// ===== 分享链接 =====
function generateShareLink() {
  const encoded = btoa(answers.join(','));
  const base = window.location.origin + window.location.pathname;
  return `${base}?r=${encodeURIComponent(encoded)}`;
}

function parseShareLink() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('r');
  if (!encoded) return null;
  try {
    const decoded = atob(decodeURIComponent(encoded));
    const arr = decoded.split(',').map(Number);
    if (arr.length === questions.length && arr.every(n => n >= 0 && n < 4)) {
      return arr;
    }
  } catch (e) {}
  return null;
}

async function copyShareLink() {
  const link = generateShareLink();
  try {
    await navigator.clipboard.writeText(link);
    document.getElementById('shareHint').textContent = '✅ 链接已复制！快去分享吧~';
  } catch (e) {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = link;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    document.getElementById('shareHint').textContent = '✅ 链接已复制！快去分享吧~';
  }
}

// ===== 重新测试 =====
function restartQuiz() {
  // 清除URL参数
  if (window.history.replaceState) {
    window.history.replaceState({}, '', window.location.pathname);
  }
  answers = [];
  currentQuestion = 0;
  showPage('home');
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', init);
