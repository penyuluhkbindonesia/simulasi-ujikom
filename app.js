(() => {
  "use strict";

  const CONFIG = Object.freeze({
    version: "1.0.0",
    durationMinutes: 120,
    storageKey: "asn9-kompetensi-test-v1",
    totalQuestions: 100
  });

  const COMPETENCIES = [
    {
      key: "integritas",
      label: "Integritas",
      description: "Konsisten antara nilai, perkataan, keputusan, dan tindakan; jujur serta berani menjaga etika."
    },
    {
      key: "kerja_sama",
      label: "Kerja Sama",
      description: "Membangun sinergi, mengelola perbedaan, dan mengoptimalkan kontribusi berbagai pihak."
    },
    {
      key: "komunikasi",
      label: "Komunikasi",
      description: "Menyampaikan dan menerima informasi secara jelas sehingga tercipta pemahaman dan tindakan."
    },
    {
      key: "orientasi_hasil",
      label: "Orientasi pada Hasil",
      description: "Memastikan aktivitas menghasilkan keluaran dan perubahan yang terukur, berkualitas, dan tepat waktu."
    },
    {
      key: "pelayanan_publik",
      label: "Pelayanan Publik",
      description: "Memenuhi kebutuhan pengguna secara profesional, adil, transparan, responsif, dan tidak diskriminatif."
    },
    {
      key: "pengembangan",
      label: "Pengembangan Diri dan Orang Lain",
      description: "Meningkatkan kapasitas melalui belajar, umpan balik, coaching, delegasi, dan kaderisasi."
    },
    {
      key: "perubahan",
      label: "Mengelola Perubahan",
      description: "Mengubah kebijakan atau gagasan menjadi cara kerja baru yang diterapkan dan berkelanjutan."
    },
    {
      key: "keputusan",
      label: "Pengambilan Keputusan",
      description: "Memilih alternatif yang tepat waktu, berbasis fakta, sesuai kewenangan, dan terkendali risikonya."
    },
    {
      key: "perekat_bangsa",
      label: "Perekat Bangsa",
      description: "Mengelola keberagaman secara inklusif, menjaga netralitas, mencegah konflik, dan membangun kepercayaan."
    }
  ];

  if (!Array.isArray(window.QUESTION_BANK) || window.QUESTION_BANK.length !== CONFIG.totalQuestions) {
    document.body.innerHTML = "<main style='padding:32px;font-family:sans-serif'><h1>Bank soal tidak dapat dimuat</h1><p>Pastikan file questions.js tersedia dan memuat 100 soal.</p></main>";
    return;
  }

  const questions = window.QUESTION_BANK;
  const questionById = new Map(questions.map((question) => [question.id, question]));

  const dom = {
    home: document.getElementById("screen-home"),
    quiz: document.getElementById("screen-quiz"),
    result: document.getElementById("screen-result"),
    participantName: document.getElementById("participant-name"),
    readinessCheck: document.getElementById("readiness-check"),
    startButton: document.getElementById("start-button"),
    resumeButton: document.getElementById("resume-button"),
    resumeNote: document.getElementById("resume-note"),
    competencyGrid: document.getElementById("competency-grid"),
    quizParticipant: document.getElementById("quiz-participant"),
    progressText: document.getElementById("progress-text"),
    answeredText: document.getElementById("answered-text"),
    progressBar: document.getElementById("progress-bar"),
    timer: document.getElementById("timer"),
    timerBox: document.querySelector(".timer-box"),
    questionNumber: document.getElementById("question-number"),
    questionCompetency: document.getElementById("question-competency"),
    flagStatus: document.getElementById("flag-status"),
    questionScenario: document.getElementById("question-scenario"),
    questionPrompt: document.getElementById("question-prompt"),
    answerOptions: document.getElementById("answer-options"),
    previousButton: document.getElementById("previous-button"),
    nextButton: document.getElementById("next-button"),
    flagButton: document.getElementById("flag-button"),
    questionNavigator: document.getElementById("question-navigator"),
    navigatorCard: document.querySelector(".navigator-card"),
    toggleNavigator: document.getElementById("toggle-navigator"),
    finishButton: document.getElementById("finish-button"),
    finishDialog: document.getElementById("finish-dialog"),
    finishDialogText: document.getElementById("finish-dialog-text"),
    resultParticipant: document.getElementById("result-participant"),
    scorePercent: document.getElementById("score-percent"),
    scoreFraction: document.getElementById("score-fraction"),
    correctCount: document.getElementById("correct-count"),
    wrongCount: document.getElementById("wrong-count"),
    unansweredCount: document.getElementById("unanswered-count"),
    timeUsed: document.getElementById("time-used"),
    resultInterpretation: document.getElementById("result-interpretation"),
    competencyBreakdown: document.getElementById("competency-breakdown"),
    reviewStatusFilter: document.getElementById("review-status-filter"),
    reviewCompetencyFilter: document.getElementById("review-competency-filter"),
    reviewList: document.getElementById("review-list"),
    printButton: document.getElementById("print-button"),
    restartButton: document.getElementById("restart-button"),
    networkBadge: document.getElementById("network-badge"),
    installButton: document.getElementById("install-button")
  };

  let state = null;
  let timerInterval = null;
  let deferredInstallPrompt = null;
  let navigatorButtons = [];

  function safeLoadState() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const validOrder = Array.isArray(parsed.questionOrder)
        && parsed.questionOrder.length === CONFIG.totalQuestions
        && parsed.questionOrder.every((id) => questionById.has(id));
      if (parsed.version !== CONFIG.version || !validOrder || !parsed.startedAt || !parsed.endsAt) {
        return null;
      }
      parsed.answers = parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {};
      parsed.flagged = Array.isArray(parsed.flagged) ? parsed.flagged : [];
      parsed.currentPosition = Number.isInteger(parsed.currentPosition) ? parsed.currentPosition : 0;
      return parsed;
    } catch (error) {
      console.warn("Gagal membaca progres tersimpan.", error);
      return null;
    }
  }

  function saveState() {
    if (!state) return;
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn("Gagal menyimpan progres.", error);
    }
  }

  function clearState() {
    state = null;
    try {
      localStorage.removeItem(CONFIG.storageKey);
    } catch (error) {
      console.warn("Gagal menghapus progres.", error);
    }
  }

  function shuffle(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
  }

  function createTestState() {
    const now = Date.now();
    const participant = dom.participantName.value.trim() || "Peserta Latihan";
    return {
      version: CONFIG.version,
      participant,
      startedAt: now,
      endsAt: now + (CONFIG.durationMinutes * 60 * 1000),
      completedAt: null,
      completionReason: null,
      questionOrder: shuffle(questions.map((question) => question.id)),
      answers: {},
      flagged: [],
      currentPosition: 0
    };
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatDateTime(timestamp) {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short"
    }).format(new Date(timestamp));
  }

  function getAnsweredCount() {
    return Object.keys(state?.answers || {}).filter((id) => Number.isInteger(state.answers[id])).length;
  }

  function getUnansweredCount() {
    return CONFIG.totalQuestions - getAnsweredCount();
  }

  function showScreen(target) {
    [dom.home, dom.quiz, dom.result].forEach((screen) => {
      screen.hidden = screen !== target;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderCompetencyCards() {
    const counts = questions.reduce((result, question) => {
      result[question.competency] = (result[question.competency] || 0) + 1;
      return result;
    }, {});

    dom.competencyGrid.replaceChildren();
    COMPETENCIES.forEach((competency, index) => {
      const article = document.createElement("article");
      article.className = "competency-item";
      article.dataset.number = String(index + 1).padStart(2, "0");

      const heading = document.createElement("h3");
      heading.textContent = competency.label;

      const description = document.createElement("p");
      description.textContent = `${competency.description} (${counts[competency.key]} soal)`;

      article.append(heading, description);
      dom.competencyGrid.append(article);
    });
  }

  function renderResumeState() {
    const saved = safeLoadState();
    if (!saved) {
      dom.resumeButton.hidden = true;
      dom.resumeNote.hidden = true;
      return;
    }

    state = saved;
    dom.resumeButton.hidden = false;
    dom.resumeNote.hidden = false;
    dom.participantName.value = saved.participant === "Peserta Latihan" ? "" : saved.participant;

    if (saved.completedAt) {
      dom.resumeButton.textContent = "Lihat Hasil Tersimpan";
      dom.resumeNote.textContent = `Tes selesai pada ${formatDateTime(saved.completedAt)}.`;
      return;
    }

    const remaining = saved.endsAt - Date.now();
    dom.resumeButton.textContent = remaining > 0 ? "Lanjutkan Tes Tersimpan" : "Lihat Hasil Otomatis";
    dom.resumeNote.textContent = remaining > 0
      ? `${getAnsweredCount()} soal telah dijawab. Sisa waktu ${formatDuration(remaining)}.`
      : "Waktu tes tersimpan telah habis dan hasil akan dihitung otomatis.";
  }

  function startNewTest() {
    const saved = safeLoadState();
    if (saved && !saved.completedAt) {
      const confirmed = window.confirm("Progres tes sebelumnya akan dihapus. Mulai tes baru?");
      if (!confirmed) return;
    }

    state = createTestState();
    saveState();
    startQuiz();
  }

  function resumeTest() {
    state = safeLoadState();
    if (!state) {
      renderResumeState();
      return;
    }

    if (state.completedAt) {
      showResults();
      return;
    }

    if (Date.now() >= state.endsAt) {
      completeTest("time");
      return;
    }

    startQuiz();
  }

  function startQuiz() {
    dom.quizParticipant.textContent = state.participant;
    buildNavigator();
    showScreen(dom.quiz);
    renderQuestion();
    startTimer();
  }

  function currentQuestion() {
    const questionId = state.questionOrder[state.currentPosition];
    return questionById.get(questionId);
  }

  function buildNavigator() {
    dom.questionNavigator.replaceChildren();
    navigatorButtons = state.questionOrder.map((questionId, position) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nav-question";
      button.textContent = String(position + 1);
      button.setAttribute("aria-label", `Buka soal ${position + 1}`);
      button.addEventListener("click", () => {
        state.currentPosition = position;
        saveState();
        renderQuestion();
        document.querySelector(".question-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      dom.questionNavigator.append(button);
      return button;
    });
  }

  function renderQuestion() {
    const question = currentQuestion();
    const selectedAnswer = state.answers[question.id];
    const flagged = state.flagged.includes(question.id);

    dom.questionNumber.textContent = `Soal ${state.currentPosition + 1}`;
    dom.questionCompetency.textContent = question.competencyLabel;
    dom.questionScenario.textContent = question.scenario;
    dom.questionPrompt.textContent = question.prompt;
    dom.flagStatus.hidden = !flagged;
    dom.flagButton.textContent = flagged ? "Hapus Tanda Tinjau" : "Tandai untuk Ditinjau";
    dom.previousButton.disabled = state.currentPosition === 0;
    dom.nextButton.textContent = state.currentPosition === CONFIG.totalQuestions - 1 ? "Tinjau dan Akhiri" : "Berikutnya";

    dom.answerOptions.replaceChildren();
    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "answer-choice";
      if (selectedAnswer === optionIndex) label.classList.add("selected");

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${question.id}`;
      input.value = String(optionIndex);
      input.checked = selectedAnswer === optionIndex;
      input.addEventListener("change", () => selectAnswer(question.id, optionIndex));

      const letter = document.createElement("span");
      letter.className = "option-letter";
      letter.textContent = String.fromCharCode(65 + optionIndex);

      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = option;

      label.append(input, letter, text);
      dom.answerOptions.append(label);
    });

    updateProgress();
    updateNavigator();
  }

  function selectAnswer(questionId, optionIndex) {
    state.answers[questionId] = optionIndex;
    saveState();

    [...dom.answerOptions.querySelectorAll(".answer-choice")].forEach((choice, index) => {
      choice.classList.toggle("selected", index === optionIndex);
    });

    updateProgress();
    updateNavigator();
  }

  function moveQuestion(direction) {
    const nextPosition = state.currentPosition + direction;
    if (nextPosition < 0 || nextPosition >= CONFIG.totalQuestions) {
      if (direction > 0) openFinishDialog();
      return;
    }
    state.currentPosition = nextPosition;
    saveState();
    renderQuestion();
    document.querySelector(".question-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleFlag() {
    const questionId = currentQuestion().id;
    if (state.flagged.includes(questionId)) {
      state.flagged = state.flagged.filter((id) => id !== questionId);
    } else {
      state.flagged.push(questionId);
    }
    saveState();
    renderQuestion();
  }

  function updateProgress() {
    const answered = getAnsweredCount();
    dom.progressText.textContent = `Soal ${state.currentPosition + 1} dari ${CONFIG.totalQuestions}`;
    dom.answeredText.textContent = `${answered} dijawab`;
    dom.progressBar.style.width = `${(answered / CONFIG.totalQuestions) * 100}%`;
  }

  function updateNavigator() {
    navigatorButtons.forEach((button, position) => {
      const questionId = state.questionOrder[position];
      button.classList.toggle("current", position === state.currentPosition);
      button.classList.toggle("answered", Number.isInteger(state.answers[questionId]));
      button.classList.toggle("flagged", state.flagged.includes(questionId));
      if (position === state.currentPosition) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function startTimer() {
    if (timerInterval) window.clearInterval(timerInterval);
    updateTimer();
    timerInterval = window.setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    if (!state || state.completedAt) return;
    const remaining = state.endsAt - Date.now();
    dom.timer.textContent = formatDuration(Math.max(0, remaining));
    dom.timerBox.classList.toggle("warning", remaining <= 10 * 60 * 1000 && remaining > 5 * 60 * 1000);
    dom.timerBox.classList.toggle("critical", remaining <= 5 * 60 * 1000);

    if (remaining <= 0) {
      completeTest("time");
    }
  }

  function openFinishDialog() {
    const unanswered = getUnansweredCount();
    const flagged = state.flagged.length;
    dom.finishDialogText.textContent =
      `${unanswered} soal belum dijawab dan ${flagged} soal ditandai untuk ditinjau. Jawaban kosong akan dinilai salah.`;
    if (typeof dom.finishDialog.showModal === "function") {
      dom.finishDialog.showModal();
    } else if (window.confirm(dom.finishDialogText.textContent)) {
      completeTest("manual");
    }
  }

  function completeTest(reason) {
    if (!state || state.completedAt) {
      if (state?.completedAt) showResults();
      return;
    }

    state.completedAt = Math.min(Date.now(), state.endsAt);
    state.completionReason = reason;
    saveState();
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
    showResults();
  }

  function calculateResults() {
    const perCompetency = {};
    COMPETENCIES.forEach((item) => {
      perCompetency[item.key] = {
        label: item.label,
        total: 0,
        correct: 0,
        answered: 0
      };
    });

    let correct = 0;
    let answered = 0;

    questions.forEach((question) => {
      const selected = state.answers[question.id];
      const category = perCompetency[question.competency];
      category.total += 1;

      if (Number.isInteger(selected)) {
        answered += 1;
        category.answered += 1;
        if (selected === question.answer) {
          correct += 1;
          category.correct += 1;
        }
      }
    });

    return {
      total: CONFIG.totalQuestions,
      correct,
      answered,
      wrong: answered - correct,
      unanswered: CONFIG.totalQuestions - answered,
      percent: Math.round((correct / CONFIG.totalQuestions) * 100),
      perCompetency
    };
  }

  function getInterpretation(percent) {
    if (percent >= 90) {
      return "Pemahaman situasional Anda sangat kuat. Pertahankan konsistensi analisis, terutama pada kasus yang melibatkan konflik kepentingan, risiko, dan keberagaman pemangku kepentingan.";
    }
    if (percent >= 80) {
      return "Pemahaman Anda kuat. Tinjau jawaban salah untuk memperhalus prioritas, mitigasi risiko, dan kemampuan mengubah solusi operasional menjadi perbaikan sistem.";
    }
    if (percent >= 70) {
      return "Pemahaman Anda cukup. Penguatan diperlukan pada pembedaan respons normatif, tindakan operasional, dan perilaku kepemimpinan yang membangun sistem.";
    }
    if (percent >= 60) {
      return "Pemahaman dasar mulai terbentuk, tetapi masih terdapat kesenjangan pada penetapan prioritas, akuntabilitas, keterlaksanaan, dan ukuran keberhasilan.";
    }
    return "Diperlukan penguatan menyeluruh. Pelajari kembali definisi sembilan kompetensi, lalu fokus pada pola: fakta, akar masalah, alternatif, keputusan, implementasi, risiko, dan indikator.";
  }

  function showResults() {
    if (!state) return;
    if (!state.completedAt) {
      completeTest("manual");
      return;
    }

    const results = calculateResults();
    showScreen(dom.result);

    const finishedReason = state.completionReason === "time" ? "Waktu habis" : "Tes diselesaikan";
    dom.resultParticipant.textContent = `${state.participant} · ${finishedReason} pada ${formatDateTime(state.completedAt)}`;
    dom.scorePercent.textContent = `${results.percent}%`;
    dom.scoreFraction.textContent = `${results.correct} dari ${results.total} benar`;
    dom.correctCount.textContent = String(results.correct);
    dom.wrongCount.textContent = String(results.wrong);
    dom.unansweredCount.textContent = String(results.unanswered);
    dom.timeUsed.textContent = formatDuration(Math.max(0, state.completedAt - state.startedAt));
    dom.resultInterpretation.textContent = getInterpretation(results.percent);

    renderBreakdown(results);
    populateReviewFilters();
    renderReview(results);
    renderResumeState();
  }

  function renderBreakdown(results) {
    dom.competencyBreakdown.replaceChildren();

    COMPETENCIES.forEach((competency) => {
      const data = results.perCompetency[competency.key];
      const percent = data.total ? Math.round((data.correct / data.total) * 100) : 0;

      const row = document.createElement("div");
      row.className = "breakdown-item";

      const name = document.createElement("div");
      name.className = "breakdown-name";
      const strong = document.createElement("strong");
      strong.textContent = competency.label;
      const detail = document.createElement("span");
      detail.textContent = `${data.correct} benar · ${data.answered - data.correct} salah · ${data.total - data.answered} kosong`;
      name.append(strong, detail);

      const track = document.createElement("div");
      track.className = "breakdown-track";
      track.setAttribute("aria-label", `${competency.label}: ${percent} persen`);
      const fill = document.createElement("span");
      fill.style.width = `${percent}%`;
      track.append(fill);

      const score = document.createElement("div");
      score.className = "breakdown-score";
      score.textContent = `${percent}%`;

      row.append(name, track, score);
      dom.competencyBreakdown.append(row);
    });
  }

  function populateReviewFilters() {
    if (dom.reviewCompetencyFilter.options.length > 1) return;
    COMPETENCIES.forEach((competency) => {
      const option = document.createElement("option");
      option.value = competency.key;
      option.textContent = competency.label;
      dom.reviewCompetencyFilter.append(option);
    });
  }

  function getQuestionStatus(question) {
    const selected = state.answers[question.id];
    if (!Number.isInteger(selected)) return "unanswered";
    return selected === question.answer ? "correct" : "wrong";
  }

  function renderReview() {
    const statusFilter = dom.reviewStatusFilter.value;
    const competencyFilter = dom.reviewCompetencyFilter.value;

    const filtered = questions.filter((question) => {
      const status = getQuestionStatus(question);
      const statusMatch = statusFilter === "all"
        || status === statusFilter
        || (statusFilter === "wrong" && status === "unanswered");
      const competencyMatch = competencyFilter === "all" || question.competency === competencyFilter;
      return statusMatch && competencyMatch;
    });

    dom.reviewList.replaceChildren();

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Tidak ada jawaban yang sesuai dengan filter.";
      dom.reviewList.append(empty);
      return;
    }

    filtered.forEach((question) => {
      const selected = state.answers[question.id];
      const status = getQuestionStatus(question);
      const details = document.createElement("details");
      details.className = "review-item";

      const summary = document.createElement("summary");

      const statusBadge = document.createElement("span");
      statusBadge.className = `review-status ${status}`;
      statusBadge.textContent = status === "correct" ? "Benar" : status === "wrong" ? "Salah" : "Kosong";

      const number = document.createElement("span");
      number.className = "review-number";
      number.textContent = `#${question.id}`;

      const competency = document.createElement("span");
      competency.className = "review-competency";
      competency.textContent = question.competencyLabel;

      summary.append(statusBadge, number, competency);

      const body = document.createElement("div");
      body.className = "review-body";

      const scenario = document.createElement("p");
      scenario.className = "review-scenario";
      scenario.textContent = question.scenario;

      const prompt = document.createElement("p");
      prompt.className = "review-prompt";
      prompt.textContent = question.prompt;

      const answerBox = document.createElement("div");
      answerBox.className = "review-answer-box";

      const userAnswer = document.createElement("div");
      userAnswer.className = "review-answer";
      if (status === "wrong") userAnswer.classList.add("user-wrong");
      const userStrong = document.createElement("strong");
      userStrong.textContent = "Jawaban Anda: ";
      const userText = document.createElement("span");
      userText.textContent = Number.isInteger(selected)
        ? `${String.fromCharCode(65 + selected)}. ${question.options[selected]}`
        : "Tidak dijawab";
      userAnswer.append(userStrong, userText);

      const correctAnswer = document.createElement("div");
      correctAnswer.className = "review-answer correct-answer";
      const correctStrong = document.createElement("strong");
      correctStrong.textContent = "Jawaban terbaik: ";
      const correctText = document.createElement("span");
      correctText.textContent = `${String.fromCharCode(65 + question.answer)}. ${question.options[question.answer]}`;
      correctAnswer.append(correctStrong, correctText);

      answerBox.append(userAnswer, correctAnswer);

      const analysis = document.createElement("div");
      analysis.className = "analysis-box";
      const analysisTitle = document.createElement("strong");
      analysisTitle.textContent = "Analisis";
      const analysisText = document.createElement("p");
      analysisText.textContent = question.analysis;
      analysis.append(analysisTitle, analysisText);

      body.append(scenario, prompt, answerBox, analysis);
      details.append(summary, body);
      dom.reviewList.append(details);
    });
  }

  function restartTest() {
    const confirmed = window.confirm("Hasil tersimpan akan dihapus dan tes baru dimulai. Lanjutkan?");
    if (!confirmed) return;
    clearState();
    dom.readinessCheck.checked = true;
    dom.startButton.disabled = false;
    state = createTestState();
    saveState();
    startQuiz();
  }

  function updateNetworkStatus() {
    const online = navigator.onLine;
    dom.networkBadge.textContent = online ? "Daring" : "Luring";
    dom.networkBadge.classList.toggle("online", online);
    dom.networkBadge.classList.toggle("offline", !online);
  }

  function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      dom.installButton.hidden = false;
    });

    dom.installButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      dom.installButton.hidden = true;
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      dom.installButton.hidden = true;
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch((error) => {
          console.warn("Service worker gagal didaftarkan.", error);
        });
      });
    }
  }

  function handleKeyboard(event) {
    if (dom.quiz.hidden || !state || state.completedAt) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return;

    const key = event.key.toUpperCase();
    if (["A", "B", "C", "D", "E"].includes(key)) {
      const optionIndex = key.charCodeAt(0) - 65;
      selectAnswer(currentQuestion().id, optionIndex);
      renderQuestion();
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      moveQuestion(1);
      event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      moveQuestion(-1);
      event.preventDefault();
    }
  }

  function bindEvents() {
    dom.readinessCheck.addEventListener("change", () => {
      dom.startButton.disabled = !dom.readinessCheck.checked;
    });

    dom.startButton.addEventListener("click", startNewTest);
    dom.resumeButton.addEventListener("click", resumeTest);
    dom.previousButton.addEventListener("click", () => moveQuestion(-1));
    dom.nextButton.addEventListener("click", () => moveQuestion(1));
    dom.flagButton.addEventListener("click", toggleFlag);
    dom.finishButton.addEventListener("click", openFinishDialog);

    dom.finishDialog.addEventListener("close", () => {
      if (dom.finishDialog.returnValue === "confirm") {
        completeTest("manual");
      }
    });

    dom.toggleNavigator.addEventListener("click", () => {
      const collapsed = dom.navigatorCard.classList.toggle("collapsed");
      dom.toggleNavigator.textContent = collapsed ? "Tampilkan" : "Sembunyikan";
      dom.toggleNavigator.setAttribute("aria-expanded", String(!collapsed));
    });

    dom.reviewStatusFilter.addEventListener("change", renderReview);
    dom.reviewCompetencyFilter.addEventListener("change", renderReview);
    dom.printButton.addEventListener("click", () => window.print());
    dom.restartButton.addEventListener("click", restartTest);

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);
    window.addEventListener("keydown", handleKeyboard);

    window.addEventListener("beforeunload", (event) => {
      if (state && !state.completedAt) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  }

  function initialize() {
    renderCompetencyCards();
    bindEvents();
    renderResumeState();
    updateNetworkStatus();
    setupInstallPrompt();
    registerServiceWorker();

    const saved = safeLoadState();
    if (saved?.completedAt) {
      state = saved;
    }
  }

  initialize();
})();
