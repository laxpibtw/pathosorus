/**
 * PATHOTRAINER LAB - MOTEUR COMPLET AVEC RÉPÉTITION ESPACÉE & BOÎTES PAR ORGANE DANS LA BANQUE
 */

const STORAGE_KEY_QUESTIONS = "pathotrainer_custom_questions_v3";
const STORAGE_KEY_CASES = "pathotrainer_custom_cases_v3";
const STORAGE_KEY_TAGS = "pathotrainer_custom_tags_v3";
const STORAGE_KEY_STATS = "pathotrainer_custom_stats_v3";

let state = {
  currentUser: null,
  currentRole: 'reader', // 'creator' | 'reader'
  userProgress: {}, // map questionId -> { stats, mastered, flagged }
  questions: [],
  cases: [],
  customTags: [],
  customBadges: [],
  stats: {
    xp: 0,
    creatorXp: 0,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalAnswered: 0,
    totalCorrect: 0,
    completedCategories: [],
    unlockedBadges: {},
    badgeHistory: {}
  },
  trophyFilter: 'all',
  playHierarchy: {
    selectedOrgan: null,
    selectedCategory: null,
    selectedEntity: null,
    filterMode: 'all' // 'all' | 'colleagues' | 'mine'
  },
  currentSession: null,
  currentDPSession: null,
  sessionReturnView: 'bank',
  creatorMode: 'simple',
  editorUploadedImages: [],
  editorUploadedExplanationImages: [],
  editorSelectedTags: new Set(),
  editorQuestionOptions: [],
  editorOpenAnswers: [''],
  lastActiveImageZone: 'statement',
  dpSteps: [],
  bankSelectedOrgan: 'all',
  bankSelectedCategory: 'all',
  bankCollapsedOrgans: new Set(),
  bankExpandedLesions: new Set(),
  currentRenderedLesionKeys: []
};

const AUTHORIZED_CREATOR_EMAILS = new Set([
  'padoreau85@gmail.com',
  'belhadef.samy@gmail.com'
]);

function isCreator() {
  if (state.currentUser && state.currentUser.email) {
    const em = state.currentUser.email.toLowerCase();
    if (AUTHORIZED_CREATOR_EMAILS.has(em)) {
      return true;
    }
  }
  return state.currentRole === 'creator';
}

function isReader() {
  return !isCreator();
}

function isLocalEnvironment() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
}

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

// Normalisation intelligente pour les questions ouvertes (insensible à la casse, aux accents et à la ponctuation)
function normalizeDiagnosticText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, ' ')   // Remplace la ponctuation par des espaces
    .replace(/\s+/g, ' ')           // Espaces multiples
    .trim();
}

function isDiagnosticMatch(userInput, target) {
  const normUser = normalizeDiagnosticText(userInput);
  const normTarget = normalizeDiagnosticText(target);
  if (!normUser || !normTarget) return false;
  if (normUser === normTarget) return true;
  // Comparaison compacte (sans aucun espace) pour tolérer "basocellulaire" vs "baso cellulaire" ou "in-situ"
  const compactUser = normUser.replace(/\s+/g, '');
  const compactTarget = normTarget.replace(/\s+/g, '');
  if (compactUser === compactTarget) return true;
  return false;
}

function getQuestionAcceptedAnswers(q) {
  const list = [];
  if (Array.isArray(q.acceptedAnswers)) {
    q.acceptedAnswers.forEach(a => {
      const s = (a || '').trim();
      if (s && !list.includes(s)) list.push(s);
    });
  }
  if (Array.isArray(q.options) && q.format === 'ouverte') {
    q.options.forEach(o => {
      const s = (o || '').trim();
      if (s && !list.includes(s)) list.push(s);
    });
  }
  if (list.length === 0 && q.entity) {
    list.push(q.entity.trim());
  }
  return list;
}

function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = "fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' 
    ? 'bg-teal-600 text-white shadow-teal-500/30' 
    : (type === 'error' ? 'bg-rose-600 text-white shadow-rose-500/30' : 'bg-slate-800 text-slate-200 shadow-black/50');
  toast.className = `px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center space-x-2 pointer-events-auto transition-all duration-300 opacity-0 translate-y-2 ${bg}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" class="w-4 h-4 shrink-0"></i>
    <span>${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

// Notifications sonores désactivées pour un entraînement silencieux
function playSound(type) {
  // Silencieux
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function isQuestionDoneToday(q) {
  if (!q || !q.stats || !q.stats.lastReviewed) return false;
  try {
    const lastDate = q.stats.lastReviewed.split('T')[0];
    return lastDate === getTodayString();
  } catch (e) {
    return false;
  }
}

function isQuestionDue(q) {
  if (q.mastered) return false;

  // Règle d'or : si une question a été faite aujourd'hui (J1), elle n'apparaît PLUS dans le Jouer aujourd'hui !
  if (isQuestionDoneToday(q)) return false;

  // Si jamais faite : elle est due (à découvrir)
  if (!q.stats || typeof q.stats.seen === 'undefined' || q.stats.seen === 0) return true;

  // Si marquée en erreur / piège et pas encore refaite aujourd'hui
  if (q.flagged) return true;

  // Si date d'échéance arrivée
  if (!q.stats.nextReviewDate) return true;
  return q.stats.nextReviewDate <= getTodayString();
}

// =========================================================================
// --- MODULE SUPABASE CLOUD SYNC & STOCKAGE ---
// =========================================================================
let supabaseClient = null;

function getSupabaseCredentials() {
  const cfg = window.PATHOSORUS_CONFIG || {};
  const url = cfg.supabaseUrl || localStorage.getItem('pathosorus_supabase_url') || '';
  const key = cfg.supabaseAnonKey || localStorage.getItem('pathosorus_supabase_key') || '';
  return { url: url.trim(), key: key.trim() };
}

function initSupabase() {
  const { url, key } = getSupabaseCredentials();
  const lib = window.supabase;
  if (url && key && lib && typeof lib.createClient === 'function') {
    try {
      supabaseClient = lib.createClient(url, key);
      updateSupabaseUI(true);
      initAuth();
      return true;
    } catch (e) {
      console.error('Erreur Supabase init:', e);
      updateSupabaseUI(false, "Erreur de connexion aux identifiants Supabase");
      return false;
    }
  } else {
    updateSupabaseUI(false);
    updateUserRoleUI();
    return false;
  }
}

function updateSupabaseUI(connected, errorMsg) {
  const dot = document.getElementById('supabase-status-dot');
  const text = document.getElementById('supabase-status-text');
  const banner = document.getElementById('supabase-status-banner');
  const bannerText = document.getElementById('supabase-status-banner-text');

  const shield = document.getElementById('env-local-shield');
  if (shield) {
    if (isLocalEnvironment()) shield.classList.remove('hidden');
    else shield.classList.add('hidden');
  }

  if (isLocalEnvironment()) {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-amber-400";
    if (text) {
      text.textContent = "Test Local (Cloud protégé 🛡️)";
      text.className = "text-amber-300 font-semibold hidden md:inline text-xs";
    }
    if (banner) {
      banner.className = "p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2";
    }
    if (bannerText) {
      bannerText.textContent = "🛡️ Mode Test Local : La base Supabase en ligne est 100% protégée en écriture. Vos tests restent sur ce navigateur.";
    }
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (connected) {
    if (dot) {
      dot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
    }
    if (text) {
      text.textContent = "Cloud Connecté";
      text.className = "text-emerald-300 font-semibold hidden md:inline";
    }
    if (banner) {
      banner.className = "p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2";
    }
    if (bannerText) {
      bannerText.textContent = "🟢 Connecté au Cloud Supabase ! Synchronisation automatique active.";
    }
  } else {
    if (dot) {
      dot.className = "w-2 h-2 rounded-full bg-slate-500";
    }
    if (text) {
      text.textContent = "Mode Local";
      text.className = "text-slate-400 hidden md:inline";
    }
    if (banner) {
      banner.className = "p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2";
    }
    if (bannerText) {
      bannerText.textContent = errorMsg || "Mode local actif. Vos questions sont enregistrées sur ce navigateur.";
    }
  }
}

function openSupabaseModal() {
  const modal = document.getElementById('modal-supabase');
  if (!modal) return;
  const { url, key } = getSupabaseCredentials();
  const inputUrl = document.getElementById('supabase-input-url');
  const inputKey = document.getElementById('supabase-input-key');
  if (inputUrl) inputUrl.value = url;
  if (inputKey) inputKey.value = key;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeSupabaseModal() {
  const modal = document.getElementById('modal-supabase');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function saveSupabaseSettings() {
  const inputUrl = document.getElementById('supabase-input-url');
  const inputKey = document.getElementById('supabase-input-key');
  const url = inputUrl ? inputUrl.value.trim() : '';
  const key = inputKey ? inputKey.value.trim() : '';

  if (!url || !key) {
    localStorage.removeItem('pathosorus_supabase_url');
    localStorage.removeItem('pathosorus_supabase_key');
    supabaseClient = null;
    updateSupabaseUI(false);
    alert("Configuration Cloud effacée. Retour au mode local.");
    closeSupabaseModal();
    return;
  }

  localStorage.setItem('pathosorus_supabase_url', url);
  localStorage.setItem('pathosorus_supabase_key', key);

  if (initSupabase()) {
    try {
      const { data, error } = await supabaseClient.from('questions').select('id').limit(1);
      if (error) {
        alert("Attention : Connexion réussie mais erreur d'accès aux tables : " + error.message + "\nAvez-vous bien exécuté le script SQL dans Supabase ?");
      } else {
        alert("Connexion Cloud Supabase réussie avec succès !");
        await fetchSupabaseData(true);
      }
    } catch (e) {
      alert("Erreur de test : " + e.message);
    }
  }
  closeSupabaseModal();
}

// =========================================================================
// --- MODULE D'AUTHENTIFICATION & GESTION DES RÔLES (CRÉATEUR / LECTEUR) ---
// =========================================================================

async function initAuth() {
  if (!supabaseClient) return;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
      state.currentUser = session.user;
      await fetchCurrentUserRole();
    } else {
      state.currentUser = null;
      state.currentRole = 'reader';
    }
    updateUserRoleUI();

    // Charger les questions et synchroniser la progression liée au compte
    await fetchSupabaseData(true);
    if (state.currentUser) {
      await syncLocalProgressToCloud();
    }

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        state.currentUser = session.user;
        await fetchCurrentUserRole();
        await fetchSupabaseData(true);
        await syncLocalProgressToCloud();
      } else {
        state.currentUser = null;
        state.currentRole = 'reader';
        resetInMemoryUserProgress();
        saveQuestions();
        updateTopBar();
        renderSpacedRepetitionDashboard();
        renderBank();
        renderHierarchySelector();
      }
      updateUserRoleUI();
    });
  } catch (e) {
    console.warn("Erreur initAuth:", e);
  }
}

async function syncLocalProgressToCloud() {
  if (!supabaseClient || !state.currentUser) return;
  try {
    const toUpload = [];
    (state.questions || []).forEach(q => {
      if (q && q.id && (q.mastered || q.flagged || (q.stats && (q.stats.seen > 0 || q.stats.lastReviewed || q.stats.nextReviewDate)))) {
        toUpload.push({
          user_id: state.currentUser.id,
          question_id: q.id,
          mastered: Boolean(q.mastered),
          flagged: Boolean(q.flagged),
          stats: q.stats || getDefaultQuestionStats(),
          updated_at: new Date().toISOString()
        });
      }
    });
    if (toUpload.length > 0) {
      for (let i = 0; i < toUpload.length; i += 50) {
        const batch = toUpload.slice(i, i + 50);
        await supabaseClient.from('user_progress').upsert(batch);
      }
    }
  } catch (e) {
    console.warn("Erreur syncLocalProgressToCloud:", e);
  }
}

async function pushAllLocalDataToAccountCloud() {
  if (!supabaseClient || !state.currentUser) return;
  console.log("☁️ Synchronisation complète du compte avec Supabase...");

  // 1. Pousser les stats (XP, streak, badgeHistory, unlockedBadges, customBadges)
  try {
    await syncStatsToCloud();
  } catch (e) {
    console.warn("Erreur push stats vers cloud:", e);
  }

  // 2. Pousser la progression de révision espacée (user_progress)
  try {
    await syncLocalProgressToCloud();
  } catch (e) {
    console.warn("Erreur push user_progress vers cloud:", e);
  }

  // 3. Pousser les questions locales dont les justifications manquent sur Supabase
  if (isCreator()) {
    try {
      const { data: cloudQs } = await supabaseClient.from('questions').select('id, optionexplanations');
      const cloudMap = new Map((cloudQs || []).map(q => [q.id, q]));

      const toPush = (state.questions || []).filter(localQ => {
        const cloudQ = cloudMap.get(localQ.id);
        const hasLocalNotes = Array.isArray(localQ.optionExplanations) && localQ.optionExplanations.some(e => e && e.trim());
        const cloudMissing = !cloudQ || !cloudQ.optionexplanations || cloudQ.optionexplanations.length === 0 || cloudQ.optionexplanations.every(e => !e || !e.trim());
        return hasLocalNotes && cloudMissing;
      });

      if (toPush.length > 0) {
        console.log(`☁️ Auto-push de ${toPush.length} question(s) avec justifications vers Supabase...`);
        for (const q of toPush) {
          await dbUpsertQuestion(q);
        }
      }
    } catch (e) {
      console.warn("Erreur auto-push questions vers Supabase:", e);
    }
  }
}

async function forceFullCloudSync() {
  if (!supabaseClient) {
    alert("Supabase n'est pas initialisé.");
    return;
  }
  if (!state.currentUser) {
    alert("Veuillez d'abord vous connecter avec votre compte créateur (padoreau85@gmail.com) via 'Connexion' en haut à droite.");
    return;
  }
  const btn = document.getElementById('btn-force-sync');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Synchronisation en cours...</span>`;
  }
  try {
    await pushAllLocalDataToAccountCloud();
    await fetchSupabaseData(true);
    alert(`Synchronisation terminée avec succès 🎉 !\n\n• Questions & Justifications envoyées et synchronisées\n• Trophées & XP à jour (${state.stats.xp || 0} XP, Série ${state.stats.streak || 1}j)\n• Cartes de révision espacée à jour.`);
  } catch (err) {
    alert("Erreur lors de la synchronisation : " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4"></i><span>Synchroniser mon compte maintenant</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }
}
window.forceFullCloudSync = forceFullCloudSync;
window.pushAllLocalDataToAccountCloud = pushAllLocalDataToAccountCloud;

async function syncStatsToCloud() {
  if (!supabaseClient || !state.currentUser) return;
  try {
    const statsPayload = {
      ...state.stats,
      customBadges: state.customBadges || []
    };

    // 1. Sauvegarde dans la table public.profiles
    try {
      const res = await supabaseClient
        .from('profiles')
        .upsert({
          id: state.currentUser.id,
          email: state.currentUser.email,
          role: state.currentRole || 'creator',
          stats: statsPayload
        });
      if (res && res.error) {
        console.warn("Avertissement sync stats profiles:", res.error.message);
      } else {
        console.log("☁️ Stats synchronisées dans profiles pour", state.currentUser.email);
      }
    } catch (profErr) {
      console.warn("Avertissement profiles upsert:", profErr);
    }

    // 2. Sauvegarde directe dans le compte utilisateur auth (100% garanti multi-appareils sans blocage RLS)
    try {
      if (supabaseClient.auth && typeof supabaseClient.auth.updateUser === 'function') {
        await supabaseClient.auth.updateUser({
          data: {
            stats: statsPayload,
            role: state.currentRole || 'creator'
          }
        });
      }
    } catch (authErr) {
      console.warn("Avertissement auth updateUser stats:", authErr);
    }
  } catch (e) {
    console.warn("Erreur sync stats:", e);
  }
}

async function fetchCurrentUserRole() {
  if (!state.currentUser) {
    state.currentRole = 'reader';
    return;
  }
  const email = (state.currentUser.email || '').toLowerCase();
  const isAdminUser = (email === 'padoreau85@gmail.com');
  if (isAdminUser) {
    state.currentRole = 'creator';
  }

  // 1. Extraire les stats directes stockées dans le compte auth Supabase (multi-appareils garanti)
  const metaStats = (state.currentUser.user_metadata && state.currentUser.user_metadata.stats) || {};

  // 2. Restaurer d'abord les stats spécifiques à ce compte depuis localStorage
  const userStatsKey = STORAGE_KEY_STATS + '_' + state.currentUser.id;
  const userStoredStats = localStorage.getItem(userStatsKey);
  let localStats = state.stats || {};
  if (userStoredStats) {
    try {
      localStats = Object.assign(localStats, JSON.parse(userStoredStats));
    } catch(e) {}
  }

  // 3. Charger le profil depuis la table profiles
  let cloudStats = {};
  let cloudProfileRole = null;
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('role, stats')
        .eq('id', state.currentUser.id)
        .maybeSingle();

      if (!error && data) {
        if (data.role) cloudProfileRole = data.role;
        if (data.stats && typeof data.stats === 'object') {
          cloudStats = data.stats;
        }
      }
    } catch (e) {}
  }

  // 3bis. Vérifier si ce compte a reçu une attribution de rôle dans custom_tags (ex: ROLE_CREATOR:email)
  let tagRole = null;
  if (supabaseClient && email) {
    try {
      const { data: creatorTag } = await supabaseClient
        .from('custom_tags')
        .select('name')
        .eq('name', 'ROLE_CREATOR:' + email)
        .maybeSingle();

      if (creatorTag) {
        tagRole = 'creator';
      } else {
        const { data: readerTag } = await supabaseClient
          .from('custom_tags')
          .select('name')
          .eq('name', 'ROLE_READER:' + email)
          .maybeSingle();
        if (readerTag) tagRole = 'reader';
      }
    } catch (tagErr) {}
  }

  // Métadonnées du compte auth Supabase
  const metaRole = (state.currentUser.user_metadata && state.currentUser.user_metadata.role);

  if (isAdminUser || AUTHORIZED_CREATOR_EMAILS.has(email)) {
    state.currentRole = 'creator';
  } else if (tagRole) {
    state.currentRole = tagRole;
  } else if (cloudProfileRole) {
    state.currentRole = cloudProfileRole;
  } else if (metaRole) {
    state.currentRole = metaRole;
  } else {
    state.currentRole = 'reader';
  }

  // 3ter. Enregistrement / mise à jour automatique dans public.profiles pour tout compte connecté
  if (supabaseClient && state.currentUser) {
    try {
      await supabaseClient.from('profiles').upsert({
        id: state.currentUser.id,
        email: state.currentUser.email,
        role: state.currentRole,
        stats: Object.keys(cloudStats).length > 0 ? cloudStats : (state.stats || {})
      });
    } catch (profUpsertErr) {
      console.warn("Profil auto-upsert:", profUpsertErr);
    }
  }

  if (email) {
    addKnownColleague(email, state.currentRole);
  }

  // 4. Fusion robuste : garantir que le créateur principal conserve son palier Niveau 25 (750 XP) partout
  const defaultMinXp = isAdminUser ? 750 : 0;
  const mergedXp = Math.max(cloudStats.xp || 0, metaStats.xp || 0, localStats.xp || 0, defaultMinXp);
  const mergedStreak = Math.max(cloudStats.streak || 1, metaStats.streak || 1, localStats.streak || 1);
  const mergedAnswered = Math.max(cloudStats.totalAnswered || 0, metaStats.totalAnswered || 0, localStats.totalAnswered || 0, isAdminUser ? 12 : 0);
  const mergedCorrect = Math.max(cloudStats.totalCorrect || 0, metaStats.totalCorrect || 0, localStats.totalCorrect || 0, isAdminUser ? 12 : 0);

  state.stats = {
    ...localStats,
    ...metaStats,
    ...cloudStats,
    xp: mergedXp,
    creatorXp: Math.max(cloudStats.creatorXp || 0, metaStats.creatorXp || 0, localStats.creatorXp || 0, isAdminUser ? 60 : 0),
    streak: mergedStreak,
    totalAnswered: mergedAnswered,
    totalCorrect: mergedCorrect,
    unlockedBadges: { ...(cloudStats.unlockedBadges || {}), ...(metaStats.unlockedBadges || {}), ...(localStats.unlockedBadges || {}) },
    badgeHistory: { ...(cloudStats.badgeHistory || {}), ...(metaStats.badgeHistory || {}), ...(localStats.badgeHistory || {}) },
    completedCategories: Array.from(new Set([...(cloudStats.completedCategories || []), ...(metaStats.completedCategories || []), ...(localStats.completedCategories || [])]))
  };

  const allCustomBadges = [...(cloudStats.customBadges || []), ...(metaStats.customBadges || []), ...(state.customBadges || [])];
  if (allCustomBadges.length > 0) {
    const seenBadges = new Set();
    state.customBadges = allCustomBadges.filter(b => {
      if (!b || !b.id || seenBadges.has(b.id)) return false;
      seenBadges.add(b.id);
      return true;
    });
    localStorage.setItem('pathosorus_custom_badges', JSON.stringify(state.customBadges));
  }

  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(state.stats));
  localStorage.setItem(userStatsKey, JSON.stringify(state.stats));
  updateTopBar();
  renderTrophiesView();

  // Mettre à jour immédiatement Supabase avec ces valeurs consolidées
  syncStatsToCloud();
}

// --- CLÉS DE STOCKAGE ET PROGRESSION ISOLÉES PAR COMPTE UTILISATEUR ---
function getUserProgressStorageKey() {
  if (state.currentUser && state.currentUser.id) {
    return 'pathosorus_user_progress_' + state.currentUser.id;
  }
  return 'pathosorus_user_progress_guest';
}

function getDefaultQuestionStats() {
  return {
    seen: 0,
    correct: 0,
    consecutiveCorrect: 0,
    intervalDays: 0,
    lastReviewed: null,
    nextReviewDate: null
  };
}

function resetInMemoryUserProgress() {
  (state.questions || []).forEach(q => {
    q.mastered = false;
    q.flagged = false;
    q.stats = getDefaultQuestionStats();
  });
  state.userProgress = {};
}

function saveLocalUserProgress(q) {
  if (!q || !q.id) return;
  const storageKey = getUserProgressStorageKey();
  let prog = {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) prog = JSON.parse(raw);
  } catch (e) {}

  prog[q.id] = {
    stats: q.stats || getDefaultQuestionStats(),
    mastered: Boolean(q.mastered),
    flagged: Boolean(q.flagged),
    updated_at: new Date().toISOString()
  };
  localStorage.setItem(storageKey, JSON.stringify(prog));
}

async function loadUserProgress() {
  // 1. Restaurer d'abord la progression locale persistante du compte courant
  const storageKey = getUserProgressStorageKey();
  try {
    const rawProg = localStorage.getItem(storageKey);
    if (rawProg) {
      const prog = JSON.parse(rawProg);
      state.questions.forEach(q => {
        if (prog[q.id]) {
          if (prog[q.id].stats) q.stats = Object.assign(q.stats || getDefaultQuestionStats(), prog[q.id].stats);
          if (typeof prog[q.id].mastered !== 'undefined') q.mastered = Boolean(prog[q.id].mastered);
          if (typeof prog[q.id].flagged !== 'undefined') q.flagged = Boolean(prog[q.id].flagged);
        }
      });
      renderSpacedRepetitionDashboard();
      renderBank();
      renderHierarchySelector();
    }
  } catch(e) {}

  if (!supabaseClient || !state.currentUser) return;

  try {
    const { data, error } = await supabaseClient
      .from('user_progress')
      .select('*')
      .eq('user_id', state.currentUser.id);

    if (!error && data && Array.isArray(data)) {
      data.forEach(up => {
        state.userProgress[up.question_id] = up;
        const q = state.questions.find(item => item.id === up.question_id);
        if (q) {
          if (typeof up.mastered !== 'undefined') q.mastered = Boolean(up.mastered);
          if (typeof up.flagged !== 'undefined') q.flagged = Boolean(up.flagged);
          if (up.stats) q.stats = Object.assign(q.stats || getDefaultQuestionStats(), up.stats);
          saveLocalUserProgress(q);
        }
      });
      localStorage.setItem('pathosorus_progress_' + state.currentUser.id, JSON.stringify(state.userProgress));
      renderSpacedRepetitionDashboard();
      renderBank();
      renderHierarchySelector();
    }
  } catch (e) {
    console.warn("Table user_progress non accessible:", e);
  }
}

async function dbSaveUserProgress(q) {
  if (!q || !q.id) return;

  // Persister immédiatement dans le stockage local réservé au compte courant
  saveLocalUserProgress(q);
  saveQuestions();

  if (!state.currentUser) return;

  state.userProgress[q.id] = {
    mastered: Boolean(q.mastered),
    flagged: Boolean(q.flagged),
    stats: q.stats || getDefaultQuestionStats()
  };
  localStorage.setItem('pathosorus_progress_' + state.currentUser.id, JSON.stringify(state.userProgress));

  if (!supabaseClient) return;

  // 1. Sauvegarde dans la table user_progress
  try {
    await supabaseClient.from('user_progress').upsert({
      user_id: state.currentUser.id,
      question_id: q.id,
      mastered: Boolean(q.mastered),
      flagged: Boolean(q.flagged),
      stats: q.stats || getDefaultQuestionStats(),
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn("Erreur sauvegarde progression Supabase user_progress:", e);
  }

  // 2. Sauvegarde directe dans auth.users.user_metadata (100% garanti sans RLS)
  try {
    if (supabaseClient.auth && typeof supabaseClient.auth.updateUser === 'function') {
      await supabaseClient.auth.updateUser({
        data: {
          userProgress: state.userProgress
        }
      });
    }
  } catch (authErr) {
    console.warn("Erreur sauvegarde user_metadata userProgress:", authErr);
  }
}

function updateUserRoleUI() {
  const roleBadge = document.getElementById('user-role-badge');
  const roleDot = document.getElementById('user-role-dot');
  const roleText = document.getElementById('user-role-text');
  const btnAuthToggle = document.getElementById('btn-auth-toggle');
  const authBtnIcon = document.getElementById('auth-btn-icon');
  const authBtnText = document.getElementById('auth-btn-text');
  const btnAccountsModal = document.getElementById('btn-accounts-modal');

  if (state.currentUser) {
    const email = state.currentUser.email || '';
    const emailPrefix = email.split('@')[0];
    if (authBtnIcon) authBtnIcon.setAttribute('data-lucide', 'log-out');
    if (authBtnText) authBtnText.textContent = "Déconnexion";
    if (btnAuthToggle) btnAuthToggle.title = `Déconnecter ${email}`;

    if (isCreator()) {
      if (roleBadge) roleBadge.className = "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-teal-500/20 to-indigo-500/20 border border-teal-500/40 text-teal-300 shadow-sm";
      if (roleDot) roleDot.className = "w-2 h-2 rounded-full bg-teal-400 animate-pulse";
      if (roleText) roleText.textContent = `${emailPrefix} (Créateur 🦖)`;
      if (btnAccountsModal) {
        btnAccountsModal.classList.remove('hidden');
        btnAccountsModal.classList.add('flex');
      }
    } else {
      if (roleBadge) roleBadge.className = "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 border border-sky-500/30 text-sky-300";
      if (roleDot) roleDot.className = "w-2 h-2 rounded-full bg-sky-400";
      if (roleText) roleText.textContent = `${emailPrefix} (Lecteur 📖)`;
      if (btnAccountsModal) {
        btnAccountsModal.classList.add('hidden');
        btnAccountsModal.classList.remove('flex');
      }
    }
  } else {
    if (authBtnIcon) authBtnIcon.setAttribute('data-lucide', 'log-in');
    if (authBtnText) authBtnText.textContent = "Connexion";
    if (btnAuthToggle) btnAuthToggle.title = "Se connecter";
    if (roleBadge) roleBadge.className = "flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400";
    if (roleDot) roleDot.className = "w-2 h-2 rounded-full bg-slate-500";
    if (roleText) roleText.textContent = "Non connecté";
    if (btnAccountsModal) {
      btnAccountsModal.classList.add('hidden');
      btnAccountsModal.classList.remove('flex');
    }
  }

  // Contrôle de l'écran verrouillé sur la vue Créer
  const lockedEl = document.getElementById('view-create-locked');
  const contentEl = document.getElementById('view-create-content');
  if (isReader()) {
    if (lockedEl) lockedEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('hidden');
  } else {
    if (lockedEl) lockedEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');
  }

  renderBank();
  if (window.lucide) lucide.createIcons();
}

function openAuthModal() {
  const modal = document.getElementById('modal-auth');
  const alertBox = document.getElementById('auth-alert-box');
  if (alertBox) alertBox.classList.add('hidden');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  if (window.lucide) lucide.createIcons();
}

function closeAuthModal() {
  const modal = document.getElementById('modal-auth');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function toggleAuthModal() {
  if (state.currentUser) {
    handleAuthLogout();
  } else {
    openAuthModal();
  }
}

function toggleAdminInitView() {
  const panel = document.getElementById('admin-init-panel');
  if (panel) {
    panel.classList.toggle('hidden');
  }
}

async function handleAuthLoginSubmit(e) {
  e.preventDefault();
  if (!supabaseClient) {
    alert("Supabase n'est pas initialisé. Vérifiez vos clés dans config.js.");
    return;
  }

  const emailInput = document.getElementById('auth-input-email');
  const passInput = document.getElementById('auth-input-password');
  const alertBox = document.getElementById('auth-alert-box');
  const btn = document.getElementById('btn-auth-submit');

  const email = (emailInput.value || '').trim();
  const password = passInput.value || '';

  if (!email || !password) return;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Connexion en cours...</span>`;
  }
  if (alertBox) alertBox.classList.add('hidden');

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    state.currentUser = data.user;
    await fetchCurrentUserRole();
    updateUserRoleUI();
    closeAuthModal();

    const roleStr = isCreator() ? "Créateur 🦖" : "Lecteur 📖";
    alert(`Bienvenue ${email} !\nConnecté avec succès en tant que ${roleStr}.`);

    // Synchronisation complète des questions et de la progression de ce compte
    await fetchSupabaseData(true);
    await syncLocalProgressToCloud();
  } catch (err) {
    console.error("Erreur connexion:", err);
    if (alertBox) {
      alertBox.className = "p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start space-x-2";
      alertBox.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 shrink-0 mt-0.5"></i><span>${err.message || "Identifiants invalides."}</span>`;
      alertBox.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i><span>Se connecter</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

async function handleAuthLogout() {
  if (!confirm("Voulez-vous vous déconnecter de PathoSorus ?")) return;
  if (state.currentUser) {
    saveStats();
    await syncLocalProgressToCloud();
  }
  if (supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {
      console.warn("Erreur signOut:", e);
    }
  }
  state.currentUser = null;
  state.currentRole = 'reader';

  // 1. Réinitialiser la progression des révisions en mémoire (évite toute fuite entre comptes)
  resetInMemoryUserProgress();
  saveQuestions();

  // 2. Réinitialiser les statistiques vers un profil visiteur propre
  state.stats = {
    xp: 0,
    creatorXp: 0,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalAnswered: 0,
    totalCorrect: 0,
    completedCategories: [],
    unlockedBadges: {},
    badgeHistory: {}
  };
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(state.stats));
  updateUserRoleUI();
  updateTopBar();
  renderSpacedRepetitionDashboard();
  renderBank();
  renderHierarchySelector();
  renderTrophiesView();

  alert("Vous êtes maintenant déconnecté.");
  switchTab('play');
}

async function handleMasterAdminSignUp() {
  const passInput = document.getElementById('auth-input-password');
  const password = passInput.value || '';
  if (!password || password.length < 6) {
    alert("Veuillez renseigner un mot de passe d'au moins 6 caractères dans le champ Mot de passe.");
    passInput.focus();
    return;
  }

  if (!confirm("Créer le compte Administrateur Master pour padoreau85@gmail.com ?")) return;

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: 'padoreau85@gmail.com',
      password: password,
      options: {
        data: { role: 'creator' }
      }
    });
    if (error) throw error;
    alert("Compte Administrateur padoreau85@gmail.com initialisé !\nSi l'e-mail de confirmation est requis, validez-le, sinon connectez-vous directement.");
  } catch (err) {
    alert("Erreur lors de la création master : " + err.message);
  }
}

// --- GESTION DES COMPTES COLLÈGUES ---

function openAccountsModal() {
  if (!isCreator()) {
    alert("Accès réservé aux comptes Créateurs.");
    return;
  }
  const modal = document.getElementById('modal-accounts');
  const alertBox = document.getElementById('acc-create-alert');
  const promoteAlertBox = document.getElementById('promote-alert-box');
  if (alertBox) alertBox.classList.add('hidden');
  if (promoteAlertBox) promoteAlertBox.classList.add('hidden');

  const sKeyInput = document.getElementById('input-local-service-key');
  if (sKeyInput) {
    sKeyInput.value = localStorage.getItem('pathosorus_service_key') || '';
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    switchAccountModalTab('list');
  }
  if (window.lucide) lucide.createIcons();
}

function closeAccountsModal() {
  const modal = document.getElementById('modal-accounts');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function switchAccountModalTab(tab) {
  const views = ['list', 'create', 'settings'];
  views.forEach(v => {
    const el = document.getElementById('acc-view-' + v);
    const btn = document.getElementById('tab-btn-acc-' + v);
    if (el) el.classList.add('hidden');
    if (btn) {
      btn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition";
    }
  });

  const targetView = document.getElementById('acc-view-' + tab);
  const targetBtn = document.getElementById('tab-btn-acc-' + tab);
  if (targetView) targetView.classList.remove('hidden');
  if (targetBtn) {
    targetBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-indigo-600 shadow-sm transition";
  }

  if (tab === 'list') {
    loadColleaguesList();
  }
  if (window.lucide) lucide.createIcons();
}

function generateColleaguePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#$*";
  let pass = "Patho";
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const passInput = document.getElementById('colleague-password');
  if (passInput) passInput.value = pass;
}

async function handleCreateColleagueSubmit(e) {
  e.preventDefault();
  if (!isCreator()) {
    alert("Action réservée aux créateurs.");
    return;
  }

  const emailInput = document.getElementById('colleague-email');
  const passInput = document.getElementById('colleague-password');
  const roleRadio = document.querySelector('input[name="colleague-role"]:checked');
  const alertBox = document.getElementById('acc-create-alert');
  const btn = document.getElementById('btn-colleague-submit');

  const email = (emailInput.value || '').trim().toLowerCase();
  const password = passInput.value || '';
  const role = roleRadio ? roleRadio.value : 'reader';

  if (!email || !password) return;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Création en cours...</span>`;
  }
  if (alertBox) alertBox.classList.add('hidden');

  try {
    const result = await createColleagueAccount(email, password, role);
    try {
      await setColleagueRole(email, role);
    } catch(e) {}

    if (alertBox) {
      alertBox.className = "p-3.5 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start space-x-2";
      alertBox.innerHTML = `
        <i data-lucide="check-circle" class="w-4 h-4 shrink-0 mt-0.5"></i>
        <div>
          <strong>Succès !</strong> ${result.message}<br>
          <span class="text-[11px] text-slate-300 mt-1 block">
            Identifiants pour votre collègue :<br>
            • E-mail : <code class="text-teal-300 font-mono">${email}</code><br>
            • Mot de passe : <code class="text-teal-300 font-mono">${password}</code><br>
            • Droits : <strong>${role === 'creator' ? 'Rédacteur (Créateur) 🦖' : 'Lecteur 📖'}</strong>
          </span>
        </div>
      `;
      alertBox.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
    emailInput.value = "";
    passInput.value = "";
  } catch (err) {
    console.error("Erreur création compte collègue:", err);
    if (alertBox) {
      alertBox.className = "p-3.5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start space-x-2";
      alertBox.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 shrink-0 mt-0.5"></i><div><strong>Échec :</strong> ${err.message}</div>`;
      alertBox.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4"></i><span>Créer l'accès pour ce collègue</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

async function createColleagueAccount(email, password, role) {
  let token = "";
  if (supabaseClient) {
    const { data: sess } = await supabaseClient.auth.getSession();
    token = sess && sess.session ? sess.session.access_token : "";
  }

  const localServiceKey = localStorage.getItem('pathosorus_service_key') || "";

  // 1. Appel vers la fonction serveur Netlify ou serveur local python
  try {
    const res = await fetch("/.netlify/functions/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? ("Bearer " + token) : "",
        "x-service-key": localServiceKey
      },
      body: JSON.stringify({ email, password, role, serviceRoleKey: localServiceKey })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else if (res.status !== 404) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Erreur serveur (${res.status})`);
    }
  } catch (netErr) {
    if (netErr.message && !netErr.message.includes("404") && !netErr.message.includes("Failed to fetch")) {
      throw netErr;
    }
  }

  // 2. Si serveur statique pur sans proxy mais avec clé service_role renseignée
  const { url } = getSupabaseCredentials();
  if (localServiceKey && url) {
    const adminRes = await fetch(url.replace(/\/$/, "") + "/auth/v1/admin/users", {
      method: "POST",
      headers: {
        "apikey": localServiceKey,
        "Authorization": "Bearer " + localServiceKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { role }
      })
    });

    const payload = await adminRes.json().catch(() => ({}));
    if (!adminRes.ok) {
      throw new Error(payload.msg || payload.message || "Erreur Supabase Admin");
    }

    if (payload.id) {
      await fetch(url.replace(/\/$/, "") + "/rest/v1/profiles", {
        method: "POST",
        headers: {
          "apikey": localServiceKey,
          "Authorization": "Bearer " + localServiceKey,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({ id: payload.id, email, role })
      });
    }

    return {
      success: true,
      message: `Compte ${role === 'creator' ? 'Créateur' : 'Lecteur'} créé directement avec succès !`
    };
  }

  // 3. Fallback client-side signUp
  const { key } = getSupabaseCredentials();
  if (window.supabase && url && key) {
    const tempSb = window.supabase.createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await tempSb.auth.signUp({
      email,
      password,
      options: { data: { role } }
    });
    if (error) throw error;
    return {
      success: true,
      message: `Compte créé via SignUp pour ${email}. Si la confirmation d'e-mail est requise sur Supabase, le collègue recevra un e-mail.`
    };
  }

  throw new Error("Impossible d'accéder au service de création de compte. Lancez l'application via Lancer-Local.command ou fournissez la clé Service Role.");
}

function addKnownColleague(email, role) {
  try {
    email = (email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    const key = 'pathosorus_known_colleagues';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = list.findIndex(c => c && c.email && c.email.toLowerCase() === email);
    if (idx >= 0) {
      list[idx].role = role;
      list[idx].updatedAt = new Date().toISOString();
    } else {
      list.push({ email, role, addedAt: new Date().toISOString() });
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {}
}

async function setColleagueRole(email, newRole) {
  email = (email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error("Veuillez saisir une adresse e-mail valide.");
  }
  if (!isCreator()) {
    throw new Error("Action réservée aux créateurs.");
  }
  if (email === 'padoreau85@gmail.com') {
    throw new Error("Le rôle du créateur master padoreau85@gmail.com est toujours Créateur.");
  }

  // 1. Sauvegarder dans custom_tags (partagé dans Supabase pour tous les utilisateurs sans contrainte de clé étrangère)
  if (supabaseClient) {
    try {
      if (newRole === 'creator') {
        await supabaseClient.from('custom_tags').upsert({ name: 'ROLE_CREATOR:' + email });
        await supabaseClient.from('custom_tags').delete().eq('name', 'ROLE_READER:' + email);
      } else {
        await supabaseClient.from('custom_tags').upsert({ name: 'ROLE_READER:' + email });
        await supabaseClient.from('custom_tags').delete().eq('name', 'ROLE_CREATOR:' + email);
      }
    } catch (tagErr) {
      console.warn("Avertissement sync custom_tags role:", tagErr);
    }

    // 2. Si le profil existe déjà dans profiles, le mettre à jour
    try {
      const { data: profs } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .ilike('email', email);

      if (profs && profs.length > 0) {
        for (const p of profs) {
          await supabaseClient.from('profiles').update({ role: newRole }).eq('id', p.id);
        }
      }
    } catch (profErr) {
      console.warn("Avertissement profiles update role:", profErr);
    }
  }

  // 3. Mémoriser localement
  addKnownColleague(email, newRole);

  return true;
}

async function handlePromoteColleagueSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('input-promote-email');
  const roleSelect = document.getElementById('select-promote-role');
  const alertBox = document.getElementById('promote-alert-box');
  const btn = document.getElementById('btn-promote-submit');

  const email = (input ? input.value : '').trim().toLowerCase();
  const role = (roleSelect ? roleSelect.value : 'creator');

  if (!email || !email.includes('@')) {
    alert("Veuillez saisir une adresse e-mail valide.");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Application...</span>`;
  }
  if (alertBox) alertBox.classList.add('hidden');

  try {
    await setColleagueRole(email, role);
    if (alertBox) {
      alertBox.className = "p-3 rounded-xl text-xs bg-teal-500/10 border border-teal-500/30 text-teal-300 flex items-start space-x-2";
      alertBox.innerHTML = `
        <i data-lucide="check-circle" class="w-4 h-4 shrink-0 mt-0.5"></i>
        <div>
          <strong>Rôle attribué avec succès !</strong><br>
          Le compte <code class="text-teal-200 font-mono">${escapeHtml(email)}</code> dispose désormais des droits <strong>${role === 'creator' ? 'Rédacteur / Créateur 🦖' : 'Lecteur 📖'}</strong>.
          <span class="block text-[11px] text-slate-400 mt-1">Actif immédiatement sur tous ses appareils dès connexion ou actualisation.</span>
        </div>
      `;
      alertBox.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
    if (input) input.value = '';
    await loadColleaguesList();
  } catch (err) {
    if (alertBox) {
      alertBox.className = "p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start space-x-2";
      alertBox.innerHTML = `
        <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0 mt-0.5"></i>
        <div><strong>Erreur :</strong> ${escapeHtml(err.message)}</div>
      `;
      alertBox.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Attribuer le rôle</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

async function toggleColleagueRole(email, newRole) {
  if (!isCreator()) {
    alert("Action réservée aux créateurs.");
    return;
  }
  const roleLabel = (newRole === 'creator') ? 'Rédacteur (Créateur) 🦖' : 'Lecteur 📖';
  if (!confirm(`Voulez-vous passer le compte ${email} en rôle "${roleLabel}" ?`)) return;

  try {
    await setColleagueRole(email, newRole);
    alert(`Rôle mis à jour avec succès : ${email} est désormais ${roleLabel} !`);
    await loadColleaguesList();
  } catch (e) {
    alert("Erreur lors de la mise à jour du rôle : " + e.message);
  }
}

async function loadColleaguesList() {
  const container = document.getElementById('colleagues-list-container');
  if (!container) return;
  container.innerHTML = `<div class="text-center py-6 text-slate-500 text-xs flex items-center justify-center space-x-2">
    <div class="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
    <span>Chargement des comptes...</span>
  </div>`;

  const accountsMap = new Map();

  // 0. Compte Master padoreau85@gmail.com et Rédacteurs autorisés
  accountsMap.set('padoreau85@gmail.com', {
    email: 'padoreau85@gmail.com',
    role: 'creator',
    isMaster: true,
    source: 'master'
  });
  accountsMap.set('belhadef.samy@gmail.com', {
    email: 'belhadef.samy@gmail.com',
    role: 'creator',
    source: 'creator'
  });

  // 1. Lire les tags de rôle dans custom_tags
  if (supabaseClient) {
    try {
      const { data: tagsData } = await supabaseClient
        .from('custom_tags')
        .select('name')
        .or('name.like.ROLE_CREATOR:%,name.like.ROLE_READER:%');

      if (tagsData && Array.isArray(tagsData)) {
        tagsData.forEach(t => {
          if (t.name.startsWith('ROLE_CREATOR:')) {
            const email = t.name.replace('ROLE_CREATOR:', '').trim().toLowerCase();
            if (email && email.includes('@')) {
              accountsMap.set(email, { email, role: 'creator', source: 'tag' });
            }
          } else if (t.name.startsWith('ROLE_READER:')) {
            const email = t.name.replace('ROLE_READER:', '').trim().toLowerCase();
            if (email && email.includes('@')) {
              accountsMap.set(email, { email, role: 'reader', source: 'tag' });
            }
          }
        });
      }
    } catch (e) {
      console.warn("custom_tags lecture rôles:", e);
    }
  }

  // 2. Lire les comptes mémorisés localement
  try {
    const localKnown = JSON.parse(localStorage.getItem('pathosorus_known_colleagues') || '[]');
    if (Array.isArray(localKnown)) {
      localKnown.forEach(c => {
        if (c && c.email) {
          const em = c.email.trim().toLowerCase();
          if (em && !accountsMap.has(em)) {
            accountsMap.set(em, { email: em, role: c.role || 'reader', source: 'local' });
          }
        }
      });
    }
  } catch(e) {}

  // 3. Lire les profils de Supabase
  if (supabaseClient) {
    try {
      const { data: profs, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profs && Array.isArray(profs)) {
        profs.forEach(p => {
          if (p && p.email) {
            const em = p.email.trim().toLowerCase();
            const existing = accountsMap.get(em) || {};
            accountsMap.set(em, {
              ...existing,
              id: p.id,
              email: em,
              role: p.role || existing.role || 'reader',
              stats: p.stats,
              created_at: p.created_at,
              source: 'profile'
            });
          }
        });
      }
    } catch (e) {
      console.warn("profiles lecture:", e);
    }
  }

  const accounts = Array.from(accountsMap.values());

  if (accounts.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs">Aucun collègue enregistré pour l'instant. Utilisez le champ ci-dessus pour ajouter un compte.</div>`;
    return;
  }

  // Trier : Master en tête, puis créateurs, puis lecteurs
  accounts.sort((a, b) => {
    if (a.email === 'padoreau85@gmail.com') return -1;
    if (b.email === 'padoreau85@gmail.com') return 1;
    if (a.role === 'creator' && b.role !== 'creator') return -1;
    if (a.role !== 'creator' && b.role === 'creator') return 1;
    return a.email.localeCompare(b.email);
  });

  const currentUserEmail = (state.currentUser && state.currentUser.email) ? state.currentUser.email.toLowerCase() : '';

  container.innerHTML = accounts.map(u => {
    const isMaster = (u.email === 'padoreau85@gmail.com');
    const isUserCreator = (u.role === 'creator') || isMaster;
    const isSelf = (currentUserEmail && currentUserEmail === u.email);
    const xp = (u.stats && typeof u.stats.xp === 'number') ? u.stats.xp : null;

    return `
      <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
        <div class="flex items-center space-x-2.5 min-w-0">
          <div class="w-8 h-8 shrink-0 rounded-xl ${isUserCreator ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'} flex items-center justify-center font-bold text-sm shadow-sm">
            ${isUserCreator ? '🦖' : '📖'}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-white flex items-center space-x-1.5 truncate">
              <span class="truncate">${escapeHtml(u.email)}</span>
              ${isMaster ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Master</span>' : ''}
              ${isSelf && !isMaster ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Vous</span>' : ''}
            </div>
            <div class="text-[11px] flex items-center space-x-2 mt-0.5">
              <span class="font-semibold ${isUserCreator ? 'text-teal-400' : 'text-sky-400'}">
                ${isUserCreator ? '🦖 Rédacteur (Créateur)' : '📖 Lecteur'}
              </span>
              ${xp !== null ? `<span class="text-slate-500">• ${xp} XP</span>` : ''}
            </div>
          </div>
        </div>

        <div class="shrink-0 flex items-center space-x-1.5">
          ${!isMaster ? `
            <button type="button" onclick="toggleColleagueRole('${escapeHtml(u.email)}', '${isUserCreator ? 'reader' : 'creator'}')" class="px-2.5 py-1.5 rounded-xl ${
              isUserCreator
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40'
            } text-xs font-bold transition flex items-center space-x-1 shadow-sm">
              <i data-lucide="${isUserCreator ? 'user-minus' : 'shield-check'}" class="w-3.5 h-3.5"></i>
              <span>${isUserCreator ? 'Passer en Lecteur' : 'Passer en Rédacteur 🦖'}</span>
            </button>
          ` : `
            <span class="text-[10px] text-slate-500 font-mono px-2 py-1">Admin Principal</span>
          `}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function saveLocalServiceKey() {
  const input = document.getElementById('input-local-service-key');
  const key = input ? input.value.trim() : '';
  if (!key) {
    alert("Veuillez saisir une clé.");
    return;
  }
  localStorage.setItem('pathosorus_service_key', key);
  alert("Clé Service Role enregistrée en local sur ce navigateur !");
}

function clearLocalServiceKey() {
  localStorage.removeItem('pathosorus_service_key');
  const input = document.getElementById('input-local-service-key');
  if (input) input.value = '';
  alert("Clé Service Role locale effacée.");
}

// --- APERÇU DÉTAILS DE LA QUESTION (POUR LECTEURS ET CRÉATEURS) ---

function openQuestionDetail(id) {
  const q = state.questions.find(item => item.id === id);
  if (!q) return;

  const modal = document.getElementById('modal-question-detail');
  if (!modal) return;

  const formatBadge = document.getElementById('detail-format-badge');
  const isOpen = (q.format === 'ouverte');
  const isQCM = (q.format === 'qcm');
  if (formatBadge) {
    if (isOpen) {
      formatBadge.textContent = "✍️ Question Ouverte";
      formatBadge.className = "text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30";
    } else if (isQCM) {
      formatBadge.textContent = "☑️ QCM";
      formatBadge.className = "text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30";
    } else {
      formatBadge.textContent = q.format === 'piege' ? '⚠️ Vrai/Faux' : '🔘 QCU';
      formatBadge.className = "text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30";
    }
  }

  const hierarchyBadge = document.getElementById('detail-hierarchy-badge');
  if (hierarchyBadge) {
    hierarchyBadge.textContent = `${q.organ} > ${q.category} > ${q.entity}`;
  }

  document.getElementById('detail-question-text').textContent = q.question;

  const contextBox = document.getElementById('detail-context-box');
  if (contextBox) {
    if (q.context && q.context.trim()) {
      contextBox.textContent = q.context;
      contextBox.classList.remove('hidden');
    } else {
      contextBox.classList.add('hidden');
    }
  }

  const photoGallery = document.getElementById('detail-photos-gallery');
  const photosContainer = document.getElementById('detail-photos-container');
  if (photoGallery && photosContainer) {
    if (q.images && q.images.length > 0) {
      photoGallery.classList.remove('hidden');
      photosContainer.innerHTML = q.images.map(img => `
        <div class="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-800" onclick="openLightbox('${img.url}', '${escapeJsString(img.caption || q.entity)}')">
          <img src="${img.url}" alt="${escapeHtml(img.caption || '')}" class="w-full h-28 object-cover group-hover:scale-105 transition duration-300">
          ${img.caption ? `<div class="p-1 text-[10px] bg-slate-900/90 text-slate-300 truncate">${escapeHtml(img.caption)}</div>` : ''}
        </div>
      `).join('');
    } else {
      photoGallery.classList.add('hidden');
    }
  }

  const optionsLabel = document.getElementById('detail-options-label');
  const optionsContainer = document.getElementById('detail-options-container');
  if (optionsContainer) {
    if (isOpen) {
      if (optionsLabel) optionsLabel.textContent = "Formulations diagnostiques acceptées :";
      const accepted = getQuestionAcceptedAnswers(q);
      optionsContainer.innerHTML = `
        <div class="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5">
          <div class="text-xs text-amber-300 font-semibold flex items-center space-x-1.5">
            <i data-lucide="check-check" class="w-4 h-4 text-amber-400"></i>
            <span>Termes diagnostiques validés pour cette question :</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${accepted.map((ans, idx) => `
              <span class="px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${
                idx === 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 text-teal-300 border border-slate-700'
              }">
                ${escapeHtml(ans)} ${idx === 0 ? '⭐ (Diagnostic principal)' : ''}
              </span>
            `).join('')}
          </div>
          <p class="text-[11px] text-slate-400">Lors de l'entraînement, la comparaison est tolérante aux majuscules, accents et tirets.</p>
        </div>
      `;
    } else {
      if (optionsLabel) optionsLabel.textContent = "Choix & Réponses :";
      optionsContainer.innerHTML = (q.options || []).map((opt, idx) => {
        const isCorrect = (q.correct || []).includes(idx);
        const letter = String.fromCharCode(65 + idx);
        const exps = (Array.isArray(q.optionExplanations) && q.optionExplanations.length > 0)
          ? q.optionExplanations
          : (Array.isArray(q.optionexplanations) ? q.optionexplanations : []);
        const itemExp = (exps && exps[idx]) ? exps[idx].trim() : '';
        return `
          <div class="space-y-1.5">
            <div class="flex items-center space-x-2.5 p-3 rounded-xl border text-xs font-medium ${
              isCorrect
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }">
              <span class="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }">${letter}</span>
              <i data-lucide="${isCorrect ? 'check-circle' : 'circle'}" class="w-4 h-4 ${isCorrect ? 'text-emerald-400' : 'text-slate-600'} shrink-0"></i>
              <span class="flex-1">${escapeHtml(opt)}</span>
              ${isCorrect ? `<span class="text-[10px] uppercase font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">Bonne Réponse</span>` : ''}
            </div>
            ${itemExp ? `
              <div class="ml-6 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-start space-x-2">
                <i data-lucide="lightbulb" class="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0"></i>
                <div class="flex-1 leading-relaxed">
                  <span class="font-bold text-amber-300">Justification ${letter} :</span>
                  <span class="text-slate-300 ml-1">${escapeHtml(itemExp)}</span>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  }

  const expContainer = document.getElementById('detail-explanation-container');
  const expText = document.getElementById('detail-explanation-text');
  const expImgsContainer = document.getElementById('detail-explanation-images-container');
  const hasExpText = Boolean(q.explanation && q.explanation.trim());
  const hasExpImgs = Boolean(q.explanationImages && q.explanationImages.length > 0);

  if (expContainer) {
    if (hasExpText || hasExpImgs) {
      expContainer.classList.remove('hidden');
      if (expText) {
        expText.textContent = q.explanation || '';
        expText.style.display = hasExpText ? 'block' : 'none';
      }
      if (expImgsContainer) {
        if (hasExpImgs) {
          expImgsContainer.classList.remove('hidden');
          expImgsContainer.innerHTML = q.explanationImages.map((img, idx) => `
            <div class="relative group cursor-pointer overflow-hidden rounded-xl border border-teal-500/30 hover:border-teal-400/60 bg-slate-900 transition" onclick="openLightbox('${img.url}', '${escapeJsString(img.caption || 'Schéma explicatif ' + (idx + 1))}')">
              <img src="${img.url}" alt="${escapeHtml(img.caption || 'Illustration')}" class="w-full h-24 object-cover group-hover:scale-105 transition duration-300">
              ${img.caption ? `<div class="p-1 text-[10px] bg-slate-950/90 text-teal-300 truncate">${escapeHtml(img.caption)}</div>` : ''}
            </div>
          `).join('');
        } else {
          expImgsContainer.classList.add('hidden');
          expImgsContainer.innerHTML = '';
        }
      }
    } else {
      expContainer.classList.add('hidden');
      if (expText) expText.textContent = '';
      if (expImgsContainer) {
        expImgsContainer.classList.add('hidden');
        expImgsContainer.innerHTML = '';
      }
    }
  }
  
  const trapContainer = document.getElementById('detail-trap-container');
  const trapText = document.getElementById('detail-trap-text');
  if (trapContainer && trapText) {
    if (q.trap && q.trap.trim()) {
      trapText.textContent = q.trap;
      trapContainer.classList.remove('hidden');
    } else {
      trapContainer.classList.add('hidden');
    }
  }

  const tagsContainer = document.getElementById('detail-tags-container');
  if (tagsContainer) {
    tagsContainer.innerHTML = (q.tags || []).map(t => `<span class="text-[10px] text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full font-mono border border-teal-500/20">#${escapeHtml(t)}</span>`).join('');
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}

function closeQuestionDetailModal() {
  const modal = document.getElementById('modal-question-detail');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function fetchSupabaseData(silent = false) {
  if (!supabaseClient) return;
  try {
    const promises = [
      supabaseClient.from('questions').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('cases').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('custom_tags').select('*').order('created_at', { ascending: true })
    ];

    if (state.currentUser && state.currentUser.id) {
      promises.push(
        supabaseClient.from('user_progress').select('*').eq('user_id', state.currentUser.id)
      );
    }

    const [qRes, cRes, tRes, upRes] = await Promise.all(promises);

    const cloudProgressMap = new Map();
    // 1. Depuis la table user_progress
    if (upRes && !upRes.error && upRes.data && Array.isArray(upRes.data)) {
      upRes.data.forEach(up => {
        cloudProgressMap.set(up.question_id, up);
        state.userProgress[up.question_id] = up;
      });
    }

    // 2. Depuis les métadonnées auth du compte (garantie multi-postes instantanée)
    if (state.currentUser && state.currentUser.user_metadata && state.currentUser.user_metadata.userProgress) {
      const metaProg = state.currentUser.user_metadata.userProgress;
      Object.keys(metaProg).forEach(qId => {
        if (!cloudProgressMap.has(qId)) {
          cloudProgressMap.set(qId, metaProg[qId]);
          state.userProgress[qId] = metaProg[qId];
        }
      });
    }

    if (state.currentUser) {
      localStorage.setItem('pathosorus_progress_' + state.currentUser.id, JSON.stringify(state.userProgress));
    }

    if (!qRes.error && qRes.data) {
      // Conserver une trace brute et intacte de Supabase pour vérifier les colonnes réellement vides
      const rawCloudQuestionsMap = new Map((qRes.data || []).map(item => [item.id, item]));

      // 1. Sauvegarder la mémoire locale pour éviter toute perte de notes
      const localQuestionMap = new Map();
      (state.questions || []).forEach(oldQ => {
        if (oldQ && oldQ.id) {
          localQuestionMap.set(oldQ.id, oldQ);
        }
      });

      // Récupérer la progression locale STRICTEMENT liée à l'utilisateur courant (ou invité)
      const userStorageKey = getUserProgressStorageKey();
      let storedProgress = {};
      try {
        const raw = localStorage.getItem(userStorageKey);
        if (raw) storedProgress = JSON.parse(raw);
      } catch (e) {}

      const isMainCreator = state.currentUser && state.currentUser.email && state.currentUser.email.toLowerCase() === 'padoreau85@gmail.com';

      const cloudQuestions = qRes.data.map(q => {
        const cloudProg = cloudProgressMap.get(q.id);
        const localProg = storedProgress[q.id];
        const localQ = localQuestionMap.get(q.id);
        
        let stats = getDefaultQuestionStats();
        let mastered = false;
        let flagged = false;

        // RÈGLE FONDAMENTALE D'ISOLATION DES COMPTES :
        // La progression personnelle (intervalles, révisions, maîtrisées) provient en priorité
        // de user_progress du compte connecté, ou du cache local réservé à cet utilisateur.
        if (cloudProg) {
          mastered = Boolean(cloudProg.mastered);
          flagged = Boolean(cloudProg.flagged);
          if (cloudProg.stats) stats = { ...stats, ...cloudProg.stats };
        } else if (localProg) {
          if (localProg.stats) stats = { ...stats, ...localProg.stats };
          if (typeof localProg.mastered !== 'undefined') mastered = Boolean(localProg.mastered);
          if (typeof localProg.flagged !== 'undefined') flagged = Boolean(localProg.flagged);
        } else if (isMainCreator && q.stats && (q.stats.seen > 0 || q.stats.lastReviewed)) {
          // Filet de sécurité pour le compte créateur principal : récupérer l'historique initial de la banque
          stats = { ...stats, ...q.stats };
          if (typeof q.mastered !== 'undefined') mastered = Boolean(q.mastered);
          if (typeof q.flagged !== 'undefined') flagged = Boolean(q.flagged);
        }

        // Si la session locale a une révision encore plus récente pour ce même utilisateur
        if (cloudProg && localProg && localProg.stats && (localProg.stats.seen || 0) > (stats.seen || 0)) {
          stats = { ...stats, ...localProg.stats };
          if (typeof localProg.mastered !== 'undefined') mastered = Boolean(localProg.mastered);
          if (typeof localProg.flagged !== 'undefined') flagged = Boolean(localProg.flagged);
        }

        // Récupérer optionExplanations depuis la colonne Supabase (optionexplanations ou optionExplanations)
        let optExp = (Array.isArray(q.optionexplanations) && q.optionexplanations.length > 0)
          ? q.optionexplanations
          : ((Array.isArray(q.optionExplanations) && q.optionExplanations.length > 0) ? q.optionExplanations : []);

        // Filet de sécurité local : si le Cloud a renvoyé des explications vides mais que le navigateur local avait déjà des explications renseignées, préserver les notes locales !
        if ((!optExp || optExp.length === 0 || optExp.every(e => !e || !e.trim())) && localQ) {
          const localExp = (Array.isArray(localQ.optionExplanations) && localQ.optionExplanations.length > 0)
            ? localQ.optionExplanations
            : (Array.isArray(localQ.optionexplanations) ? localQ.optionexplanations : []);
          if (localExp.some(e => e && e.trim())) {
            optExp = localExp;
          }
        }

        // Filet spécifique CIN-3 (q_1792663474345) si vide sur Supabase : justifications médicales exhaustives
        if (q.id === 'q_1792663474345' && (!optExp || optExp.length === 0 || optExp.every(e => !e || !e.trim()))) {
          optExp = [
            "Faux : L'atteinte limitée aux 2/3 inférieurs caractérise le CIN-2. Dans le CIN-3 (haut grade), la désorganisation architecturale et les atypies cytonucléaires intéressent toute la hauteur (ou >2/3) de l'épithélium malpighien.",
            "Faux : L'IHC p16INK4a montre un marquage diffus et intense « en bloc » (nucléaire et cytoplasmique continu sur au moins le tiers inférieur), traduisant l'inactivation de pRb par l'oncoprotéine E7 des HPV à haut risque.",
            "Faux : Les koïlocytes correspondent à l'effet cytopathogène du HPV (Human Papillomavirus), et non du virus HSV.",
            "Faux : La zone de jonction pavimento-cylindrique (zone de transformation) est le site électif de vulnérabilité et de développement des NIEM / CIN.",
            "Vrai : Toutes les propositions précédentes comportent des erreurs, ce qui fait de cette assertion la seule réponse exacte."
          ];
        }

        const expImgs = (Array.isArray(q.explanationimages) && q.explanationimages.length > 0)
          ? q.explanationimages
          : ((Array.isArray(q.explanationImages) && q.explanationImages.length > 0) ? q.explanationImages : (localQ?.explanationImages || []));

        const accAns = (Array.isArray(q.acceptedanswers) && q.acceptedanswers.length > 0)
          ? q.acceptedanswers
          : ((Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0) ? q.acceptedAnswers : (q.format === 'ouverte' ? (q.options || []) : []));

        const diff = q.difficulty || (q.stats && q.stats.difficulty) || 'facile';
        const extClues = q.extremeClues || q.extremeclues || (q.stats && q.stats.extremeClues) || '';
        const author = (q.stats && q.stats.created_by) || q.created_by || (localQ && localQ.created_by) || (q.id === 'q_1792671361751' ? 'belhadef.samy@gmail.com' : 'padoreau85@gmail.com');

        return {
          ...q,
          created_by: author,
          options: q.options || [],
          correct: Array.isArray(q.correct) ? q.correct : (typeof q.correct === 'number' ? [q.correct] : []),
          optionExplanations: optExp,
          optionexplanations: optExp,
          acceptedAnswers: accAns,
          acceptedanswers: accAns,
          tags: q.tags || [],
          images: q.images || [],
          explanationImages: expImgs,
          explanationimages: expImgs,
          difficulty: diff,
          extremeClues: extClues,
          stats,
          mastered,
          flagged
        };
      });

      // Fusion intelligente : Ne JAMAIS écraser les questions créées localement qui ne sont pas encore sur Supabase
      const cloudIds = new Set(cloudQuestions.map(q => q.id));
      const localOnlyQuestions = (state.questions || []).filter(q => !cloudIds.has(q.id));

      state.questions = [...cloudQuestions, ...localOnlyQuestions];
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(state.questions));

      // Sauvegarder dans le cache local propre à cet utilisateur pour la répétition espacée
      const syncProg = {};
      state.questions.forEach(q => {
        if (q.stats && (q.stats.seen > 0 || q.stats.lastReviewed || q.stats.nextReviewDate || q.mastered || q.flagged)) {
          syncProg[q.id] = { stats: q.stats, mastered: Boolean(q.mastered), flagged: Boolean(q.flagged) };
        }
      });
      localStorage.setItem(userStorageKey, JSON.stringify(syncProg));
    }

    if (!cRes.error && cRes.data) {
      state.cases = cRes.data.map(c => ({
        ...c,
        tags: c.tags || [],
        steps: c.steps || []
      }));
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(state.cases));
    }

    if (!tRes.error && tRes.data && tRes.data.length > 0) {
      state.customTags = tRes.data.map(t => t.name).filter(n => n && !n.startsWith('ROLE_'));
      localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(state.customTags));
    }

    // Récupérer les trophées personnalisés s'ils existent sur Supabase
    try {
      const bRes = await supabaseClient.from('custom_badges').select('*');
      if (!bRes.error && bRes.data && Array.isArray(bRes.data)) {
        const cloudIds = new Set(bRes.data.map(b => b.id));
        const localOnly = (state.customBadges || []).filter(b => !cloudIds.has(b.id));
        state.customBadges = [...bRes.data, ...localOnly];
        localStorage.setItem('pathosorus_custom_badges', JSON.stringify(state.customBadges));
      }
    } catch(e) {}

    updateTopBar();
    renderHierarchySelector();
    renderTagsCloud();
    renderDPCardsOnPlay();
    renderSpacedRepetitionDashboard();
    renderBank();
    checkAndUnlockBadges();
    renderTrophiesView();

    // Auto-push vers Supabase : si des questions ont des justifications locales mais vides sur Supabase
    if (state.currentUser && isCreator() && qRes.data) {
      const rawCloudMap = new Map(qRes.data.map(item => [item.id, item]));
      const needSync = state.questions.filter(q => {
        const hasNotes = Array.isArray(q.optionExplanations) && q.optionExplanations.some(e => e && e.trim());
        const rawQ = rawCloudMap.get(q.id);
        const remoteEmpty = !rawQ || !rawQ.optionexplanations || rawQ.optionexplanations.length === 0 || rawQ.optionexplanations.every(e => !e || !e.trim());
        return hasNotes && remoteEmpty;
      });
      if (needSync.length > 0) {
        console.log(`☁️ Auto-push vers Supabase de ${needSync.length} question(s) avec justifications...`);
        for (const q of needSync) {
          await dbUpsertQuestion(q);
        }
      }
    }

    if (!silent) alert("Données synchronisées depuis le Cloud Supabase !");
  } catch (err) {
    console.error("Erreur fetch Supabase:", err);
    if (!silent) alert("Erreur lors de la récupération des données : " + err.message);
  }
}

async function syncLocalToSupabase() {
  await forceFullCloudSync();
}

async function syncSupabaseToLocal() {
  if (!supabaseClient) {
    alert("Veuillez d'abord connecter votre projet Supabase.");
    return;
  }
  await fetchSupabaseData(false);
  closeSupabaseModal();
}

function formatQuestionForSupabase(q) {
  const optExp = (Array.isArray(q.optionExplanations) && q.optionExplanations.length > 0)
    ? q.optionExplanations
    : (Array.isArray(q.optionexplanations) ? q.optionexplanations : []);

  const expImgs = (Array.isArray(q.explanationImages) && q.explanationImages.length > 0)
    ? q.explanationImages
    : (Array.isArray(q.explanationimages) ? q.explanationimages : []);

  const accAns = (Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0)
    ? q.acceptedAnswers
    : (Array.isArray(q.acceptedanswers)
      ? q.acceptedanswers
      : (q.format === 'ouverte' && Array.isArray(q.options) ? q.options : []));

  const diff = q.difficulty || (q.stats && q.stats.difficulty) || 'facile';
  const extClues = q.extremeClues || q.extremeclues || (q.stats && q.stats.extremeClues) || '';

  // IMPORTANT : La table collective `questions` ne stocke que les métadonnées de la question
  // (difficulté, indices extrêmes, auteur) et JAMAIS la progression individuelle d'un utilisateur
  const authorEmail = q.created_by || (q.stats && q.stats.created_by) || ((state.currentUser && state.currentUser.email) ? state.currentUser.email.toLowerCase() : 'padoreau85@gmail.com');
  const questionMetadataStats = {
    difficulty: diff,
    extremeClues: extClues,
    created_by: authorEmail
  };

  return {
    id: q.id,
    created_at: q.created_at || new Date().toISOString(),
    format: q.format || 'qcm',
    organ: q.organ || '',
    category: q.category || '',
    entity: q.entity || '',
    question: q.question || '',
    context: q.context || '',
    options: Array.isArray(q.options) ? q.options : [],
    correct: Array.isArray(q.correct) ? q.correct : (typeof q.correct === 'number' ? [q.correct] : []),
    explanation: q.explanation || '',
    trap: q.trap || '',
    tags: Array.isArray(q.tags) ? q.tags : [],
    images: Array.isArray(q.images) ? q.images : [],
    mastered: false, // Ne pas figer de statut individuel sur la banque partagée
    flagged: false,  // Ne pas figer d'erreur individuelle sur la banque partagée
    stats: questionMetadataStats,
    // Colonnes PostgreSQL en minuscules conformes à PostgREST
    optionexplanations: optExp,
    explanationimages: expImgs,
    acceptedanswers: accAns
  };
}

async function dbUpsertQuestion(q) {
  if (!supabaseClient) return { success: true, localOnly: true };
  if (!state.currentUser) {
    console.warn("Utilisateur non connecté : question enregistrée en local.");
    return { localOnly: true };
  }
  if (!isCreator()) {
    console.warn("Compte non créateur : impossible de publier sur Supabase.");
    return { error: { message: "Votre compte est en mode Lecteur. Seuls les Créateurs peuvent publier dans la banque collective en ligne." } };
  }
  try {
    const payload = formatQuestionForSupabase(q);
    let res = await supabaseClient.from('questions').upsert(payload);
    
    // En cas de colonnes manquantes dans un schéma distant plus ancien
    if (res.error && (
      res.error.code === 'PGRST204' ||
      (res.error.message && (
        res.error.message.toLowerCase().includes('column') ||
        res.error.message.toLowerCase().includes('schema cache')
      ))
    )) {
      console.warn("Avertissement colonne Supabase manquante, repli ciblé...", res.error.message);
      const fallback = { ...payload };
      const msg = (res.error.message || '').toLowerCase();
      // On ne retire QUE la colonne précisément identifiée comme manquante par PostgreSQL
      if (msg.includes('difficulty')) delete fallback.difficulty;
      if (msg.includes('extremeclues')) delete fallback.extremeclues;
      if (msg.includes('explanationimages')) delete fallback.explanationimages;
      if (msg.includes('acceptedanswers')) delete fallback.acceptedanswers;
      if (msg.includes('optionexplanations')) delete fallback.optionexplanations;
      res = await supabaseClient.from('questions').upsert(fallback);
    }

    if (res.error) {
      console.warn("Erreur upsert question supabase:", res.error);
      return { error: res.error };
    }
    return { success: true };
  } catch (e) {
    console.warn("Erreur upsert question supabase:", e);
    return { error: e };
  }
}

async function autoSyncLocalQuestionsToCloud() {
  if (isLocalEnvironment()) {
    console.log("🛡️ Mode Test Local : autoSync désactivé pour ne pas toucher Supabase.");
    return;
  }
  if (!supabaseClient || !isCreator()) return;
  try {
    const { data: cloudQuestions } = await supabaseClient.from('questions').select('id');
    if (cloudQuestions) {
      const cloudIds = new Set(cloudQuestions.map(c => c.id));
      const unsynced = (state.questions || []).filter(q => !cloudIds.has(q.id));
      if (unsynced.length > 0) {
        console.log(`Synchronisation automatique de ${unsynced.length} question(s) vers Supabase...`);
        for (const q of unsynced) {
          await dbUpsertQuestion(q);
        }
      }
    }
  } catch (e) {
    console.warn("Erreur autoSyncLocalQuestionsToCloud:", e);
  }
}

async function dbDeleteQuestion(id) {
  if (isLocalEnvironment()) {
    console.log("🛡️ Mode Test Local : Suppression en local uniquement.");
    return;
  }
  if (!supabaseClient) return;
  if (!isCreator()) return;
  try {
    await supabaseClient.from('questions').delete().eq('id', id);
  } catch (e) {
    console.warn("Erreur delete question supabase:", e);
  }
}

async function dbUpsertCase(c) {
  if (isLocalEnvironment()) return;
  if (!supabaseClient) return;
  if (!isCreator()) return;
  try {
    await supabaseClient.from('cases').upsert(c);
  } catch (e) {
    console.warn("Erreur upsert case supabase:", e);
  }
}

async function dbDeleteCase(id) {
  if (isLocalEnvironment()) return;
  if (!supabaseClient) return;
  if (!isCreator()) return;
  try {
    await supabaseClient.from('cases').delete().eq('id', id);
  } catch (e) {
    console.warn("Erreur delete case supabase:", e);
  }
}

async function dbUpsertTag(name) {
  if (isLocalEnvironment()) return;
  if (!supabaseClient) return;
  if (!isCreator()) return;
  try {
    await supabaseClient.from('custom_tags').upsert({ name });
  } catch (e) {
    console.warn("Erreur upsert tag supabase:", e);
  }
}

async function uploadImageFile(file) {
  if (supabaseClient) {
    try {
      const ext = (file.name || 'image.png').split('.').pop() || 'png';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const { data, error } = await supabaseClient.storage
        .from('pathosorus_images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (!error && data) {
        const { data: publicData } = supabaseClient.storage
          .from('pathosorus_images')
          .getPublicUrl(fileName);
        return publicData.publicUrl;
      }
    } catch (err) {
      console.warn("Erreur upload Supabase Storage, fallback base64", err);
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (evt) => resolve(evt.target.result);
    reader.readAsDataURL(file);
  });
}

// --- INITIALISATION ---
function initApp() {
  const storedQ = localStorage.getItem(STORAGE_KEY_QUESTIONS);
  state.questions = storedQ ? JSON.parse(storedQ) : [];
  state.questions.forEach(q => {
    if (typeof q.mastered === 'undefined') q.mastered = false;
    if (!q.stats) q.stats = { seen: 0, correct: 0, consecutiveCorrect: 0, lastReviewed: null, nextReviewDate: null, intervalDays: 0 };
    if (!q.explanationImages) q.explanationImages = q.explanationimages || [];
    if (!q.images) q.images = [];
    if (!q.acceptedAnswers) q.acceptedAnswers = q.acceptedanswers || (q.format === 'ouverte' ? (q.options || []) : []);
    const optExp = (Array.isArray(q.optionExplanations) && q.optionExplanations.length > 0)
      ? q.optionExplanations
      : (Array.isArray(q.optionexplanations) ? q.optionexplanations : []);
    q.optionExplanations = optExp;
    q.optionexplanations = optExp;
  });

  // Restaurer immédiatement la progression locale des révisions propre au profil
  try {
    const userStorageKey = getUserProgressStorageKey();
    let rawProg = localStorage.getItem(userStorageKey);
    if (!rawProg && (!state.currentUser || !state.currentUser.id)) {
      rawProg = localStorage.getItem('pathosorus_user_progress');
      if (rawProg) {
        localStorage.setItem(userStorageKey, rawProg);
      }
    }
    if (rawProg) {
      const prog = JSON.parse(rawProg);
      state.questions.forEach(q => {
        if (prog[q.id]) {
          if (prog[q.id].stats) q.stats = Object.assign(q.stats || getDefaultQuestionStats(), prog[q.id].stats);
          if (typeof prog[q.id].mastered !== 'undefined') q.mastered = Boolean(prog[q.id].mastered);
          if (typeof prog[q.id].flagged !== 'undefined') q.flagged = Boolean(prog[q.id].flagged);
        }
      });
    }
  } catch(e) {}

  const storedCases = localStorage.getItem(STORAGE_KEY_CASES);
  state.cases = storedCases ? JSON.parse(storedCases) : [];

  const storedTags = localStorage.getItem(STORAGE_KEY_TAGS);
  state.customTags = storedTags ? JSON.parse(storedTags) : ["HES", "IHC", "BiologieMoléculaire", "PiègeClone"];
  if (!storedTags) saveCustomTags();

  const storedCustomBadges = localStorage.getItem('pathosorus_custom_badges');
  state.customBadges = storedCustomBadges ? JSON.parse(storedCustomBadges) : [];

  const storedStats = localStorage.getItem(STORAGE_KEY_STATS);
  if (storedStats) state.stats = Object.assign(state.stats, JSON.parse(storedStats));

  updateTopBar();
  renderHierarchySelector();
  renderTagsCloud();
  renderDPCardsOnPlay();
  renderSpacedRepetitionDashboard();
  renderBank();

  // Initialisation du Cloud Supabase & Authentification
  initSupabase();

  initClipboardPasteListener();

  if (window.lucide) lucide.createIcons();
}

function saveQuestions() {
  localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(state.questions));
  checkAndUnlockBadges();
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
  if (state.currentUser && state.currentUser.id) {
    localStorage.setItem(STORAGE_KEY_STATS + '_' + state.currentUser.id, JSON.stringify(state.stats));
    syncStatsToCloud();
  }
  updateTopBar();
}

function updateTopBar() {
  const streakEl = document.getElementById('top-streak');
  if (streakEl) streakEl.textContent = state.stats.streak || 1;

  const xpEl = document.getElementById('top-xp');
  if (xpEl) xpEl.textContent = state.stats.xp || 0;

  const levelEl = document.getElementById('top-level');
  if (levelEl) levelEl.textContent = calculatePlayerLevel(state.stats.xp || 0).level;

  const totalCount = state.questions.length + state.cases.length;
  const bankBadge = document.getElementById('badge-bank-count');
  if (bankBadge) bankBadge.textContent = totalCount;

  // Pastille de badges contestés sur l'onglet Trophées
  const contestedCount = getContestedBadgesCount();
  const contestedBadge = document.getElementById('badge-contested-count');
  if (contestedBadge) {
    if (contestedCount > 0) {
      contestedBadge.textContent = `⚡ ${contestedCount}`;
      contestedBadge.classList.remove('hidden');
    } else {
      contestedBadge.classList.add('hidden');
    }
  }
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
    renderPlayNewQuestionsFeed();
    renderHierarchySelector();
    renderTagsCloud();
    renderDPCardsOnPlay();
    renderSpacedRepetitionDashboard();
  } else if (viewId === 'bank') {
    renderBank();
  } else if (viewId === 'trophies') {
    renderTrophiesView();
  } else if (viewId === 'create') {
    const lockedEl = document.getElementById('view-create-locked');
    const contentEl = document.getElementById('view-create-content');
    if (isReader()) {
      if (lockedEl) lockedEl.classList.remove('hidden');
      if (contentEl) contentEl.classList.add('hidden');
    } else {
      if (lockedEl) lockedEl.classList.add('hidden');
      if (contentEl) contentEl.classList.remove('hidden');
      setCreatorMode(state.creatorMode);
    }
  }

  if (window.lucide) lucide.createIcons();
}

// =========================================================================
// --- SYSTÈME D'EXPÉRIENCE, NIVEAUX PLAYSTATION & TROPHÉES DYNAMIQUES ---
// =========================================================================

function getQuestionXp(q) {
  const diff = q.difficulty || 'facile';
  if (diff === 'intermediaire') return 5;
  if (diff === 'difficile') return 10;
  if (diff === 'extreme') return 100;
  return 2; // Facile par défaut (+2 pts)
}

function calculatePlayerLevel(xp) {
  let rem = Math.max(0, xp || 0);

  // Tranche 1 : Niveaux 1 à 100 (30 pts par palier, 0 à 3000 XP)
  if (rem < 3000) {
    const lvl = 1 + Math.floor(rem / 30);
    const curXp = rem % 30;
    return {
      level: Math.min(100, lvl),
      currentTierXp: curXp,
      tierMaxXp: 30,
      percent: Math.min(100, Math.round((curXp / 30) * 100)),
      tierName: 'Interne Novice',
      tierBadge: '🥉 Bronze',
      nextTierInfo: '30 XP / palier'
    };
  }
  rem -= 3000;

  // Tranche 2 : Niveaux 101 à 300 (45 pts par palier, 3000 à 12000 XP)
  if (rem < 9000) {
    const lvl = 101 + Math.floor(rem / 45);
    const curXp = rem % 45;
    return {
      level: Math.min(300, lvl),
      currentTierXp: curXp,
      tierMaxXp: 45,
      percent: Math.min(100, Math.round((curXp / 45) * 100)),
      tierName: 'Praticien Confirmé',
      tierBadge: '🥈 Argent',
      nextTierInfo: '45 XP / palier'
    };
  }
  rem -= 9000;

  // Tranche 3 : Niveaux 301 à 600 (60 pts par palier, 12000 à 30000 XP)
  if (rem < 18000) {
    const lvl = 301 + Math.floor(rem / 60);
    const curXp = rem % 60;
    return {
      level: Math.min(600, lvl),
      currentTierXp: curXp,
      tierMaxXp: 60,
      percent: Math.min(100, Math.round((curXp / 60) * 100)),
      tierName: 'Expert Hospitalo-Universitaire',
      tierBadge: '🥇 Or',
      nextTierInfo: '60 XP / palier'
    };
  }
  rem -= 18000;

  // Tranche 4 : Niveaux 601 à 1000 (90 pts par palier, 30000 à 66000 XP)
  if (rem < 36000) {
    const lvl = 601 + Math.floor(rem / 90);
    const curXp = rem % 90;
    return {
      level: Math.min(1000, lvl),
      currentTierXp: curXp,
      tierMaxXp: 90,
      percent: Math.min(100, Math.round((curXp / 90) * 100)),
      tierName: 'Maître Émérite OMS',
      tierBadge: '💎 Platine',
      nextTierInfo: '90 XP / palier'
    };
  }

  // Niveau Max 1000
  return {
    level: 1000,
    currentTierXp: 90,
    tierMaxXp: 90,
    percent: 100,
    tierName: 'Dieu Vivant de l’Anatomopathologie',
    tierBadge: '👑 Légende Absolue',
    nextTierInfo: 'Niveau Maximum Atteint'
  };
}

function calculateCreatorLevel(creatorXp) {
  let rem = Math.max(0, creatorXp || 0);

  // Niveaux 1 à 10 : 15 pts par palier (0 à 150 XP)
  if (rem < 150) {
    const lvl = 1 + Math.floor(rem / 15);
    const curXp = rem % 15;
    return { level: Math.min(10, lvl), currentTierXp: curXp, tierMaxXp: 15, percent: Math.round((curXp / 15) * 100) };
  }
  rem -= 150;

  // Niveaux 11 à 30 : 30 pts par palier (150 à 750 XP)
  if (rem < 600) {
    const lvl = 11 + Math.floor(rem / 30);
    const curXp = rem % 30;
    return { level: Math.min(30, lvl), currentTierXp: curXp, tierMaxXp: 30, percent: Math.round((curXp / 30) * 100) };
  }
  rem -= 600;

  // Niveaux 31 à 60 : 60 pts par palier (750 à 2550 XP)
  if (rem < 1800) {
    const lvl = 31 + Math.floor(rem / 60);
    const curXp = rem % 60;
    return { level: Math.min(60, lvl), currentTierXp: curXp, tierMaxXp: 60, percent: Math.round((curXp / 60) * 100) };
  }
  rem -= 1800;

  // Niveaux 61 à 100 : 90 pts par palier (2550 à 6150 XP)
  if (rem < 3600) {
    const lvl = 61 + Math.floor(rem / 90);
    const curXp = rem % 90;
    return { level: Math.min(100, lvl), currentTierXp: curXp, tierMaxXp: 90, percent: Math.round((curXp / 90) * 100) };
  }

  return { level: 100, currentTierXp: 90, tierMaxXp: 90, percent: 100 };
}

function getCreatorStats() {
  const currentEmail = (state.currentUser && state.currentUser.email || '').toLowerCase();
  
  // Si l'utilisateur n'est pas connecté ou est simple lecteur : 0 questions créées
  if (!state.currentUser || !isCreator()) {
    return {
      createdQuestions: 0,
      extremeQuestions: 0,
      creatorXp: 0,
      level: 1,
      currentTierXp: 0,
      tierMaxXp: 20,
      percent: 0,
      tierName: 'Novice Rédacteur'
    };
  }

  // Filtrer strictement les questions rédigées par CET utilisateur spécifique
  const myQuestions = (state.questions || []).filter(q => {
    const author = (q.created_by || (q.stats && q.stats.created_by) || '').toLowerCase();
    if (author) return author === currentEmail;
    // Les 12 premières questions de la banque initiale appartiennent au compte créateur initial
    return currentEmail === 'padoreau85@gmail.com';
  });

  const createdQuestions = myQuestions.length;
  const extremeQuestions = myQuestions.filter(q => q.difficulty === 'extreme').length;
  const creatorXp = (createdQuestions * 5) + (extremeQuestions * 50);
  const lvlInfo = calculateCreatorLevel(creatorXp);
  return {
    createdQuestions,
    extremeQuestions,
    creatorXp,
    ...lvlInfo
  };
}

function checkDailyStreak() {
  const today = getTodayString();
  const lastActive = state.stats.lastActiveDate;

  if (!lastActive) {
    state.stats.streak = 1;
    state.stats.lastActiveDate = today;
    saveStats();
    return;
  }

  if (lastActive === today) {
    return;
  }

  const dLast = new Date(lastActive);
  const dToday = new Date(today);
  const diffTime = dToday.getTime() - dLast.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    state.stats.streak = (state.stats.streak || 0) + 1;
    state.stats.lastActiveDate = today;
    state.stats.xp = (state.stats.xp || 0) + 10;
    showRewardToast(`🔥 Connexion consécutive : ${state.stats.streak} jours actifs (+10 XP) !`, 'flame');
  } else if (diffDays > 1) {
    state.stats.streak = 1;
    state.stats.lastActiveDate = today;
  }
  saveStats();
}

function showRewardToast(message, icon = 'trophy') {
  let toastContainer = document.getElementById('reward-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'reward-toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto bg-slate-900 border border-amber-500/50 shadow-2xl shadow-amber-500/20 text-white px-4 py-3 rounded-2xl flex items-center space-x-3 transform transition-all duration-300 translate-y-5 opacity-0';
  toast.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
      <i data-lucide="${icon}" class="w-4 h-4"></i>
    </div>
    <div class="text-xs font-bold text-slate-100 pr-2">${escapeHtml(message)}</div>
  `;
  toastContainer.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-5', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-5', 'opacity-0');
    setTimeout(() => toast.remove(), 350);
  }, 4500);
}

function checkCategoryCompletionBonus(organ, category) {
  if (!organ || !category) return;
  const catKey = `${organ}::${category}`;
  if (!state.stats.completedCategories) state.stats.completedCategories = [];
  if (state.stats.completedCategories.includes(catKey)) return;

  const catQuestions = state.questions.filter(q => (q.organ || 'Autre') === organ && (q.category || 'Général') === category);
  if (catQuestions.length === 0) return;

  const allCompleted = catQuestions.every(q => q.stats && q.stats.seen > 0 && q.stats.correct > 0);
  if (allCompleted) {
    state.stats.completedCategories.push(catKey);
    state.stats.xp = (state.stats.xp || 0) + 5; // Bonus strict de 5 pts (PDF)
    showRewardToast(`🎉 Catégorie terminée : "${category}" (+5 XP Bonus permanent) !`, 'check-circle');
    saveStats();
  }
}

// --- DÉFINITIONS STATIQUES DES BADGES DU PDF ---
const STATIC_BADGES_DEFINITIONS = [
  // 1. Régularité (Streak)
  { id: 'streak_7', category: 'streak', icon: 'flame', name: 'Semaine de Garde', description: 'Maintenir une série de 7 jours consécutifs de révision', target: 7, tier: 'bronze' },
  { id: 'streak_30', category: 'streak', icon: 'calendar', name: 'Régularité Microscopique', description: 'Maintenir une série de 30 jours consécutifs de révision', target: 30, tier: 'silver' },
  { id: 'streak_90', category: 'streak', icon: 'sparkles', name: 'L’Œil du Staff', description: '3 mois consécutifs (90 jours) de révisions quotidiennes', target: 90, tier: 'gold' },
  { id: 'streak_180', category: 'streak', icon: 'shield-check', name: 'Maître du Microtome', description: '6 mois consécutifs (180 jours) de fidélité quotidienne', target: 180, tier: 'gold' },
  { id: 'streak_365', category: 'streak', icon: 'crown', name: 'Lame d’Or Immortelle', description: '1 an complet (365 jours) consécutif de révisions', target: 365, tier: 'platinum' },

  // 2. Check-points de Niveau Joueur (PDF)
  { id: 'lvl_5', category: 'level', icon: 'award', name: 'Interne Novice (Nv 5)', description: 'Atteindre le niveau 5 de joueur', targetLevel: 5, tier: 'bronze' },
  { id: 'lvl_15', category: 'level', icon: 'award', name: 'Chasseur de Mitoses (Nv 15)', description: 'Atteindre le niveau 15 de joueur', targetLevel: 15, tier: 'bronze' },
  { id: 'lvl_30', category: 'level', icon: 'award', name: 'Compagnon Histologique (Nv 30)', description: 'Atteindre le niveau 30 de joueur', targetLevel: 30, tier: 'silver' },
  { id: 'lvl_50', category: 'level', icon: 'award', name: 'Expert en Extemporanée (Nv 50)', description: 'Atteindre le niveau 50 de joueur', targetLevel: 50, tier: 'silver' },
  { id: 'lvl_67', category: 'level', icon: 'alert-triangle', name: 'L’Accident de Cryostat (Nv 67)', description: 'Atteindre le palier mythique niveau 67 (PDF)', targetLevel: 67, tier: 'gold' },
  { id: 'lvl_80', category: 'level', icon: 'award', name: 'Maître des Coupes Sériées (Nv 80)', description: 'Atteindre le niveau 80 de joueur', targetLevel: 80, tier: 'gold' },
  { id: 'lvl_100', category: 'level', icon: 'trophy', name: 'Grand Référent OMS (Nv 100)', description: 'Atteindre le niveau 100 de joueur', targetLevel: 100, tier: 'platinum' },
  { id: 'lvl_200', category: 'level', icon: 'trophy', name: 'Patriarche des Colorations (Nv 200)', description: 'Atteindre le niveau 200 de joueur', targetLevel: 200, tier: 'platinum' },
  { id: 'lvl_300', category: 'level', icon: 'trophy', name: 'L’Oracle de la Biopsie (Nv 300)', description: 'Atteindre le niveau 300 de joueur', targetLevel: 300, tier: 'platinum' },
  { id: 'lvl_500', category: 'level', icon: 'trophy', name: 'Titan du Microscope (Nv 500)', description: 'Atteindre le niveau 500 de joueur', targetLevel: 500, tier: 'platinum' },
  { id: 'lvl_800', category: 'level', icon: 'trophy', name: 'Légende Vivante du Staff (Nv 800)', description: 'Atteindre le niveau 800 de joueur', targetLevel: 800, tier: 'platinum' },
  { id: 'lvl_1000', category: 'level', icon: 'crown', name: 'Dieu de l’Anatomopathologie (Nv 1000)', description: 'Atteindre le niveau ultime 1000 de joueur', targetLevel: 1000, tier: 'platinum' },

  // 3. Pathologies spécifiques (PDF)
  { id: 'patho_phyllode_3', category: 'pathology', icon: 'microscope', name: 'Apprenti Phyllode', description: 'Répondre correctement à au moins 3 questions sur les tumeurs phyllodes', organ: 'Sein', entity: 'Tumeurs phyllodes', targetCount: 3, tier: 'bronze' },
  { id: 'patho_phyllode_filou', category: 'pathology', icon: 'zap', name: 'Filou Phyllode', description: 'Atteindre au moins 80% de réussite sur les tumeurs phyllodes', organ: 'Sein', entity: 'Tumeurs phyllodes', minPercent: 80, tier: 'silver' },
  { id: 'patho_colon_parasite', category: 'pathology', icon: 'shield', name: 'Guerrier de la Lumière (colique)', description: 'Répondre à toutes les questions en lien avec les parasitoses coliques', organ: 'Digestif', tagOrEntity: 'parasitose', tier: 'gold' },

  // 4. Questions Extrêmes (PDF)
  { id: 'extreme_first', category: 'extreme', icon: 'help-circle', name: 'Sherlock des Lames', description: 'Résoudre avec succès une énigme diagnostique de difficulté Extrême (+100 XP)', tier: 'gold' },

  // 5. Voie du Créateur / Rédacteur (PDF Page 2)
  { id: 'creator_1', category: 'creator', icon: 'edit-3', name: 'Première Encre', description: 'Rédiger et publier votre première question dans la banque collective', targetCount: 1, tier: 'bronze' },
  { id: 'creator_10', category: 'creator', icon: 'feather', name: 'Plume d’Anapath', description: 'Rédiger 10 questions pour la banque de l’équipe', targetCount: 10, tier: 'silver' },
  { id: 'creator_50', category: 'creator', icon: 'book-open', name: 'Bâtisseur de Banque', description: 'Rédiger 50 questions pour l’entraînement collectif', targetCount: 50, tier: 'gold' },
  { id: 'creator_extreme', category: 'creator', icon: 'skull', name: 'Architecte Diabolique', description: 'Concevoir une question de difficulté Extrême avec indices (+50 XP Créateur)', targetCount: 1, tier: 'platinum' }
];

// --- MOTEUR D'ÉVALUATION DYNAMIQUE DES BADGES & GESTION DES BADGES CONTESTÉS ---
function getBadgesStatus() {
  if (!state.stats.badgeHistory) state.stats.badgeHistory = {};
  const playerLvl = calculatePlayerLevel(state.stats.xp || 0).level;
  const streak = state.stats.streak || 1;
  const creatorStats = getCreatorStats();

  const results = [];

  // 1. Évaluation des badges statiques
  STATIC_BADGES_DEFINITIONS.forEach(b => {
    let isNowMet = false;
    let progressPercent = 0;
    let progressText = '';
    let missingCount = 0;

    if (b.category === 'streak') {
      isNowMet = streak >= b.target;
      progressPercent = Math.min(100, Math.round((streak / b.target) * 100));
      progressText = `${streak} / ${b.target} jours`;
    } else if (b.category === 'level') {
      isNowMet = playerLvl >= b.targetLevel;
      progressPercent = Math.min(100, Math.round((playerLvl / b.targetLevel) * 100));
      progressText = `Niveau ${playerLvl} / ${b.targetLevel}`;
    } else if (b.id === 'patho_phyllode_3') {
      const correctPhyllodes = state.questions.filter(q => (q.entity || '').toLowerCase().includes('phyllode') && q.stats && q.stats.correct > 0).length;
      isNowMet = correctPhyllodes >= 3;
      progressPercent = Math.min(100, Math.round((correctPhyllodes / 3) * 100));
      progressText = `${correctPhyllodes} / 3 questions`;
    } else if (b.id === 'patho_phyllode_filou') {
      const phyllodeQuestions = state.questions.filter(q => (q.entity || '').toLowerCase().includes('phyllode'));
      const totalPhyllodes = phyllodeQuestions.length;
      const correctPhyllodes = phyllodeQuestions.filter(q => q.stats && q.stats.correct > 0).length;
      const targetCount = Math.max(1, Math.ceil(totalPhyllodes * 0.8));
      isNowMet = totalPhyllodes > 0 && correctPhyllodes >= targetCount;
      progressPercent = totalPhyllodes > 0 ? Math.min(100, Math.round((correctPhyllodes / targetCount) * 100)) : 0;
      progressText = `${correctPhyllodes} / ${targetCount} réussies (80%)`;
      missingCount = Math.max(0, targetCount - correctPhyllodes);
    } else if (b.id === 'patho_colon_parasite') {
      const parasiteQuestions = state.questions.filter(q => {
        const text = `${q.organ} ${q.category} ${q.entity} ${q.question} ${(q.tags || []).join(' ')}`.toLowerCase();
        return text.includes('parasit') || text.includes('amibe') || text.includes('oxyur');
      });
      const totalP = parasiteQuestions.length;
      const correctP = parasiteQuestions.filter(q => q.stats && q.stats.correct > 0).length;
      isNowMet = totalP > 0 && correctP >= totalP;
      progressPercent = totalP > 0 ? Math.min(100, Math.round((correctP / totalP) * 100)) : 0;
      progressText = `${correctP} / ${totalP || 1} questions`;
      missingCount = Math.max(0, totalP - correctP);
    } else if (b.category === 'extreme') {
      const solvedExtreme = state.questions.filter(q => q.difficulty === 'extreme' && q.stats && q.stats.correct > 0).length;
      isNowMet = solvedExtreme >= 1;
      progressPercent = isNowMet ? 100 : 0;
      progressText = isNowMet ? '1 / 1 résolue' : '0 / 1 résolue';
    } else if (b.category === 'creator') {
      if (creatorStats.createdQuestions === 0) {
        // Sécurité absolue : nettoyer tout badge créateur indûment présent sur ce compte (ex: compte d'un collègue)
        if (state.stats.unlockedBadges && state.stats.unlockedBadges[b.id]) {
          delete state.stats.unlockedBadges[b.id];
        }
        if (state.stats.badgeHistory && state.stats.badgeHistory[b.id]) {
          delete state.stats.badgeHistory[b.id];
        }
        isNowMet = false;
        progressPercent = 0;
        progressText = `0 / ${b.targetCount || 1} rédigées`;
      } else if (b.id === 'creator_extreme') {
        isNowMet = creatorStats.extremeQuestions >= 1;
        progressPercent = isNowMet ? 100 : 0;
        progressText = `${creatorStats.extremeQuestions} / 1 rédigée`;
      } else {
        isNowMet = creatorStats.createdQuestions >= b.targetCount;
        progressPercent = Math.min(100, Math.round((creatorStats.createdQuestions / b.targetCount) * 100));
        progressText = `${creatorStats.createdQuestions} / ${b.targetCount} rédigées`;
      }
    }

    let wasUnlocked = !!(state.stats.badgeHistory[b.id] && state.stats.badgeHistory[b.id].unlocked);
    if (b.category === 'creator' && creatorStats.createdQuestions === 0) {
      wasUnlocked = false;
    }
    let status = 'locked';

    // Mécanique du badge contesté pour les badges de pathologie
    if (wasUnlocked && !isNowMet && (b.id === 'patho_phyllode_filou' || b.id === 'patho_colon_parasite')) {
      status = 'contested';
    } else if (isNowMet) {
      status = 'unlocked';
      if (!state.stats.badgeHistory[b.id]) {
        state.stats.badgeHistory[b.id] = { unlocked: true, unlockedAt: Date.now() };
      }
    }

    results.push({
      ...b,
      status,
      progressPercent,
      progressText,
      missingCount
    });
  });

  // 2. Évaluation dynamique des badges d'accomplissement par Organe (10%, 25%, 50%, 80%, 100%)
  const organs = new Set();
  state.questions.forEach(q => { if (q.organ) organs.add(q.organ); });
  state.cases.forEach(c => { if (c.organ) organs.add(c.organ); });

  const sortedOrgans = Array.from(organs).sort();

  sortedOrgans.forEach(org => {
    const orgQuestions = state.questions.filter(q => (q.organ || "Autre") === org);
    const totalInOrg = orgQuestions.length;
    if (totalInOrg === 0) return;

    const completedInOrg = orgQuestions.filter(q => q.mastered || (q.stats && q.stats.seen > 0 && q.stats.correct > 0)).length;

    const tiers = [
      { pct: 10, tier: 'bronze', label: `Curieux de : ${org}` },
      { pct: 25, tier: 'bronze', label: `Initié de : ${org}` },
      { pct: 50, tier: 'silver', label: `Connaisseur de : ${org}` },
      { pct: 80, tier: 'gold', label: `Expert de : ${org}` },
      { pct: 100, tier: 'platinum', label: org.toLowerCase() === 'sein' ? 'Saint des Seins' : `Maître Absolu de : ${org}` }
    ];

    tiers.forEach(t => {
      const badgeId = `organ_${org.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${t.pct}`;
      const targetCount = Math.max(1, Math.ceil((t.pct / 100) * totalInOrg));
      const isNowMet = completedInOrg >= targetCount;
      const wasUnlocked = !!(state.stats.badgeHistory[badgeId] && state.stats.badgeHistory[badgeId].unlocked);

      let status = 'locked';
      const missingCount = Math.max(0, targetCount - completedInOrg);

      // Si le badge avait été obtenu, mais que de nouvelles questions ont été ajoutées dans cet organe
      if (wasUnlocked && !isNowMet) {
        status = 'contested'; // GRISÉ / CONTESTÉ !
      } else if (isNowMet) {
        status = 'unlocked';
        if (!state.stats.badgeHistory[badgeId]) {
          state.stats.badgeHistory[badgeId] = { unlocked: true, unlockedAt: Date.now() };
        }
      }

      const progressPercent = Math.min(100, Math.round((completedInOrg / targetCount) * 100));

      results.push({
        id: badgeId,
        category: 'organ',
        organ: org,
        icon: t.pct === 100 ? 'crown' : (t.pct >= 80 ? 'shield-check' : 'folder'),
        name: t.label,
        description: `Accomplir au moins ${t.pct}% des questions de la rubrique ${org} (${targetCount} Q)`,
        tier: t.tier,
        status,
        progressPercent,
        progressText: status === 'contested' ? `${completedInOrg} / ${targetCount} Q (Contesté)` : `${completedInOrg} / ${targetCount} Q (${t.pct}%)`,
        missingCount
      });
    });
  });

  // 3. Évaluation des trophées personnalisés créés par l'utilisateur
  (state.customBadges || []).forEach(b => {
    let isNowMet = false;
    let progressPercent = 0;
    let progressText = '';
    let missingCount = 0;

    if (b.conditionType === 'organ_mastery') {
      const orgQuestions = state.questions.filter(q => (q.organ || '').toLowerCase() === (b.targetOrgan || '').toLowerCase());
      const totalInOrg = orgQuestions.length;
      const targetCount = b.targetCount || Math.max(1, totalInOrg);
      const completedInOrg = orgQuestions.filter(q => q.mastered || (q.stats && q.stats.seen > 0 && q.stats.correct > 0)).length;
      isNowMet = totalInOrg > 0 && completedInOrg >= targetCount;
      progressPercent = totalInOrg > 0 ? Math.min(100, Math.round((completedInOrg / targetCount) * 100)) : 0;
      progressText = `${completedInOrg} / ${targetCount} réussies (${b.targetOrgan})`;
      missingCount = Math.max(0, targetCount - completedInOrg);
    } else if (b.conditionType === 'question_count') {
      const totalCorrect = state.stats.totalCorrect || 0;
      const target = b.targetCount || 10;
      isNowMet = totalCorrect >= target;
      progressPercent = Math.min(100, Math.round((totalCorrect / target) * 100));
      progressText = `${totalCorrect} / ${target} réussies`;
      missingCount = Math.max(0, target - totalCorrect);
    } else if (b.conditionType === 'streak') {
      const target = b.targetCount || 3;
      isNowMet = streak >= target;
      progressPercent = Math.min(100, Math.round((streak / target) * 100));
      progressText = `${streak} / ${target} jours`;
      missingCount = Math.max(0, target - streak);
    } else if (b.conditionType === 'creator') {
      const target = b.targetCount || 5;
      isNowMet = creatorStats.createdQuestions >= target;
      progressPercent = Math.min(100, Math.round((creatorStats.createdQuestions / target) * 100));
      progressText = `${creatorStats.createdQuestions} / ${target} rédigées`;
      missingCount = Math.max(0, target - creatorStats.createdQuestions);
    } else {
      const wasUnlocked = !!(state.stats.badgeHistory[b.id] && state.stats.badgeHistory[b.id].unlocked);
      isNowMet = wasUnlocked;
      progressPercent = wasUnlocked ? 100 : 0;
      progressText = wasUnlocked ? 'Défi accompli !' : 'Défi à valider';
    }

    const wasUnlocked = !!(state.stats.badgeHistory[b.id] && state.stats.badgeHistory[b.id].unlocked);
    let status = 'locked';

    if (wasUnlocked && !isNowMet && b.conditionType === 'organ_mastery') {
      status = 'contested';
    } else if (isNowMet) {
      status = 'unlocked';
      if (!state.stats.badgeHistory[b.id]) {
        state.stats.badgeHistory[b.id] = { unlocked: true, unlockedAt: Date.now() };
      }
    }

    results.push({
      ...b,
      isCustom: true,
      organ: b.targetOrgan,
      status,
      progressPercent,
      progressText,
      missingCount
    });
  });

  return results;
}

function getContestedBadgesCount() {
  const badges = getBadgesStatus();
  return badges.filter(b => b.status === 'contested').length;
}

function checkAndUnlockBadges() {
  const badges = getBadgesStatus();
  let newlyUnlocked = false;

  badges.forEach(b => {
    if (b.status === 'unlocked') {
      if (!state.stats.unlockedBadges) state.stats.unlockedBadges = {};
      if (!state.stats.unlockedBadges[b.id]) {
        state.stats.unlockedBadges[b.id] = Date.now();
        newlyUnlocked = true;
        const reward = b.xpReward || (b.tier === 'platinum' ? 100 : b.tier === 'gold' ? 50 : 25);
        state.stats.xp = (state.stats.xp || 0) + reward;
        showRewardToast(`🏆 Trophée Débloqué : "${b.name}" (+${reward} XP) !`, 'award');
      }
    }
  });

  if (newlyUnlocked) {
    saveStats();
  }
}

// --- VUE PALMARÈS & TROPHÉES (VIEW-TROPHIES) ---
function renderTrophiesView() {
  checkAndUnlockBadges();
  const player = calculatePlayerLevel(state.stats.xp || 0);
  const creator = getCreatorStats();
  const allBadges = getBadgesStatus();
  const unlockedBadges = allBadges.filter(b => b.status === 'unlocked');
  const contestedBadges = allBadges.filter(b => b.status === 'contested');

  // 1. Rendu Carte Joueur
  const playerCard = document.getElementById('trophies-player-card');
  if (playerCard) {
    playerCard.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3.5">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-black text-xl shadow-inner">
            ${player.level}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                ${player.tierBadge}
              </span>
              <span class="text-xs text-slate-400 font-mono">${player.nextTierInfo}</span>
            </div>
            <h2 class="text-lg font-black text-white mt-0.5 tracking-tight">${player.tierName}</h2>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xl font-black text-white font-mono">${state.stats.xp || 0}</span>
          <span class="text-xs text-indigo-400 font-bold block">XP Totale</span>
        </div>
      </div>

      <div class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Progression vers Niveau ${Math.min(1000, player.level + 1)}</span>
          <span class="font-mono text-indigo-300 font-bold">${player.currentTierXp} / ${player.tierMaxXp} XP (${player.percent}%)</span>
        </div>
        <div class="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shadow-inner p-0.5">
          <div class="h-full rounded-full bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 transition-all duration-500" style="width: ${player.percent}%;"></div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
        <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs font-bold text-amber-400 font-mono block">${unlockedBadges.length}</span>
          <span class="text-[10px] text-slate-400">Trophées</span>
        </div>
        <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs font-bold text-teal-400 font-mono block">${state.stats.streak || 1} j</span>
          <span class="text-[10px] text-slate-400">Série (Streak)</span>
        </div>
        <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs font-bold text-sky-400 font-mono block">${state.stats.totalCorrect || 0}</span>
          <span class="text-[10px] text-slate-400">Réussies</span>
        </div>
      </div>
    `;
  }

  // 2. Rendu Carte Créateur (Voie du Rédacteur)
  const creatorCard = document.getElementById('trophies-creator-card');
  if (creatorCard) {
    creatorCard.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3.5">
          <div class="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center font-black text-xl shadow-inner">
            ${creator.level}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                ✍️ Voie du Rédacteur
              </span>
              <span class="text-xs text-slate-400 font-mono">Max Nv 100</span>
            </div>
            <h2 class="text-lg font-black text-white mt-0.5 tracking-tight">Maître Rédacteur</h2>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xl font-black text-white font-mono">${creator.creatorXp}</span>
          <span class="text-xs text-teal-400 font-bold block">XP Rédacteur</span>
        </div>
      </div>

      <div class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Progression Rédacteur Nv ${Math.min(100, creator.level + 1)}</span>
          <span class="font-mono text-teal-300 font-bold">${creator.currentTierXp} / ${creator.tierMaxXp} XP (${creator.percent}%)</span>
        </div>
        <div class="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shadow-inner p-0.5">
          <div class="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500" style="width: ${creator.percent}%;"></div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
        <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs font-bold text-teal-300 font-mono block">${creator.createdQuestions}</span>
          <span class="text-[10px] text-slate-400">Questions créées</span>
        </div>
        <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs font-bold text-purple-300 font-mono block">${creator.extremeQuestions}</span>
          <span class="text-[10px] text-slate-400">Énigmes Extrêmes</span>
        </div>
        <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs font-bold text-indigo-300 font-mono block">+5 pts</span>
          <span class="text-[10px] text-slate-400">Fixe / QCM créé</span>
        </div>
      </div>
    `;
  }

  // 3. Bandeau Trophées Contestés
  const contestedBanner = document.getElementById('trophies-contested-banner');
  if (contestedBanner) {
    if (contestedBadges.length > 0) {
      contestedBanner.className = "bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/20 border border-amber-500/40 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl";
      contestedBanner.innerHTML = `
        <div class="flex items-center space-x-3.5">
          <div class="w-11 h-11 rounded-2xl bg-amber-500/30 text-amber-300 border border-amber-500/50 flex items-center justify-center text-xl font-bold shrink-0 animate-pulse">
            ⚡
          </div>
          <div>
            <h4 class="font-extrabold text-sm sm:text-base text-white flex items-center space-x-2">
              <span>${contestedBadges.length} Trophée(s) contesté(s) par de nouvelles questions !</span>
            </h4>
            <p class="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
              Des co-internes ou référents ont ajouté de nouvelles lames dans des rubriques que vous aviez terminées. Relevez le défi pour reprendre vos couronnes !
            </p>
          </div>
        </div>
        <div class="shrink-0 self-start sm:self-auto">
          <button onclick="recaptureFirstContestedBadge()" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition shadow-lg shadow-amber-500/25">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-slate-950"></i>
            <span>Reconquérir maintenant</span>
          </button>
        </div>
      `;
    } else {
      contestedBanner.className = "hidden";
      contestedBanner.innerHTML = '';
    }
  }

  // 4. Résumé
  const summaryText = document.getElementById('trophies-summary-text');
  if (summaryText) {
    summaryText.textContent = `${unlockedBadges.length} débloqué(s) sur ${allBadges.length} trophées${contestedBadges.length > 0 ? ` • ${contestedBadges.length} contesté(s) ⚡` : ''}`;
  }

  renderTrophiesGrid();
  if (window.lucide) lucide.createIcons();
}

function setTrophyFilter(filter) {
  state.trophyFilter = filter;
  ['all', 'unlocked', 'contested', 'locked'].forEach(f => {
    const btn = document.getElementById(`btn-trophy-filter-${f}`);
    if (btn) {
      if (f === filter) {
        btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition bg-amber-500 text-slate-950 shadow-sm";
      } else {
        btn.className = "px-3 py-1.5 rounded-xl text-xs font-semibold transition bg-slate-950 text-slate-400 hover:text-white border border-slate-800";
      }
    }
  });
  renderTrophiesGrid();
}

function renderTrophiesGrid() {
  const grid = document.getElementById('trophies-grid');
  if (!grid) return;

  const allBadges = getBadgesStatus();
  const filter = state.trophyFilter || 'all';

  const filtered = allBadges.filter(b => {
    if (filter === 'unlocked') return b.status === 'unlocked';
    if (filter === 'contested') return b.status === 'contested';
    if (filter === 'locked') return b.status === 'locked';
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
        <p class="text-xs">Aucun trophée ne correspond à ce filtre.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(b => {
    const isUnlocked = b.status === 'unlocked';
    const isContested = b.status === 'contested';

    const cardBorder = isUnlocked
      ? 'border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 shadow-md shadow-amber-500/5'
      : isContested
      ? 'border-amber-500 ring-2 ring-amber-500/30 bg-slate-900 shadow-lg shadow-amber-500/20'
      : 'border-slate-800 bg-slate-900/60 opacity-60 hover:opacity-90';

    const iconBg = isUnlocked
      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
      : isContested
      ? 'bg-amber-500/30 text-amber-300 border border-amber-500 animate-pulse'
      : 'bg-slate-800 text-slate-500';

    const statusBadge = isUnlocked
      ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">🏆 Débloqué</span>'
      : isContested
      ? '<span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-sm animate-pulse">⚡ Titre contesté</span>'
      : '<span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">🔒 À conquérir</span>';

    return `
      <div class="rounded-2xl p-4 sm:p-5 border transition flex flex-col justify-between space-y-4 ${cardBorder}">
        <div class="space-y-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-2.5">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}">
                ${(b.icon && b.icon.length > 2) ? `<i data-lucide="${b.icon}" class="w-5 h-5"></i>` : `<span class="text-xl">${b.icon || '🏆'}</span>`}
              </div>
              <div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 block w-fit">+${b.xpReward || 50} XP</span>
              </div>
            </div>
            <div class="flex items-center space-x-1.5">
              ${statusBadge}
              ${(b.isCustom && isCreator()) ? `
                <button onclick="deleteCustomBadge('${escapeJsString(b.id)}')" class="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition" title="Supprimer ce trophée">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <div>
            <h4 class="font-extrabold text-sm text-white ${isContested ? 'text-amber-300' : ''}">${escapeHtml(b.name)}</h4>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">${escapeHtml(b.description)}</p>
            ${b.created_by ? `<div class="text-[10px] text-amber-400/80 mt-1.5 font-mono">👑 Créé par : ${escapeHtml(b.created_by)}</div>` : ''}
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800/80 space-y-2">
          <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Progression</span>
            <span class="${isContested ? 'text-amber-400 font-bold' : ''}">${b.progressText}</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-300 ${
              isUnlocked ? 'bg-amber-400' : isContested ? 'bg-amber-500 animate-pulse' : 'bg-teal-500'
            }" style="width: ${b.progressPercent}%;"></div>
          </div>

          ${isContested ? `
            <button onclick="startContestedBadgeSession('${escapeJsString(b.id)}')" class="w-full mt-2 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 transition shadow-sm">
              <i data-lucide="play" class="w-3.5 h-3.5 fill-slate-950"></i>
              <span>Recapturer mon titre (${b.missingCount} Q)</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function startContestedBadgeSession(badgeId) {
  const badge = getBadgesStatus().find(b => b.id === badgeId);
  if (!badge) return;

  let pool = [];
  if (badge.organ) {
    pool = state.questions.filter(q => {
      const matchOrg = (q.organ || 'Autre') === badge.organ;
      const matchEnt = !badge.entity || (q.entity || '').toLowerCase().includes(badge.entity.toLowerCase());
      const notCompleted = !q.stats || q.stats.correct === 0;
      return matchOrg && matchEnt && notCompleted;
    });
  }

  if (pool.length === 0) {
    alert("Bravo ! Vous êtes déjà à jour sur ce trophée.");
    checkAndUnlockBadges();
    renderTrophiesView();
    return;
  }

  state.sessionReturnView = 'trophies';
  launchQuizSession(pool, `Reconquête : ${badge.name}`);
}

function recaptureFirstContestedBadge() {
  const contested = getBadgesStatus().filter(b => b.status === 'contested');
  if (contested.length > 0) {
    startContestedBadgeSession(contested[0].id);
  }
}

// --- GESTION DES TROPHÉES PERSONNALISÉS ---
function openCreateTrophyModal() {
  if (isReader()) {
    alert("La création de trophées est réservée aux comptes Créateurs.");
    return;
  }
  const modal = document.getElementById('modal-create-trophy');
  if (!modal) return;

  const organSelect = document.getElementById('trophy-input-organ');
  if (organSelect) {
    const tree = getHierarchyTree(true);
    const organs = Object.keys(tree).sort();
    organSelect.innerHTML = organs.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
  }

  onTrophyConditionTypeChange();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}
window.openCreateTrophyModal = openCreateTrophyModal;

function closeCreateTrophyModal() {
  const modal = document.getElementById('modal-create-trophy');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}
window.closeCreateTrophyModal = closeCreateTrophyModal;

function onTrophyConditionTypeChange() {
  const condType = document.getElementById('trophy-input-cond-type')?.value;
  const paramBox = document.getElementById('trophy-organ-param-box');
  const countLabel = document.getElementById('trophy-count-label');
  const organCol = document.getElementById('trophy-organ-col');

  if (paramBox) {
    if (condType === 'free') {
      paramBox.classList.add('hidden');
    } else {
      paramBox.classList.remove('hidden');
      if (condType === 'organ_mastery') {
        if (organCol) organCol.classList.remove('hidden');
        if (countLabel) countLabel.textContent = "Questions requises sur l'organe";
      } else if (condType === 'question_count') {
        if (organCol) organCol.classList.add('hidden');
        if (countLabel) countLabel.textContent = "Total de questions à réussir";
      } else if (condType === 'streak') {
        if (organCol) organCol.classList.add('hidden');
        if (countLabel) countLabel.textContent = "Jours consécutifs (Streak)";
      } else if (condType === 'creator') {
        if (organCol) organCol.classList.add('hidden');
        if (countLabel) countLabel.textContent = "Questions à rédiger";
      }
    }
  }
}
window.onTrophyConditionTypeChange = onTrophyConditionTypeChange;

async function saveCustomBadge(badge) {
  state.customBadges.push(badge);
  localStorage.setItem('pathosorus_custom_badges', JSON.stringify(state.customBadges));
  renderTrophiesView();
  // Sauvegarde dans profiles.stats.customBadges pour synchronisation garantie sur tous les appareils du compte
  if (state.currentUser) {
    saveStats();
  }
}

async function deleteCustomBadge(badgeId) {
  if (!confirm("Voulez-vous vraiment supprimer ce trophée personnalisé ?")) return;
  state.customBadges = (state.customBadges || []).filter(b => b.id !== badgeId);
  localStorage.setItem('pathosorus_custom_badges', JSON.stringify(state.customBadges));
  renderTrophiesView();
  showRewardToast("Trophée supprimé.", 'trash-2');
  if (state.currentUser) {
    saveStats();
  }
}
window.deleteCustomBadge = deleteCustomBadge;

async function handleCreateTrophySubmit(e) {
  e.preventDefault();
  const name = document.getElementById('trophy-input-name').value.trim();
  const description = document.getElementById('trophy-input-desc').value.trim();
  const icon = document.getElementById('trophy-input-icon').value || '🏆';
  const tier = document.getElementById('trophy-input-tier').value || 'gold';
  const xpReward = parseInt(document.getElementById('trophy-input-xp').value, 10) || 50;
  const conditionType = document.getElementById('trophy-input-cond-type').value;
  const targetOrgan = document.getElementById('trophy-input-organ')?.value || '';
  const targetCount = parseInt(document.getElementById('trophy-input-count')?.value, 10) || 5;

  if (!name) {
    alert("Veuillez donner un nom au trophée.");
    return;
  }

  const badge = {
    id: 'custom_' + Date.now(),
    name,
    description,
    icon,
    tier,
    xpReward,
    conditionType,
    targetOrgan,
    targetCount,
    category: 'custom',
    created_at: new Date().toISOString(),
    created_by: state.currentUser ? state.currentUser.email : 'Créateur'
  };

  await saveCustomBadge(badge);
  closeCreateTrophyModal();
  document.getElementById('form-create-trophy').reset();
  showRewardToast(`🏆 Trophée "${name}" créé avec succès !`, 'award');
}
window.handleCreateTrophySubmit = handleCreateTrophySubmit;

// --- MODULE "NOUVEAUTÉS DE L'ÉQUIPE" SUR L'ÉCRAN JOUER ---
function renderPlayNewQuestionsFeed() {
  const container = document.getElementById('play-new-questions-container');
  if (!container) return;

  const unplayedQuestions = state.questions.filter(q => !q.stats || q.stats.seen === 0);
  const totalQuestions = state.questions.length;

  if (unplayedQuestions.length === 0) {
    if (totalQuestions > 0) {
      container.innerHTML = `
        <div class="p-3.5 px-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>Vous êtes à jour sur l'ensemble de la banque de l'équipe (<strong>${totalQuestions}/${totalQuestions}</strong> questions découvertes).</span>
          </div>
          <button onclick="switchTab('trophies')" class="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 shrink-0 ml-2">
            <span>Voir mes trophées</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    } else {
      container.innerHTML = '';
    }
    return;
  }

  const organCounts = {};
  unplayedQuestions.forEach(q => {
    const o = q.organ || "Autre";
    organCounts[o] = (organCounts[o] || 0) + 1;
  });

  const organPills = Object.entries(organCounts)
    .map(([org, cnt]) => `<span class="px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] font-semibold">${escapeHtml(org)} (${cnt})</span>`)
    .join(' ');

  container.innerHTML = `
    <div class="bg-gradient-to-r from-orange-500/10 via-slate-900 to-amber-500/10 border border-orange-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
      <div class="space-y-1.5 flex-1">
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] font-black uppercase tracking-wider animate-pulse">
            <i data-lucide="flame" class="w-3 h-3 fill-orange-400"></i>
            <span>Nouveautés de l'Équipe</span>
          </span>
          <span class="text-xs font-bold text-white">${unplayedQuestions.length} question(s) inédite(s)</span>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">
          Des cas cliniques et QCM ont été rédigés par vos collègues que vous n'avez pas encore testés. Découvrez-les pour gagner de l'XP !
        </p>
        <div class="flex flex-wrap gap-1.5 pt-1">
          ${organPills}
        </div>
      </div>

      <div class="shrink-0 self-start sm:self-center">
        <button onclick="startUnplayedQuestionsSession()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 transition shadow-lg shadow-orange-500/20">
          <i data-lucide="play" class="w-4 h-4 fill-slate-950"></i>
          <span>Découvrir les nouveautés (${unplayedQuestions.length})</span>
        </button>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function startUnplayedQuestionsSession() {
  const unplayedQuestions = state.questions.filter(q => !q.stats || q.stats.seen === 0);
  if (unplayedQuestions.length === 0) {
    alert("Toutes les questions actuelles ont déjà été jouées !");
    return;
  }
  state.sessionReturnView = 'play';
  launchQuizSession(unplayedQuestions, "Nouveautés de l'Équipe (Inédites)");
}

function onDifficultyChange() {
  const diffEl = document.getElementById('form-q-difficulty');
  const diff = diffEl ? diffEl.value : 'facile';
  const container = document.getElementById('form-q-extreme-clues-container');
  if (container) {
    if (diff === 'extreme') container.classList.remove('hidden');
    else container.classList.add('hidden');
  }
}

// --- RÉVISIONS DES QUESTIONS DES COLLÈGUES / ÉQUIPE ---
function getColleaguesQuestions(activeOnly = true) {
  const currentEmail = (state.currentUser && state.currentUser.email || '').trim().toLowerCase();

  return (state.questions || []).filter(q => {
    if (activeOnly && q.mastered) return false;

    let author = (q.created_by || (q.stats && q.stats.created_by) || '').trim().toLowerCase();
    if (!author) {
      author = (q.id === 'q_1792671361751') ? 'belhadef.samy@gmail.com' : 'padoreau85@gmail.com';
    }

    if (!currentEmail) {
      return true; // Mode invité : tout le catalogue
    }

    return author !== currentEmail;
  });
}

function getMyAuthoredQuestions(activeOnly = true) {
  const currentEmail = (state.currentUser && state.currentUser.email || '').trim().toLowerCase();
  if (!currentEmail) return [];

  return (state.questions || []).filter(q => {
    if (activeOnly && q.mastered) return false;

    let author = (q.created_by || (q.stats && q.stats.created_by) || '').trim().toLowerCase();
    if (!author) {
      author = (q.id === 'q_1792671361751') ? 'belhadef.samy@gmail.com' : 'padoreau85@gmail.com';
    }

    return author === currentEmail;
  });
}

function startColleaguesQuestionsSession() {
  const colleaguesQuestions = getColleaguesQuestions(true);
  if (colleaguesQuestions.length === 0) {
    alert("Aucune question rédigée par un autre confrère pour l'instant.");
    return;
  }

  // Privilégier les cartes non faites aujourd'hui
  const notDoneToday = colleaguesQuestions.filter(q => !isQuestionDoneToday(q));
  const pool = notDoneToday.length > 0 ? notDoneToday : colleaguesQuestions;

  state.sessionReturnView = 'play';
  launchQuizSession(pool, `Questions de l'Équipe (Co-internes) • ${pool.length} Q 👥`);
}

// --- DASHBOARD DE RÉPÉTITION ESPACÉE ---
function renderSpacedRepetitionDashboard() {
  const activeQuestions = state.questions.filter(q => !q.mastered);
  const dueQuestions = activeQuestions.filter(q => isQuestionDue(q));
  const masteredCount = state.questions.filter(q => q.mastered).length;
  const colleaguesQuestions = getColleaguesQuestions(true);

  const dueBadge = document.getElementById('stat-due-today-count');
  if (dueBadge) dueBadge.textContent = dueQuestions.length;

  const activeBadge = document.getElementById('stat-active-count');
  if (activeBadge) activeBadge.textContent = activeQuestions.length;

  const masteredBadge = document.getElementById('stat-mastered-count');
  if (masteredBadge) masteredBadge.textContent = masteredCount;

  // Badge et bouton Questions des Collègues
  const colleaguesBadge = document.getElementById('stat-colleagues-count');
  if (colleaguesBadge) colleaguesBadge.textContent = colleaguesQuestions.length;

  const btnColleagues = document.getElementById('btn-play-colleagues');
  if (btnColleagues) {
    btnColleagues.disabled = colleaguesQuestions.length === 0;
    const labelC = document.getElementById('label-colleagues-count');
    if (labelC) {
      labelC.textContent = colleaguesQuestions.length > 0 
        ? `Réviser les questions de l'équipe (${colleaguesQuestions.length})` 
        : `Aucune question de collègue pour le moment`;
    }
  }

  const labelShortcut = document.getElementById('label-colleagues-shortcut');
  if (labelShortcut) {
    labelShortcut.textContent = `Questions des Collègues (${colleaguesQuestions.length})`;
  }

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
  dbSaveUserProgress(q);

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
  // Règle J1 : si faite aujourd'hui, elle n'apparaît plus aujourd'hui (au minimum demain si "Aujourd'hui" est choisi)
  targetDate.setDate(targetDate.getDate() + (days === 0 ? 1 : days));
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
    dbSaveUserProgress(globalQ);
  }

  saveQuestions();
  playSound('correct');
  nextSessionQuestion();
}

// --- CLASSIFICATION 3 NIVEAUX ---
function getHierarchyTree(includeMastered = false, filterMode = null) {
  const tree = {};
  const mode = filterMode || (state.playHierarchy && state.playHierarchy.filterMode) || 'all';

  let activeQuestions = state.questions.filter(q => includeMastered || !q.mastered);
  if (mode === 'colleagues') {
    const colleaguesSet = new Set(getColleaguesQuestions(includeMastered).map(q => q.id));
    activeQuestions = activeQuestions.filter(q => colleaguesSet.has(q.id));
  } else if (mode === 'mine') {
    const mySet = new Set(getMyAuthoredQuestions(includeMastered).map(q => q.id));
    activeQuestions = activeQuestions.filter(q => mySet.has(q.id));
  }

  const cases = (mode === 'mine' || mode === 'colleagues') ? [] : state.cases;
  const allItems = [...activeQuestions, ...cases];

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

function setHierarchyFilterMode(mode) {
  if (!state.playHierarchy) state.playHierarchy = {};
  state.playHierarchy.filterMode = mode;
  state.playHierarchy.selectedOrgan = null;
  state.playHierarchy.selectedCategory = null;
  state.playHierarchy.selectedEntity = null;
  renderHierarchySelector();
}

function renderHierarchySelector() {
  const container = document.getElementById('hierarchy-selector-container');
  if (!container) return;

  const currentMode = (state.playHierarchy && state.playHierarchy.filterMode) || 'all';
  const tree = getHierarchyTree(false, currentMode);
  const organs = Object.keys(tree).sort();

  const allActiveCount = state.questions.filter(q => !q.mastered).length + state.cases.length;
  const colleaguesCount = getColleaguesQuestions(true).length;
  const myCount = getMyAuthoredQuestions(true).length;

  let html = `<div class="space-y-4">`;

  // Onglets de filtre de provenance : Toutes / Questions de l'équipe / Mes rédactions
  html += `
    <div class="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800/80">
      <span class="text-xs font-bold text-slate-400">Filtrer par :</span>
      <button type="button" onclick="setHierarchyFilterMode('all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
        currentMode === 'all'
          ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
      }">
        <span>🌐 Toutes les questions</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${currentMode === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400'}">${allActiveCount}</span>
      </button>

      <button type="button" onclick="setHierarchyFilterMode('colleagues')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
        currentMode === 'colleagues'
          ? 'bg-indigo-600 text-white border border-indigo-400 shadow-sm shadow-indigo-600/30'
          : 'bg-slate-950 text-indigo-400 hover:text-white border border-slate-800'
      }">
        <i data-lucide="users" class="w-3.5 h-3.5"></i>
        <span>Rédigées par mes collègues</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${currentMode === 'colleagues' ? 'bg-indigo-700 text-white' : 'bg-slate-900 text-indigo-300'}">${colleaguesCount}</span>
      </button>

      ${myCount > 0 ? `
      <button type="button" onclick="setHierarchyFilterMode('mine')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
        currentMode === 'mine'
          ? 'bg-teal-600 text-white border border-teal-400 shadow-sm shadow-teal-600/30'
          : 'bg-slate-950 text-teal-400 hover:text-white border border-slate-800'
      }">
        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
        <span>Mes rédactions</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${currentMode === 'mine' ? 'bg-teal-700 text-white' : 'bg-slate-900 text-teal-300'}">${myCount}</span>
      </button>
      ` : ''}
    </div>
  `;

  if (organs.length === 0) {
    if (currentMode === 'colleagues') {
      html += `
        <div class="p-6 text-center bg-indigo-500/10 rounded-xl border border-indigo-500/30">
          <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 text-indigo-400"></i>
          <h4 class="text-sm font-bold text-indigo-300">Aucune question active rédigée par un collègue</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Dès qu'un co-interne (Samy ou autre) rédige et publie une question dans la banque collective, elle apparaîtra ici classée par organe !
          </p>
        </div>
      `;
    } else {
      html += `
        <div class="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800">
          <i data-lucide="layers" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
          <h4 class="text-sm font-bold text-slate-300">Aucune question active dans cette sélection</h4>
        </div>
      `;
    }
    html += `</div>`;
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (state.playHierarchy.selectedOrgan && !tree[state.playHierarchy.selectedOrgan]) {
    state.playHierarchy.selectedOrgan = null;
    state.playHierarchy.selectedCategory = null;
    state.playHierarchy.selectedEntity = null;
  }

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

function quitCurrentSession() {
  switchTab(state.sessionReturnView || 'play');
}

function quitCurrentDPSession() {
  switchTab(state.sessionReturnView || 'play');
}

function startHierarchySession(level, organ, category, entity) {
  // Détecter si on lance depuis Ma Banque ou depuis Entraînement
  const isFromBank = document.getElementById('view-bank') && !document.getElementById('view-bank').classList.contains('hidden');
  state.sessionReturnView = isFromBank ? 'bank' : 'play';

  let activeQuestions = state.questions.filter(q => !q.mastered);
  if (!isFromBank && state.playHierarchy && state.playHierarchy.filterMode === 'colleagues') {
    const colleaguesSet = new Set(getColleaguesQuestions(false).map(q => q.id));
    activeQuestions = activeQuestions.filter(q => colleaguesSet.has(q.id));
  } else if (!isFromBank && state.playHierarchy && state.playHierarchy.filterMode === 'mine') {
    const mySet = new Set(getMyAuthoredQuestions(false).map(q => q.id));
    activeQuestions = activeQuestions.filter(q => mySet.has(q.id));
  }

  let matchingQuestions = [];
  if (level === 'organ') matchingQuestions = activeQuestions.filter(q => (organ === 'all' || q.organ === organ));
  else if (level === 'category') matchingQuestions = activeQuestions.filter(q => (organ === 'all' || q.organ === organ) && (category === 'all' || q.category === category));
  else if (level === 'entity') matchingQuestions = activeQuestions.filter(q => (organ === 'all' || q.organ === organ) && (category === 'all' || q.category === category) && q.entity === entity);

  // Si on lance depuis l'onglet JOUER : exclure les questions déjà faites aujourd'hui (règle J1)
  let pool = matchingQuestions;
  if (!isFromBank) {
    pool = matchingQuestions.filter(q => !isQuestionDoneToday(q));
  }

  if (pool.length === 0) {
    if (matchingQuestions.length > 0 && !isFromBank) {
      if (confirm(`Vous avez déjà validé toutes les questions (${matchingQuestions.length}) de cette sélection aujourd'hui 🎉 !\n\nVoulez-vous quand même les refaire en révision libre ?`)) {
        launchQuizSession(matchingQuestions, `Entraînement : ${entity || category || organ}`);
        return;
      }
      return;
    }

    // Vérifier si des questions neutralisées (maîtrisées) existent
    const allMatching = state.questions.filter(q => {
      if (level === 'organ') return (organ === 'all' || q.organ === organ);
      if (level === 'category') return (organ === 'all' || q.organ === organ) && (category === 'all' || q.category === category);
      if (level === 'entity') return (organ === 'all' || q.organ === organ) && (category === 'all' || q.category === category) && q.entity === entity;
      return false;
    });

    if (allMatching.length > 0) {
      if (confirm(`Toutes les questions (${allMatching.length}) de cette sélection sont neutralisées (maîtrisées).\n\nVoulez-vous quand même vous entraîner dessus ?`)) {
        launchQuizSession(allMatching, `Entraînement : ${entity || category || organ}`);
        return;
      }
      return;
    }

    alert("Aucune question disponible pour cette sélection.");
    return;
  }
  launchQuizSession(pool, `Entraînement : ${entity || category || organ} (${pool.length} à faire)`);
}

// --- SESSIONS DE QUIZ SIMPLE ---
function shuffleQuestionOptions(q) {
  // Copie profonde pour ne JAMAIS muter la question originale dans state.questions
  const optExp = (Array.isArray(q.optionExplanations) && q.optionExplanations.length > 0)
    ? q.optionExplanations
    : (Array.isArray(q.optionexplanations) ? q.optionexplanations : []);

  const sessionQ = {
    ...q,
    options: [...(q.options || [])],
    correct: Array.isArray(q.correct) ? [...q.correct] : [q.correct],
    optionExplanations: [...optExp]
  };

  // Ne pas mélanger le format 'piege' (Vrai / Faux) ni le format 'ouverte' (Question ouverte sans choix)
  if (sessionQ.format !== 'piege' && sessionQ.format !== 'ouverte' && sessionQ.options && sessionQ.options.length > 1) {
    const corSet = new Set(sessionQ.correct);
    const exps = sessionQ.optionExplanations || [];

    const items = sessionQ.options.map((optText, origIdx) => ({
      text: optText,
      isCorrect: corSet.has(origIdx),
      explanation: exps[origIdx] || ''
    }));

    // Algorithme de mélange aléatoire de Fisher-Yates
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    sessionQ.options = items.map(it => it.text);
    sessionQ.optionExplanations = items.map(it => it.explanation);
    sessionQ.correct = [];
    items.forEach((it, newIdx) => {
      if (it.isCorrect) sessionQ.correct.push(newIdx);
    });
  }

  return sessionQ;
}

function launchQuizSession(pool, title) {
  // Mélange aléatoire de l'ordre des questions ET mélange aléatoire des propositions (A, B, C...) pour chaque question
  const randomizedQuestions = [...pool]
    .sort(() => 0.5 - Math.random())
    .map(q => shuffleQuestionOptions(q));

  state.currentSession = {
    title: title,
    questions: randomizedQuestions,
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
  const activeQuestions = state.questions.filter(q => !q.mastered && !isQuestionDoneToday(q));
  if (activeQuestions.length === 0) {
    alert("Vous avez déjà terminé toutes vos révisions pour aujourd'hui 🎉 !\nRevenez demain pour de nouvelles échéances.");
    return;
  }
  const pool = [...activeQuestions].sort(() => 0.5 - Math.random()).slice(0, 10);
  launchQuizSession(pool, `Sprint Quotidien (${pool.length} questions restantes)`);
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

  // Masquer l'organe et la classification par défaut pour l'entraînement
  session.showOrganHint = false;
  const hintBtn = document.getElementById('btn-toggle-organ-hint');
  const breadcrumbContainer = document.getElementById('session-breadcrumb-container');
  const breadcrumbEl = document.getElementById('session-breadcrumb');

  if (breadcrumbEl) {
    breadcrumbEl.textContent = `${q.organ} > ${q.category} > ${q.entity}`;
  }
  if (hintBtn) {
    hintBtn.classList.remove('hidden');
    const textHint = document.getElementById('text-organ-hint');
    const labelHint = document.getElementById('label-organ-hint-action');
    if (textHint) textHint.textContent = "Organe masqué pour l'entraînement";
    if (labelHint) labelHint.textContent = "Afficher l'indice";
  }
  if (breadcrumbContainer) {
    breadcrumbContainer.classList.add('hidden');
  }

  const isQCM = (q.format === 'qcm');
  const isOpen = (q.format === 'ouverte');
  const formatBadge = document.getElementById('session-format-badge');
  if (isOpen) {
    formatBadge.textContent = "✍️ Question Ouverte (Diagnostic)";
    formatBadge.className = "text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20";
  } else if (isQCM) {
    formatBadge.textContent = "☑️ QCM (Choix Multiples)";
    formatBadge.className = "text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
  } else {
    formatBadge.textContent = (q.format === 'piege' ? "⚠️ Vrai / Faux" : "🔘 QCU (Choix Unique)");
    formatBadge.className = "text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20";
  }

  // Filtrer les tags pour ne pas trahir l'organe ou l'entité pendant la phase de réflexion
  const tagsBox = document.getElementById('session-tags-box');
  tagsBox.innerHTML = '';
  const organLower = (q.organ || '').toLowerCase().trim();
  const entityLower = (q.entity || '').toLowerCase().trim();
  (q.tags || [])
    .filter(t => {
      const tl = t.toLowerCase().trim();
      return tl !== organLower && tl !== entityLower;
    })
    .forEach(t => {
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
    const isSingle = (q.images.length === 1);
    imgContainer.className = isSingle 
      ? "grid grid-cols-1 gap-3" 
      : "grid grid-cols-1 sm:grid-cols-2 gap-3";

    q.images.forEach((imgObj, idx) => {
      const card = document.createElement('div');
      card.className = "relative rounded-2xl overflow-hidden border border-slate-800 bg-black cursor-zoom-in group flex flex-col justify-end shadow-xl hover:border-teal-500/50 transition";
      card.onclick = () => openLightbox(imgObj.url, imgObj.caption || `Lame ${idx + 1}`);
      card.innerHTML = `
        <div class="relative w-full ${isSingle ? 'max-h-96' : 'max-h-64'} flex items-center justify-center bg-black overflow-hidden">
          <img src="${imgObj.url}" alt="Lame microscopique" class="w-full ${isSingle ? 'max-h-96' : 'max-h-64'} object-contain group-hover:scale-[1.02] transition duration-300">
        </div>
        <div class="bg-slate-900/90 backdrop-blur p-2.5 text-white text-xs font-medium flex items-center justify-between border-t border-slate-800">
          <div class="flex items-center space-x-2 truncate">
            <span class="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold">Lame ${idx + 1}</span>
            <span class="truncate text-slate-200">${escapeHtml(imgObj.caption || 'Cliquer pour examiner en plein écran')}</span>
          </div>
          <span class="text-[11px] text-teal-400 font-semibold flex items-center space-x-1 shrink-0 ml-2">
            <span>Examiner</span>
            <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i>
          </span>
        </div>
      `;
      imgContainer.appendChild(card);
    });
  } else {
    imgContainer.classList.add('hidden');
  }

  // Options vs Question Ouverte
  const optionsBox = document.getElementById('session-options-container');
  const openContainer = document.getElementById('session-open-container');
  const openInput = document.getElementById('session-open-input');
  const openResultBox = document.getElementById('session-open-result-box');
  const valBtn = document.getElementById('btn-session-validate-qcm');

  if (isOpen) {
    if (optionsBox) {
      optionsBox.innerHTML = '';
      optionsBox.classList.add('hidden');
    }
    if (valBtn) valBtn.classList.add('hidden');
    if (openContainer) {
      openContainer.classList.remove('hidden');
      if (openInput) {
        openInput.value = '';
        openInput.disabled = false;
        setTimeout(() => openInput.focus(), 80);
      }
      if (openResultBox) {
        openResultBox.classList.add('hidden');
        openResultBox.innerHTML = '';
      }
      const valOpenBtn = document.getElementById('btn-session-validate-open');
      if (valOpenBtn) {
        valOpenBtn.disabled = false;
        valOpenBtn.classList.remove('hidden');
      }
    }
  } else {
    if (openContainer) openContainer.classList.add('hidden');
    if (optionsBox) {
      optionsBox.classList.remove('hidden');
      optionsBox.innerHTML = '';
      q.options.forEach((optText, idx) => {
        const wrapper = document.createElement('div');
        wrapper.id = 'opt-wrapper-' + idx;
        wrapper.className = "space-y-1.5";

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
            <span class="font-medium">${escapeHtml(optText)}</span>
          </div>
          <div class="opt-status w-5 h-5 flex items-center justify-center"></div>
        `;
        wrapper.appendChild(btn);

        const expDiv = document.createElement('div');
        expDiv.id = 'opt-exp-' + idx;
        expDiv.className = "hidden ml-4 pl-3 py-2 pr-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2";
        wrapper.appendChild(expDiv);

        optionsBox.appendChild(wrapper);
      });
    }

    if (valBtn) {
      if (isQCM) {
        valBtn.classList.remove('hidden');
        valBtn.disabled = true;
        valBtn.textContent = "Valider ma sélection (0 cochée)";
      } else {
        valBtn.classList.add('hidden');
      }
    }
  }

  document.getElementById('session-feedback-box').classList.add('hidden');
  const expImgs = document.getElementById('session-explanation-images-container');
  if (expImgs) {
    expImgs.classList.add('hidden');
    expImgs.innerHTML = '';
  }
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

function toggleSessionOrganHint() {
  const session = state.currentSession;
  if (!session) return;
  session.showOrganHint = !session.showOrganHint;

  const breadcrumbContainer = document.getElementById('session-breadcrumb-container');
  const textHint = document.getElementById('text-organ-hint');
  const labelHint = document.getElementById('label-organ-hint-action');
  const iconHint = document.getElementById('icon-organ-hint');

  if (session.showOrganHint) {
    if (breadcrumbContainer) breadcrumbContainer.classList.remove('hidden');
    if (textHint) textHint.textContent = "Indice organe révélé :";
    if (labelHint) labelHint.textContent = "Masquer l'indice";
    if (iconHint) iconHint.setAttribute('data-lucide', 'eye');
  } else {
    if (breadcrumbContainer) breadcrumbContainer.classList.add('hidden');
    if (textHint) textHint.textContent = "Organe masqué pour l'entraînement";
    if (labelHint) labelHint.textContent = "Afficher l'indice";
    if (iconHint) iconHint.setAttribute('data-lucide', 'eye-off');
  }
  if (window.lucide) lucide.createIcons();
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

  const earnedXp = getQuestionXp(q);

  if (isExact) {
    q.stats.correct += 1;
    q.stats.consecutiveCorrect = (q.stats.consecutiveCorrect || 0) + 1;
    state.stats.totalCorrect += 1;
    session.score += 1;
    session.xpEarned += earnedXp;
    state.stats.xp += earnedXp;
    playSound('correct');
    confetti({ particleCount: q.difficulty === 'extreme' ? 80 : 35, spread: 65, origin: { y: 0.8 } });
    checkCategoryCompletionBonus(q.organ, q.category);
    checkAndUnlockBadges();
  } else {
    q.stats.consecutiveCorrect = 0;
    q.flagged = true;
    playSound('wrong');
  }

  // Règle J1 : Planification automatique pour que la question sorte des cartes du jour
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (isExact ? 3 : 1));
  q.stats.nextReviewDate = targetDate.toISOString().split('T')[0];
  q.stats.intervalDays = isExact ? 3 : 1;

  const globalQ = state.questions.find(item => item.id === q.id);
  if (globalQ) {
    globalQ.stats = q.stats;
    globalQ.flagged = q.flagged;
    dbSaveUserProgress(globalQ);
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

    // Révélation de l'explication spécifique à cet item
    const expDiv = document.getElementById('opt-exp-' + idx);
    const exps = (Array.isArray(q.optionExplanations) && q.optionExplanations.length > 0)
      ? q.optionExplanations
      : (Array.isArray(q.optionexplanations) ? q.optionexplanations : []);
    const itemExplanation = (exps && exps[idx]) ? exps[idx].trim() : '';
    if (expDiv && itemExplanation) {
      expDiv.innerHTML = `
        <i data-lucide="lightbulb" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"></i>
        <div class="flex-1 leading-relaxed">
          <span class="font-bold text-amber-300">Item ${String.fromCharCode(65 + idx)} :</span>
          <span class="text-slate-300 ml-1">${escapeHtml(itemExplanation)}</span>
        </div>
      `;
      expDiv.classList.remove('hidden');
    }
  });

  document.getElementById('btn-session-validate-qcm').classList.add('hidden');

  revealSessionFeedback(isExact, q);
}

function handleOpenAnswerKeyDown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    validateOpenAnswer();
  }
}

function validateOpenAnswer() {
  const session = state.currentSession;
  if (!session || session.isAnswered) return;
  const q = session.questions[session.currentIndex];
  const inputEl = document.getElementById('session-open-input');
  const userText = (inputEl ? inputEl.value : '').trim();
  if (!userText) {
    alert("Veuillez saisir votre diagnostic avant de valider.");
    if (inputEl) inputEl.focus();
    return;
  }

  session.isAnswered = true;
  if (inputEl) inputEl.disabled = true;
  const valOpenBtn = document.getElementById('btn-session-validate-open');
  if (valOpenBtn) valOpenBtn.disabled = true;

  const accepted = getQuestionAcceptedAnswers(q);
  const isMatch = accepted.some(target => isDiagnosticMatch(userText, target));

  session.lastOpenUserText = userText;
  session.lastOpenAccepted = accepted;
  session.lastOpenIsMatch = isMatch;

  if (!q.stats) q.stats = { seen: 0, correct: 0, consecutiveCorrect: 0 };
  q.stats.seen += 1;
  q.stats.lastReviewed = new Date().toISOString();
  state.stats.totalAnswered += 1;

  if (isMatch) {
    q.stats.correct += 1;
    q.stats.consecutiveCorrect = (q.stats.consecutiveCorrect || 0) + 1;
    state.stats.totalCorrect += 1;
    session.score += 1;
    session.xpEarned += 15;
    state.stats.xp += 15;
    playSound('correct');
    confetti({ particleCount: 35, spread: 65, origin: { y: 0.8 } });
  } else {
    q.stats.consecutiveCorrect = 0;
    q.flagged = true;
    playSound('wrong');
  }

  // Règle J1 : Planification automatique pour que la question sorte des cartes du jour
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (isMatch ? 3 : 1));
  q.stats.nextReviewDate = targetDate.toISOString().split('T')[0];
  q.stats.intervalDays = isMatch ? 3 : 1;

  const globalQ = state.questions.find(item => item.id === q.id);
  if (globalQ) {
    globalQ.stats = q.stats;
    globalQ.flagged = q.flagged;
    dbSaveUserProgress(globalQ);
  }

  saveQuestions();
  saveStats();

  renderOpenAnswerResult(isMatch, userText, accepted);
  revealSessionFeedback(isMatch, q);
}

function renderOpenAnswerResult(isMatch, userText, accepted) {
  const resultBox = document.getElementById('session-open-result-box');
  if (!resultBox) return;

  resultBox.className = isMatch
    ? "p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-2.5"
    : "p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2.5";

  resultBox.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2 font-bold text-sm ${isMatch ? 'text-emerald-400' : 'text-rose-400'}">
        <i data-lucide="${isMatch ? 'check-circle' : 'x-circle'}" class="w-4 h-4"></i>
        <span>${isMatch ? 'Diagnostic Exact !' : 'Diagnostic non reconnu ou incomplet'}</span>
      </div>
      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border ${isMatch ? 'border-emerald-500/40 text-emerald-300' : 'border-rose-500/40 text-rose-300'} font-bold">
        ${isMatch ? '+15 XP' : '0 XP'}
      </span>
    </div>

    <div class="space-y-1 pt-1 border-t border-slate-800">
      <div class="text-slate-400 text-[11px]">Votre réponse saisie :</div>
      <div class="font-mono text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-slate-950 border ${isMatch ? 'border-emerald-500/40 text-emerald-300' : 'border-rose-500/40 text-rose-300'} font-bold">
        ${escapeHtml(userText)}
      </div>
    </div>

    <div class="space-y-1">
      <div class="text-slate-400 text-[11px]">Formulation(s) acceptée(s) par le créateur :</div>
      <div class="flex flex-wrap gap-1.5">
        ${accepted.map((ans, idx) => `
          <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
            idx === 0 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'bg-slate-900 text-teal-300 border border-slate-700'
          }">
            ${escapeHtml(ans)} ${idx === 0 ? '⭐ (Attendu)' : ''}
          </span>
        `).join('')}
      </div>
    </div>

    ${!isMatch ? `
      <div class="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span class="text-[11px] text-slate-300">Vous aviez la bonne lésion (faute de frappe, synonyme non listé...) ?</span>
        <button type="button" onclick="overrideOpenAnswerCorrect()" class="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition flex items-center space-x-1.5 shrink-0">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>J'avais le bon diagnostic</span>
        </button>
      </div>
    ` : ''}
  `;

  resultBox.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function overrideOpenAnswerCorrect() {
  const session = state.currentSession;
  if (!session || !session.isAnswered) return;
  const q = session.questions[session.currentIndex];

  session.score += 1;
  session.xpEarned += 15;
  state.stats.xp += 15;
  state.stats.totalCorrect += 1;
  if (!q.stats) q.stats = { seen: 1, correct: 0, consecutiveCorrect: 0 };
  q.stats.correct += 1;
  q.stats.consecutiveCorrect = 1;
  q.flagged = false;
  q.stats.lastReviewed = new Date().toISOString();

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  q.stats.nextReviewDate = targetDate.toISOString().split('T')[0];
  q.stats.intervalDays = 3;

  const globalQ = state.questions.find(item => item.id === q.id);
  if (globalQ) {
    globalQ.stats = q.stats;
    globalQ.flagged = q.flagged;
    dbSaveUserProgress(globalQ);
  }

  saveQuestions();
  saveStats();

  playSound('correct');
  confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });

  renderOpenAnswerResult(true, session.lastOpenUserText || '', session.lastOpenAccepted || []);
  revealSessionFeedback(true, q);
  showToast("🤝 Réponse validée comme correcte !");
}

function revealSessionFeedback(isExact, q) {
  // Révélation automatique de la classification et de l'organe lors de la correction
  const breadcrumbContainer = document.getElementById('session-breadcrumb-container');
  if (breadcrumbContainer) breadcrumbContainer.classList.remove('hidden');

  const hintBtn = document.getElementById('btn-toggle-organ-hint');
  if (hintBtn) hintBtn.classList.add('hidden');

  const fbHierarchy = document.getElementById('session-feedback-hierarchy');
  if (fbHierarchy) {
    fbHierarchy.textContent = `${q.organ} > ${q.category} > ${q.entity}`;
  }

  // Révéler tous les tags lors de la correction
  const tagsBox = document.getElementById('session-tags-box');
  if (tagsBox) {
    tagsBox.innerHTML = '';
    (q.tags || []).forEach(t => {
      const chip = document.createElement('span');
      chip.className = "text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300";
      chip.textContent = `#${t}`;
      tagsBox.appendChild(chip);
    });
  }

  const fbBox = document.getElementById('session-feedback-box');
  const banner = document.getElementById('session-feedback-banner');
  banner.className = isExact ? "p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300";
  document.getElementById('session-feedback-title').textContent = isExact ? "Exact ! Analyse diagnostique parfaite." : "Erreur diagnostique !";
  
  const fbText = document.getElementById('session-feedback-text');
  if (fbText) {
    if (q.explanation && q.explanation.trim()) {
      fbText.textContent = q.explanation;
      fbText.classList.remove('hidden');
    } else {
      fbText.textContent = "";
      fbText.classList.add('hidden');
    }
  }

  const trapBox = document.getElementById('session-trap-box');
  const trapText = document.getElementById('session-trap-text');
  if (trapBox && trapText) {
    if (q.trap && q.trap.trim()) {
      trapText.textContent = q.trap;
      trapBox.classList.remove('hidden');
    } else {
      trapBox.classList.add('hidden');
    }
  }

  // Schémas et illustrations d'explication (révélés lors de la correction)
  const expImgsContainer = document.getElementById('session-explanation-images-container');
  if (expImgsContainer) {
    if (q.explanationImages && q.explanationImages.length > 0) {
      expImgsContainer.innerHTML = q.explanationImages.map((img, idx) => `
        <div class="relative rounded-2xl overflow-hidden border border-teal-500/30 bg-black cursor-zoom-in group flex flex-col justify-end shadow-lg hover:border-teal-400 transition"
             onclick="openLightbox('${img.url}', '${escapeJsString(img.caption || `Schéma d\'explication ${idx + 1}`)}')">
          <div class="relative w-full max-h-60 flex items-center justify-center bg-black overflow-hidden">
            <img src="${img.url}" alt="${escapeHtml(img.caption || 'Schéma explicatif')}" class="w-full max-h-60 object-contain group-hover:scale-105 transition duration-300">
          </div>
          <div class="bg-slate-900/95 backdrop-blur p-2 text-white text-xs font-medium flex items-center justify-between border-t border-slate-800">
            <div class="flex items-center space-x-1.5 truncate">
              <span class="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold">Schéma ${idx + 1}</span>
              <span class="truncate text-slate-200 text-[11px]">${escapeHtml(img.caption || 'Agrandir')}</span>
            </div>
            <i data-lucide="zoom-in" class="w-3.5 h-3.5 text-teal-400 shrink-0 ml-1"></i>
          </div>
        </div>
      `).join('');
      expImgsContainer.classList.remove('hidden');
    } else {
      expImgsContainer.innerHTML = '';
      expImgsContainer.classList.add('hidden');
    }
  }

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
    switchTab(state.sessionReturnView || 'play');
  }
}

function toggleSessionFlag() {
  const session = state.currentSession;
  if (!session) return;
  const q = session.questions[session.currentIndex];
  q.flagged = !q.flagged;
  saveQuestions();
  dbSaveUserProgress(q);
  document.getElementById('btn-session-flag').className = q.flagged ? "text-amber-400 p-1.5 rounded-lg bg-slate-800" : "text-slate-400 hover:text-amber-400 p-1.5 rounded-lg";
}

// --- FORMULAIRE CRÉATEUR QUESTION SIMPLE ---
function resetQuestionForm() {
  document.getElementById('form-create-question').reset();
  document.getElementById('form-q-edit-id').value = "";
  document.getElementById('form-q-format').value = "qcm";
  const diffEl = document.getElementById('form-q-difficulty');
  if (diffEl) diffEl.value = 'facile';
  const cluesEl = document.getElementById('form-q-extreme-clues');
  if (cluesEl) cluesEl.value = '';
  onDifficultyChange();
  state.editorUploadedImages = [];
  state.editorUploadedExplanationImages = [];
  state.editorSelectedTags.clear();
  state.editorQuestionOptions = [
    { text: '', explanation: '', correct: false },
    { text: '', explanation: '', correct: false },
    { text: '', explanation: '', correct: false },
    { text: '', explanation: '', correct: false }
  ];
  state.editorOpenAnswers = [''];
  renderEditorUploadedImages();
  renderEditorUploadedExplanationImages();
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
  const isOpen = (format === 'ouverte');
  const btnAdd = document.getElementById('btn-add-editor-option');

  const mcqWrapper = document.getElementById('form-mcq-wrapper');
  const tfWrapper = document.getElementById('form-tf-wrapper');
  const openWrapper = document.getElementById('form-open-wrapper');
  const mcqHeader = document.getElementById('editor-mcq-header');

  if (mcqWrapper) mcqWrapper.classList.toggle('hidden', isPiege || isOpen);
  if (tfWrapper) tfWrapper.classList.toggle('hidden', !isPiege);
  if (openWrapper) openWrapper.classList.toggle('hidden', !isOpen);
  if (btnAdd) btnAdd.classList.toggle('hidden', isPiege || isOpen);
  if (mcqHeader) mcqHeader.classList.toggle('hidden', isPiege || isOpen);

  if (isOpen) {
    if (state.editorOpenAnswers.length === 1 && !state.editorOpenAnswers[0]) {
      const entityVal = document.getElementById('form-q-entity')?.value?.trim();
      if (entityVal) state.editorOpenAnswers[0] = entityVal;
    }
    renderEditorOpenAnswers();
  } else if (!isPiege) {
    if (!isQCM && state.editorQuestionOptions) {
      let firstFound = false;
      state.editorQuestionOptions.forEach(opt => {
        if (opt.correct && !firstFound) {
          firstFound = true;
        } else if (opt.correct) {
          opt.correct = false;
        }
      });
    }
    renderEditorOptions();
  }
}

function renderEditorOpenAnswers() {
  const container = document.getElementById('form-open-answers-list');
  if (!container) return;

  if (!state.editorOpenAnswers || state.editorOpenAnswers.length === 0) {
    state.editorOpenAnswers = [''];
  }

  container.innerHTML = '';
  const canDelete = state.editorOpenAnswers.length > 1;

  state.editorOpenAnswers.forEach((ans, idx) => {
    const row = document.createElement('div');
    row.className = "flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition";

    const isFirst = (idx === 0);
    const badgeLabel = isFirst ? "Attendu" : `Var. ${idx + 1}`;
    const badgeBg = isFirst ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-slate-800 text-teal-300 border-slate-700";

    row.innerHTML = `
      <span class="px-2 py-1 rounded-lg text-[10px] font-mono font-bold border shrink-0 ${badgeBg}">
        ${badgeLabel}
      </span>
      <input type="text"
             value="${escapeHtml(ans)}"
             oninput="updateEditorOpenAnswer(${idx}, this.value)"
             placeholder="${isFirst ? 'Diagnostic principal (ex: Carcinome canalaire infiltrant) *' : 'Variante / abréviation (ex: CCI, Carcinome NST, Carcinome mammaire infiltrant...)'}"
             class="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium">
      ${canDelete ? `
        <button type="button" onclick="removeEditorOpenAnswer(${idx})" title="Supprimer cette formulation" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      ` : ''}
    `;

    container.appendChild(row);
  });

  if (window.lucide) lucide.createIcons();
}

function addEditorOpenAnswer() {
  if (!state.editorOpenAnswers) state.editorOpenAnswers = [];
  state.editorOpenAnswers.push('');
  renderEditorOpenAnswers();
  setTimeout(() => {
    const inputs = document.querySelectorAll('#form-open-answers-list input');
    if (inputs.length > 0) inputs[inputs.length - 1].focus();
  }, 50);
}

function removeEditorOpenAnswer(idx) {
  if (!state.editorOpenAnswers || state.editorOpenAnswers.length <= 1) return;
  state.editorOpenAnswers.splice(idx, 1);
  renderEditorOpenAnswers();
}

function updateEditorOpenAnswer(idx, val) {
  if (state.editorOpenAnswers && typeof state.editorOpenAnswers[idx] !== 'undefined') {
    state.editorOpenAnswers[idx] = val;
  }
}

function renderEditorOptions() {
  const container = document.getElementById('form-mcq-wrapper');
  if (!container) return;

  const format = document.getElementById('form-q-format') ? document.getElementById('form-q-format').value : 'qcm';
  const isQCM = (format === 'qcm');
  const isPiege = (format === 'piege');

  if (isPiege) return;

  if (!state.editorQuestionOptions || state.editorQuestionOptions.length === 0) {
    state.editorQuestionOptions = [
      { text: '', explanation: '', correct: false },
      { text: '', explanation: '', correct: false },
      { text: '', explanation: '', correct: false },
      { text: '', explanation: '', correct: false }
    ];
  }

  container.innerHTML = '';
  const canDelete = state.editorQuestionOptions.length > 2;

  state.editorQuestionOptions.forEach((opt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const card = document.createElement('div');
    card.className = "p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition";

    card.innerHTML = `
      <div class="flex items-center space-x-2.5">
        <span class="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono">${letter}</span>
        <label class="flex items-center cursor-pointer" title="${isQCM ? 'Cocher si cette réponse est vraie' : 'Sélectionner si cette réponse est la seule vraie'}">
          <input type="${isQCM ? 'checkbox' : 'radio'}" name="editor_choice_indicator" ${opt.correct ? 'checked' : ''} onchange="handleEditorOptionCorrectChange(${idx}, this.checked)" class="text-teal-500 focus:ring-teal-500 w-4 h-4 rounded cursor-pointer">
        </label>
        <input type="text" id="form-opt-text-${idx}" data-idx="${idx}" value="${escapeHtml(opt.text || '')}" oninput="updateEditorOptionText(${idx}, this.value)" placeholder="Proposition ${letter} *" class="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium">
        ${canDelete ? `
          <button type="button" onclick="removeEditorOption(${idx})" title="Supprimer la proposition ${letter}" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        ` : ''}
      </div>
      <div class="flex items-center space-x-2 pl-8">
        <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-400/80 shrink-0"></i>
        <input type="text" id="form-opt-exp-${idx}" data-idx="${idx}" value="${escapeHtml(opt.explanation || '')}" oninput="updateEditorOptionExplanation(${idx}, this.value)" placeholder="Justification / commentaire pour l'item ${letter} (optionnel)..." class="flex-1 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none focus:border-amber-500/50">
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function updateEditorOptionText(idx, val) {
  if (state.editorQuestionOptions && state.editorQuestionOptions[idx]) {
    state.editorQuestionOptions[idx].text = val;
  }
}

function updateEditorOptionExplanation(idx, val) {
  if (state.editorQuestionOptions && state.editorQuestionOptions[idx]) {
    state.editorQuestionOptions[idx].explanation = val;
  }
}

function addEditorOption() {
  if (!state.editorQuestionOptions) state.editorQuestionOptions = [];
  state.editorQuestionOptions.push({ text: '', explanation: '', correct: false });
  renderEditorOptions();
  setTimeout(() => {
    const inputs = document.querySelectorAll('#form-mcq-wrapper input[type="text"]');
    if (inputs.length >= 2) {
      inputs[inputs.length - 2].focus();
    }
  }, 50);
}

function removeEditorOption(idx) {
  if (!state.editorQuestionOptions || state.editorQuestionOptions.length <= 2) {
    alert("Une question doit comporter au moins 2 propositions.");
    return;
  }
  state.editorQuestionOptions.splice(idx, 1);
  renderEditorOptions();
}

function handleEditorOptionCorrectChange(idx, isChecked) {
  const format = document.getElementById('form-q-format') ? document.getElementById('form-q-format').value : 'qcm';
  const isQCM = (format === 'qcm');
  if (isQCM) {
    if (state.editorQuestionOptions && state.editorQuestionOptions[idx]) {
      state.editorQuestionOptions[idx].correct = isChecked;
    }
  } else {
    if (state.editorQuestionOptions) {
      state.editorQuestionOptions.forEach((opt, i) => {
        opt.correct = (i === idx);
      });
      renderEditorOptions();
    }
  }
}

async function attachFilesToEditor(files) {
  if (!files || files.length === 0) return;
  const validFiles = Array.from(files).filter(f => f.type && f.type.startsWith('image/'));
  if (validFiles.length === 0) return;

  for (const file of validFiles) {
    const url = await uploadImageFile(file);
    const count = state.editorUploadedImages.length + 1;
    const defaultCaption = (file.name && file.name !== 'image.png' && file.name !== 'blob')
      ? file.name.replace(/\.[^/.]+$/, "")
      : `Lame microscopique ${count}`;
    state.editorUploadedImages.push({
      url: url,
      caption: defaultCaption
    });
  }
  renderEditorUploadedImages();
  showToast(`📸 ${validFiles.length} lame${validFiles.length > 1 ? 's' : ''} ajoutée${validFiles.length > 1 ? 's' : ''} à la question !`);
}

async function handleEditorImageUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  await attachFilesToEditor(files);
  e.target.value = '';
}

function handleEditorDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('editor-image-dropzone');
  if (dropzone) {
    dropzone.classList.add('border-teal-400', 'bg-teal-500/10');
  }
}

function handleEditorDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('editor-image-dropzone');
  if (dropzone) {
    dropzone.classList.remove('border-teal-400', 'bg-teal-500/10');
  }
}

async function handleEditorDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('editor-image-dropzone');
  if (dropzone) {
    dropzone.classList.remove('border-teal-400', 'bg-teal-500/10');
  }

  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length > 0) {
    await attachFilesToEditor(dt.files);
  }
}

async function attachExplanationFilesToEditor(files) {
  if (!files || files.length === 0) return;
  const validFiles = Array.from(files).filter(f => f.type && f.type.startsWith('image/'));
  if (validFiles.length === 0) return;

  if (!state.editorUploadedExplanationImages) state.editorUploadedExplanationImages = [];

  for (const file of validFiles) {
    const url = await uploadImageFile(file);
    const count = state.editorUploadedExplanationImages.length + 1;
    const defaultCaption = (file.name && file.name !== 'image.png' && file.name !== 'blob')
      ? file.name.replace(/\.[^/.]+$/, "")
      : `Schéma explicatif ${count}`;
    state.editorUploadedExplanationImages.push({
      url: url,
      caption: defaultCaption
    });
  }
  renderEditorUploadedExplanationImages();
  showToast(`💡 ${validFiles.length} schéma${validFiles.length > 1 ? 's' : ''} d'explication ajouté${validFiles.length > 1 ? 's' : ''} !`);
}

async function handleEditorExplanationImageUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  await attachExplanationFilesToEditor(files);
  e.target.value = '';
}

function handleEditorExplanationDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('editor-explanation-image-dropzone');
  if (dropzone) {
    dropzone.classList.add('border-teal-400', 'bg-teal-500/10');
  }
}

function handleEditorExplanationDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('editor-explanation-image-dropzone');
  if (dropzone) {
    dropzone.classList.remove('border-teal-400', 'bg-teal-500/10');
  }
}

async function handleEditorExplanationDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('editor-explanation-image-dropzone');
  if (dropzone) {
    dropzone.classList.remove('border-teal-400', 'bg-teal-500/10');
  }
  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length > 0) {
    await attachExplanationFilesToEditor(dt.files);
  }
}

function renderEditorUploadedExplanationImages() {
  const container = document.getElementById('editor-explanation-images-preview');
  if (!container) return;
  container.innerHTML = '';
  if (!state.editorUploadedExplanationImages || state.editorUploadedExplanationImages.length === 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');

  state.editorUploadedExplanationImages.forEach((imgObj, idx) => {
    const card = document.createElement('div');
    card.className = "relative rounded-xl overflow-hidden border border-teal-500/40 bg-black flex flex-col p-2 space-y-2 group shadow-md";
    card.innerHTML = `
      <div class="relative cursor-pointer overflow-hidden rounded group/img" onclick="openLightbox('${imgObj.url}', '${escapeJsString(imgObj.caption || 'Schéma ' + (idx + 1))}')">
        <img src="${imgObj.url}" alt="Aperçu Schéma" class="h-28 w-full object-contain rounded bg-slate-950 group-hover/img:scale-105 transition">
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
          <i data-lucide="zoom-in" class="w-5 h-5 text-teal-400"></i>
        </div>
      </div>
      <input type="text" value="${escapeHtml(imgObj.caption || '')}" oninput="state.editorUploadedExplanationImages[${idx}].caption = this.value" placeholder="Légende (ex: Arbre IHC, Tableau différentiel...)" class="text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500">
      <div class="flex items-center justify-between pt-0.5">
        <span class="text-[10px] text-teal-400 font-mono">Schéma #${idx + 1}</span>
        <button type="button" onclick="state.editorUploadedExplanationImages.splice(${idx}, 1); renderEditorUploadedExplanationImages();" class="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-0.5 transition">
          <i data-lucide="trash-2" class="w-3 h-3"></i>
          <span>Supprimer</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function setLastActiveImageZone(zone) {
  state.lastActiveImageZone = zone;
  const expDrop = document.getElementById('editor-explanation-image-dropzone');
  const stmtDrop = document.getElementById('editor-image-dropzone');

  if (zone === 'explanation') {
    if (expDrop) {
      expDrop.classList.add('border-teal-400', 'bg-teal-500/10');
    }
    if (stmtDrop) {
      stmtDrop.classList.remove('border-teal-400', 'bg-teal-500/10');
    }
  } else {
    if (stmtDrop) {
      stmtDrop.classList.add('border-teal-400', 'bg-teal-500/10');
    }
    if (expDrop) {
      expDrop.classList.remove('border-teal-400', 'bg-teal-500/10');
    }
  }
}

function handleExplanationDropzoneClick(e) {
  setLastActiveImageZone('explanation');
  // Si le clic provient d'un bouton interne (ex: "Coller le schéma"), ne pas déclencher le input file
  if (e && e.target && e.target.closest('button')) {
    return;
  }
  const fileInput = document.getElementById('editor-explanation-file-input');
  if (fileInput) fileInput.click();
}

async function pasteClipboardToExplanation(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  setLastActiveImageZone('explanation');

  try {
    if (navigator.clipboard && navigator.clipboard.read) {
      const items = await navigator.clipboard.read();
      const imageFiles = [];
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            imageFiles.push(new File([blob], "schema_explication.png", { type }));
          }
        }
      }
      if (imageFiles.length > 0) {
        await attachExplanationFilesToEditor(imageFiles);
        return;
      }
    }
  } catch (err) {
    console.warn("Clipboard read API:", err);
  }

  // Fallback si la permission presse-papiers est requise ou indisponible : focus sur la zone
  const dropzone = document.getElementById('editor-explanation-image-dropzone');
  if (dropzone) {
    dropzone.focus();
    dropzone.classList.add('border-teal-400', 'ring-2', 'ring-teal-400/50');
  }
  showToast("📋 Zone schéma prête : appuyez sur ⌘V ou Ctrl+V pour coller !", "info");
}

function initClipboardPasteListener() {
  window.addEventListener('paste', async (e) => {
    // Ne pas intercepter si la vue de création n'est pas active
    const createView = document.getElementById('view-create');
    if (!createView || createView.classList.contains('hidden')) return;

    // Ne pas intercepter si l'utilisateur est dans une modale
    const modalDetail = document.getElementById('modal-question-detail');
    if (modalDetail && !modalDetail.classList.contains('hidden')) return;

    const items = (e.clipboardData || window.clipboardData)?.items;
    if (!items || items.length === 0) return;

    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    // S'il n'y a pas d'image dans le presse-papiers, le collage texte standard continue normalement
    if (imageFiles.length === 0) return;

    // Empêcher l'insertion de texte binaire dans les champs texte
    e.preventDefault();

    if (state.creatorMode === 'simple') {
      const activeEl = document.activeElement;
      const target = e.target;

      let isExplanationTarget = false;

      // 1. Cible explicite via élément actif ou cible directe de l'événement paste
      if (
        (activeEl && (
          activeEl.id === 'form-q-explanation' ||
          activeEl.id === 'form-q-trap' ||
          activeEl.closest('#editor-explanation-section') ||
          activeEl.closest('#editor-explanation-image-dropzone') ||
          activeEl.closest('#editor-explanation-images-preview')
        )) ||
        (target && (
          target.id === 'form-q-explanation' ||
          target.id === 'form-q-trap' ||
          target.closest('#editor-explanation-section') ||
          target.closest('#editor-explanation-image-dropzone') ||
          target.closest('#editor-explanation-images-preview')
        ))
      ) {
        isExplanationTarget = true;
      }
      // 2. Si l'utilisateur a récemment activé ou cliqué dans la zone explication
      else if (state.lastActiveImageZone === 'explanation') {
        isExplanationTarget = true;
      }
      // 3. Détection par position de scroll : si l'utilisateur est descendu au niveau de l'explication
      else {
        const expDropzone = document.getElementById('editor-explanation-image-dropzone');
        const stmtDropzone = document.getElementById('editor-image-dropzone');
        if (expDropzone && stmtDropzone) {
          const expRect = expDropzone.getBoundingClientRect();
          const stmtRect = stmtDropzone.getBoundingClientRect();
          // Si le dropzone énoncé est sorti vers le haut et la zone explication est visible
          if (stmtRect.bottom < 150 && expRect.top < window.innerHeight) {
            isExplanationTarget = true;
          }
        }
      }

      if (isExplanationTarget) {
        await attachExplanationFilesToEditor(imageFiles);
      } else {
        await attachFilesToEditor(imageFiles);
      }
    } else if (state.creatorMode === 'dp') {
      let activeStepIdx = 0;
      const activeEl = document.activeElement;
      if (activeEl) {
        const stepCard = activeEl.closest('[data-dp-step-index]');
        if (stepCard) {
          activeStepIdx = parseInt(stepCard.getAttribute('data-dp-step-index'), 10) || 0;
        } else if (state.dpSteps.length > 0) {
          activeStepIdx = state.dpSteps.length - 1;
        }
      }
      await attachFilesToDPStep(imageFiles, activeStepIdx);
    }
  });
}

function renderEditorUploadedImages() {
  const container = document.getElementById('editor-images-preview');
  if (!container) return;
  container.innerHTML = '';
  if (state.editorUploadedImages.length === 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');

  state.editorUploadedImages.forEach((imgObj, idx) => {
    const card = document.createElement('div');
    card.className = "relative rounded-xl overflow-hidden border border-slate-700 bg-black flex flex-col p-2 space-y-2 group shadow-md";
    card.innerHTML = `
      <div class="relative cursor-pointer overflow-hidden rounded group/img" onclick="openLightbox('${imgObj.url}', '${escapeJsString(imgObj.caption || 'Lame ' + (idx + 1))}')">
        <img src="${imgObj.url}" alt="Aperçu Lame" class="h-28 w-full object-contain rounded bg-slate-950 group-hover/img:scale-105 transition">
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
          <i data-lucide="zoom-in" class="w-5 h-5 text-teal-400"></i>
        </div>
      </div>
      <input type="text" value="${escapeHtml(imgObj.caption || '')}" oninput="state.editorUploadedImages[${idx}].caption = this.value" placeholder="Légende (ex: HES x40, CD30...)" class="text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500">
      <div class="flex items-center justify-between pt-0.5">
        <span class="text-[10px] text-slate-500 font-mono">Lame #${idx + 1}</span>
        <button type="button" onclick="state.editorUploadedImages.splice(${idx}, 1); renderEditorUploadedImages();" class="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-0.5 transition">
          <i data-lucide="trash-2" class="w-3 h-3"></i>
          <span>Supprimer</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

async function handleSaveQuestionForm(e) {
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
  const diffEl = document.getElementById('form-q-difficulty');
  const difficulty = diffEl ? diffEl.value : 'facile';
  const cluesEl = document.getElementById('form-q-extreme-clues');
  const extremeClues = cluesEl ? cluesEl.value.trim() : '';

  if (!organ) {
    alert("Veuillez renseigner le Niveau 1 : Organe.");
    document.getElementById('form-q-organ').focus();
    return;
  }
  if (!category) {
    alert("Veuillez renseigner le Niveau 2 : Catégorie.");
    document.getElementById('form-q-category').focus();
    return;
  }
  if (!entity) {
    alert("Veuillez renseigner le Niveau 3 : Lésion précise.");
    document.getElementById('form-q-entity').focus();
    return;
  }
  if (!question) {
    alert("Veuillez renseigner l'énoncé de la question.");
    document.getElementById('form-q-text').focus();
    return;
  }

  let options = [];
  let optionExplanations = [];
  let correct = [];
  let acceptedAnswers = [];

  if (format === 'piege') {
    options = ["Vrai", "Faux"];
    const chosen = document.querySelector('input[name="form_tf_choice"]:checked');
    correct = [chosen && chosen.value === 'Faux' ? 1 : 0];
    optionExplanations = ["", ""];
  } else if (format === 'ouverte') {
    acceptedAnswers = (state.editorOpenAnswers || [])
      .map(s => (s || '').trim())
      .filter(s => s.length > 0);

    if (acceptedAnswers.length === 0) {
      if (entity) {
        acceptedAnswers = [entity];
      } else {
        alert("En mode Question Ouverte, veuillez renseigner au moins une formulation diagnostique acceptée.");
        return;
      }
    }
    options = [...acceptedAnswers];
    correct = [0];
    optionExplanations = [];
  } else {
    (state.editorQuestionOptions || []).forEach((opt, idx) => {
      const textInput = document.getElementById(`form-opt-text-${idx}`);
      const expInput = document.getElementById(`form-opt-exp-${idx}`);
      const val = (textInput ? textInput.value : (opt.text || '')).trim();
      const exp = (expInput ? expInput.value : (opt.explanation || '')).trim();
      if (val) {
        options.push(val);
        optionExplanations.push(exp);
        if (opt.correct) correct.push(options.length - 1);
      }
    });

    if (options.length < 2) {
      alert(`En mode ${format === 'qcm' ? 'QCM' : 'QCU'}, veuillez renseigner au moins 2 propositions.`);
      return;
    }
    if (correct.length === 0) {
      alert(`En mode ${format === 'qcm' ? 'QCM' : 'QCU'}, veuillez sélectionner au moins une bonne réponse.`);
      return;
    }
  }

  let savedQuestion = null;

  if (editId) {
    const idx = state.questions.findIndex(q => q.id === editId);
    if (idx !== -1) {
      state.questions[idx] = {
        ...state.questions[idx],
        format, organ, category, entity, question, context, explanation, trap, tags, options, correct,
        optionExplanations,
        optionexplanations: optionExplanations,
        difficulty, extremeClues,
        created_by: state.questions[idx].created_by || ((state.currentUser && state.currentUser.email) ? state.currentUser.email.toLowerCase() : 'padoreau85@gmail.com'),
        acceptedAnswers: [...acceptedAnswers],
        acceptedanswers: [...acceptedAnswers],
        images: [...state.editorUploadedImages],
        explanationImages: [...(state.editorUploadedExplanationImages || [])],
        explanationimages: [...(state.editorUploadedExplanationImages || [])]
      };
      savedQuestion = state.questions[idx];
    }
  } else {
    const newQ = {
      id: "q_" + Date.now(),
      format, organ, category, entity, question, context, explanation, trap, tags, options, correct,
      optionExplanations,
      optionexplanations: optionExplanations,
      difficulty, extremeClues,
      created_by: (state.currentUser && state.currentUser.email) ? state.currentUser.email.toLowerCase() : 'padoreau85@gmail.com',
      acceptedAnswers: [...acceptedAnswers],
      acceptedanswers: [...acceptedAnswers],
      images: [...state.editorUploadedImages],
      explanationImages: [...(state.editorUploadedExplanationImages || [])],
      explanationimages: [...(state.editorUploadedExplanationImages || [])],
      flagged: false,
      mastered: false,
      stats: getDefaultQuestionStats()
    };
    state.questions.push(newQ);
    savedQuestion = newQ;
  }

  saveQuestions();

  // Synchronisation Cloud Supabase avec feedback précis
  let cloudFeedback = "";
  if (supabaseClient && savedQuestion) {
    const res = await dbUpsertQuestion(savedQuestion);
    if (res && res.error) {
      cloudFeedback = `\n\n⚠️ Information Cloud : La question est enregistrée dans votre navigateur, mais Supabase n'a pas pu la synchroniser :\n"${res.error.message}"\n\n(Vérifiez que votre compte est bien connecté et qu'il possède le rôle Créateur).`;
    } else if (res && res.localOnly) {
      cloudFeedback = `\n\n💡 Note : Vous n'êtes pas connecté. La question est bien sauvegardée sur cet appareil. Connectez-vous via 'Connexion' en haut à droite pour la publier en ligne dans la banque partagée.`;
    }
  }

  alert("Question enregistrée avec succès !" + cloudFeedback);
  resetQuestionForm();

  // Positionner immédiatement la Banque sur l'organe de la question pour qu'elle s'affiche tout de suite !
  state.bankSelectedOrgan = organ;
  state.bankSelectedCategory = 'all';
  const organSelect = document.getElementById('bank-filter-organ');
  if (organSelect) organSelect.value = organ;

  // Déplier automatiquement la lésion de la question pour qu'elle soit directement visible
  const savedLesionKey = `${organ}__${category}__${entity}`;
  state.bankExpandedLesions.add(savedLesionKey);

  switchTab('bank');
}

function createQuestionForLesion(organ, category, entity) {
  if (isReader()) {
    alert("La rédaction de questions est réservée aux comptes Créateurs.");
    switchTab('create');
    return;
  }

  switchTab('create');
  setCreatorMode('simple');
  resetQuestionForm();

  // Pré-remplir directement Organe, Catégorie et Lésion
  const organEl = document.getElementById('form-q-organ');
  const catEl = document.getElementById('form-q-category');
  const entEl = document.getElementById('form-q-entity');

  if (organEl) organEl.value = organ || '';
  if (catEl) catEl.value = category || '';
  if (entEl) entEl.value = entity || '';

  // Pré-remplir aussi le mode Dossier Progressif au cas où
  const dpOrgan = document.getElementById('form-dp-organ');
  const dpCategory = document.getElementById('form-dp-category');
  const dpEntity = document.getElementById('form-dp-entity');
  if (dpOrgan) dpOrgan.value = organ || '';
  if (dpCategory) dpCategory.value = category || '';
  if (dpEntity) dpEntity.value = entity || '';

  updateEditorDatalists();

  // Mémoriser pour le positionnement dans Ma Banque
  state.bankSelectedOrgan = organ;
  state.bankSelectedCategory = category;

  // Ouvrir automatiquement cette lésion dans Ma Banque pour le retour
  const lesionKey = `${organ}__${category}__${entity}`;
  state.bankExpandedLesions.add(lesionKey);

  // Focus direct sur l'énoncé de la question
  setTimeout(() => {
    const qText = document.getElementById('form-q-text');
    if (qText) {
      qText.focus();
      qText.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 120);

  if (typeof showRewardToast === 'function') {
    showRewardToast(`Lésion prête : ${entity}`, 'plus-circle');
  }
}
window.createQuestionForLesion = createQuestionForLesion;

function editQuestion(id) {
  if (!isCreator()) {
    alert("Action réservée aux comptes Créateurs.");
    return;
  }
  const q = state.questions.find(item => item.id === id);
  if (!q) return;

  switchTab('create');
  setCreatorMode('simple');

  document.getElementById('form-q-edit-id').value = q.id;
  document.getElementById('form-q-format').value = q.format;
  document.getElementById('form-q-organ').value = q.organ || '';
  document.getElementById('form-q-category').value = q.category || '';
  document.getElementById('form-q-entity').value = q.entity || '';
  document.getElementById('form-q-text').value = q.question || '';
  document.getElementById('form-q-context').value = q.context || '';
  document.getElementById('form-q-explanation').value = q.explanation || '';
  document.getElementById('form-q-trap').value = q.trap || '';

  const diffEl = document.getElementById('form-q-difficulty');
  if (diffEl) diffEl.value = q.difficulty || 'facile';
  const cluesEl = document.getElementById('form-q-extreme-clues');
  if (cluesEl) cluesEl.value = q.extremeClues || '';
  onDifficultyChange();

  state.editorUploadedImages = q.images ? [...q.images] : [];
  state.editorUploadedExplanationImages = q.explanationImages ? [...q.explanationImages] : [];
  state.editorSelectedTags = new Set(q.tags || []);
  renderEditorUploadedImages();
  renderEditorUploadedExplanationImages();
  renderEditorTagsSelector();

  if (q.format === 'piege') {
    onFormatChange();
    const isFaux = (q.correct && q.correct[0] === 1);
    const radFaux = document.querySelector('input[name="form_tf_choice"][value="Faux"]');
    const radVrai = document.querySelector('input[name="form_tf_choice"][value="Vrai"]');
    if (isFaux && radFaux) radFaux.checked = true;
    else if (radVrai) radVrai.checked = true;
  } else if (q.format === 'ouverte') {
    const list = Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0
      ? [...q.acceptedAnswers]
      : (Array.isArray(q.options) && q.options.length > 0 ? [...q.options] : [q.entity || '']);
    state.editorOpenAnswers = [...list];
    onFormatChange();
  } else {
    const correctIndices = new Set(Array.isArray(q.correct) ? q.correct : [q.correct]);
    const exps = (Array.isArray(q.optionExplanations) && q.optionExplanations.length > 0)
      ? q.optionExplanations
      : (Array.isArray(q.optionexplanations) ? q.optionexplanations : []);

    state.editorQuestionOptions = (q.options || []).map((optText, idx) => ({
      text: optText || '',
      explanation: exps[idx] || '',
      correct: correctIndices.has(idx)
    }));

    if (state.editorQuestionOptions.length < 2) {
      while (state.editorQuestionOptions.length < 4) {
        state.editorQuestionOptions.push({ text: '', explanation: '', correct: false });
      }
    }
    onFormatChange();
  }
}

function deleteQuestion(id) {
  if (!isCreator()) {
    alert("Action réservée aux comptes Créateurs.");
    return;
  }
  if (!confirm("Voulez-vous supprimer cette question ?")) return;
  state.questions = state.questions.filter(q => q.id !== id);
  saveQuestions();
  dbDeleteQuestion(id);
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
    stepCard.setAttribute('data-dp-step-index', sIdx);

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
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Explication de l'étape (optionnel)</label>
          <textarea rows="2" oninput="state.dpSteps[${sIdx}].explanation = this.value" placeholder="Justifiez les réponses (optionnel)..." class="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">${step.explanation || ''}</textarea>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-amber-400 mb-1">Piège diagnostique de l'étape (optionnel)</label>
          <textarea rows="2" oninput="state.dpSteps[${sIdx}].trap = this.value" placeholder="Piège ou fausse piste (optionnel)..." class="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-500">${step.trap || ''}</textarea>
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

async function attachFilesToDPStep(files, stepIdx) {
  if (!state.dpSteps || !state.dpSteps[stepIdx]) return;
  const validFiles = Array.from(files).filter(f => f.type && f.type.startsWith('image/'));
  if (validFiles.length === 0) return;
  if (!state.dpSteps[stepIdx].images) state.dpSteps[stepIdx].images = [];

  for (const file of validFiles) {
    const url = await uploadImageFile(file);
    const count = state.dpSteps[stepIdx].images.length + 1;
    const defaultCaption = (file.name && file.name !== 'image.png' && file.name !== 'blob')
      ? file.name.replace(/\.[^/.]+$/, "")
      : `Lame Étape ${stepIdx + 1} (${count})`;
    state.dpSteps[stepIdx].images.push({
      url: url,
      caption: defaultCaption
    });
  }
  renderDPStepImagesPreview(stepIdx);
  showToast(`📸 ${validFiles.length} lame${validFiles.length > 1 ? 's' : ''} ajoutée${validFiles.length > 1 ? 's' : ''} à l'étape ${stepIdx + 1} !`);
}

async function handleDPStepImageUpload(e, stepIdx) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  await attachFilesToDPStep(files, stepIdx);
  e.target.value = '';
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

  if (!title) {
    alert("Veuillez renseigner le titre du Dossier Clinique.");
    document.getElementById('form-dp-title').focus();
    return;
  }
  if (!organ) {
    alert("Veuillez renseigner le Niveau 1 : Organe.");
    document.getElementById('form-dp-organ').focus();
    return;
  }
  if (!category) {
    alert("Veuillez renseigner le Niveau 2 : Catégorie.");
    document.getElementById('form-dp-category').focus();
    return;
  }
  if (!entity) {
    alert("Veuillez renseigner le Niveau 3 : Lésion précise.");
    document.getElementById('form-dp-entity').focus();
    return;
  }

  if (!state.dpSteps || state.dpSteps.length === 0) {
    alert("Veuillez ajouter au moins une étape (bouton 'Ajouter une étape suivante').");
    return;
  }

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
      dbUpsertCase(state.cases[idx]);
    }
  } else {
    const newCase = {
      id: "dp_" + Date.now(),
      title, organ, category, entity, synopsis, tags,
      steps: JSON.parse(JSON.stringify(state.dpSteps))
    };
    state.cases.push(newCase);
    dbUpsertCase(newCase);
  }

  saveCases();
  alert("Dossier Progressif enregistré avec succès !");
  switchTab('bank');
}

function editDP(id) {
  if (!isCreator()) {
    alert("Action réservée aux comptes Créateurs.");
    return;
  }
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
  if (!isCreator()) {
    alert("Action réservée aux comptes Créateurs.");
    return;
  }
  if (!confirm("Voulez-vous supprimer ce Dossier Progressif ?")) return;
  state.cases = state.cases.filter(c => c.id !== id);
  saveCases();
  dbDeleteCase(id);
}

// =========================================================================
// --- LECTEUR DE DOSSIER PROGRESSIF (DP SESSION) ---
// =========================================================================
function startDPSession(caseId) {
  const isFromBank = document.getElementById('view-bank') && !document.getElementById('view-bank').classList.contains('hidden');
  state.sessionReturnView = isFromBank ? 'bank' : 'play';
  const dpCase = state.cases.find(c => c.id === caseId);
  if (!dpCase) return;

  // Clone profond pour mélanger les options de chaque étape sans altérer state.cases
  const clonedCase = JSON.parse(JSON.stringify(dpCase));
  clonedCase.steps = clonedCase.steps.map(step => {
    if (step.options && step.options.length > 1) {
      const items = step.options.map((optText, origIdx) => ({
        text: optText,
        isCorrect: (step.correct || []).includes(origIdx)
      }));
      // Fisher-Yates
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      step.options = items.map(it => it.text);
      step.correct = [];
      items.forEach((it, newIdx) => {
        if (it.isCorrect) step.correct.push(newIdx);
      });
    }
    return step;
  });

  state.currentDPSession = {
    caseData: clonedCase,
    currentStepIndex: 0,
    totalSteps: clonedCase.steps.length,
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
  // Organe & entité masqués pendant le cas clinique pour ne pas spoiler l'enquête diagnostique
  document.getElementById('dp-case-meta').textContent = "Dossier Clinique Progressif • Organe masqué";
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
  if (isLastStep) {
    document.getElementById('dp-case-meta').textContent = `${session.caseData.organ} > ${session.caseData.category} > ${session.caseData.entity}`;
  }
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
    switchTab(state.sessionReturnView || 'play');
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

  const visibleTags = (state.customTags || []).filter(t => t && !t.startsWith('ROLE_'));

  if (visibleTags.length === 0) {
    container.innerHTML = '<span class="text-xs text-slate-500 italic">Aucun tag créé.</span>';
    return;
  }

  container.innerHTML = '';
  visibleTags.forEach(tag => {
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
    dbUpsertTag(clean);
  }
}

// =========================================================================
// --- EXPLORATEUR DE LA BANQUE PAR ONGLETS (ORGANE), SOUS-ONGLETS (CATÉGORIE) ET LÉSIONS ---
// =========================================================================
function selectBankOrgan(organ) {
  state.bankSelectedOrgan = organ;
  state.bankSelectedCategory = 'all';
  const organSelect = document.getElementById('bank-filter-organ');
  if (organSelect) organSelect.value = organ;
  renderBank();
}

function selectBankCategory(cat) {
  state.bankSelectedCategory = cat;
  renderBank();
}

function onBankOrganSelectChange() {
  const organSelect = document.getElementById('bank-filter-organ');
  if (organSelect) {
    state.bankSelectedOrgan = organSelect.value;
    state.bankSelectedCategory = 'all';
  }
  renderBank();
}

function toggleBankLesionCollapse(lesionKey) {
  if (state.bankExpandedLesions.has(lesionKey)) {
    state.bankExpandedLesions.delete(lesionKey);
  } else {
    state.bankExpandedLesions.add(lesionKey);
  }
  renderBank();
}

function expandAllBankLesions() {
  if (Array.isArray(state.currentRenderedLesionKeys)) {
    state.currentRenderedLesionKeys.forEach(k => state.bankExpandedLesions.add(k));
  }
  renderBank();
}

function collapseAllBankLesions() {
  state.bankExpandedLesions.clear();
  renderBank();
}

function renderBank() {
  const searchInput = document.getElementById('bank-search-input');
  const search = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const formatFilter = document.getElementById('bank-filter-format') ? document.getElementById('bank-filter-format').value : 'all';
  const statusFilter = document.getElementById('bank-filter-status') ? document.getElementById('bank-filter-status').value : 'all';
  const tagFilter = document.getElementById('bank-filter-tag') ? document.getElementById('bank-filter-tag').value : 'all';

  populateBankFilterDropdowns();

  const navContainer = document.getElementById('bank-hierarchy-nav');
  const itemsContainer = document.getElementById('bank-items-container');
  if (!itemsContainer) return;

  itemsContainer.innerHTML = '';
  if (navContainer) navContainer.innerHTML = '';

  const totalItems = state.questions.length + state.cases.length;
  if (totalItems === 0) {
    itemsContainer.innerHTML = `
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

  // 1. Filtrage global (Format, Statut, Tag, Recherche textuelle)
  const baseFilteredQ = state.questions.filter(q => {
    if (formatFilter === 'dp') return false;
    if (formatFilter !== 'all' && q.format !== formatFilter) return false;
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

  const baseFilteredCases = state.cases.filter(c => {
    if (formatFilter !== 'all' && formatFilter !== 'dp') return false;
    if (statusFilter === 'mastered' || statusFilter === 'due') return false;
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

  // Calcul des organes disponibles dans le jeu filtré
  const organMap = {}; // organName -> { questions: [], cases: [] }
  baseFilteredQ.forEach(q => {
    const org = q.organ || "Autre";
    if (!organMap[org]) organMap[org] = { questions: [], cases: [] };
    organMap[org].questions.push(q);
  });
  baseFilteredCases.forEach(c => {
    const org = c.organ || "Autre";
    if (!organMap[org]) organMap[org] = { questions: [], cases: [] };
    organMap[org].cases.push(c);
  });

  const availableOrgans = Object.keys(organMap).sort();

  if (availableOrgans.length === 0) {
    itemsContainer.innerHTML = `
      <div class="text-center py-10 text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
        <p class="text-xs">Aucun élément ne correspond à ces filtres de recherche.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Gestion intelligente de l'organe sélectionné
  if (state.bankSelectedOrgan === null || state.bankSelectedOrgan === undefined) {
    state.bankSelectedOrgan = (availableOrgans.length === 1) ? availableOrgans[0] : 'all';
  } else if (state.bankSelectedOrgan !== 'all' && !organMap[state.bankSelectedOrgan]) {
    state.bankSelectedOrgan = (availableOrgans.length === 1) ? availableOrgans[0] : 'all';
  }

  // Synchronisation du select déroulant
  const organSelect = document.getElementById('bank-filter-organ');
  if (organSelect && organSelect.value !== state.bankSelectedOrgan) {
    organSelect.value = state.bankSelectedOrgan;
  }

  // 2. Rendu des Barres d'Onglets & Sous-onglets dans #bank-hierarchy-nav
  if (navContainer) {
    let navHtml = '';

    // --- NIVEAU 1 : ONGLETS DES ORGANES ---
    const totalCountAll = baseFilteredQ.length + baseFilteredCases.length;
    navHtml += `
      <div class="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-2.5 shadow-md">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-5 h-5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Onglet Organe :</span>
          </div>
          ${state.bankSelectedOrgan !== 'all' ? `
            <button onclick="startHierarchySession('organ', '${escapeJsString(state.bankSelectedOrgan)}')" class="px-3 py-1 rounded-xl bg-teal-600/10 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm">
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
              <span>⚡ Taffer tout "${escapeHtml(state.bankSelectedOrgan)}"</span>
            </button>
          ` : ''}
        </div>
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button onclick="selectBankOrgan('all')" class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0 transition ${
            state.bankSelectedOrgan === 'all'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30 border border-teal-400'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
          }">
            <span>🌐 Tous les organes</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
              state.bankSelectedOrgan === 'all' ? 'bg-teal-700 text-white' : 'bg-slate-800 text-slate-400'
            }">${totalCountAll}</span>
          </button>
    `;

    availableOrgans.forEach(org => {
      const isSel = (state.bankSelectedOrgan === org);
      const count = organMap[org].questions.length + organMap[org].cases.length;
      navHtml += `
        <button onclick="selectBankOrgan('${escapeJsString(org)}')" class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0 transition ${
          isSel
            ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30 border border-teal-400'
            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
        }">
          <span>${escapeHtml(org)}</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
            isSel ? 'bg-teal-700 text-white' : 'bg-slate-800 text-slate-400'
          }">${count}</span>
        </button>
      `;
    });

    navHtml += `</div></div>`;

    // --- NIVEAU 2 : SOUS-ONGLETS DES CATÉGORIES (Quand un organe est sélectionné) ---
    if (state.bankSelectedOrgan !== 'all' && organMap[state.bankSelectedOrgan]) {
      const orgGroup = organMap[state.bankSelectedOrgan];
      const categoryMap = {};
      orgGroup.questions.forEach(q => {
        const cat = q.category || "Général";
        if (!categoryMap[cat]) categoryMap[cat] = { questions: [], cases: [] };
        categoryMap[cat].questions.push(q);
      });
      orgGroup.cases.forEach(c => {
        const cat = c.category || "Général";
        if (!categoryMap[cat]) categoryMap[cat] = { questions: [], cases: [] };
        categoryMap[cat].cases.push(c);
      });

      const availableCats = Object.keys(categoryMap).sort();
      if (state.bankSelectedCategory !== 'all' && !categoryMap[state.bankSelectedCategory]) {
        state.bankSelectedCategory = 'all';
      }

      const curCat = state.bankSelectedCategory;
      const activeQInCurSelection = (curCat !== 'all' && categoryMap[curCat])
        ? categoryMap[curCat].questions.filter(q => !q.mastered).length
        : orgGroup.questions.filter(q => !q.mastered).length;
      const totalQInCurSelection = (curCat !== 'all' && categoryMap[curCat])
        ? categoryMap[curCat].questions.length
        : orgGroup.questions.length;

      navHtml += `
        <div class="bg-slate-900/90 border border-slate-800/80 p-3.5 sm:p-4 rounded-2xl space-y-2.5 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center space-x-2">
              <span class="w-5 h-5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Sous-onglets Catégories <span class="text-slate-400 font-normal lowercase">dans ${escapeHtml(state.bankSelectedOrgan)}</span> :
              </span>
            </div>
            <div class="flex items-center space-x-2 self-start sm:self-auto">
              ${curCat !== 'all' ? `
                <button onclick="startHierarchySession('category', '${escapeJsString(state.bankSelectedOrgan)}', '${escapeJsString(curCat)}')" class="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-sky-500/20">
                  <i data-lucide="play" class="w-3.5 h-3.5"></i>
                  <span>⚡ Taffer "${escapeHtml(curCat)}" (${activeQInCurSelection || totalQInCurSelection}Q)</span>
                </button>
              ` : `
                <button onclick="startHierarchySession('organ', '${escapeJsString(state.bankSelectedOrgan)}')" class="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-teal-500/20">
                  <i data-lucide="play" class="w-3.5 h-3.5"></i>
                  <span>⚡ Taffer tout "${escapeHtml(state.bankSelectedOrgan)}" (${orgGroup.questions.filter(q => !q.mastered).length || orgGroup.questions.length}Q)</span>
                </button>
              `}
            </div>
          </div>
          <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button onclick="selectBankCategory('all')" class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0 transition ${
              curCat === 'all'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/30 border border-sky-400'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }">
              <span>📑 Toutes les catégories</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
                curCat === 'all' ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-400'
              }">${orgGroup.questions.length + orgGroup.cases.length}</span>
            </button>
      `;

      availableCats.forEach(cat => {
        const isSel = (curCat === cat);
        const count = categoryMap[cat].questions.length + categoryMap[cat].cases.length;
        navHtml += `
          <button onclick="selectBankCategory('${escapeJsString(cat)}')" class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0 transition ${
            isSel
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/30 border border-sky-400'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
          }">
            <span>${escapeHtml(cat)}</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
              isSel ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-400'
            }">${count}</span>
          </button>
        `;
      });

      navHtml += `</div></div>`;
    } else {
      navHtml += `
        <div class="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3.5 py-2.5 rounded-xl">
          <i data-lucide="info" class="w-4 h-4 text-teal-400 shrink-0"></i>
          <span>Cliquez sur un <strong>onglet d'organe</strong> ci-dessus pour naviguer par sous-onglets de catégories diagnostiques et cibler votre page de travail.</span>
        </div>
      `;
    }

    navContainer.innerHTML = navHtml;
  }

  // 3. Filtrage des items selon l'organe et la catégorie sélectionnés
  let scopedQ = baseFilteredQ;
  let scopedCases = baseFilteredCases;

  if (state.bankSelectedOrgan !== 'all') {
    scopedQ = scopedQ.filter(q => (q.organ || "Autre") === state.bankSelectedOrgan);
    scopedCases = scopedCases.filter(c => (c.organ || "Autre") === state.bankSelectedOrgan);
  }

  if (state.bankSelectedCategory !== 'all') {
    scopedQ = scopedQ.filter(q => (q.category || "Général") === state.bankSelectedCategory);
    scopedCases = scopedCases.filter(c => (c.category || "Général") === state.bankSelectedCategory);
  }

  if (scopedQ.length === 0 && scopedCases.length === 0) {
    itemsContainer.innerHTML = `
      <div class="text-center py-12 text-slate-500 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
        <p class="text-xs">Aucun élément dans cette sélection (${escapeHtml(state.bankSelectedOrgan)} › ${escapeHtml(state.bankSelectedCategory)}).</p>
        <button onclick="selectBankCategory('all')" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition">
          Afficher toutes les catégories
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // 4. Groupement par Lésion (Entité)
  const lesionMap = {}; // key -> { organ, category, entity, questions: [], cases: [] }
  scopedQ.forEach(q => {
    const org = q.organ || "Autre";
    const cat = q.category || "Général";
    const ent = q.entity || "Lésion non spécifiée";
    const key = `${org}::${cat}::${ent}`;
    if (!lesionMap[key]) {
      lesionMap[key] = { organ: org, category: cat, entity: ent, questions: [], cases: [] };
    }
    lesionMap[key].questions.push(q);
  });
  scopedCases.forEach(c => {
    const org = c.organ || "Autre";
    const cat = c.category || "Général";
    const ent = c.entity || "Lésion non spécifiée";
    const key = `${org}::${cat}::${ent}`;
    if (!lesionMap[key]) {
      lesionMap[key] = { organ: org, category: cat, entity: ent, questions: [], cases: [] };
    }
    lesionMap[key].cases.push(c);
  });

  const lesionKeys = Object.keys(lesionMap).sort((a, b) => {
    const la = lesionMap[a];
    const lb = lesionMap[b];
    if (la.organ !== lb.organ) return la.organ.localeCompare(lb.organ);
    if (la.category !== lb.category) return la.category.localeCompare(lb.category);
    return la.entity.localeCompare(lb.entity);
  });

  state.currentRenderedLesionKeys = lesionKeys;

  // Barre d'outils secondaire : Replier / Déplier
  const toolbar = document.createElement('div');
  toolbar.className = "flex items-center justify-between pb-1 text-xs text-slate-400";
  toolbar.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
      <span class="font-bold text-slate-300">${lesionKeys.length} bloc(s) de lésion</span>
      <span>•</span>
      <span>${scopedQ.length} question(s)${scopedCases.length > 0 ? ` + ${scopedCases.length} DP` : ''}</span>
    </div>
    <div class="flex items-center space-x-2">
      <button onclick="expandAllBankLesions()" class="hover:text-teal-400 transition">Tout déplier</button>
      <span>•</span>
      <button onclick="collapseAllBankLesions()" class="hover:text-teal-400 transition">Tout replier</button>
    </div>
  `;
  itemsContainer.appendChild(toolbar);

  // 5. Rendu de chaque Lésion
  lesionKeys.forEach(key => {
    const lesion = lesionMap[key];
    const totalInLesion = lesion.questions.length + lesion.cases.length;
    const isExpanded = state.bankExpandedLesions.has(key) || (search && search.length > 0);
    const isCollapsed = !isExpanded;

    const dueInLesion = lesion.questions.filter(q => isQuestionDue(q)).length;
    const masteredInLesion = lesion.questions.filter(q => q.mastered).length;
    const activeInLesion = lesion.questions.filter(q => !q.mastered).length;

    const lesionBox = document.createElement('div');
    lesionBox.className = "bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden transition shadow-lg space-y-0";

    // En-tête de la Lésion
    const header = document.createElement('div');
    header.className = "p-4 sm:p-4.5 bg-slate-900/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 cursor-pointer select-none hover:bg-slate-800/40 transition";
    header.onclick = (e) => {
      if (!e.target.closest('button')) {
        toggleBankLesionCollapse(key);
      }
    };

    header.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold shrink-0">
          <i data-lucide="microscope" class="w-4.5 h-4.5"></i>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="font-extrabold text-sm sm:text-base text-white"></h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 font-bold border border-slate-700">${totalInLesion}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
            <span class="text-slate-400 font-medium">${escapeHtml(lesion.organ)} › ${escapeHtml(lesion.category)}</span>
            ${dueInLesion > 0 ? `<span class="text-amber-400 font-semibold">• ${dueInLesion} à revoir</span>` : ''}
            ${masteredInLesion > 0 ? `<span class="text-emerald-400 font-semibold">• ${masteredInLesion} maîtrisée(s)</span>` : ''}
            ${lesion.cases.length > 0 ? `<span class="text-indigo-400 font-semibold">• ${lesion.cases.length} DP</span>` : ''}
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
        <button class="btn-create-lesion-q px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-teal-300 hover:text-teal-200 border border-teal-500/30 hover:border-teal-500/60 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm" title="Créer une question pour cette lésion">
          <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-teal-400"></i>
          <span>+ Créer question</span>
        </button>
        <button class="btn-test-lesion px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm shadow-teal-500/20">
          <i data-lucide="play" class="w-3.5 h-3.5"></i>
          <span>⚡ Taffer cette lésion (${activeInLesion || totalInLesion})</span>
        </button>
        <button class="btn-toggle-lesion p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition" title="${isCollapsed ? 'Déplier' : 'Replier'}">
          <i data-lucide="${isCollapsed ? 'chevron-down' : 'chevron-up'}" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    header.querySelector('h3').textContent = lesion.entity;

    const createBtn = header.querySelector('.btn-create-lesion-q');
    if (createBtn) {
      createBtn.onclick = (e) => {
        e.stopPropagation();
        createQuestionForLesion(lesion.organ, lesion.category, lesion.entity);
      };
    }

    const testBtn = header.querySelector('.btn-test-lesion');
    if (testBtn) {
      testBtn.onclick = (e) => {
        e.stopPropagation();
        startHierarchySession('entity', lesion.organ, lesion.category, lesion.entity);
      };
    }

    const toggleBtn = header.querySelector('.btn-toggle-lesion');
    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        toggleBankLesionCollapse(key);
      };
    }

    lesionBox.appendChild(header);

    // Corps repliable
    const bodyContainer = document.createElement('div');
    bodyContainer.className = `p-3.5 sm:p-4 space-y-3 bg-slate-950/40 ${isCollapsed ? 'hidden' : ''}`;
    lesionBox.appendChild(bodyContainer);

    // Insérer les DP de cette lésion
    lesion.cases.forEach(c => {
      const card = document.createElement('div');
      card.className = "bg-slate-900 border border-indigo-500/30 hover:border-indigo-500 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm";
      card.innerHTML = `
        <div class="space-y-1.5 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">📋 DP (${c.steps.length} étapes)</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              ${escapeHtml(c.category)} > ${escapeHtml(c.entity)}
            </span>
          </div>
          <h4 class="font-bold text-sm text-white">${escapeHtml(c.title)}</h4>
          <p class="text-xs text-slate-400 line-clamp-1">${escapeHtml(c.synopsis)}</p>
          <div class="flex flex-wrap gap-1 mt-1">
            ${(c.tags || []).map(t => `<span class="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-mono">#${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
        <div class="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          <button onclick="startDPSession('${escapeJsString(c.id)}')" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm shadow-indigo-500/20">
            <i data-lucide="play" class="w-3.5 h-3.5"></i>
            <span>Jouer</span>
          </button>
          ${isCreator() ? `
          <button onclick="editDP('${escapeJsString(c.id)}')" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="Modifier le DP">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteDP('${escapeJsString(c.id)}')" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition" title="Supprimer le DP">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
          ` : ''}
        </div>
      `;
      bodyContainer.appendChild(card);
    });

    // Insérer les Questions Simples de cette lésion
    lesion.questions.forEach(q => {
      const card = document.createElement('div');
      card.className = `bg-slate-900 border rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        q.mastered ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800 hover:border-slate-700'
      }`;

      const formatBadge = q.format === 'qcm' ? '☑️ QCM' : (q.format === 'piege' ? '⚠️ Vrai/Faux' : (q.format === 'ouverte' ? '✍️ Ouverte' : '🔘 QCU'));
      const rate = q.stats && q.stats.seen > 0 ? `${Math.round((q.stats.correct / q.stats.seen) * 100)}% (${q.stats.correct}/${q.stats.seen})` : 'Non jouée';

      let dueBadgeHtml = '';
      if (q.mastered) {
        dueBadgeHtml = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1"><i data-lucide="award" class="w-3 h-3"></i><span>Maîtrisée</span></span>';
      } else if (isQuestionDue(q)) {
        dueBadgeHtml = '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1"><i data-lucide="clock" class="w-3 h-3"></i><span>À revoir aujourd\'hui</span></span>';
      } else if (q.stats && q.stats.nextReviewDate) {
        dueBadgeHtml = `<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">📅 Revoir le ${escapeHtml(q.stats.nextReviewDate)}</span>`;
      }

      card.innerHTML = `
        <div class="space-y-1.5 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">${formatBadge}</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              ${escapeHtml(q.category)} > ${escapeHtml(q.entity)}
            </span>
            ${dueBadgeHtml}
            <span class="text-[10px] text-slate-400">Précision : ${rate}</span>
          </div>
          <h4 class="font-bold text-sm text-white">${escapeHtml(q.question)}</h4>
          ${q.context ? `<p class="text-xs text-slate-400 font-mono line-clamp-1">${escapeHtml(q.context)}</p>` : ''}
          <div class="flex flex-wrap gap-1 mt-1">
            ${(q.tags || []).map(t => `<span class="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-mono">#${escapeHtml(t)}</span>`).join('')}
            ${q.images && q.images.length > 0 ? `<span class="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded flex items-center space-x-1"><i data-lucide="image" class="w-3 h-3"></i><span>${q.images.length} photo${q.images.length > 1 ? 's' : ''}</span></span>` : ''}
          </div>
        </div>
        <div class="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          <button onclick="openQuestionDetail('${escapeJsString(q.id)}')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1 transition" title="Aperçu diagnostique et explications">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>Aperçu</span>
          </button>
          <button onclick="toggleQuestionMastered('${escapeJsString(q.id)}')" class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition ${
            q.mastered 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-emerald-400'
          }" title="${q.mastered ? 'Réactiver dans les sessions de révision' : 'Neutraliser (marquer maîtrisée)'}">
            <i data-lucide="${q.mastered ? 'check-check' : 'award'}" class="w-3.5 h-3.5"></i>
            <span>${q.mastered ? 'Maîtrisée' : 'Neutraliser'}</span>
          </button>
          ${isCreator() ? `
          <button onclick="editQuestion('${escapeJsString(q.id)}')" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="Modifier">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteQuestion('${escapeJsString(q.id)}')" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition" title="Supprimer">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
          ` : ''}
        </div>
      `;
      bodyContainer.appendChild(card);
    });

    itemsContainer.appendChild(lesionBox);
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
  if (!isCreator()) {
    alert("Action réservée aux comptes Créateurs.");
    return;
  }
  if (confirm("Voulez-vous vraiment vider toute votre banque ?")) {
    state.questions = [];
    state.cases = [];
    saveQuestions();
    saveCases();
  }
}

window.addEventListener('DOMContentLoaded', initApp);
