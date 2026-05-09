// ==========================================
// 1. IMPORT & INISIALISASI (VERSI MODULAR)
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
// 2. FITUR GLOBAL (FOOTER & QUOTE)
// ==========================================
async function fetchGlobalQuote(textId, authorId) {
    const quoteText = document.getElementById(textId);
    if (!quoteText) return;
    try {
        const response = await fetch('https://api.adviceslip.com/advice?t=' + new Date().getTime());
        const data = await response.json();
        quoteText.innerText = `"${data.slip.advice}"`;
        if (document.getElementById(authorId)) document.getElementById(authorId).innerText = "— Wise Advice";
    } catch (e) {
        quoteText.innerText = "Kerja sama tim adalah kunci kemenangan!";
    }
}

// ==========================================
// 3. LOGIKA GURU: SIGN IN & SIGN UP (VERSI KEBAL ERROR)
// ==========================================
if (document.getElementById('login-form')) {
    fetchGlobalQuote('quote-text', 'quote-author');
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            // Ambil elemen input ke-1 (Email) dan ke-2 (Password) di form login
            const inputs = document.getElementById('login-form').getElementsByTagName('input');
            const email = inputs[0].value;
            const password = inputs[1].value;
            
            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    alert("Login Berhasil!");
                    window.location.href = 'dashboard.html';
                })
                .catch((err) => alert("Gagal Login: " + err.message));
        } catch (error) {
            console.error("Ada masalah di form login HTML:", error);
            alert("Error sistem! Cek F12 Console.");
        }
    });
}

if (document.getElementById('signup-form')) {
    fetchGlobalQuote('quote-text', 'quote-author');
    document.getElementById('signup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            // Karena di signup ada Nama (0), Email (1), dan Password (2)
            const inputs = document.getElementById('signup-form').getElementsByTagName('input');
            
            // Ambil berdasarkan urutan kotak di HTML kamu
            let email, password;
            if (inputs.length >= 3) {
                email = inputs[1].value; // Kotak ke-2
                password = inputs[2].value; // Kotak ke-3
            } else {
                email = inputs[0].value;
                password = inputs[1].value;
            }
            
            createUserWithEmailAndPassword(auth, email, password)
                .then(() => {
                    alert("Akun Berhasil! Silakan Login.");
                    window.location.href = 'signin.html';
                })
                .catch((err) => alert("Gagal Daftar: " + err.message));
        } catch (error) {
            console.error("Ada masalah di form signup HTML:", error);
            alert("Error sistem! Cek F12 Console.");
        }
    });
}
// ==========================================
// ==========================================
// 4. LOGIKA GURU: DASHBOARD (BUAT SOAL)
// ==========================================
let dashboardQuestions = [];
if (document.getElementById('questionInput')) {
    window.nextQuestion = function() {
        const q = document.getElementById('questionInput').value;
        const a = document.getElementById('optA').value;
        const b = document.getElementById('optB').value;
        const c = document.getElementById('optC').value;
        const d = document.getElementById('optD').value;
        
        // Ambil kunci jawaban (A/B/C/D)
        const correctNode = document.querySelector('input[name="correctKey"]:checked');
        const correct = correctNode ? correctNode.value : null;

        if (q && a && b && c && d && correct) {
            dashboardQuestions.push({ q, a, b, c, d, correct });
            
            // Bersihkan kolom input untuk soal selanjutnya
            document.querySelectorAll('input[type="text"], textarea').forEach(el => el.value = '');
            
            // Update angka di layar
            document.getElementById('savedCount').innerText = dashboardQuestions.length;
            const nextNum = dashboardQuestions.length + 1;
            if (document.getElementById('questionNumber')) document.getElementById('questionNumber').innerText = nextNum;
            if (document.getElementById('nextBtnNum')) document.getElementById('nextBtnNum').innerText = nextNum + 1;
            
            alert(`Soal ke-${dashboardQuestions.length} tersimpan di memori sementara.`);
        } else {
            alert("Harap lengkapi semua kolom teks dan pilih salah satu kunci jawaban!");
        }
    };

    // UBAH NAMANYA DI SINI MENJADI finishQuiz (Tanpa 'Creation')
    window.finishQuiz = function() {
        if (dashboardQuestions.length > 0) {
            // Simpan array soal ke LocalStorage lalu pindah halaman
            localStorage.setItem('ruix_questions', JSON.stringify(dashboardQuestions));
            window.location.href = 'ongoing.html';
        } else {
            alert("Tunggu dulu! Kamu belum membuat minimal 1 soal.");
        }
    };
}
// ==========================================
// 5. LOGIKA GURU: ONGOING (KUIS LIVE)
// ==========================================
if (document.getElementById('generatedPin')) {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    document.getElementById('generatedPin').innerText = pin;
    localStorage.setItem('ruix_active_pin', pin); // Simpan PIN agar Report.html bisa baca
    
    const questions = JSON.parse(localStorage.getItem('ruix_questions') || '[]');

    // UPLOAD KE DATABASE
    set(ref(db, `quizzes/${pin}`), {
        questions: questions,
        status: "active",
        createdAt: new Date().toISOString()
    });

    // Pantau Murid Masuk - Sesuaikan ID dengan studentList di ongoing.html
    onChildAdded(ref(db, `quizzes/${pin}/students`), (snapshot) => {
        const name = snapshot.key;
        const list = document.getElementById('studentList'); 
        const countDisplay = document.getElementById('studentCount');
        const waitMsg = document.getElementById('waitingMessage');

        if (waitMsg) waitMsg.remove(); // Hapus tulisan "Belum ada siswa"
        if (list) {
            list.innerHTML += `<div class="bg-black text-white px-4 py-2 rounded-full font-bold uppercase text-sm border-2 border-[#BD00FF]">${name}</div>`;
            if(countDisplay) countDisplay.innerText = list.children.length;
        }
    });

    window.stopQuiz = async function() {
        if (confirm("Hentikan kuis?")) {
            await update(ref(db, `quizzes/${pin}`), { status: "finished" });
            window.location.href = 'report.html';
        }
    };
}

// ==========================================
// 6. LOGIKA MURID: MASUK KUIS (AMBIL DATA SERVER)
// ==========================================
if (document.getElementById('quizPin')) {
    fetchGlobalQuote('quote-text', 'quote-author'); // Pastikan quote muncul di landing murid

    window.startQuiz = async function() {
        const name = document.getElementById('groupName').value.trim();
        const pin = document.getElementById('quizPin').value.trim();

        if (name && pin) {
            try {
                // Cek PIN ke Firebase
                const snapshot = await get(ref(db, `quizzes/${pin}`));
                
                if (snapshot.exists() && snapshot.val().status === "active") {
                    const quizData = snapshot.val();
                    
                    // SIMPAN DATA PENTING KE MEMORI MURID
                    localStorage.setItem('groupName', name);
                    localStorage.setItem('ruix_active_pin', pin);
                    // Ambil soal langsung dari database (bukan localStorage kosong)
                    localStorage.setItem('ruix_questions', JSON.stringify(quizData.questions));
                    
                    window.location.href = 'quiz.html';
                } else {
                    alert("Waduh, PIN salah atau kuisnya sudah ditutup Pak Guru/Bu Guru!");
                }
            } catch (error) {
                console.error("Gagal koneksi ke database:", error);
                alert("Koneksi internet bermasalah, coba lagi ya!");
            }
        } else {
            alert("Isi nama kelompok dan PIN kuis dulu ya!");
        }
    };
}

// ==========================================
// 7. LOGIKA MURID: MAIN KUIS (SINKRON SKOR)
// ==========================================
if (document.getElementById('timerText')) {
    const pin = localStorage.getItem('ruix_active_pin');
    const name = localStorage.getItem('groupName');
    const questions = JSON.parse(localStorage.getItem('ruix_questions'));
    let idx = 0, score = 0;

    // FITUR PENTING: Murid berhenti jika kuis dihentikan guru
    onValue(ref(db, `quizzes/${pin}/status`), (snap) => {
        if (snap.val() === "finished") {
            localStorage.setItem('finalScore', score);
            window.location.href = 'result.html';
        }
    });

    window.checkAnswer = function(choice) {
        if (choice === questions[idx].correct) score += 100;
        else score -= 50;
        
        // Update skor ke Realtime Database
        update(ref(db, `quizzes/${pin}/students/${name}`), { score: score });
        
        idx++;
        if (idx < questions.length) loadQ();
        else {
            localStorage.setItem('finalScore', score);
            window.location.href = 'result.html';
        }
    };

    function loadQ() {
        const q = questions[idx];
        document.getElementById('questionText').innerText = q.q;
        document.getElementById('textOptA').innerText = q.a;
        document.getElementById('textOptB').innerText = q.b;
        document.getElementById('textOptC').innerText = q.c;
        document.getElementById('textOptD').innerText = q.d;
        // Update progress bar & counter
        document.getElementById('questionCounter').innerText = `${idx + 1}/${questions.length}`;
        document.getElementById('progressBar').style.width = `${((idx + 1) / questions.length) * 100}%`;
    }
    loadQ();
}

// ==========================================
// 8. LOGIKA GURU: REPORT (SINKRON MODULAR)
// ==========================================
if (document.getElementById('leaderboard-body')) {
    const pin = localStorage.getItem('ruix_active_pin');

    if (pin) {
        onValue(ref(db, `quizzes/${pin}/students`), (snap) => {
            const data = snap.val();
            const body = document.getElementById('leaderboard-body');
            if (!body) return;
            body.innerHTML = ''; 
            
            if (data) {
                const sorted = Object.entries(data)
                    .map(([id, d]) => ({ name: id, score: d.score || 0 }))
                    .sort((a, b) => b.score - a.score);
                
                sorted.forEach((s, i) => {
                    const rankStr = (i + 1) < 10 ? `0${i + 1}` : i + 1;
                    body.innerHTML += `
                        <tr class="border-2 border-black hover:bg-gray-50 transition-colors">
                            <td class="p-4 border-2 border-black text-center text-2xl font-black italic">${rankStr}</td>
                            <td class="p-4 border-2 border-black font-bold uppercase">${s.name}</td>
                            <td class="p-4 border-2 border-black text-right text-[#BD00FF] font-black">${s.score}</td>
                        </tr>`;
                });
            }
        });
    }

    window.exitReport = async function() {
        if (confirm("DATA KUIS AKAN DIHAPUS PERMANEN. Pastikan sudah dicatat!")) {
            if (pin) await remove(ref(db, `quizzes/${pin}`)); 
            localStorage.removeItem('ruix_questions');
            localStorage.removeItem('ruix_active_pin');
            window.location.href = 'signin.html';
        }
    };
}
// ==========================================
// 9. LOGIKA MURID: RESULT (SKOR AKHIR)
// ==========================================
if (document.getElementById('finalScoreDisplay')) {
    const score = parseInt(localStorage.getItem('finalScore') || '0');
    document.getElementById('finalScoreDisplay').innerText = score.toLocaleString();
    
    // Warnai Bintang
    if (score >= 800) {
        document.getElementById('star1').classList.replace('text-gray-300', 'text-[#BD00FF]');
        document.getElementById('star2').classList.replace('text-gray-300', 'text-[#BD00FF]');
        document.getElementById('star3').classList.replace('text-gray-300', 'text-[#BD00FF]');
        document.getElementById('congratsText').innerText = "Masya Allah, Kamu Pintar!";
    } else if (score >= 500) {
        document.getElementById('star1').classList.replace('text-gray-300', 'text-[#BD00FF]');
        document.getElementById('star2').classList.replace('text-gray-300', 'text-[#BD00FF]');
        document.getElementById('congratsText').innerText = "Keren! Tingkatkan lagi ya!";
    } else {
        document.getElementById('star1').classList.replace('text-gray-300', 'text-[#BD00FF]');
        document.getElementById('congratsText').innerText = "Jangan Menyerah, Ayo Belajar Lagi!";
    }

    fetchGlobalQuote('quote-text', 'quote-author');
}