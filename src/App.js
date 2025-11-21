import React, { useState } from 'react';
import './App.css'; 
import ReactMarkdown from 'react-markdown'; 

// --- Komponen Logo Minimalis (SVG) ---
const AiQuizLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Outline of a Flashcard/Document */}
        <rect x="3" y="5" width="18" height="14" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        
        {/* AI/Brain Symbol (Garis sirkuit vertikal) */}
        <line x1="8" y1="10" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="16" y1="10" x2="16" y2="14" stroke="currentColor" strokeWidth="1.5"/>

        {/* Kilat/Flash (Proses Instan) */}
        <path d="M11 9 L13 15 L11 15 L13 9 Z" fill="currentColor" stroke="none" />
    </svg>
);


function App() {
    const [textInput, setTextInput] = useState('');
    const [questions, setQuestions] = useState([]);
    const [materiPenuh, setMateriPenuh] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [currentView, setCurrentView] = useState('input'); 
    const [userAnswers, setUserAnswers] = useState({}); 
    // State baru untuk mengontrol kapan hasil kuis ditampilkan
    const [isSubmitted, setIsSubmitted] = useState(false); 

    const handleView = (viewName) => {
        setCurrentView(viewName);
    };

    const handleGenerateContent = async () => {
        if (textInput.trim() === '') {
            setError('Mohon masukkan pertanyaan atau materi terlebih dahulu.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setQuestions([]);
        setMateriPenuh('');
        setUserAnswers({}); 
        setIsSubmitted(false); // Pastikan status submission direset

        try {
            const BACKEND_URL = 'https://3000-firebase-prepai-1763738031556.cluster-ejd22kqny5htuv5dfowoyipt52.cloudworkstations.dev/api/generate-content'; 
            
            const response = await fetch(BACKEND_URL, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textInput, format: 'multiple_choice' }), 
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Gagal terhubung ke server backend.');
            }

            setQuestions(result.data.questions);
            setMateriPenuh(result.data.materi_penuh);

        } catch (err) {
            setError(err.message);
            console.error('Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        setCurrentView('input');
        setError(null);
    };
    
    const handleGenerateNew = () => {
        setTextInput(''); 
        setQuestions([]); 
        setMateriPenuh(''); 
        setCurrentView('input'); 
        setError(null);
        setUserAnswers({});
        setIsSubmitted(false); // Reset status submission
    };
    
    // --- FUNGSI BARU: HANYA MENYIMPAN PILIHAN (BISA DIUBAH) ---
    const handleAnswer = (questionIndex, selectedOption) => {
        // Hanya izinkan memilih/mengubah pilihan jika belum disubmit
        if (isSubmitted) {
            return;
        }
        
        // Simpan atau ganti pilihan yang sudah ada
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: selectedOption,
        }));
    };
    
    // --- FUNGSI BARU: MENGHITUNG SKOR DAN MENAMPILKAN HASIL ---
    const handleSubmitQuiz = () => {
        if (questions.length === 0) return;
        setIsSubmitted(true);
    };

    // Hitung skor (digunakan saat isSubmitted = true)
    const score = Object.keys(userAnswers).filter(index => {
        const question = questions[index];
        return question && question.correctAnswer === userAnswers[index];
    }).length;
    
    // Cek apakah semua soal memiliki pilihan
    const allSelected = questions.length > 0 && Object.keys(userAnswers).length === questions.length;


    if (currentView === 'materi') {
        return (
            <div className="App">
                <header className="App-header dark-header"> 
                    <h1>📖 Materi</h1>
                </header>

                <main className="container materi-view dark-bg"> 
                    <button className="back-button secondary-btn" onClick={handleGoBack}>
                        ← Kembali ke Input Materi
                    </button>
                    
                    <div className="materi-content dark-card"> 
                        {materiPenuh ? <ReactMarkdown>{materiPenuh}</ReactMarkdown> : <p>Memuat materi...</p>}
                    </div>
                </main>
            </div>
        );
    }

    if (currentView === 'flashcards') {
        return (
            <div className="App">
                <header className="App-header dark-header"> 
                    <h1>📝 Uji Pemahaman Materi</h1>
                </header>

                <main className="container quiz-view dark-bg"> 
                    <button className="back-button secondary-btn" onClick={handleGoBack}>
                        ← Kembali ke Input Materi
                    </button>
                    
                    <h2 className="section-title">{questions.length} Soal Pemahaman</h2> 
                    
                    <div className="quiz-list">
                        {questions.map((q, index) => {
                            const userAnswer = userAnswers[index];
                            const isSelected = userAnswer !== undefined;
                            const isCorrect = isSubmitted && q.correctAnswer === userAnswer;
                            
                            let cardClass = "quiz-card dark-card";
                            if (isSubmitted) {
                                cardClass += isCorrect ? ' correct' : ' incorrect';
                            } else if (isSelected) {
                                cardClass += ' selected-pending'; // Menandai yang sudah dipilih, tapi belum disubmit
                            }
                            
                            return (
                                <div key={index} className={cardClass}>
                                    <div className="quiz-question">
                                        <strong>Soal {index + 1}:</strong> 
                                        <ReactMarkdown>{q.question}</ReactMarkdown>
                                    </div>
                                    
                                    <div className="quiz-options">
                                        {q.options.map((option, optIndex) => {
                                            let optionClass = "option-button secondary-btn";
                                            
                                            // Saat BELUM disubmit
                                            if (!isSubmitted) {
                                                if (option === userAnswer) {
                                                    optionClass += ' selected'; // Pilihan pengguna
                                                }
                                            } 
                                            // Saat SUDAH disubmit (menampilkan hasil)
                                            else { 
                                                if (option === q.correctAnswer) {
                                                    optionClass += ' correct-answer-reveal'; // Jawaban benar
                                                }
                                                if (option === userAnswer && option !== q.correctAnswer) {
                                                    optionClass += ' selected-incorrect'; // Jawaban salah pengguna
                                                }
                                            }
                                            
                                            return (
                                                <button 
                                                    key={optIndex}
                                                    className={optionClass}
                                                    onClick={() => handleAnswer(index, option)}
                                                    // Tombol opsi dinonaktifkan setelah disubmit
                                                    disabled={isSubmitted} 
                                                >
                                                    {String.fromCharCode(65 + optIndex)}. {option}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Tampilkan feedback hanya setelah disubmit */}
                                    {isSubmitted && (
                                        <div className="feedback-message">
                                            {isCorrect ? '✅ Benar!' : `❌ Salah. Jawaban yang benar adalah: ${q.correctAnswer}`}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* --- TOMBOL SUBMIT (Hanya Muncul sebelum disubmit) --- */}
                    {!isSubmitted && (
                        <button 
                            className="primary-btn submit-quiz-button" 
                            onClick={handleSubmitQuiz}
                            disabled={!allSelected} // Hanya aktif jika semua soal telah dijawab
                        >
                            Submit Jawaban & Lihat Skor ✨
                        </button>
                    )}

                    {/* --- SKOR DAN KONTROL BARU (Hanya Muncul setelah disubmit) --- */}
                    {isSubmitted && (
                        <>
                            <div className="score-summary primary-btn">
                                🎉 Skor Akhir: {score} dari {questions.length} ({((score / questions.length) * 100).toFixed(0)}%)
                            </div>
                            
                            <button 
                                className="generate-new-button secondary-btn" 
                                onClick={handleGenerateNew} 
                                disabled={isLoading}
                            > 
                                Buat Kuis Baru ✏️
                            </button>
                        </>
                    )}

                </main>
            </div>
        );
    }

    return (
        <div className="App">

            
            <main className="container landing-view dark-bg"> 
                <div className="split-layout-container">
                    
                    {/* Panel Promo (Bagian Kiri) */}
                    <div className="left-promo-panel"> 
                        <div className="logo-section">
                            {/* Mengganti SVG placeholder dengan komponen AiQuizLogo */}
                            <AiQuizLogo /> 
                            <span className="logo-text">PrepKilat AI</span>
                        </div>
                        <h1>Kuasai Ilmu. Taklukkan Masa Depan.</h1>
                        <p>Ciptakan kuis beserta temukan materi dari teks apa pun, ditenagai oleh AI. Pembelajaran jadi cepat, efisien.</p>
                    </div>

                    {/* Kolom Input Pertanyaan (Bagian Kanan) */}
                    <div className="input-section dark-card">
                        <h2>Input Pertanyaan atau Materi</h2>
                        <p>Masukkan topik, pertanyaan, atau jelaskan materi apa yang ingin Anda pelajari.</p>
                        
                        <textarea
                            className="text-input dark-input" 
                            rows="8" 
                            placeholder="Contoh: Saya ingin mempelajari materi tentang Pertumbuhan dan Perkembangan pada Manusia..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            disabled={isLoading}
                        />

                        {questions.length === 0 && materiPenuh.length === 0 && (
                            <button className="primary-btn" onClick={handleGenerateContent} disabled={isLoading || textInput.trim() === ''}>
                                {isLoading ? '⏳ Sedang Membuat Konten...' : '✨ Generate Konten'}
                            </button>
                        )}

                        {questions.length > 0 && materiPenuh.length > 0 && (
                            <div className="post-result-controls"> 
                                <div className="result-buttons">
                                    <button className="view-results-button materi-button primary-btn" onClick={() => handleView('materi')} disabled={isLoading}>
                                        Lihat Materi 📖
                                    </button>
                                    <button className="view-results-button flashcard-button primary-btn" onClick={() => handleView('flashcards')} disabled={isLoading}>
                                        Lihat {questions.length} Soal Kuis 📝
                                    </button>
                                </div>
                                <button className="generate-new-button secondary-btn" onClick={handleGenerateNew} disabled={isLoading}> 
                                    Generate Topik Baru ✏️
                                </button>
                            </div>
                        )}
                        
                        {error && <div className="error-message">⚠️ Error: {error}</div>}

                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;