// ==========================================
// 1. IMPORT & KONFIGURASI FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, update, onValue, get, remove, onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCy3ZnU7qnUNjh7Xy_oWnGtgGwhGYAFQ_w",
  authDomain: "ruix-b8930.firebaseapp.com",
  databaseURL: "https://ruix-b8930-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ruix-b8930",
  storageBucket: "ruix-b8930.firebasestorage.app",
  messagingSenderId: "795626700124",
  appId: "1:795626700124:web:ed12ec7bea6203a33e1599"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ==========================================
// 2. FITUR GLOBAL (QUOTE)
// ==========================================
window.fetchQuote = async function() {
    const text = document.getElementById('quote-text');
    const author = document.getElementById('quote-author');
    if (!text) return; // Kalau tidak ada kotak quote, jangan jalankan

    text.innerText = "Memuat pesan motivasi...";
    try {
        const res = await fetch('https://api.adviceslip.com/advice?t=' + Date.now());
        const data = await res.json();
        text.innerText = `"${data.slip.advice}"`;
        if (author) author.innerText = "— Ruix System";
    } catch (e) {
        text.innerText = "Fokus adalah kunci kemenangan hari ini!";
        if (author) author.innerText = "— Ruix System";
    }
};

// ==========================================
// 3. AUTH LOGIC (SIGN IN / SIGN UP) 
// ==========================================

// --- LOGIKA LOGIN ---
if (document.getElementById('login-form')) {
    window.fetchQuote(); // MENGGUNAKAN NAMA FUNGSI YANG BENAR
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');
        
        const email = emailInput ? emailInput.value.trim() : ""; 
        const password = passwordInput ? passwordInput.value : "";
        
        const btn = e.target.querySelector('button') || e.target.querySelector('input[type="submit"]');
        
        if (btn) {
            btn.disabled = true;
            btn.innerText = "MEMPROSES...";
            if(btn.value) btn.value = "MEMPROSES...";
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'dashboard.html';
        } catch (err) { 
            console.error("Detail Error Auth:", err.code, err.message); 
            if (err.code === 'auth/invalid-email') alert("Format email salah!");
            else if (err.code === 'auth/invalid-credential') alert("Email atau Password salah!");
            else alert("Login Gagal: " + err.message);

            if (btn) {
                btn.disabled = false;
                btn.innerText = "Masuk ke Dashboard";
                if(btn.value) btn.value = "Masuk ke Dashboard";
            }
        }
    });
}

// --- LOGIKA DAFTAR (SIGN UP) ---
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    window.fetchQuote();

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const inputs = e.target.querySelectorAll('input');
        const btn = e.target.querySelector('button');

        const email = inputs[1] ? inputs[1].value.trim() : inputs[0].value.trim();
        const password = inputs[2] ? inputs[2].value.trim() : inputs[1].value.trim();

        if (!email || !password) return alert("Email dan Password harus diisi!");

        if (btn) {
            btn.disabled = true;
            btn.innerText = "⏳ MENDAFTARKAN AKUN...";
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Akun Berhasil Dibuat! Silakan login.");
            window.location.href = 'signin.html';
        } catch (err) {
            console.error("Error Daftar:", err.code);
            alert("Gagal Daftar: " + err.message);
            if (btn) {
                btn.disabled = false;
                btn.innerText = "DAFTAR";
            }
        }
    });
}

// ==========================================
// 4. GURU: DASHBOARD (BUAT SOAL)
// ==========================================
let dashboardQuestions = [];
if (document.getElementById('questionInput')) {
    const updateNumbers = () => {
        const current = dashboardQuestions.length + 1;
        document.getElementById('questionNumber').innerText = current;
        document.getElementById('nextBtnNum').innerText = current + 1;
        document.getElementById('savedCount').innerText = dashboardQuestions.length;
    };

    window.nextQuestion = function() {
        const q = document.getElementById('questionInput').value.trim();
        const a = document.getElementById('optA').value.trim();
        const b = document.getElementById('optB').value.trim();
        const c = document.getElementById('optC').value.trim();
        const d = document.getElementById('optD').value.trim();
        const correct = document.querySelector('input[name="correctKey"]:checked')?.value;

        if (q && a && b && c && d && correct) {
            dashboardQuestions.push({ q, a, b, c, d, correct });
            ['questionInput', 'optA', 'optB', 'optC', 'optD'].forEach(id => document.getElementById(id).value = '');
            updateNumbers();
        } else { 
            alert("Harap lengkapi semua teks soal dan opsi!"); 
        }
    };

    window.finishQuiz = async function() {
        const qInput = document.getElementById('questionInput').value.trim();
        if (dashboardQuestions.length === 0 && qInput === "") {
            return alert("Buat minimal 1 soal terlebih dahulu!");
        }

        const allBtns = document.querySelectorAll('button');
        allBtns.forEach(b => {
            b.disabled = true;
            if (b.innerText.includes("Selesai")) b.innerText = "⏳ MENYIMPAN KE CLOUD...";
        });

        if (qInput !== "") window.nextQuestion();

        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
            await set(ref(db, `quizzes/${pin}`), {
                questions: dashboardQuestions,
                status: "active",
                createdAt: new Date().toISOString()
            });
            
            localStorage.setItem('ruix_active_pin', pin);
            localStorage.setItem('ruix_questions', JSON.stringify(dashboardQuestions));
            window.location.href = 'ongoing.html';
        } catch (err) { 
            alert("Gagal Simpan ke Server: " + err.message); 
            allBtns.forEach(b => b.disabled = false);
        }
    };
}

// ==========================================
// 5. GURU: ONGOING (MONITORING LIVE)
// ==========================================
if (document.getElementById('generatedPin')) {
    const pin = localStorage.getItem('ruix_active_pin');
    if (!pin) window.location.href = 'dashboard.html';
    else {
        document.getElementById('generatedPin').innerText = pin;
        const qs = JSON.parse(localStorage.getItem('ruix_questions') || '[]');
        document.getElementById('totalQuestions').innerText = qs.length;

        onChildAdded(ref(db, `quizzes/${pin}/students`), (snap) => {
            const name = snap.key;
            const list = document.getElementById('studentList');
            const waitMsg = document.getElementById('waitingMessage');
            
            if (waitMsg) waitMsg.remove();
            if (!document.getElementById(`student-${name}`)) {
                list.innerHTML += `<div id="student-${name}" class="bg-black text-white px-4 py-2 rounded-full font-bold uppercase text-sm border-2 border-[#BD00FF]">${name}</div>`;
            }
            document.getElementById('studentCount').innerText = list.children.length;
        });

        window.stopQuiz = async function() {
            if (confirm("Hentikan kuis secara paksa sekarang?")) {
                const btns = document.querySelectorAll('button');
                btns.forEach(b => { b.disabled = true; b.innerText = "MENGHENTIKAN..."; });
                
                await update(ref(db, `quizzes/${pin}`), { status: "finished" });
                window.location.href = 'report.html';
            }
        };
    }
}

// ==========================================
// 6. SISWA: JOIN KUIS (INDEX.HTML)
// ==========================================
if (document.getElementById('quizPin')) {
    window.fetchQuote(); 

    window.startQuiz = async function() {
        const name = document.getElementById('groupName').value.trim();
        const pin = document.getElementById('quizPin').value.trim();
        const btn = document.querySelector('button[onclick="startQuiz()"]');
        
        if (!name || !pin) return alert("Isi Nama & PIN dulu ya!");

        if (btn) { 
            btn.disabled = true; 
            btn.innerText = "⏳ MENGECEK PIN..."; 
        }

        try {
            const snap = await get(ref(db, `quizzes/${pin}`));
            
            if (snap.exists() && snap.val().status === "active") {
                await update(ref(db, `quizzes/${pin}/students/${name}`), { score: 0 });
                localStorage.setItem('groupName', name);
                localStorage.setItem('ruix_active_pin', pin);
                localStorage.setItem('ruix_questions', JSON.stringify(snap.val().questions));
                window.location.href = 'quiz.html';
            } else { 
                alert("Waduh, PIN Salah atau Kuis Sudah Ditutup!"); 
                if (btn) { btn.disabled = false; btn.innerText = "Ayo Main! 🚀"; }
            }
        } catch (err) { 
            alert("Koneksi Error: " + err.message); 
            if (btn) { btn.disabled = false; btn.innerText = "Ayo Main! 🚀"; }
        }
    };
}

// ==========================================
// 7. SISWA: PLAYING KUIS (SKOR & TIMER)
// ==========================================
if (document.getElementById('questionText')) {
    const pin = localStorage.getItem('ruix_active_pin');
    const name = localStorage.getItem('groupName');
    const questions = JSON.parse(localStorage.getItem('ruix_questions') || '[]');
    let idx = 0, score = 0, timerInterval;

    const loadQ = () => {
        if (idx >= questions.length) return endQuiz();
        
        const q = questions[idx];
        document.getElementById('questionText').innerText = q.q;
        
        ['A','B','C','D'].forEach(opt => {
            const textSpan = document.getElementById(`textOpt${opt}`);
            const btn = textSpan.parentElement;
            textSpan.innerText = q[opt.toLowerCase()];
            btn.disabled = false;
            btn.style.opacity = "1"; 
        });
        
        document.getElementById('currentPoints').innerText = `${score} pts`;
        document.getElementById('questionCounter').innerText = `${idx + 1}/${questions.length}`;
        document.getElementById('progressBar').style.width = `${((idx + 1) / questions.length) * 100}%`;
        
        startTimer();
    };

    const startTimer = () => {
        let time = 15;
        document.getElementById('timerText').innerText = time;
        clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            time--;
            document.getElementById('timerText').innerText = time;
            if (time <= 0) { 
                clearInterval(timerInterval); 
                window.checkAnswer(null); 
            }
        }, 1000);
    };

    window.checkAnswer = async function(choice) {
        clearInterval(timerInterval);
        const btns = document.querySelectorAll('main button');
        btns.forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });

        if (choice === questions[idx].correct) score += 100;
        else score = Math.max(0, score - 50);

        try {
            await update(ref(db, `quizzes/${pin}/students/${name}`), { score: score });
            idx++;
            setTimeout(loadQ, 400); 
        } catch (e) { 
            console.error(e);
            idx++; 
            loadQ(); 
        }
    };

    const endQuiz = () => {
        localStorage.setItem('finalScore', score);
        window.location.href = 'result.html';
    };

    onValue(ref(db, `quizzes/${pin}/status`), (s) => { 
        if (s.exists() && s.val() === "finished") endQuiz(); 
    });
    
    loadQ();
}

// ==========================================
// 8. SISWA: RESULT TAMPILAN SKOR
// ==========================================
if (document.getElementById('finalScoreDisplay')) {
    window.fetchQuote();
    const finalScore = parseInt(localStorage.getItem('finalScore') || '0');
    const qs = JSON.parse(localStorage.getItem('ruix_questions') || '[]');
    document.getElementById('finalScoreDisplay').innerText = finalScore;

    const stars = [document.getElementById('star1'), document.getElementById('star2'), document.getElementById('star3')];
    const congrats = document.getElementById('congratsText');
    const maxScore = qs.length * 100;
    const ratio = maxScore > 0 ? finalScore / maxScore : 0;

    if (ratio >= 0.8) {
        stars.forEach(s => s.classList.replace('text-gray-300', 'text-[#BD00FF]'));
        congrats.innerText = "Masya Allah, Kamu Sempurna!";
    } else if (ratio >= 0.4) {
        stars[0].classList.replace('text-gray-300', 'text-[#BD00FF]');
        stars[1].classList.replace('text-gray-300', 'text-[#BD00FF]');
        congrats.innerText = "Keren! Tingkatkan Terus!";
    } else if (ratio > 0) {
        stars[0].classList.replace('text-gray-300', 'text-[#BD00FF]');
        congrats.innerText = "Ayo Jangan Menyerah!";
    } else {
        congrats.innerText = "Tetap Semangat Mencoba Lagi!";
    }
}

// ==========================================
// 9. GURU: REPORT & KLASEMEN
// ==========================================
if (document.getElementById('leaderboard-body')) {
    const pin = localStorage.getItem('ruix_active_pin');
    
    onValue(ref(db, `quizzes/${pin}/students`), (snap) => {
        const body = document.getElementById('leaderboard-body');
        body.innerHTML = '';
        
        if (snap.exists()) {
            Object.entries(snap.val())
                .map(([name, d]) => ({ name, score: d.score || 0 }))
                .sort((a,b) => b.score - a.score)
                .forEach((s, i) => {
                    const rank = (i + 1) < 10 ? `0${i + 1}` : i + 1;
                    body.innerHTML += `
                        <tr class="border-2 border-black hover:bg-gray-50 transition-colors">
                            <td class="p-4 border-2 border-black text-center text-2xl font-black italic">${rank}</td>
                            <td class="p-4 border-2 border-black uppercase font-bold">${s.name}</td>
                            <td class="p-4 border-2 border-black text-right text-[#BD00FF] font-black">${s.score}</td>
                        </tr>`;
                });
        }
    });

    window.exitReport = async function() {
        if (confirm("Data skor kuis akan dihapus secara permanen dari server. Pastikan Anda sudah mencatatnya. Lanjutkan?")) {
            const btns = document.querySelectorAll('button');
            btns.forEach(b => { b.disabled = true; b.innerText = "MENGHAPUS DATA..."; });
            
            const pin = localStorage.getItem('ruix_active_pin');
            try {
                if (pin) await remove(ref(db, `quizzes/${pin}`));
                localStorage.clear();
                window.location.href = 'signin.html';
            } catch (err) {
                alert("Gagal menghapus data: " + err.message);
                btns.forEach(b => { b.disabled = false; b.innerText = "Keluar Ke Sign In 🚪"; });
            }
        }
    };
}