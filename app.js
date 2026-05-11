// 게임 데이터
const levelData = {
    1: {
        condition: '반대말을 찾으세요!',
        items: [
            { word: '성공', answer: '실패', wrongs: ['도착', '결과', '시작', '출발'] },
            { word: '칭찬', answer: '꾸중', wrongs: ['격려', '위로', '명령', '부탁'] },
            { word: '원인', answer: '결과', wrongs: ['이유', '과정', '시작', '목적'] },
            { word: '이익', answer: '손해', wrongs: ['도움', '성공', '희망', '승리'] },
            { word: '희망', answer: '절망', wrongs: ['소망', '기대', '슬픔', '분노'] },
            { word: '승리', answer: '패배', wrongs: ['성공', '도전', '출발', '결과'] },
            { word: '찬성', answer: '반대', wrongs: ['동의', '허락', '거절', '질문'] },
            { word: '긍정', answer: '부정', wrongs: ['인정', '확신', '거짓', '진실'] },
            { word: '출발', answer: '도착', wrongs: ['시작', '진행', '결과', '과정'] },
            { word: '절약', answer: '낭비', wrongs: ['저축', '소비', '사용', '보관'] }
        ]
    },
    2: {
        condition: '포함되는 낱말을 찾으세요!',
        items: [
            { word: '직업', answer: '소방관', wrongs: ['병원', '컴퓨터', '아파트', '도서관'] },
            { word: '스포츠', answer: '배드민턴', wrongs: ['피아노', '독서', '요리', '바이올린'] },
            { word: '가전제품', answer: '냉장고', wrongs: ['책장', '연필', '자전거', '자동차'] },
            { word: '포유류', answer: '고래', wrongs: ['거북이', '독수리', '상어', '개구리'] },
            { word: '조류', answer: '타조', wrongs: ['박쥐', '고양이', '사자', '뱀'] },
            { word: '악기', answer: '단소', wrongs: ['축구공', '연필', '가위', '마우스'] },
            { word: '대륙', answer: '아시아', wrongs: ['한국', '서울', '제주도', '한라산'] },
            { word: '과목', answer: '도덕', wrongs: ['교실', '지우개', '책상', '운동장'] },
            { word: '채소', answer: '당근', wrongs: ['사과', '바나나', '포도', '수박'] },
            { word: '교통수단', answer: '헬리콥터', wrongs: ['신발', '칠판', '스마트폰', '책가방'] }
        ]
    }
};

// 캔버스 및 컨텍스트
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// 게임 변수
let currentLevel = 1;
let score = 0;
let health = 3;
let animationId;
let lastTime = 0;
let spawnTimer = 0;
let isGameOver = false;

let currentMission = null;
let asteroids = [];
let particles = [];
let stars = [];

// 플레이어 객체
const player = {
    x: 0,
    y: 0,
    width: 80,
    height: 80,
    color: '#00d2ff',
    targetX: 0,
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 우주선 그리기
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff4b2b';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/4, 0, Math.PI * 2);
        ctx.fill();

        // 불꽃
        ctx.fillStyle = '#ff9000';
        ctx.beginPath();
        ctx.moveTo(-this.width/4, this.height/2);
        ctx.lineTo(this.width/4, this.height/2);
        ctx.lineTo(0, this.height/2 + 20 + Math.random() * 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    },
    update(deltaTime) {
        // 부드러운 이동
        this.x += (this.targetX - this.x) * 0.2;
        // 화면 밖으로 나가지 않게
        if (this.x < this.width/2) this.x = this.width/2;
        if (this.x > canvas.width - this.width/2) this.x = canvas.width - this.width/2;
    }
};

// 소행성 클래스
class Asteroid {
    constructor(word, isCorrect) {
        this.radius = 40 + Math.random() * 10;
        this.x = this.radius + Math.random() * (canvas.width - this.radius * 2);
        this.y = -this.radius;
        this.speed = 3.0 + Math.random() * 2.5 + (currentLevel * 1.0); // 속도 대폭 증가
        this.word = word;
        this.isCorrect = isCorrect;
        this.color = '#cfd9df'; // 정답/오답 모두 동일한 색상으로 통일
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 소행성 본체
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#333';
        ctx.stroke();

        ctx.restore();

        // 글자는 회전하지 않게
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px "Jua"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.word, 0, 0);
        ctx.restore();
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
    }
}

// 파티클 클래스 (이펙트)
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.targetX = canvas.width / 2;
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
}

window.addEventListener('resize', resizeCanvas);

// 입력 처리 (터치 및 마우스)
function handleInput(e) {
    if (isGameOver) return;
    
    // 터치 또는 마우스 X 좌표 가져오기
    let clientX = e.clientX;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
    }
    
    player.targetX = clientX;
}

window.addEventListener('pointermove', handleInput);
window.addEventListener('pointerdown', handleInput);

function initStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

function setMission() {
    let missionData;
    if (currentLevel === 3) {
        // 종합 문제
        const randLevel = Math.random() > 0.5 ? 1 : 2;
        missionData = levelData[randLevel];
    } else {
        missionData = levelData[currentLevel];
    }
    
    const randomItem = missionData.items[Math.floor(Math.random() * missionData.items.length)];
    currentMission = {
        condition: missionData.condition,
        word: randomItem.word,
        answer: randomItem.answer,
        wrongs: [...randomItem.wrongs].sort(() => Math.random() - 0.5).slice(0, 3) // 오답 3개 섞어서 추출
    };

    document.getElementById('mission-condition').innerText = currentMission.condition;
    document.getElementById('mission-word').innerText = currentMission.word;
    document.getElementById('level-display').innerText = currentLevel + '단계';
}

function spawnAsteroid() {
    if (!currentMission || isGameOver) return;

    // 정답 또는 오답 생성
    const isCorrect = Math.random() > 0.7; // 30% 확률로 정답 등장
    let wordText = '';

    if (isCorrect) {
        wordText = currentMission.answer;
    } else {
        wordText = currentMission.wrongs[Math.floor(Math.random() * currentMission.wrongs.length)];
    }

    // 화면에 정답이 너무 없으면 정답 강제 생성
    if (!isCorrect) {
        const correctExists = asteroids.some(a => a.isCorrect);
        if (!correctExists && Math.random() > 0.5) {
            wordText = currentMission.answer;
            asteroids.push(new Asteroid(wordText, true));
            return;
        }
    }

    asteroids.push(new Asteroid(wordText, isCorrect));
}

function createExplosion(x, y, isCorrect) {
    const color = isCorrect ? '#5ce1e6' : '#ff6666';
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function showFeedback(isCorrect) {
    const msgBox = document.getElementById('feedback-msg');
    msgBox.classList.remove('show-correct', 'show-wrong');
    
    // 약간의 딜레이를 주어 애니메이션이 다시 트리거되도록 함
    setTimeout(() => {
        if (isCorrect) {
            msgBox.innerText = "최고예요! 👍";
            msgBox.classList.add('show-correct');
            score += 10;
        } else {
            msgBox.innerText = "앗, 다시 해봐요! 💦";
            msgBox.classList.add('show-wrong');
            health -= 1;
        }
        
        document.getElementById('score').innerText = score;
        document.getElementById('health').innerText = health;

        if (health <= 0) {
            gameOver();
        } else if (isCorrect) {
            // 정답을 맞추면 새 미션 부여
            asteroids = []; // 기존 소행성 지우기
            setMission();
        }
    }, 10);
}

function checkCollision(player, asteroid) {
    const dx = player.x - asteroid.x;
    const dy = player.y - asteroid.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 플레이어 충돌 범위(대략)
    return distance < (player.width / 2 + asteroid.radius * 0.8);
}

function gameLoop(timestamp) {
    if (isGameOver) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 배경 그리기
    drawStars();

    // 플레이어 업데이트 및 그리기
    player.update(deltaTime);
    player.draw();

    // 소행성 스폰
    spawnTimer += deltaTime;
    const spawnRate = Math.max(500, 1400 - (currentLevel * 300)); // 스폰 주기 더 짧게 (난이도 증가)
    if (spawnTimer > spawnRate) {
        spawnAsteroid();
        spawnTimer = 0;
    }

    // 소행성 업데이트, 그리기 및 충돌 처리
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];
        ast.update();
        ast.draw();

        // 충돌 체크
        if (checkCollision(player, ast)) {
            createExplosion(ast.x, ast.y, ast.isCorrect);
            showFeedback(ast.isCorrect);
            asteroids.splice(i, 1);
            continue;
        }

        // 화면 밖으로 나가면 제거
        if (ast.y > canvas.height + ast.radius) {
            asteroids.splice(i, 1);
        }
    }

    // 파티클 업데이트 및 그리기
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    animationId = requestAnimationFrame(gameLoop);
}

// 화면 전환
function startGame(level) {
    currentLevel = level;
    score = 0;
    health = 3;
    isGameOver = false;
    asteroids = [];
    particles = [];
    spawnTimer = 0;

    document.getElementById('score').innerText = score;
    document.getElementById('health').innerText = health;

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    resizeCanvas();
    initStars();
    setMission();
    
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
}

function showStartScreen() {
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
}

// 초기화
window.onload = () => {
    resizeCanvas();
};
