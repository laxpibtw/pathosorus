/**
 * PATHOTRAINER LAB - MOTEUR COMPLET AVEC RÉPÉTITION ESPACÉE & BOÎTES PAR ORGANE DANS LA BANQUE
 */

const STORAGE_KEY_QUESTIONS = "pathotrainer_custom_questions_v3";
const STORAGE_KEY_CASES = "pathotrainer_custom_cases_v3";
const STORAGE_KEY_TAGS = "pathotrainer_custom_tags_v3";
const STORAGE_KEY_STATS = "pathotrainer_custom_stats_v3";

let state = {
  questions: [],
  cases: [],
  customTags: [],
  stats: {
    xp: 0,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalAnswered: 0,
    totalCorrect: 0
  },
  playHierarchy: {
    selectedOrgan: null,
    selectedCategory: null,
    selectedEntity: null
  },
  currentSession: null,
  currentDPSession: null,
  creatorMode: 'simple',
  editorUploadedImages: [],
  editorSelectedTags: new Set(),
  dpSteps: [],
  bankCollapsedOrgans: new Set() // Ensemble des boîtes d'organes repliées
};

// --- SYNTHÈSE SONORE ---
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJsString(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
function playSound(type) {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.14);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function isQuestionDue(q) {
  if (q.mastered) return false;
  if (!q.stats || !q.stats.nextReviewDate) return true;
  if (q.flagged) return true;
  return q.stats.nextReviewDate <= getTodayString();
}

// --- INITIALISATION ---
function initApp() {
  const storedQ = localStorage.getItem(STORAGE_KEY_QUESTIONS);
  state.questions = storedQ ? JSON.parse(storedQ) : [];
  state.questions.forEach(q => {
    if (typeof q.mastered === 'undefined') q.mastered = false;
    if (!q.stats) q.stats = { seen: 0, correct: 0, consecutiveCorrect: 0, lastReviewed: null, nextReviewDate: null, intervalDays: 0 };
  });

  const storedCases = localStorage.getItem(STORAGE_KEY_CASES);
  state.cases = storedCases ? JSON.parse(storedCases) : [];

  const storedTags = localStorage.getItem(STORAGE_KEY_TAGS);
  state.customTags = storedTags ? JSON.parse(storedTags) : ["HES", "IHC", "BiologieMoléculaire", "PiègeClone"];
  if (!storedTags) saveCustomTags();

  const storedStats = localStorage.getItem(STORAGE_KEY_STATS);
  if (storedStats) state.stats = Object.assign(state.stats, JSON.parse(storedStats));

  updateTopBar();
  renderHierarchySelector();
  renderTagsCloud();
  renderDPCardsOnPlay();
  renderSpacedRepetitionDashboard();
  renderBank();

  if (window.lucide) lucide.createIcons();
}

function saveQuestions() {
  localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(state.questions));
  updateTopBar();
  renderHierarchySelector();
  renderTagsCloud();
  renderSpacedRepetitionDashboard();
  renderBank();
  updateEditorDatalists();
}

function saveCases() {
  localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(state.cases));
  updateTopBar();
  renderDPCardsOnPlay();
  renderBank();
  updateEditorDatalists();
}

function saveCustomTags() {
  localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(state.customTags));
  renderTagsCloud();
  renderEditorTagsSelector();
  renderDPTagsSelector();
}

function saveStats() {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(state.stats));
  updateTopBar();
}

function updateTopBar() {
  document.getElementById('top-streak').textContent = state.stats.streak;
  document.getElementById('top-xp').textContent = state.stats.xp;
  const totalCount = state.questions.length + state.cases.length;
  document.getElementById('badge-bank-count').textContent = totalCount;
}

// --- ONGLETS ---
function switchTab(viewId) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.remove('bg-teal-600', 'text-white', 'shadow-sm', 'shadow-teal-500/20');
    btn.classList.add('text-slate-300', 'hover:bg-slate-800');
  });

  const activeBtn = document.getElementById('nav-btn-' + viewId);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-300', 'hover:bg-slate-800');
    activeBtn.classList.add('bg-teal-600', 'text-white', 'shadow-sm', 'shadow-teal-500/20');
  }

  const targetView = document.getElementById('view-' + viewId);
  if (targetView) targetView.classList.remove('hidden');

  if (viewId === 'play') {
    renderHierarchySelector();
    renderTagsCloud();
    renderDPCardsOnPlay();
    renderSpacedRepetitionDashboard();
  } else if (viewId === 'bank') {
    renderBank();
  } else if (viewId === 'create') {
    setCreatorMode(state.creatorMode);
  }

  if (window.lucide) lucide.createIcons();
}

// --- DASHBOARD DE RÉPÉTITION ESPACÉE ---
function renderSpacedRepetitionDashboard() {
  const activeQuestions = state.questions.filter(q => !q.mastered);
  const dueQuestions = activeQuestions.filter(q => isQuestionDue(q));
  const masteredCount = state.questions.filter(q => q.mastered).length;

  const dueBadge = document.getElementById('stat-due-today-count');
  if (dueBadge) dueBadge.textContent = dueQuestions.length;

  const activeBadge = document.getElementById('stat-active-count');
  if (activeBadge) activeBadge.textContent = activeQuestions.length;

  const masteredBadge = document.getElementById('stat-mastered-count');
  if (masteredBadge) masteredBadge.textContent = masteredCount;

  const btnStartDue = document.getElementById('btn-play-due-today');
  if (btnStartDue) {
    btnStartDue.disabled = dueQuestions.length === 0;
    const label = document.getElementById('label-due-today');
    if (label) {
      label.textContent = dueQuestions.length > 0 
        ? `Lancer la session du jour (${dueQuestions.length} à revoir)` 
        : `Aucune carte échue aujourd'hui 🎉`;
    }
  }

  const btnMastered = document.getElementById('btn-play-mastered');
  if (btnMastered) {
    btnMastered.disabled = masteredCount === 0;
    const labelM = document.getElementById('label-mastered-count');
    if (labelM) labelM.textContent = `Tester mes maîtrisées (${masteredCount})`;
  }
}

function startSpacedRepetitionDueSession() {
  const pool = state.questions.filter(q => isQuestionDue(q));
  if (pool.length === 0) {
    alert("Toutes vos révisions espacées sont à jour pour aujourd'hui !");
    return;
  }
  launchQuizSession(pool, `Session du Jour (${pool.length} cartes dues) 🔁`);
}

function startMasteredReviewSession() {
  const pool = state.questions.filter(q => q.mastered);
  if (pool.length === 0) {
    alert("Aucune question neutralisée pour le moment.");
    return;
  }
  launchQuizSession(pool, "Vérification des Questions Maîtrisées (Neutralisées) 🎓");
}

function toggleQuestionMastered(id) {
  const q = state.questions.find(item => item.id === id);
  if (!q) return;

  q.mastered = !q.mastered;
  saveQuestions();

  if (state.currentSession) {
    const curQ = state.currentSession.questions[state.currentSession.currentIndex];
    if (curQ && curQ.id === id) {
      curQ.mastered = q.mastered;
      updateSessionMasteredButton(q.mastered);
    }
  }

  renderBank();
  renderSpacedRepetitionDashboard();
}

function chooseReviewInterval(days) {
  const session = state.currentSession;
  if (!session) return;
  const q = session.questions[session.currentIndex];

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  const nextDateStr = targetDate.toISOString().split('T')[0];

  if (!q.stats) q.stats = { seen: 0, correct: 0, consecutiveCorrect: 0 };
  q.stats.intervalDays = days;
  q.stats.nextReviewDate = nextDateStr;
  q.stats.lastReviewed = new Date().toISOString();

  if (days === 0) {
    q.flagged = true;
  } else {
    q.flagged = false;
  }

  const globalQ = state.questions.find(item => item.id === q.id);
  if (globalQ) {
    globalQ.stats = q.stats;
    globalQ.flagged = q.flagged;
  }

  saveQuestions();
  playSound('correct');
  nextSessionQuestion();
}

// --- CLASSIFICATION 3 NIVEAUX ---
function getHierarchyTree(includeMastered = false) {
  const tree = {};
  const activeQuestions = state.questions.filter(q => includeMastered || !q.mastered);
  const allItems = [...activeQuestions, ...state.cases];

  allItems.forEach(q => {
    const organ = q.organ || "Autre";
    const category = q.category || "Général";
    const entity = q.entity || "Non spécifié";

    if (!tree[organ]) tree[organ] = { count: 0, categories: {} };
    tree[organ].count += 1;

    if (!tree[organ].categories[category]) tree[organ].categories[category] = { count: 0, entities: {} };
    tree[organ].categories[category].count += 1;

    if (!tree[organ].categories[category].entities[entity]) tree[organ].categories[category].entities[entity] = 0;
    tree[organ].categories[category].entities[entity] += 1;
  });
  return tree;
}

function renderHierarchySelector() {
  const container = document.getElementById('hierarchy-selector-container');
  if (!container) return;

  const tree = getHierarchyTree(false);
  const organs = Object.keys(tree).sort();

  if (organs.length === 0) {
    const totalQ = state.questions.length;
    const masteredQ = state.questions.filter(q => q.mastered).length;

    if (totalQ > 0 && masteredQ === totalQ) {
      container.innerHTML = `
        <div class="p-6 text-center bg-emerald-500/10 rounded-xl border border-emerald-500/30">
          <i data-lucide="award" class="w-8 h-8 mx-auto mb-2 text-emerald-400"></i>
          <h4 class="text-sm font-bold text-emerald-300">Toutes vos questions sont actuellement maîtrisées ! 🎉</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Vous avez neutralisé l'ensemble de votre banque. Vous pouvez les tester à nouveau via l'espace "Questions Maîtrisées" ci-dessus ou en réactiver depuis Ma Banque.
          </p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800">
          <i data-lucide="layers" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
          <h4 class="text-sm font-bold text-slate-300">Votre classification est prête</h4>
          <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Créez vos questions en renseignant votre <strong>Organe</strong> (ex: Sein), votre <strong>Catégorie</strong> (ex: Tumeurs épithéliales) et votre <strong>Lésion</strong> (ex: Carcinome lobulaire).
          </p>
          <button onclick="switchTab('create')" class="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 transition">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Créer du contenu</span>
          </button>
        </div>
      `;
    }
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (state.playHierarchy.selectedOrgan && !tree[state.playHierarchy.selectedOrgan]) {
    state.playHierarchy.selectedOrgan = null;
    state.playHierarchy.selectedCategory = null;
    state.playHierarchy.selectedEntity = null;
  }

  let html = `<div class="space-y-4">`;

  // Niveau 1
  html += `
    <div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span class="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-mono">1</span>
          <span>Choisissez l'Organe :</span>
        </span>
        ${state.playHierarchy.selectedOrgan ? `
          <button onclick="startHierarchySession('organ', '${escapeJsString(state.playHierarchy.selectedOrgan)}')" class="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center space-x-1 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 transition">
            <i data-lucide="play" class="w-3.5 h-3.5"></i>
            <span>Tester tout "${escapeHtml(state.playHierarchy.selectedOrgan)}" (${tree[state.playHierarchy.selectedOrgan].count}Q actives)</span>
          </button>
        ` : ''}
      </div>
      <div class="flex flex-wrap gap-2">
  `;

  organs.forEach(org => {
    const isSelected = (state.playHierarchy.selectedOrgan === org);
    const count = tree[org].count;
    html += `
      <button onclick="selectOrganForPlay('${escapeJsString(org)}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
        isSelected 
          ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30 border border-teal-400' 
          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
      }">
        <span>${escapeHtml(org)}</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-teal-700 text-white' : 'bg-slate-800 text-slate-400'}">${count}</span>
      </button>
    `;
  });
  html += `</div></div>`;

  // Niveau 2
  if (state.playHierarchy.selectedOrgan) {
    const orgObj = tree[state.playHierarchy.selectedOrgan];
    const categories = Object.keys(orgObj.categories).sort();

    html += `
      <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <span class="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-mono">2</span>
            <span>Catégorie dans <em>${escapeHtml(state.playHierarchy.selectedOrgan)}</em> :</span>
          </span>
          ${state.playHierarchy.selectedCategory ? `
            <button onclick="startHierarchySession('category', '${escapeJsString(state.playHierarchy.selectedOrgan)}', '${escapeJsString(state.playHierarchy.selectedCategory)}')" class="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 transition">
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
              <span>Tester "${escapeHtml(state.playHierarchy.selectedCategory)}" (${orgObj.categories[state.playHierarchy.selectedCategory].count}Q)</span>
            </button>
          ` : ''}
        </div>
        <div class="flex flex-wrap gap-2">
    `;

    categories.forEach(cat => {
      const isSelected = (state.playHierarchy.selectedCategory === cat);
      const count = orgObj.categories[cat].count;
      html += `
        <button onclick="selectCategoryForPlay('${escapeJsString(cat)}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
          isSelected 
            ? 'bg-sky-600 text-white shadow-md shadow-sky-500/30 border border-sky-400' 
            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
        }">
          <span>${escapeHtml(cat)}</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-400'}">${count}</span>
        </button>
      `;
    });
    html += `</div>`;

    // Niveau 3
    if (state.playHierarchy.selectedCategory) {
      const catObj = orgObj.categories[state.playHierarchy.selectedCategory];
      const entities = Object.keys(catObj.entities).sort();

      html += `
        <div class="pt-3 border-t border-slate-800/80 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <span class="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-mono">3</span>
              <span>Lésion précise dans <em>${escapeHtml(state.playHierarchy.selectedCategory)}</em> :</span>
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
      `;

      entities.forEach(ent => {
        const count = catObj.entities[ent];
        html += `
          <button onclick="startHierarchySession('entity', '${escapeJsString(state.playHierarchy.selectedOrgan)}', '${escapeJsString(state.playHierarchy.selectedCategory)}', '${escapeJsString(ent)}')" class="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center space-x-2 transition group shadow-sm">
            <i data-lucide="play" class="w-3.5 h-3.5 text-indigo-400 group-hover:text-white"></i>
            <span>${escapeHtml(ent)}</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-indigo-300 group-hover:bg-indigo-700 group-hover:text-white">${count}Q</span>
          </button>
        `;
      });
      html += `</div></div>`;
    }

    html += `</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function selectOrganForPlay(organ) {
  state.playHierarchy.selectedOrgan = organ;
  state.playHierarchy.selectedCategory = null;
  state.playHierarchy.selectedEntity = null;
  renderHierarchySelector();
}

function selectCategoryForPlay(cat) {
  state.playHierarchy.selectedCategory = cat;
  state.playHierarchy.selectedEntity = null;
  renderHierarchySelector();
}

function startHierarchySession(level, organ, category, entity) {
  let pool = [];
  const activeQuestions = state.questions.filter(q => !q.mastered);

  if (level === 'organ') pool = activeQuestions.filter(q => q.organ === organ);
  else if (level === 'category') pool = activeQuestions.filter(q => q.organ === organ && q.category === category);
  else if (level === 'entity') pool = activeQuestions.filter(q => q.organ === organ && q.category === category && q.entity === entity);

  if (pool.length === 0) {
    alert("Aucune question active (non maîtrisée) pour cette sélection.");
    return;
  }
  launchQuizSession(pool, `Session : ${entity || category || organ}`);
}

// --- SESSIONS DE QUIZ SIMPLE ---
function launchQuizSession(pool, title) {
  state.currentSession = {
    title: title,
    questions: [...pool].sort(() => 0.5 - Math.random()),
    currentIndex: 0,
    score: 0,
    xpEarned: 0,
    selectedAnswers: new Set(),
    isAnswered: false
  };

  switchTab('session');
  renderSessionQuestion();
}

function startGlobalSprint() {
  const activeQuestions = state.questions.filter(q => !q.mastered);
  if (activeQuestions.length === 0) {
    alert("Toutes vos questions sont maîtrisées ou votre banque est vide.");
    return;
  }
  const pool = [...activeQuestions].sort(() => 0.5 - Math.random()).slice(0, 10);
  launchQuizSession(pool, "Sprint Quotidien (Questions Actives)");
}

function renderSessionQuestion() {
  const session = state.currentSession;
  if (!session) return;
  const q = session.questions[session.currentIndex];
  session.selectedAnswers.clear();
  session.isAnswered = false;

  const total = session.questions.length;
  const curNum = session.currentIndex + 1;
  document.getElementById('session-progress-text').textContent = `Question ${curNum} / ${total}`;
  document.getElementById('session-progress-bar').style.width = `${(curNum / total) * 100}%`;

  document.getElementById('session-breadcrumb').textContent = `${q.organ} > ${q.category} > ${q.entity}`;

  const isQCM = (q.format === 'qcm');
  const formatBadge = document.getElementById('session-format-badge');
  formatBadge.textContent = isQCM ? "☑️ QCM (Choix Multiples)" : (q.format === 'piege' ? "⚠️ Vrai / Faux" : "🔘 QCU (Choix Unique)");
  formatBadge.className = isQCM ? "text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20";

  const tagsBox = document.getElementById('session-tags-box');
  tagsBox.innerHTML = '';
  (q.tags || []).forEach(t => {
    const chip = document.createElement('span');
    chip.className = "text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300";
    chip.textContent = `#${t}`;
    tagsBox.appendChild(chip);
  });

  const flagBtn = document.getElementById('btn-session-flag');
  flagBtn.className = q.flagged ? "text-amber-400 p-1.5 rounded-lg bg-slate-800" : "text-slate-400 hover:text-amber-400 p-1.5 rounded-lg";

  document.getElementById('session-question-text').textContent = q.question;
  const ctxBox = document.getElementById('session-context-box');
  if (q.context && q.context.trim()) {
    ctxBox.textContent = q.context;
    ctxBox.classList.remove('hidden');
  } else {
    ctxBox.classList.add('hidden');
  }

  const imgContainer = document.getElementById('session-images-container');
  imgContainer.innerHTML = '';
  if (q.images && q.images.length > 0) {
    imgContainer.classList.remove('hidden');
    q.images.forEach((imgObj, idx) => {
      const card = document.createElement('div');
      card.className = "relative rounded-xl overflow-hidden border border-slate-700 bg-black cursor-zoom-in group max-h-60 flex flex-col justify-end";
      card.onclick = () => openLightbox(imgObj.url, imgObj.caption || `Cliché ${idx + 1}`);
      card.innerHTML = `
        <img src="${imgObj.url}" alt="Coupe" class="max-h-60 w-full object-contain">
        <div class="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur p-2 text-white text-[11px] font-medium flex items-center justify-between border-t border-slate-800">
          <span class="truncate">${imgObj.caption || 'Agrandir la coupe'}</span>
          <i data-lucide="zoom-in" class="w-3.5 h-3.5 text-teal-400"></i>
        </div>
      `;
      imgContainer.appendChild(card);
    });
  } else {
    imgContainer.classList.add('hidden');
  }

  // Options
  const optionsBox = document.getElementById('session-options-container');
  optionsBox.innerHTML = '';
  q.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.id = 'opt-btn-' + idx;
    btn.className = "w-full text-left p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/50 transition flex items-center justify-between text-sm text-slate-200 group";
    btn.onclick = () => {
      if (isQCM) toggleQCMSelection(idx);
      else selectSingleOption(idx);
    };

    const letter = String.fromCharCode(65 + idx);
    const shape = isQCM ? "rounded-md" : "rounded-lg";

    btn.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="opt-box w-7 h-7 ${shape} bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-teal-400 transition">${letter}</span>
        <span class="font-medium">${optText}</span>
      </div>
      <div class="opt-status w-5 h-5 flex items-center justify-center"></div>
    `;
    optionsBox.appendChild(btn);
  });

  const valBtn = document.getElementById('btn-session-validate-qcm');
  if (isQCM) {
    valBtn.classList.remove('hidden');
    valBtn.disabled = true;
    valBtn.textContent = "Valider ma sélection (0 cochée)";
  } else {
    valBtn.classList.add('hidden');
  }

  document.getElementById('session-feedback-box').classList.add('hidden');
  updateSessionMasteredButton(q.mastered);

  if (window.lucide) lucide.createIcons();
}

function updateSessionMasteredButton(isMastered) {
  const btn = document.getElementById('btn-session-toggle-mastered');
  if (!btn) return;
  if (isMastered) {
    btn.className = "px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm shadow-emerald-500/30";
    btn.innerHTML = `<i data-lucide="check-check" class="w-4 h-4"></i><span>Maîtrisée (Neutralisée)</span>`;
  } else {
    btn.className = "px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 font-bold text-xs flex items-center space-x-1.5 transition";
    btn.innerHTML = `<i data-lucide="award" class="w-4 h-4"></i><span>Neutraliser (Marquer Maîtrisée)</span>`;
  }
  if (window.lucide) lucide.createIcons();
}

function toggleCurrentSessionQuestionMastered() {
  const session = state.currentSession;
  if (!session) return;
  const q = session.questions[session.currentIndex];
  toggleQuestionMastered(q.id);
}

function toggleQCMSelection(idx) {
  const session = state.currentSession;
  if (!session || session.isAnswered) return;

  const btn = document.getElementById('opt-btn-' + idx);
  if (session.selectedAnswers.has(idx)) {
    session.selectedAnswers.delete(idx);
    btn.classList.remove('border-teal-500', 'bg-teal-500/10');
    btn.querySelector('.opt-box').classList.remove('bg-teal-600', 'text-white', 'border-teal-500');
  } else {
    session.selectedAnswers.add(idx);
    btn.classList.add('border-teal-500', 'bg-teal-500/10');
    btn.querySelector('.opt-box').classList.add('bg-teal-600', 'text-white', 'border-teal-500');
  }

  const valBtn = document.getElementById('btn-session-validate-qcm');
  const count = session.selectedAnswers.size;
  valBtn.disabled = count === 0;
  valBtn.textContent = `Valider ma sélection (${count} cochée${count > 1 ? 's' : ''})`;
}

function validateQCMAnswer() {
  const session = state.currentSession;
  if (!session || session.isAnswered) return;
  evaluateSessionAnswer(Array.from(session.selectedAnswers));
}

function selectSingleOption(idx) {
  const session = state.currentSession;
  if (!session || session.isAnswered) return;
  evaluateSessionAnswer([idx]);
}

function evaluateSessionAnswer(selectedIndices) {
  const session = state.currentSession;
  if (!session || session.isAnswered) return;
  session.isAnswered = true;

  const q = session.questions[session.currentIndex];
  const correctIndices = Array.isArray(q.correct) ? q.correct : [q.correct];

  const selSet = new Set(selectedIndices);
  const corSet = new Set(correctIndices);
  const isExact = (selSet.size === corSet.size) && [...selSet].every(x => corSet.has(x));

  if (!q.stats) q.stats = { seen: 0, correct: 0, consecutiveCorrect: 0 };
  q.stats.seen += 1;
  q.stats.lastReviewed = new Date().toISOString();
  state.stats.totalAnswered += 1;

  if (isExact) {
    q.stats.correct += 1;
    q.stats.consecutiveCorrect = (q.stats.consecutiveCorrect || 0) + 1;
    state.stats.totalCorrect += 1;
    session.score += 1;
    session.xpEarned += 15;
    state.stats.xp += 15;
    playSound('correct');
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  } else {
    q.stats.consecutiveCorrect = 0;
    q.flagged = true;
    playSound('wrong');
  }

  const globalQ = state.questions.find(item => item.id === q.id);
  if (globalQ) {
    globalQ.stats = q.stats;
    globalQ.flagged = q.flagged;
  }

  saveQuestions();
  saveStats();

  q.options.forEach((_, idx) => {
    const btn = document.getElementById('opt-btn-' + idx);
    if (!btn) return;
    btn.disabled = true;

    const isTrue = corSet.has(idx);
    const wasSel = selSet.has(idx);

    if (isTrue && wasSel) {
      btn.className = "w-full text-left p-4 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-200 flex items-center justify-between text-sm";
      btn.querySelector('.opt-status').innerHTML = '<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i>';
    } else if (isTrue && !wasSel) {
      btn.className = "w-full text-left p-4 rounded-xl border border-emerald-500/60 bg-emerald-500/5 text-emerald-300 flex items-center justify-between text-sm";
      btn.querySelector('.opt-status').innerHTML = '<span class="text-[10px] font-bold text-emerald-400">[Réponse attendue]</span>';
    } else if (!isTrue && wasSel) {
      btn.className = "w-full text-left p-4 rounded-xl border border-rose-500 bg-rose-500/10 text-rose-200 flex items-center justify-between text-sm";
      btn.querySelector('.opt-status').innerHTML = '<i data-lucide="x-circle" class="w-5 h-5 text-rose-400"></i>';
    } else {
      btn.classList.add('opacity-40');
    }
  });

  document.getElementById('btn-session-validate-qcm').classList.add('hidden');

  const fbBox = document.getElementById('session-feedback-box');
  const banner = document.getElementById('session-feedback-banner');
  banner.className = isExact ? "p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300";
  document.getElementById('session-feedback-title').textContent = isExact ? "Exact ! Analyse diagnostique parfaite." : "Erreur diagnostique !";
  document.getElementById('session-feedback-text').textContent = q.explanation;
  document.getElementById('session-trap-text').textContent = q.trap || "Aucun piège spécifique renseigné.";

  const streakText = document.getElementById('session-stat-streak');
  if (streakText) {
    streakText.textContent = `Réussite consécutive : ${q.stats.consecutiveCorrect} fois`;
  }

  fbBox.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function nextSessionQuestion() {
  const session = state.currentSession;
  if (!session) return;

  session.currentIndex += 1;
  if (session.currentIndex < session.questions.length) {
    renderSessionQuestion();
  } else {
    alert(`Session terminée !\nScore : ${session.score} / ${session.questions.length} (+${session.xpEarned} XP)`);
    switchTab('play');
  }
}

function toggleSessionFlag() {
  const session = state.currentSession;
  if (!session) return;
  const q = session.questions[session.currentIndex];
  q.flagged = !q.flagged;
  saveQuestions();
  document.getElementById('btn-session-flag').className = q.flagged ? "text-amber-400 p-1.5 rounded-lg bg-slate-800" : "text-slate-400 hover:text-amber-400 p-1.5 rounded-lg";
}

// --- FORMULAIRE CRÉATEUR QUESTION SIMPLE ---
function resetQuestionForm() {
  document.getElementById('form-create-question').reset();
  document.getElementById('form-q-edit-id').value = "";
  document.getElementById('form-q-format').value = "qcm";
  state.editorUploadedImages = [];
  state.editorSelectedTags.clear();
  renderEditorUploadedImages();
  renderEditorTagsSelector();
  updateEditorDatalists();
  onFormatChange();
}

function updateEditorDatalists() {
  const organDatalist = document.getElementById('datalist-organs');
  const categoryDatalist = document.getElementById('datalist-categories');
  const entityDatalist = document.getElementById('datalist-entities');

  const tree = getHierarchyTree(true);
  const organs = Object.keys(tree);
  const categories = new Set();
  const entities = new Set();

  [...state.questions, ...state.cases].forEach(q => {
    if (q.category) categories.add(q.category);
    if (q.entity) entities.add(q.entity);
  });

  if (organDatalist) organDatalist.innerHTML = organs.map(o => `<option value="${o}">`).join('');
  if (categoryDatalist) categoryDatalist.innerHTML = Array.from(categories).map(c => `<option value="${c}">`).join('');
  if (entityDatalist) entityDatalist.innerHTML = Array.from(entities).map(e => `<option value="${e}">`).join('');
}

function renderEditorTagsSelector() {
  const container = document.getElementById('editor-tags-pills');
  if (!container) return;
  container.innerHTML = '';

  state.customTags.forEach(tag => {
    const isSelected = state.editorSelectedTags.has(tag);
    const chip = document.createElement('button');
    chip.type = "button";
    chip.onclick = () => {
      if (state.editorSelectedTags.has(tag)) state.editorSelectedTags.delete(tag);
      else state.editorSelectedTags.add(tag);
      renderEditorTagsSelector();
    };
    chip.className = `px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
      isSelected ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
    }`;
    chip.textContent = `#${tag}`;
    container.appendChild(chip);
  });
}

function handleAddCustomTagFromInput() {
  const input = document.getElementById('form-new-tag-input');
  const val = input.value.trim().replace(/^#/, '');
  if (val) {
    createNewGlobalTag(val);
    state.editorSelectedTags.add(val);
    renderEditorTagsSelector();
    input.value = '';
  }
}

function onFormatChange() {
  const format = document.getElementById('form-q-format').value;
  const isQCM = (format === 'qcm');
  const isPiege = (format === 'piege');

  document.getElementById('form-mcq-wrapper').classList.toggle('hidden', isPiege);
  document.getElementById('form-tf-wrapper').classList.toggle('hidden', !isPiege);

  if (!isPiege) {
    for (let i = 0; i < 4; i++) {
      const input = document.getElementById('form-opt-indicator-' + i);
      if (input) {
        input.type = isQCM ? 'checkbox' : 'radio';
        input.name = isQCM ? 'correct_qcm_choice' : 'correct_qcu_choice';
      }
    }
  }
}

function handleEditorImageUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(evt) {
      state.editorUploadedImages.push({
        url: evt.target.result,
        caption: file.name.replace(/\.[^/.]+$/, "")
      });
      renderEditorUploadedImages();
    };
    reader.readAsDataURL(file);
  });
}

function renderEditorUploadedImages() {
  const container = document.getElementById('editor-images-preview');
  container.innerHTML = '';
  if (state.editorUploadedImages.length === 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');

  state.editorUploadedImages.forEach((imgObj, idx) => {
    const card = document.createElement('div');
    card.className = "relative rounded-xl overflow-hidden border border-slate-700 bg-black flex flex-col p-2 space-y-2";
    card.innerHTML = `
      <img src="${imgObj.url}" alt="Aperçu" class="h-28 w-full object-contain rounded">
      <input type="text" value="${imgObj.caption}" oninput="state.editorUploadedImages[${idx}].caption = this.value" placeholder="Légende (ex: HES x40)" class="text-[11px] bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white">
      <button type="button" onclick="state.editorUploadedImages.splice(${idx}, 1); renderEditorUploadedImages();" class="text-[10px] text-rose-400 hover:text-rose-300 font-semibold text-center">Supprimer</button>
    `;
    container.appendChild(card);
  });
}

function handleSaveQuestionForm(e) {
  e.preventDefault();

  const editId = document.getElementById('form-q-edit-id').value;
  const format = document.getElementById('form-q-format').value;
  const organ = document.getElementById('form-q-organ').value.trim();
  const category = document.getElementById('form-q-category').value.trim();
  const entity = document.getElementById('form-q-entity').value.trim();
  const question = document.getElementById('form-q-text').value.trim();
  const context = document.getElementById('form-q-context').value.trim();
  const explanation = document.getElementById('form-q-explanation').value.trim();
  const trap = document.getElementById('form-q-trap').value.trim();
  const tags = Array.from(state.editorSelectedTags);

  let options = [];
  let correct = [];

  if (format === 'piege') {
    options = ["Vrai", "Faux"];
    const chosen = document.querySelector('input[name="form_tf_choice"]:checked');
    correct = [chosen && chosen.value === 'Faux' ? 1 : 0];
  } else if (format === 'qcm') {
    for (let i = 0; i < 4; i++) {
      options.push(document.getElementById('form-opt-text-' + i).value.trim());
      const chk = document.getElementById('form-opt-indicator-' + i);
      if (chk && chk.checked) correct.push(i);
    }
    if (correct.length === 0) {
      alert("En mode QCM, veuillez cocher au moins une bonne réponse.");
      return;
    }
  } else {
    for (let i = 0; i < 4; i++) {
      options.push(document.getElementById('form-opt-text-' + i).value.trim());
      const rad = document.getElementById('form-opt-indicator-' + i);
      if (rad && rad.checked) correct.push(i);
    }
  }

  if (editId) {
    const idx = state.questions.findIndex(q => q.id === editId);
    if (idx !== -1) {
      state.questions[idx] = {
        ...state.questions[idx],
        format, organ, category, entity, question, context, explanation, trap, tags, options, correct,
        images: [...state.editorUploadedImages]
      };
    }
  } else {
    const newQ = {
      id: "q_" + Date.now(),
      format, organ, category, entity, question, context, explanation, trap, tags, options, correct,
      images: [...state.editorUploadedImages],
      flagged: false,
      mastered: false,
      stats: { seen: 0, correct: 0, consecutiveCorrect: 0, lastReviewed: null, nextReviewDate: null, intervalDays: 0 }
    };
    state.questions.push(newQ);
  }

  saveQuestions();
  alert("Question enregistrée avec succès !");
  switchTab('bank');
}

function editQuestion(id) {
  const q = state.questions.find(item => item.id === id);
  if (!q) return;

  switchTab('create');
  setCreatorMode('simple');

  document.getElementById('form-q-edit-id').value = q.id;
  document.getElementById('form-q-format').value = q.format;
  document.getElementById('form-q-organ').value = q.organ;
  document.getElementById('form-q-category').value = q.category || '';
  document.getElementById('form-q-entity').value = q.entity || '';
  document.getElementById('form-q-text').value = q.question;
  document.getElementById('form-q-context').value = q.context || '';
  document.getElementById('form-q-explanation').value = q.explanation;
  document.getElementById('form-q-trap').value = q.trap || '';

  state.editorUploadedImages = q.images ? [...q.images] : [];
  state.editorSelectedTags = new Set(q.tags || []);
  renderEditorUploadedImages();
  renderEditorTagsSelector();
  onFormatChange();

  if (q.format === 'piege') {
    const isFaux = (q.correct[0] === 1);
    const radFaux = document.querySelector('input[name="form_tf_choice"][value="Faux"]');
    const radVrai = document.querySelector('input[name="form_tf_choice"][value="Vrai"]');
    if (isFaux && radFaux) radFaux.checked = true;
    else if (radVrai) radVrai.checked = true;
  } else {
    q.options.forEach((optText, idx) => {
      const input = document.getElementById('form-opt-text-' + idx);
      if (input) input.value = optText;
      const indicator = document.getElementById('form-opt-indicator-' + idx);
      if (indicator) indicator.checked = (q.correct || []).includes(idx);
    });
  }
}

function deleteQuestion(id) {
  if (!confirm("Voulez-vous supprimer cette question ?")) return;
  state.questions = state.questions.filter(q => q.id !== id);
  saveQuestions();
}

// =========================================================================
// --- CRÉATEUR DE DOSSIERS PROGRESSIFS (DP MULTI-ÉTAPES) ---
// =========================================================================
function setCreatorMode(mode) {
  state.creatorMode = mode;
  const btnSimple = document.getElementById('tab-creator-simple');
  const btnDP = document.getElementById('tab-creator-dp');
  const boxSimple = document.getElementById('creator-box-simple');
  const boxDP = document.getElementById('creator-box-dp');

  if (mode === 'simple') {
    btnSimple.className = "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 bg-teal-600 text-white shadow-sm";
    btnDP.className = "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 text-slate-400 hover:text-white";
    boxSimple.classList.remove('hidden');
    boxDP.classList.add('hidden');
    resetQuestionForm();
  } else {
    btnDP.className = "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 bg-indigo-600 text-white shadow-sm";
    btnSimple.className = "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 text-slate-400 hover:text-white";
    boxDP.classList.remove('hidden');
    boxSimple.classList.add('hidden');
    resetDPForm();
  }

  if (window.lucide) lucide.createIcons();
}

function resetDPForm() {
  document.getElementById('form-create-dp').reset();
  document.getElementById('form-dp-edit-id').value = "";
  state.editorSelectedTags.clear();
  renderDPTagsSelector();
  updateEditorDatalists();

  state.dpSteps = [
    createEmptyDPStep(1),
    createEmptyDPStep(2)
  ];
  renderDPStepsBuilder();
}

function createEmptyDPStep(stepNumber) {
  return {
    stepNumber: stepNumber,
    title: `Étape ${stepNumber}`,
    narrative: "",
    images: [],
    format: "qcm",
    question: "",
    options: ["", "", "", ""],
    correct: [0],
    explanation: "",
    trap: ""
  };
}

function renderDPTagsSelector() {
  const container = document.getElementById('dp-tags-pills');
  if (!container) return;
  container.innerHTML = '';

  state.customTags.forEach(tag => {
    const isSelected = state.editorSelectedTags.has(tag);
    const chip = document.createElement('button');
    chip.type = "button";
    chip.onclick = () => {
      if (state.editorSelectedTags.has(tag)) state.editorSelectedTags.delete(tag);
      else state.editorSelectedTags.add(tag);
      renderDPTagsSelector();
    };
    chip.className = `px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
      isSelected ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
    }`;
    chip.textContent = `#${tag}`;
    container.appendChild(chip);
  });
}

function handleAddCustomTagFromDPInput() {
  const input = document.getElementById('form-dp-new-tag-input');
  const val = input.value.trim().replace(/^#/, '');
  if (val) {
    createNewGlobalTag(val);
    state.editorSelectedTags.add(val);
    renderDPTagsSelector();
    input.value = '';
  }
}

function addStepToDP() {
  const newNum = state.dpSteps.length + 1;
  state.dpSteps.push(createEmptyDPStep(newNum));
  renderDPStepsBuilder();
}

function removeStepFromDP(index) {
  if (state.dpSteps.length <= 1) {
    alert("Un Dossier Progressif doit comporter au moins 1 étape.");
    return;
  }
  state.dpSteps.splice(index, 1);
  state.dpSteps.forEach((s, idx) => s.stepNumber = idx + 1);
  renderDPStepsBuilder();
}

function renderDPStepsBuilder() {
  const container = document.getElementById('dp-steps-builder-container');
  if (!container) return;
  container.innerHTML = '';

  state.dpSteps.forEach((step, sIdx) => {
    const isQCM = (step.format === 'qcm');
    const stepCard = document.createElement('div');
    stepCard.className = "bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md";

    stepCard.innerHTML = `
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <div class="flex items-center space-x-2">
          <span class="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">${step.stepNumber}</span>
          <h4 class="text-sm font-bold text-white">Étape ${step.stepNumber}</h4>
        </div>
        ${state.dpSteps.length > 1 ? `
          <button type="button" onclick="removeStepFromDP(${sIdx})" class="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-1">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Supprimer l'étape</span>
          </button>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 gap-3">
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Titre de l'étape *</label>
          <input type="text" value="${step.title || ''}" oninput="state.dpSteps[${sIdx}].title = this.value" placeholder="ex: Étape 1 : Présentation clinique & HES panoramique" required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Données cliniques & description microscopique *</label>
          <textarea rows="2" oninput="state.dpSteps[${sIdx}].narrative = this.value" placeholder="Détaillez ce qui est observé à ce stade du cas clinique..." required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans">${step.narrative || ''}</textarea>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-[11px] font-semibold text-slate-300">Coupes & Clichés pour l'Étape ${step.stepNumber}</label>
          <label class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition border border-slate-700">
            <i data-lucide="image-plus" class="w-3.5 h-3.5 text-indigo-400"></i>
            <span>Ajouter clichés</span>
            <input type="file" accept="image/*" multiple onchange="handleDPStepImageUpload(event, ${sIdx})" class="hidden">
          </label>
        </div>
        <div id="dp-step-images-preview-${sIdx}" class="grid grid-cols-2 sm:grid-cols-3 gap-2 ${step.images && step.images.length > 0 ? '' : 'hidden'}"></div>
      </div>

      <div class="pt-3 border-t border-slate-800/80 space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-[11px] font-semibold text-indigo-300">Question de l'étape *</label>
          <select onchange="state.dpSteps[${sIdx}].format = this.value; renderDPStepsBuilder();" class="py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-indigo-500">
            <option value="qcm" ${isQCM ? 'selected' : ''}>☑️ QCM (Choix Multiples - Défaut)</option>
            <option value="qcu" ${!isQCM ? 'selected' : ''}>🔘 QCU (Choix Unique)</option>
          </select>
        </div>
        <input type="text" value="${step.question || ''}" oninput="state.dpSteps[${sIdx}].question = this.value" placeholder="ex: Quels diagnostics différentiels évoquez-vous ?" required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">
      </div>

      <div class="space-y-2">
        <label class="block text-[11px] font-semibold text-slate-400">Propositions (Cochez la ou les bonnes réponses) :</label>
        ${[0, 1, 2, 3].map(optIdx => `
          <div class="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
            <input type="${isQCM ? 'checkbox' : 'radio'}" name="dp_step_${sIdx}_correct" ${step.correct.includes(optIdx) ? 'checked' : ''} onchange="handleDPStepCorrectChange(${sIdx}, ${optIdx}, this.checked, ${isQCM})" class="text-indigo-500 focus:ring-indigo-500 w-4 h-4">
            <input type="text" value="${step.options[optIdx] || ''}" oninput="state.dpSteps[${sIdx}].options[${optIdx}] = this.value" placeholder="Option ${String.fromCharCode(65 + optIdx)}" required class="flex-1 bg-transparent border-none text-xs text-white focus:outline-none">
          </div>
        `).join('')}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Explication de l'étape *</label>
          <textarea rows="2" oninput="state.dpSteps[${sIdx}].explanation = this.value" placeholder="Justifiez les réponses..." required class="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">${step.explanation || ''}</textarea>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-amber-400 mb-1">Piège diagnostique de l'étape *</label>
          <textarea rows="2" oninput="state.dpSteps[${sIdx}].trap = this.value" placeholder="Piège ou fausse piste..." required class="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-500">${step.trap || ''}</textarea>
        </div>
      </div>
    `;

    container.appendChild(stepCard);
    renderDPStepImagesPreview(sIdx);
  });

  if (window.lucide) lucide.createIcons();
}

function handleDPStepCorrectChange(stepIdx, optIdx, isChecked, isQCM) {
  const step = state.dpSteps[stepIdx];
  if (isQCM) {
    if (isChecked && !step.correct.includes(optIdx)) step.correct.push(optIdx);
    else if (!isChecked) step.correct = step.correct.filter(x => x !== optIdx);
  } else {
    step.correct = [optIdx];
  }
}

function handleDPStepImageUpload(e, stepIdx) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(evt) {
      if (!state.dpSteps[stepIdx].images) state.dpSteps[stepIdx].images = [];
      state.dpSteps[stepIdx].images.push({
        url: evt.target.result,
        caption: file.name.replace(/\.[^/.]+$/, "")
      });
      renderDPStepImagesPreview(stepIdx);
    };
    reader.readAsDataURL(file);
  });
}

function renderDPStepImagesPreview(stepIdx) {
  const container = document.getElementById(`dp-step-images-preview-${stepIdx}`);
  if (!container) return;
  const step = state.dpSteps[stepIdx];
  container.innerHTML = '';

  if (!step.images || step.images.length === 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');

  step.images.forEach((imgObj, iIdx) => {
    const card = document.createElement('div');
    card.className = "relative rounded-xl overflow-hidden border border-slate-700 bg-black flex flex-col p-2 space-y-1";
    card.innerHTML = `
      <img src="${imgObj.url}" alt="Aperçu" class="h-24 w-full object-contain rounded">
      <input type="text" value="${imgObj.caption}" oninput="state.dpSteps[${stepIdx}].images[${iIdx}].caption = this.value" placeholder="Légende" class="text-[10px] bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white">
      <button type="button" onclick="state.dpSteps[${stepIdx}].images.splice(${iIdx}, 1); renderDPStepImagesPreview(${stepIdx});" class="text-[9px] text-rose-400 hover:text-rose-300 font-semibold text-center">Supprimer</button>
    `;
    container.appendChild(card);
  });
}

function handleSaveDPForm(e) {
  e.preventDefault();

  const editId = document.getElementById('form-dp-edit-id').value;
  const title = document.getElementById('form-dp-title').value.trim();
  const organ = document.getElementById('form-dp-organ').value.trim();
  const category = document.getElementById('form-dp-category').value.trim();
  const entity = document.getElementById('form-dp-entity').value.trim();
  const synopsis = document.getElementById('form-dp-synopsis').value.trim();
  const tags = Array.from(state.editorSelectedTags);

  for (let i = 0; i < state.dpSteps.length; i++) {
    const s = state.dpSteps[i];
    if (s.correct.length === 0) {
      alert(`À l'étape ${i + 1}, veuillez cocher au moins une bonne réponse.`);
      return;
    }
  }

  if (editId) {
    const idx = state.cases.findIndex(c => c.id === editId);
    if (idx !== -1) {
      state.cases[idx] = {
        ...state.cases[idx],
        title, organ, category, entity, synopsis, tags,
        steps: JSON.parse(JSON.stringify(state.dpSteps))
      };
    }
  } else {
    const newCase = {
      id: "dp_" + Date.now(),
      title, organ, category, entity, synopsis, tags,
      steps: JSON.parse(JSON.stringify(state.dpSteps))
    };
    state.cases.push(newCase);
  }

  saveCases();
  alert("Dossier Progressif enregistré avec succès !");
  switchTab('bank');
}

function editDP(id) {
  const c = state.cases.find(item => item.id === id);
  if (!c) return;

  switchTab('create');
  setCreatorMode('dp');

  document.getElementById('form-dp-edit-id').value = c.id;
  document.getElementById('form-dp-title').value = c.title;
  document.getElementById('form-dp-organ').value = c.organ;
  document.getElementById('form-dp-category').value = c.category || '';
  document.getElementById('form-dp-entity').value = c.entity || '';
  document.getElementById('form-dp-synopsis').value = c.synopsis;

  state.editorSelectedTags = new Set(c.tags || []);
  renderDPTagsSelector();

  state.dpSteps = JSON.parse(JSON.stringify(c.steps));
  renderDPStepsBuilder();
}

function deleteDP(id) {
  if (!confirm("Voulez-vous supprimer ce Dossier Progressif ?")) return;
  state.cases = state.cases.filter(c => c.id !== id);
  saveCases();
}

// =========================================================================
// --- LECTEUR DE DOSSIER PROGRESSIF (DP SESSION) ---
// =========================================================================
function startDPSession(caseId) {
  const dpCase = state.cases.find(c => c.id === caseId);
  if (!dpCase) return;

  state.currentDPSession = {
    caseData: dpCase,
    currentStepIndex: 0,
    totalSteps: dpCase.steps.length,
    score: 0,
    isStepAnswered: false,
    selectedInCurrentStep: new Set()
  };

  switchTab('dp-session');
  renderDPStep();
}

function renderDPStep() {
  const session = state.currentDPSession;
  if (!session) return;

  const currentStep = session.caseData.steps[session.currentStepIndex];
  session.isStepAnswered = false;
  session.selectedInCurrentStep.clear();

  document.getElementById('dp-case-title').textContent = session.caseData.title;
  document.getElementById('dp-case-meta').textContent = `${session.caseData.organ} > ${session.caseData.category} > ${session.caseData.entity}`;
  document.getElementById('dp-step-indicator').textContent = `Étape ${session.currentStepIndex + 1} / ${session.totalSteps}`;
  document.getElementById('dp-progress-bar').style.width = `${((session.currentStepIndex + 1) / session.totalSteps) * 100}%`;

  document.getElementById('dp-step-title').textContent = currentStep.title;
  document.getElementById('dp-step-narrative').textContent = currentStep.narrative;

  const imagesContainer = document.getElementById('dp-step-images-container');
  imagesContainer.innerHTML = '';
  if (currentStep.images && currentStep.images.length > 0) {
    imagesContainer.classList.remove('hidden');
    currentStep.images.forEach((imgObj, idx) => {
      const card = document.createElement('div');
      card.className = "relative rounded-xl overflow-hidden border border-slate-700 bg-black cursor-zoom-in group max-h-64 flex flex-col justify-end";
      card.onclick = () => openLightbox(imgObj.url, imgObj.caption || `Cliché Étape ${session.currentStepIndex + 1}`);
      card.innerHTML = `
        <img src="${imgObj.url}" alt="Cliché" class="max-h-64 w-full object-contain">
        <div class="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur p-2 text-white text-[11px] font-medium flex items-center justify-between border-t border-slate-800">
          <span class="truncate">${imgObj.caption}</span>
          <i data-lucide="zoom-in" class="w-3.5 h-3.5 text-indigo-400"></i>
        </div>
      `;
      imagesContainer.appendChild(card);
    });
  } else {
    imagesContainer.classList.add('hidden');
  }

  const isQCM = (currentStep.format === 'qcm');
  const typeBadge = document.getElementById('dp-step-type-badge');
  typeBadge.textContent = isQCM ? "☑️ QCM (Choix multiples)" : "🔘 QCU (Choix unique)";

  document.getElementById('dp-step-question').textContent = currentStep.question;

  const optionsBox = document.getElementById('dp-step-options-container');
  optionsBox.innerHTML = '';
  currentStep.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.id = 'dp-opt-' + idx;
    btn.className = "w-full text-left p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition flex items-center justify-between text-sm text-slate-200 group";
    btn.onclick = () => {
      if (isQCM) toggleDPOption(idx);
      else selectDPSingle(idx);
    };

    const letter = String.fromCharCode(65 + idx);
    const boxShape = isQCM ? "rounded-md" : "rounded-lg";

    btn.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="opt-indicator w-7 h-7 ${boxShape} bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-indigo-400 transition">${letter}</span>
        <span class="font-medium">${optText}</span>
      </div>
      <div class="opt-check-status w-5 h-5 flex items-center justify-center"></div>
    `;
    optionsBox.appendChild(btn);
  });

  const valBtn = document.getElementById('btn-dp-validate-qcm');
  if (isQCM) {
    valBtn.classList.remove('hidden');
    valBtn.disabled = true;
    valBtn.textContent = "Valider cette étape (0 cochée)";
  } else {
    valBtn.classList.add('hidden');
  }

  document.getElementById('dp-step-feedback-box').classList.add('hidden');
  if (window.lucide) lucide.createIcons();
}

function toggleDPOption(idx) {
  const session = state.currentDPSession;
  if (!session || session.isStepAnswered) return;

  const btn = document.getElementById('dp-opt-' + idx);
  if (session.selectedInCurrentStep.has(idx)) {
    session.selectedInCurrentStep.delete(idx);
    btn.classList.remove('border-indigo-500', 'bg-indigo-500/10');
    btn.querySelector('.opt-indicator').classList.remove('bg-indigo-600', 'text-white', 'border-indigo-500');
  } else {
    session.selectedInCurrentStep.add(idx);
    btn.classList.add('border-indigo-500', 'bg-indigo-500/10');
    btn.querySelector('.opt-indicator').classList.add('bg-indigo-600', 'text-white', 'border-indigo-500');
  }

  const valBtn = document.getElementById('btn-dp-validate-qcm');
  const count = session.selectedInCurrentStep.size;
  valBtn.disabled = count === 0;
  valBtn.textContent = `Valider cette étape (${count} cochée${count > 1 ? 's' : ''})`;
}

function validateDPQCM() {
  const session = state.currentDPSession;
  if (!session || session.isStepAnswered) return;
  evaluateDPStep(Array.from(session.selectedInCurrentStep));
}

function selectDPSingle(idx) {
  const session = state.currentDPSession;
  if (!session || session.isStepAnswered) return;
  evaluateDPStep([idx]);
}

function evaluateDPStep(selectedIndices) {
  const session = state.currentDPSession;
  if (!session || session.isStepAnswered) return;
  session.isStepAnswered = true;

  const currentStep = session.caseData.steps[session.currentStepIndex];
  const correctIndices = Array.isArray(currentStep.correct) ? currentStep.correct : [currentStep.correct];

  const selSet = new Set(selectedIndices);
  const corSet = new Set(correctIndices);
  const isExact = (selSet.size === corSet.size) && [...selSet].every(x => corSet.has(x));

  if (isExact) {
    session.score += 1;
    state.stats.xp += 20;
    playSound('correct');
  } else {
    playSound('wrong');
  }
  saveStats();

  currentStep.options.forEach((_, idx) => {
    const btn = document.getElementById('dp-opt-' + idx);
    if (!btn) return;
    btn.disabled = true;

    const isTrue = corSet.has(idx);
    const wasSel = selSet.has(idx);

    if (isTrue && wasSel) {
      btn.className = "w-full text-left p-4 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-200 flex items-center justify-between text-sm";
      btn.querySelector('.opt-check-status').innerHTML = '<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i>';
    } else if (isTrue && !wasSel) {
      btn.className = "w-full text-left p-4 rounded-xl border border-emerald-500/60 bg-emerald-500/5 text-emerald-300 flex items-center justify-between text-sm";
      btn.querySelector('.opt-check-status').innerHTML = '<span class="text-[10px] font-bold text-emerald-400">[Réponse attendue]</span>';
    } else if (!isTrue && wasSel) {
      btn.className = "w-full text-left p-4 rounded-xl border border-rose-500 bg-rose-500/10 text-rose-200 flex items-center justify-between text-sm";
      btn.querySelector('.opt-check-status').innerHTML = '<i data-lucide="x-circle" class="w-5 h-5 text-rose-400"></i>';
    } else {
      btn.classList.add('opacity-40');
    }
  });

  document.getElementById('btn-dp-validate-qcm').classList.add('hidden');

  const fbBox = document.getElementById('dp-step-feedback-box');
  const banner = document.getElementById('dp-feedback-banner');
  banner.className = isExact ? "p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300";
  document.getElementById('dp-feedback-title').textContent = isExact ? "Étape validée avec succès !" : "Erreur sur cette étape !";
  document.getElementById('dp-feedback-text').textContent = currentStep.explanation;
  document.getElementById('dp-trap-text').textContent = currentStep.trap || "Penser à croiser les aspects macro, micro et phénotypiques.";
  
  const isLastStep = (session.currentStepIndex + 1 >= session.totalSteps);
  document.getElementById('btn-dp-next-step').innerHTML = isLastStep ? `<span>Clôturer le Dossier Clinique</span><i data-lucide="check" class="w-4 h-4"></i>` : `<span>Débloquer l'Étape Suivante</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;

  fbBox.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function nextDPStep() {
  const session = state.currentDPSession;
  if (!session) return;

  if (session.currentStepIndex + 1 < session.totalSteps) {
    session.currentStepIndex += 1;
    renderDPStep();
  } else {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    alert(`Bravo ! Vous avez terminé ce Dossier Progressif.\nScore : ${session.score} / ${session.totalSteps} étapes réussies (+${session.score * 20} XP).`);
    switchTab('play');
  }
}

// --- DOSSIERS PROGRESSIFS SUR LA PAGE JOUER ---
function renderDPCardsOnPlay() {
  const container = document.getElementById('home-dp-cards-container');
  if (!container) return;

  if (state.cases.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-6 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
        <i data-lucide="file-question" class="w-8 h-8 mx-auto mb-2 text-indigo-400/60"></i>
        <h4 class="text-sm font-bold text-white">Aucun Dossier Progressif créé</h4>
        <p class="text-xs text-slate-400 mt-1">Vous pouvez composer vos propres cas clinico-pathologiques multi-étapes avec coupes séquentielles.</p>
        <button onclick="switchTab('create'); setCreatorMode('dp');" class="mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 transition">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
          <span>Créer un Dossier Progressif</span>
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = '';
  state.cases.forEach(c => {
    const card = document.createElement('div');
    card.className = "bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between transition group shadow-lg";
    card.innerHTML = `
      <div>
        <div class="flex items-center space-x-2 mb-2">
          <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">Dossier Progressif</span>
          <span class="text-xs text-slate-400 font-mono">${c.organ} > ${c.category} > ${c.entity}</span>
        </div>
        <h4 class="font-bold text-white text-base group-hover:text-indigo-300 transition">${c.title}</h4>
        <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">${c.synopsis}</p>
        <div class="flex flex-wrap gap-1.5 mt-3">
          ${(c.tags || []).map(t => `<span class="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded">#${t}</span>`).join('')}
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span class="text-xs text-indigo-300 font-semibold">${c.steps.length} Étapes séquentielles</span>
        <button onclick="startDPSession('${c.id}')" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-sm shadow-indigo-500/30">
          <span>Résoudre le cas</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
  if (window.lucide) lucide.createIcons();
}

// --- TAGS CLOUD ---
function renderTagsCloud() {
  const container = document.getElementById('home-tags-container');
  if (!container) return;

  if (state.customTags.length === 0) {
    container.innerHTML = '<span class="text-xs text-slate-500 italic">Aucun tag créé.</span>';
    return;
  }

  container.innerHTML = '';
  state.customTags.forEach(tag => {
    const count = state.questions.filter(q => !q.mastered && (q.tags || []).includes(tag)).length +
                  state.cases.filter(c => (c.tags || []).includes(tag)).length;
    const btn = document.createElement('button');
    btn.onclick = () => {
      const pool = state.questions.filter(q => !q.mastered && (q.tags || []).includes(tag));
      if (pool.length === 0) {
        alert(`Aucune question active n'utilise le tag #${tag}.`);
        return;
      }
      launchQuizSession(pool, `Quiz Tag #${tag}`);
    };
    btn.className = "px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 text-xs font-semibold text-slate-300 hover:text-teal-400 flex items-center space-x-1.5 transition";
    btn.innerHTML = `<span>#${tag}</span><span class="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded-full">${count}</span>`;
    container.appendChild(btn);
  });
}

function createNewGlobalTag(tagName) {
  const clean = tagName.trim().replace(/^#/, '');
  if (!clean) return;
  if (!state.customTags.includes(clean)) {
    state.customTags.push(clean);
    saveCustomTags();
  }
}

// =========================================================================
// --- EXPLORATEUR DE LA BANQUE AVEC BOÎTES PAR ORGANE (ACCORDÉONS) ---
// =========================================================================
function toggleOrganBankBox(organName) {
  if (state.bankCollapsedOrgans.has(organName)) {
    state.bankCollapsedOrgans.delete(organName);
  } else {
    state.bankCollapsedOrgans.add(organName);
  }
  renderBank();
}

function collapseAllOrganBankBoxes() {
  const tree = getHierarchyTree(true);
  Object.keys(tree).forEach(org => state.bankCollapsedOrgans.add(org));
  renderBank();
}

function expandAllOrganBankBoxes() {
  state.bankCollapsedOrgans.clear();
  renderBank();
}

function renderBank() {
  const search = (document.getElementById('bank-search-input').value || '').toLowerCase();
  const formatFilter = document.getElementById('bank-filter-format').value;
  const statusFilter = document.getElementById('bank-filter-status').value;
  const organFilter = document.getElementById('bank-filter-organ').value;
  const tagFilter = document.getElementById('bank-filter-tag').value;

  populateBankFilterDropdowns();

  const container = document.getElementById('bank-items-container');
  if (!container) return;
  container.innerHTML = '';

  const totalItems = state.questions.length + state.cases.length;
  if (totalItems === 0) {
    container.innerHTML = `
      <div class="text-center py-16 text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
        <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-white">Votre banque est vide</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Créez vos premières questions (QCM par défaut) ou vos premiers Dossiers Progressifs (DP).
        </p>
        <button onclick="switchTab('create')" class="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 transition">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Créer maintenant</span>
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Filtrage Questions
  const filteredQ = state.questions.filter(q => {
    if (formatFilter === 'dp') return false;
    if (formatFilter !== 'all' && q.format !== formatFilter) return false;
    if (organFilter !== 'all' && q.organ !== organFilter) return false;
    if (tagFilter !== 'all' && !(q.tags || []).includes(tagFilter)) return false;

    if (statusFilter === 'active' && q.mastered) return false;
    if (statusFilter === 'mastered' && !q.mastered) return false;
    if (statusFilter === 'due' && !isQuestionDue(q)) return false;
    if (statusFilter === 'errors' && (!q.flagged && !(q.stats && q.stats.seen > 0 && q.stats.correct < q.stats.seen))) return false;

    if (search) {
      const matchQ = (q.question || '').toLowerCase().includes(search);
      const matchCtx = (q.context || '').toLowerCase().includes(search);
      const matchOrg = (q.organ || '').toLowerCase().includes(search);
      const matchCat = (q.category || '').toLowerCase().includes(search);
      const matchEnt = (q.entity || '').toLowerCase().includes(search);
      const matchTags = (q.tags || []).some(t => t.toLowerCase().includes(search));
      if (!matchQ && !matchCtx && !matchOrg && !matchCat && !matchEnt && !matchTags) return false;
    }
    return true;
  });

  // Filtrage DP
  const filteredCases = state.cases.filter(c => {
    if (formatFilter !== 'all' && formatFilter !== 'dp') return false;
    if (statusFilter === 'mastered' || statusFilter === 'due') return false;
    if (organFilter !== 'all' && c.organ !== organFilter) return false;
    if (tagFilter !== 'all' && !(c.tags || []).includes(tagFilter)) return false;
    if (search) {
      const matchT = (c.title || '').toLowerCase().includes(search);
      const matchSyn = (c.synopsis || '').toLowerCase().includes(search);
      const matchOrg = (c.organ || '').toLowerCase().includes(search);
      const matchCat = (c.category || '').toLowerCase().includes(search);
      const matchEnt = (c.entity || '').toLowerCase().includes(search);
      const matchTags = (c.tags || []).some(t => t.toLowerCase().includes(search));
      if (!matchT && !matchSyn && !matchOrg && !matchCat && !matchEnt && !matchTags) return false;
    }
    return true;
  });

  if (filteredQ.length === 0 && filteredCases.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
        <p class="text-xs">Aucun élément ne correspond à ces filtres de recherche.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // GROUPEMENT EN BOÎTES PAR ORGANE
  const organGroups = {}; // organName -> { questions: [], cases: [] }
  filteredQ.forEach(q => {
    const org = q.organ || "Autre";
    if (!organGroups[org]) organGroups[org] = { questions: [], cases: [] };
    organGroups[org].questions.push(q);
  });
  filteredCases.forEach(c => {
    const org = c.organ || "Autre";
    if (!organGroups[org]) organGroups[org] = { questions: [], cases: [] };
    organGroups[org].cases.push(c);
  });

  const sortedOrgans = Object.keys(organGroups).sort();

  // Barre d'outils secondaire : Replier / Déplier
  const toolbar = document.createElement('div');
  toolbar.className = "flex items-center justify-between pb-1 text-xs text-slate-400";
  toolbar.innerHTML = `
    <span>${sortedOrgans.length} boîte(s) d'organe trouvée(s)</span>
    <div class="flex items-center space-x-2">
      <button onclick="expandAllOrganBankBoxes()" class="hover:text-teal-400 transition">Tout déplier</button>
      <span>•</span>
      <button onclick="collapseAllOrganBankBoxes()" class="hover:text-teal-400 transition">Tout replier</button>
    </div>
  `;
  container.appendChild(toolbar);

  // Rendu de chaque Boîte d'Organe
  sortedOrgans.forEach(orgName => {
    const group = organGroups[orgName];
    const totalInOrg = group.questions.length + group.cases.length;
    const isCollapsed = state.bankCollapsedOrgans.has(orgName) && !search; // Ne pas replier si recherche active

    const dueInOrg = group.questions.filter(q => isQuestionDue(q)).length;
    const masteredInOrg = group.questions.filter(q => q.mastered).length;

    const organBox = document.createElement('div');
    organBox.className = "bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition shadow-lg space-y-0";

    // En-tête de la Boîte d'Organe
    const header = document.createElement('div');
    header.className = "p-4 sm:p-5 bg-slate-900/90 flex items-center justify-between cursor-pointer select-none border-b border-slate-800/80 hover:bg-slate-800/40 transition";
    header.addEventListener('click', () => toggleOrganBankBox(orgName));

    header.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold">
          <i data-lucide="folder" class="w-4 h-4"></i>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="font-extrabold text-base text-white capitalize"></h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 font-bold border border-slate-700">${totalInOrg}</span>
          </div>
          <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
            ${dueInOrg > 0 ? `<span class="text-amber-400 font-semibold">• ${dueInOrg} à revoir</span>` : ''}
            ${masteredInOrg > 0 ? `<span class="text-emerald-400 font-semibold">• ${masteredInOrg} maîtrisée(s)</span>` : ''}
            ${group.cases.length > 0 ? `<span class="text-indigo-400 font-semibold">• ${group.cases.length} DP</span>` : ''}
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button class="btn-test-organ hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-teal-600/10 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition">
          <i data-lucide="play" class="w-3.5 h-3.5"></i>
          <span>Tester l'organe</span>
        </button>
        <button class="btn-toggle-box p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
          <i data-lucide="${isCollapsed ? 'chevron-down' : 'chevron-up'}" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    header.querySelector('h3').textContent = orgName;

    const testBtn = header.querySelector('.btn-test-organ');
    if (testBtn) {
      testBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startHierarchySession('organ', orgName);
      });
    }

    const toggleBtn = header.querySelector('.btn-toggle-box');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOrganBankBox(orgName);
      });
    }

    organBox.appendChild(header);

    // Corps repliable contenant les cartes de cet organe
    const bodyContainer = document.createElement('div');
    bodyContainer.className = `p-4 sm:p-5 space-y-3 bg-slate-950/40 ${isCollapsed ? 'hidden' : ''}`;
    organBox.appendChild(bodyContainer);

    // Insérer les Dossiers Progressifs de cet organe
    group.cases.forEach(c => {
      const card = document.createElement('div');
      card.className = "bg-slate-900 border border-indigo-500/30 hover:border-indigo-500 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm";
      card.innerHTML = `
        <div class="space-y-1.5 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">📋 DP (${c.steps.length} étapes)</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              ${c.category} > ${c.entity}
            </span>
          </div>
          <h4 class="font-bold text-sm text-white">${c.title}</h4>
          <p class="text-xs text-slate-400 line-clamp-1">${c.synopsis}</p>
          <div class="flex flex-wrap gap-1 mt-1">
            ${(c.tags || []).map(t => `<span class="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-mono">#${t}</span>`).join('')}
          </div>
        </div>
        <div class="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          <button onclick="startDPSession('${c.id}')" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm shadow-indigo-500/20">
            <i data-lucide="play" class="w-3.5 h-3.5"></i>
            <span>Jouer</span>
          </button>
          <button onclick="editDP('${c.id}')" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="Modifier le DP">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteDP('${c.id}')" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition" title="Supprimer le DP">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;
      bodyContainer.appendChild(card);
    });

    // Insérer les Questions Simples de cet organe
    group.questions.forEach(q => {
      const card = document.createElement('div');
      card.className = `bg-slate-900 border rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        q.mastered ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800 hover:border-slate-700'
      }`;

      const formatBadge = q.format === 'qcm' ? '☑️ QCM' : (q.format === 'piege' ? '⚠️ Vrai/Faux' : '🔘 QCU');
      const rate = q.stats && q.stats.seen > 0 ? `${Math.round((q.stats.correct / q.stats.seen) * 100)}% (${q.stats.correct}/${q.stats.seen})` : 'Non jouée';

      let dueBadgeHtml = '';
      if (q.mastered) {
        dueBadgeHtml = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1"><i data-lucide="award" class="w-3 h-3"></i><span>Maîtrisée</span></span>';
      } else if (isQuestionDue(q)) {
        dueBadgeHtml = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1"><i data-lucide="clock" class="w-3 h-3"></i><span>À revoir aujourd\'hui</span></span>';
      } else if (q.stats && q.stats.nextReviewDate) {
        dueBadgeHtml = `<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">📅 Revoir le ${q.stats.nextReviewDate}</span>`;
      }

      card.innerHTML = `
        <div class="space-y-1.5 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">${formatBadge}</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              ${q.category} > ${q.entity}
            </span>
            ${dueBadgeHtml}
            <span class="text-[10px] text-slate-400">Précision : ${rate}</span>
          </div>
          <h4 class="font-bold text-sm text-white">${q.question}</h4>
          ${q.context ? `<p class="text-xs text-slate-400 font-mono line-clamp-1">${q.context}</p>` : ''}
          <div class="flex flex-wrap gap-1 mt-1">
            ${(q.tags || []).map(t => `<span class="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-mono">#${t}</span>`).join('')}
            ${q.images && q.images.length > 0 ? `<span class="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded flex items-center space-x-1"><i data-lucide="image" class="w-3 h-3"></i><span>${q.images.length} photo${q.images.length > 1 ? 's' : ''}</span></span>` : ''}
          </div>
        </div>
        <div class="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          <button onclick="toggleQuestionMastered('${q.id}')" class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition ${
            q.mastered 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-emerald-400'
          }" title="${q.mastered ? 'Réactiver dans les sessions de révision' : 'Neutraliser (marquer maîtrisée)'}">
            <i data-lucide="${q.mastered ? 'check-check' : 'award'}" class="w-3.5 h-3.5"></i>
            <span>${q.mastered ? 'Maîtrisée' : 'Neutraliser'}</span>
          </button>
          <button onclick="editQuestion('${q.id}')" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="Modifier">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteQuestion('${q.id}')" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition" title="Supprimer">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;
      bodyContainer.appendChild(card);
    });

    container.appendChild(organBox);
  });

  if (window.lucide) lucide.createIcons();
}

function populateBankFilterDropdowns() {
  const organSelect = document.getElementById('bank-filter-organ');
  const tagSelect = document.getElementById('bank-filter-tag');

  if (organSelect) {
    const curVal = organSelect.value;
    const tree = getHierarchyTree(true);
    organSelect.innerHTML = `<option value="all">Tous les organes</option>` + Object.keys(tree).map(o => `<option value="${o}">${o}</option>`).join('');
    organSelect.value = curVal || 'all';
  }

  if (tagSelect) {
    const curVal = tagSelect.value;
    tagSelect.innerHTML = `<option value="all">Tous les tags (#)</option>` + state.customTags.map(t => `<option value="${t}">#${t}</option>`).join('');
    tagSelect.value = curVal || 'all';
  }
}

// Lightbox
function openLightbox(url, caption) {
  const modal = document.getElementById('lightbox-modal');
  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox-caption').textContent = caption || '';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.getElementById('lightbox-img').src = '';
}

// Export / Import
function exportCustomBankJSON() {
  const data = {
    questions: state.questions,
    cases: state.cases,
    customTags: state.customTags,
    stats: state.stats
  };
  const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const a = document.createElement('a');
  a.setAttribute("href", str);
  a.setAttribute("download", `pathotrainer_banque_${getTodayString()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importCustomBankJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (parsed.questions && Array.isArray(parsed.questions)) state.questions = parsed.questions;
      if (parsed.cases && Array.isArray(parsed.cases)) state.cases = parsed.cases;
      if (parsed.customTags && Array.isArray(parsed.customTags)) state.customTags = parsed.customTags;
      saveQuestions();
      saveCases();
      saveCustomTags();
      alert("Banque importée avec succès !");
    } catch (err) {
      alert("Erreur lors de la lecture du fichier JSON.");
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (confirm("Voulez-vous vraiment vider toute votre banque ?")) {
    state.questions = [];
    state.cases = [];
    saveQuestions();
    saveCases();
  }
}

window.addEventListener('DOMContentLoaded', initApp);
