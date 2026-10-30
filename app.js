/**
 * PATHOTRAINER LAB - MOTEUR COMPLET AVEC RÉPÉTITION ESPACÉE & BOÎTES PAR ORGANE DANS LA BANQUE
 */

const STORAGE_KEY_QUESTIONS = "pathotrainer_custom_questions_v3";
const STORAGE_KEY_CASES = "pathotrainer_custom_cases_v3";
const STORAGE_KEY_TAGS = "pathotrainer_custom_tags_v3";
const STORAGE_KEY_STATS = "pathotrainer_custom_stats_v3";
const STORAGE_KEY_LESION_NOTES = "pathotrainer_custom_lesion_notes_v1";
const STORAGE_KEY_STATEMENT_TEMPLATES = "pathotrainer_statement_templates_v2";
const STORAGE_KEY_ORGAN_STATEMENT_TEMPLATES = "pathosorus_organ_statement_templates_v1";
const STORAGE_KEY_LESION_STATEMENT_TEMPLATES = "pathosorus_lesion_statement_templates_v1";

const DEFAULT_LESION_STATEMENT_TEMPLATES = {
  "Tumeurs borderlines mucineuses": [
    "Quel est l'aspect architectural prédominant dans cette tumeur borderline mucineuse :",
    "Quel est le profil immunohistochimique attendu (CK7, CK20, CDX2) devant ce contingent mucineux :",
    "Quel critère histologique permet d'exclure formellement un carcinome mucineux invasif :",
    "Quels sont les facteurs pronostiques et les risques d'association à un pseudomyxome péritonéal :"
  ],
  "Carcinomes mucineux de l'ovaire": [
    "Devant cette lésion mucineuse ovarienne, quel argument morphologique ou IHC oriente vers une métastase digestive (Krukenberg) :",
    "Quel est le mode d'invasion tumoral prédominant (confluent expansif vs infiltratif destructif) :",
    "Quel est le bilan d'extension et la stratégie d'exploration complémentaire recommandée :"
  ],
  "Carcinome séreux de haut grade": [
    "Quel est le profil immunohistochimique caractéristique (WT1, p16, p53 mutationnelle) :",
    "Quel est le statut de l'expression de la p53 (mutation nulle vs surexpression diffuse) :",
    "Quelles altérations moléculaires (BRCA1/2, statut HRD) devez-vous rechercher systématiquement :"
  ],
  "Carcinome lobulaire": [
    "Quel est le profil immunohistochimique caractéristique (E-cadhérine membranaire négative, p120 cytoplasmique) :",
    "Quel diagnostic différentiel devez-vous éliminer devant cette prolifération en file indienne :",
    "Quel est le sous-type histologique (classique, pléomorphe, alvéolaire, solide) :"
  ],
  "Carcinome canalaire infiltrant": [
    "Quels sont les critères du score histopronostique de Scarff-Bloom-Richardson (SBR / Elston-Ellis) :",
    "Quel est le bilan immunohistochimique théranostique indispensable (RO, RP, HER2, Ki-67) :"
  ],
  "CIN-3": [
    "Quelle est l'interprétation du couple p16 et Ki-67 dans cette biopsie cervicale confirmant le haut grade (HSIL) :",
    "Selon la terminologie LAST / OMS, quel est le diagnostic et la conduite à tenir devant :"
  ],
  "Carcinome à cellules claires": [
    "Quel profil immunohistochimique (Napsin A, HNF1-bêta, WT1 négatif) confirme le diagnostic :",
    "Devant cette prolifération tubulo-kystique à cellules en clou de tapissier, quel diagnostic différentiel éliminez-vous :"
  ],
  "Chorioamniotite aiguë": [
    "Dans la classification d'Amsterdam, quel stade et quel grade attribuez-vous à la réponse inflammatoire maternelle et fœtale :"
  ],
  "Malperfusion vasculaire maternelle": [
    "Dans la classification d'Amsterdam, quelles lésions élémentaires définissent une malperfusion vasculaire maternelle (MVM) :"
  ]
};

const DEFAULT_ORGAN_STATEMENT_TEMPLATES = {
  "Sein": [
    "Quel est le profil immunohistochimique attendu dans ce carcinome mammaire :",
    "Quel est le grade histopronostique SBR (Elston-Ellis) devant :",
    "Selon les recommandations ASCO/CAP, quel est le statut HER2 devant :"
  ],
  "Col utérin": [
    "Quelle est l'interprétation du couple p16 et Ki-67 dans cette biopsie cervicale :",
    "Selon la terminologie LAST / OMS, quel est le diagnostic devant :"
  ],
  "Placenta": [
    "Dans la classification d'Amsterdam, quelles lésions évoquent une malperfusion vasculaire maternelle :",
    "Quel stade et quel grade attribuez-vous à cette chorioamniotite aiguë :"
  ],
  "Rein": [
    "Dans la classification OMS des tumeurs rénales, quel profil IHC confirme le diagnostic de :",
    "Quel est le grade nucléolaire OMS/ISUP devant cette prolifération à cellules claires :"
  ],
  "Ovaire": [
    "Quel profil immunohistochimique (WT1, p53, p16) permet de distinguer :",
    "Quel est le sous-type histologique OMS le plus probable devant cette prolifération ovarienne :"
  ],
  "Utérus": [
    "Selon la classification moléculaire OMS des carcinomes de l'endomètre, quel est le groupe pronostique devant :",
    "Quel est le sous-type histologique et le profil IHC attendu dans cette lésion endométriale :"
  ],
  "Tumeurs germinales": [
    "Quel panel d'anticorps (OCT3/4, SALL4, CD30, AFP, hCG) permet de confirmer :",
    "Quel composant germinal identifiez-vous sur cet aspect histologique :"
  ]
};

const OLD_DEFAULT_STATEMENT_TEMPLATES = [
  "Quelles sont les propositions vraies concernant",
  "Quel est le diagnostic le plus probable devant",
  "Parmi les propositions suivantes concernant",
  "Quel marqueur immunohistochimique permet de confirmer",
  "Quelle anomalie moléculaire est caractéristique de",
  "Quel critère histologique permet d'affirmer",
  "Quel est le principal diagnostic différentiel de"
];

let state = {
  currentUser: null,
  currentRole: 'creator', // 'creator' par défaut pour enrichir librement la banque collective (méthode Zenipad)
  userProgress: {}, // map questionId -> { stats, mastered, flagged }
  questions: [],
  cases: [],
  customTags: [],
  customBadges: [],
  lesionNotes: {}, // map "Organ::Category::Entity" -> { key, organ, category, entity, content, updatedAt, authorName, authorEmail }
  statementTemplates: [],
  organStatementTemplates: {}, // map organ -> string[]
  stats: {
    xp: 0,
    creatorXp: 0,
    streak: 1,
    lastActiveDate: null,
    totalAnswered: 0,
    totalCorrect: 0,
    completedCategories: [],
    unlockedBadges: {},
    badgeHistory: {},
    equippedTitle: '',
    equippedTitleBadgeId: '',
    trophyCustomNames: {}
  },
  trophyFilter: 'all',
  trophyCategoryFilter: 'all',
  playHierarchy: {
    selectedOrgan: null,
    selectedCategory: null,
    selectedEntity: null,
    filterMode: 'all' // 'all' | 'slides'
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
  statementTemplates: [],
  organStatementTemplates: {},
  lesionStatementTemplates: {},
  bankSelectedOrgan: 'all',
  bankSelectedCategory: 'all',
  bankCollapsedOrgans: new Set(),
  bankExpandedLesions: new Set(),
  currentRenderedLesionKeys: [],
  duelOpponentEmail: null
};

let _isHandlingAuthLogin = false;

const AUTHORIZED_CREATOR_EMAILS = new Set([
  'padoreau85@gmail.com',
  'belhadef.samy@gmail.com'
]);

function isAuthorizedToDelete(email = null) {
  const targetEmail = (email || getCurrentUserEmail() || '').trim().toLowerCase();
  return targetEmail === 'padoreau85@gmail.com' || targetEmail === 'belhadef.samy@gmail.com';
}
window.isAuthorizedToDelete = isAuthorizedToDelete;

function getProfileDisplayName(email) {
  if (!email) return 'Choisir Profil';
  const norm = email.trim().toLowerCase();
  if (norm === 'padoreau85@gmail.com') return 'Pierre-Alain Doreau';
  if (norm === 'belhadef.samy@gmail.com') return 'Samy Belhadef';
  const p = norm.split('@')[0];
  return p.charAt(0).toUpperCase() + p.slice(1);
}
window.getProfileDisplayName = getProfileDisplayName;

function getActiveUser() {
  if (state.currentUser && state.currentUser.email) {
    return state.currentUser;
  }
  const explicitLogout = localStorage.getItem('pathosorus_explicit_logout') === 'true';
  if (explicitLogout) {
    return null;
  }
  // Récupérer le compte enregistré explicitement sur cet appareil
  const savedEmail = localStorage.getItem('pathosorus_current_email');
  if (savedEmail && savedEmail.trim()) {
    const email = savedEmail.trim().toLowerCase();
    return {
      id: 'usr_' + email.replace(/[^a-z0-9]/gi, '_'),
      email: email,
      user_metadata: {
        role: 'creator' // Tous les comptes possèdent les droits complets d'enregistrement et de rédaction
      }
    };
  }
  return null;
}

function getCurrentUserEmail() {
  const u = getActiveUser();
  return (u && u.email) ? u.email.trim().toLowerCase() : '';
}

function isCreator() {
  return true; // Accès complet pour enrichir librement la banque collective (méthode Zenipad) pour tous les comptes
}

function isReader() {
  return false;
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

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return getLocalDateString();
}

function isQuestionDoneToday(q) {
  if (!q || !q.stats || !q.stats.lastReviewed) return false;
  try {
    const revDate = new Date(q.stats.lastReviewed);
    const now = new Date();
    return revDate.getFullYear() === now.getFullYear() &&
           revDate.getMonth() === now.getMonth() &&
           revDate.getDate() === now.getDate();
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
let realtimeChannel = null;
let pathosorusSyncChannel = null;

// Canal BroadcastChannel pour synchronisation instantanée entre onglets du même appareil (0ms)
try {
  if (typeof BroadcastChannel !== 'undefined') {
    pathosorusSyncChannel = new BroadcastChannel('pathosorus_sync_channel');
    pathosorusSyncChannel.onmessage = (event) => {
      if (event && event.data && event.data.type === 'DATA_UPDATED') {
        console.log("📡 [BroadcastChannel] Mise à jour reçue d'un autre onglet local");
        fetchSupabaseData(true);
      }
    };
  }
} catch(e) {}

function broadcastLocalUpdate() {
  if (pathosorusSyncChannel) {
    try {
      pathosorusSyncChannel.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
    } catch(e) {}
  }
}

function setupRealtimeSync() {
  if (!supabaseClient || typeof supabaseClient.channel !== 'function') return;
  try {
    if (realtimeChannel) {
      try { supabaseClient.removeChannel(realtimeChannel); } catch(e){}
    }
    realtimeChannel = supabaseClient
      .channel('pathosorus_realtime_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, (payload) => {
        console.log("⚡ [Realtime] Changement détecté questions:", payload.eventType);
        fetchSupabaseData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, (payload) => {
        console.log("⚡ [Realtime] Changement détecté cas cliniques:", payload.eventType);
        fetchSupabaseData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_tags' }, (payload) => {
        console.log("⚡ [Realtime] Changement détecté tags/progression/tombstones:", payload.eventType);
        fetchSupabaseData(true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("⚡ [Realtime] Connecté aux changements en direct multi-appareils");
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("⚠️ [Realtime] Canal déconnecté (" + status + "), reconnexion automatique programmée...");
          setTimeout(setupRealtimeSync, 4000);
        }
      });
  } catch(rtErr) {
    console.warn("Erreur souscription Supabase Realtime:", rtErr);
  }
}

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
      supabaseClient = lib.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          lock: async (name, acquireTimeout, fn) => { return await fn(); }
        }
      });
      updateSupabaseUI(true);

      // Souscription Realtime multi-postes avec reconnexion automatique
      setupRealtimeSync();

      // Téléchargement immédiat et sans attente des questions et cas depuis Supabase (t=0)
      fetchSupabaseData(true);

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
  const rememberedUser = getActiveUser();
  if (rememberedUser) {
    state.currentUser = rememberedUser;
  }

  if (!supabaseClient) {
    updateUserRoleUI();
    return;
  }
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
      state.currentUser = session.user;
      if (session.user.email) {
        const em = session.user.email.trim().toLowerCase();
        localStorage.setItem('pathosorus_current_email', em);
        localStorage.removeItem('pathosorus_explicit_logout');
        loadUserStatsForAccount(em);
        loadUserProgressForAccount(em);
      }
      await fetchCurrentUserRole();
      checkDailyStreak();
    } else {
      const active = getActiveUser();
      if (active) {
        state.currentUser = active;
        if (active.email) {
          const em = active.email.trim().toLowerCase();
          loadUserStatsForAccount(em);
          loadUserProgressForAccount(em);
        }
        await fetchCurrentUserRole();
        checkDailyStreak();
      } else {
        state.currentUser = null;
        state.currentRole = 'reader';
      }
    }
    updateUserRoleUI();

    // Charger les questions et synchroniser la progression liée au compte depuis le Cloud (Cloud-Authoritative)
    await fetchSupabaseData(true);
    if (state.currentUser) {
      checkDailyStreak();
    }

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (_isHandlingAuthLogin) return;
      if (session && session.user) {
        state.currentUser = session.user;
        if (session.user.email) {
          const em = session.user.email.trim().toLowerCase();
          localStorage.setItem('pathosorus_current_email', em);
          localStorage.removeItem('pathosorus_explicit_logout');
          loadUserStatsForAccount(em);
          loadUserProgressForAccount(em);
        }
        await fetchCurrentUserRole();
        checkDailyStreak();
        await fetchSupabaseData(true);
        checkDailyStreak();
      } else if (event === 'SIGNED_OUT') {
        const explicitLogout = localStorage.getItem('pathosorus_explicit_logout') === 'true';
        if (explicitLogout) {
          state.currentUser = null;
          state.currentRole = 'reader';
          state.stats = getDefaultStats();
          resetInMemoryUserProgress();
          localStorage.removeItem('pathosorus_current_email');
          updateTopBar();
          renderSpacedRepetitionDashboard();
          renderBank();
          renderHierarchySelector();
          updateUserRoleUI();
        }
      }
      updateUserRoleUI();
    });
  } catch (e) {
    console.warn("Erreur initAuth:", e);
    const active = getActiveUser();
    if (active) {
      state.currentUser = active;
    }
    updateUserRoleUI();
  }
}

function isValidUUID(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

let _syncUserProgressTagTimeout = null;
function debouncedSyncUserProgressTagToCloud() {
  if (_syncUserProgressTagTimeout) clearTimeout(_syncUserProgressTagTimeout);
  _syncUserProgressTagTimeout = setTimeout(() => {
    syncUserProgressTagToCloud();
    syncUserStatsTagToCloud();
  }, 1000);
}

async function syncUserProgressTagToCloud() {
  if (!supabaseClient || !state.currentUser) return;
  const email = getCurrentUserEmail();
  if (!email) return;

  try {
    const compactMap = {};
    // La progression personnelle est isolée par compte dans state.userProgress
    Object.keys(state.userProgress || {}).forEach(qId => {
      const p = state.userProgress[qId];
      if (!p) return;
      const st = p.stats || getDefaultQuestionStats();
      if (p.mastered || p.flagged || (st && (st.seen > 0 || st.lastReviewed))) {
        compactMap[qId] = {
          s: st,
          m: p.mastered ? 1 : 0,
          f: p.flagged ? 1 : 0
        };
      }
    });

    const payload = JSON.stringify(compactMap);
    const tagName = `UPROG:${email}:${payload}`;

    await supabaseClient.from('custom_tags').upsert({ name: tagName }, { onConflict: 'name' });
    await supabaseClient.from('custom_tags').delete().ilike('name', `UPROG:${email}:%`).neq('name', tagName);
  } catch (err) {
    console.warn("Erreur syncUserProgressTagToCloud:", err);
  }
}

async function syncUserStatsTagToCloud() {
  if (!supabaseClient || !state.currentUser) return;
  const email = getCurrentUserEmail();
  if (!email) return;

  try {
    const statsPayload = {
      xp: state.stats.xp || 0,
      creatorXp: state.stats.creatorXp || 0,
      streak: state.stats.streak || 1,
      lastActiveDate: state.stats.lastActiveDate,
      totalAnswered: state.stats.totalAnswered || 0,
      totalCorrect: state.stats.totalCorrect || 0,
      completedCategories: state.stats.completedCategories || [],
      unlockedBadges: state.stats.unlockedBadges || {}
    };
    const tagName = `USTATS:${email}:${JSON.stringify(statsPayload)}`;

    await supabaseClient.from('custom_tags').upsert({ name: tagName }, { onConflict: 'name' });
    await supabaseClient.from('custom_tags').delete().ilike('name', `USTATS:${email}:%`).neq('name', tagName);
  } catch (err) {
    console.warn("Erreur syncUserStatsTagToCloud:", err);
  }
}

async function syncLocalProgressToCloud() {
  if (!supabaseClient || !state.currentUser) return;
  try {
    // La table collective questions ne doit JAMAIS être polluée par la progression personnelle
    // La progression personnelle de chaque utilisateur va exclusivement dans UPROG:email et user_progress
    const questionsToSync = (state.questions || []).filter(q => 
      q && q.id && (q.mastered || q.flagged || (q.stats && (q.stats.seen > 0 || q.stats.lastReviewed)))
    );

    // 1. Synchroniser les tags UPROG et USTATS dans custom_tags (garantie multi-Mac instantanée isolée par profil)
    await syncUserProgressTagToCloud();
    await syncUserStatsTagToCloud();

    // 3. user_progress table (tentative optionnelle)
    if (isValidUUID(state.currentUser.id)) {
      const toUpload = [];
      questionsToSync.forEach(q => {
        toUpload.push({
          user_id: state.currentUser.id,
          question_id: q.id,
          mastered: Boolean(q.mastered),
          flagged: Boolean(q.flagged),
          stats: q.stats || getDefaultQuestionStats(),
          updated_at: new Date().toISOString()
        });
      });
      if (toUpload.length > 0) {
        for (let i = 0; i < toUpload.length; i += 50) {
          const batch = toUpload.slice(i, i + 50);
          await supabaseClient.from('user_progress').upsert(batch);
        }
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

      const deletedIds = new Set(JSON.parse(localStorage.getItem('pathosorus_deleted_ids') || '[]'));
      const toPush = (state.questions || []).filter(localQ => {
        if (!localQ || !localQ.id || deletedIds.has(localQ.id)) return false;
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
    alert(`Synchronisation terminée avec succès !\n\n• Questions & Justifications envoyées et synchronisées\n• Trophées & XP à jour (${state.stats.xp || 0} XP, Série ${state.stats.streak || 1}j)\n• Cartes de révision espacée à jour.`);
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

async function syncCloudNowSafe() {
  if (!supabaseClient) {
    showToast("Supabase non connecté.", "error");
    return;
  }
  const btn = document.getElementById('btn-quick-sync') || document.querySelector('button[onclick*="syncCloudNowSafe"]') || document.querySelector('button[onclick*="resetToCloudBank"]');
  let originalHtml = '';
  if (btn) {
    originalHtml = btn.innerHTML;
    btn.classList.add('opacity-75', 'pointer-events-none');
    btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-teal-400 animate-spin"></i><span>Sync en cours...</span>`;
    if (window.lucide) lucide.createIcons();
  }
  showToast("Synchronisation Cloud bidirectionnelle sécurisée en cours...", "info");
  try {
    // 1. Envoyer d'abord tous les éléments locaux non synchronisés vers Supabase (questions et DP)
    await autoSyncLocalDataToCloud();
    // 2. Télécharger les nouveautés du Cloud et fusionner sans JAMAIS rien supprimer
    await fetchSupabaseData(true);
    const totalQ = (state.questions ? state.questions.length : 0);
    const totalC = (state.cases ? state.cases.length : 0);
    showToast(`✅ Banque Cloud synchronisée : ${totalQ} questions et ${totalC} DP à jour !`, "success");
  } catch (err) {
    console.warn("Erreur lors de la synchronisation Cloud:", err);
    showToast("Données locales sécurisées.", "info");
  } finally {
    if (btn) {
      btn.classList.remove('opacity-75', 'pointer-events-none');
      btn.innerHTML = originalHtml;
      if (window.lucide) lucide.createIcons();
    }
  }
}
window.syncCloudNowSafe = syncCloudNowSafe;
window.resetToCloudBank = syncCloudNowSafe; // Remplacement sécurisé : NE SUPPRIME JAMAIS LE STOCKAGE LOCAL
window.syncCloudNow = syncCloudNowSafe;

async function syncStatsToCloud() {
  if (!supabaseClient || !state.currentUser) return;
  const currentEmail = getCurrentUserEmail();
  try {
    const statsPayload = {
      ...state.stats,
      customBadges: state.customBadges || []
    };

    // 0. Sauvegarde principale dans la table SQL public.user_stats (Source de vérité universelle)
    if (currentEmail) {
      try {
        await supabaseClient.from('user_stats').upsert({
          email: currentEmail,
          name: getQuestionAuthorDisplayName(currentEmail).name,
          role: state.currentRole || 'creator',
          xp: state.stats.xp || 0,
          streak: state.stats.streak || 1,
          last_active_date: state.stats.lastActiveDate || getLocalDateString(),
          total_correct: state.stats.totalCorrect || 0,
          total_answered: state.stats.totalAnswered || 0,
          unlocked_badges: state.stats.unlockedBadges || {},
          completed_categories: state.stats.completedCategories || [],
          equipped_title: state.stats.equippedTitle || '',
          trophy_custom_names: state.stats.trophyCustomNames || {},
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
      } catch (statsErr) {}
    }

    // 1. Sauvegarde dans la table public.profiles (si UUID valide)
    if (isValidUUID(state.currentUser.id)) {
      try {
        await supabaseClient
          .from('profiles')
          .upsert({
            id: state.currentUser.id,
            email: state.currentUser.email,
            role: state.currentRole || 'creator',
            stats: statsPayload
          });
      } catch (profErr) {}
    }

    // 2. Sauvegarde directe dans custom_tags (Fallback)
    await syncUserStatsTagToCloud();

  } catch (e) {
    console.warn("Erreur sync stats:", e);
  }
}

async function fetchCurrentUserRole() {
  if (!state.currentUser) {
    state.currentRole = 'reader';
    updateUserRoleUI();
    return;
  }
  const email = (state.currentUser.email || '').toLowerCase().trim();
  const isAdminUser = (email === 'padoreau85@gmail.com');
  if (isAdminUser || AUTHORIZED_CREATOR_EMAILS.has(email)) {
    state.currentRole = 'creator';
  } else {
    let tagRole = null;
    if (supabaseClient && email) {
      try {
        const { data: creatorTag } = await supabaseClient
          .from('custom_tags')
          .select('name')
          .eq('name', 'ROLE_CREATOR:' + email)
          .maybeSingle();
        if (creatorTag) tagRole = 'creator';
      } catch (e) {}
    }
    const metaRole = (state.currentUser.user_metadata && state.currentUser.user_metadata.role);
    state.currentRole = tagRole || metaRole || 'reader';
  }

  if (email) {
    addKnownColleague(email, state.currentRole);
  }

  updateUserRoleUI();
}

// --- CLÉS DE STOCKAGE ET PROGRESSION ISOLÉES PAR COMPTE UTILISATEUR ---
function getDefaultStats() {
  return {
    xp: 0,
    creatorXp: 0,
    streak: 1,
    lastActiveDate: null,
    totalAnswered: 0,
    totalCorrect: 0,
    completedCategories: [],
    unlockedBadges: {},
    badgeHistory: {},
    equippedTitle: '',
    equippedTitleBadgeId: '',
    trophyCustomNames: {}
  };
}

function getUserStatsStorageKey(email = null) {
  const em = (email || getCurrentUserEmail() || 'guest').trim().toLowerCase();
  return 'pathosorus_stats_' + em.replace(/[^a-z0-9]/gi, '_');
}

function loadUserStatsForAccount(email = null) {
  const em = (email || getCurrentUserEmail() || 'guest').trim().toLowerCase();
  const key = getUserStatsStorageKey(em);

  let loaded = null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) loaded = JSON.parse(raw);
  } catch(e) {}

  const activeDate = localStorage.getItem('pathosorus_last_active_' + em) || null;

  if (loaded && typeof loaded === 'object') {
    state.stats = {
      ...getDefaultStats(),
      ...loaded,
      lastActiveDate: activeDate || loaded.lastActiveDate || null
    };
  } else {
    state.stats = {
      ...getDefaultStats(),
      lastActiveDate: activeDate
    };
  }
}
window.loadUserStatsForAccount = loadUserStatsForAccount;

function getUserProgressStorageKey(email = null) {
  const em = (email || getCurrentUserEmail() || 'guest').trim().toLowerCase();
  return 'pathosorus_user_progress_' + em.replace(/[^a-z0-9]/gi, '_');
}

function loadUserProgressForAccount(email = null) {
  resetInMemoryUserProgress();
  const em = (email || getCurrentUserEmail() || 'guest').trim().toLowerCase();
  const storageKey = getUserProgressStorageKey(em);

  try {
    const rawProg = localStorage.getItem(storageKey);
    if (rawProg) {
      const prog = JSON.parse(rawProg);
      state.userProgress = prog || {};
      (state.questions || []).forEach(q => {
        if (!q || !q.id) return;
        if (prog[q.id]) {
          q.stats = Object.assign(getDefaultQuestionStats(), prog[q.id].stats || {});
          if (typeof prog[q.id].mastered !== 'undefined') q.mastered = Boolean(prog[q.id].mastered);
          if (typeof prog[q.id].flagged !== 'undefined') q.flagged = Boolean(prog[q.id].flagged);
        } else {
          // Question non révisée par ce compte : métriques vierges garanties
          q.stats = getDefaultQuestionStats();
          q.mastered = false;
          q.flagged = false;
        }
      });
    } else {
      state.userProgress = {};
      (state.questions || []).forEach(q => {
        if (!q) return;
        q.stats = getDefaultQuestionStats();
        q.mastered = false;
        q.flagged = false;
      });
    }
  } catch(e) {}
}
window.loadUserProgressForAccount = loadUserProgressForAccount;


function getDefaultQuestionStats() {
  return {
    seen: 0,
    correct: 0,
    consecutiveCorrect: 0,
    intervalDays: 0,
    lastReviewed: null,
    nextReviewDate: null,
    lastFailedDate: null,
    lastCorrectDate: null,
    lastXpDate: null,
    trophyEligible: false
  };
}

function isQuestionTrophyQualified(q) {
  if (!q || !q.stats) return false;
  if (!q.stats.correct || q.stats.correct <= 0) return false;
  if (q.stats.trophyEligible === true) return true;
  if (!q.stats.lastFailedDate) return true;
  const today = getLocalDateString();
  const lastFailed = q.stats.lastFailedDate;
  const lastCorrect = q.stats.lastCorrectDate || (q.stats.lastReviewed ? q.stats.lastReviewed.slice(0, 10) : null);
  if (lastFailed && lastCorrect && lastCorrect > lastFailed) {
    return true;
  }
  return false;
}
window.isQuestionTrophyQualified = isQuestionTrophyQualified;

function resetInMemoryUserProgress() {
  (state.questions || []).forEach(q => {
    if (!q) return;
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
  if (!state.userProgress) state.userProgress = {};
  state.userProgress[q.id] = prog[q.id];
}

async function loadUserProgress() {
  const currentEmail = getCurrentUserEmail();
  loadUserProgressForAccount(currentEmail);
  renderSpacedRepetitionDashboard();
  renderBank();
  renderHierarchySelector();

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

  if (!state.currentUser) return;

  state.userProgress[q.id] = {
    mastered: Boolean(q.mastered),
    flagged: Boolean(q.flagged),
    stats: q.stats || getDefaultQuestionStats(),
    updated_at: new Date().toISOString()
  };
  localStorage.setItem('pathosorus_progress_' + state.currentUser.id, JSON.stringify(state.userProgress));

  if (!supabaseClient) return;

  // 0. Sauvegarde principale dans la table SQL public.user_question_progress (Strictement isolée par email)
  const currentEmail = getCurrentUserEmail();
  if (currentEmail) {
    try {
      const qst = q.stats || getDefaultQuestionStats();
      await supabaseClient.from('user_question_progress').upsert({
        user_email: currentEmail,
        question_id: q.id,
        mastered: Boolean(q.mastered),
        flagged: Boolean(q.flagged),
        seen: qst.seen || 1,
        correct: qst.correct || 0,
        consecutive_correct: qst.consecutiveCorrect || 0,
        interval_days: qst.intervalDays || 1,
        last_reviewed: qst.lastReviewed || new Date().toISOString(),
        next_review_date: qst.nextReviewDate || null,
        last_failed_date: qst.lastFailedDate || null,
        last_correct_date: qst.lastCorrectDate || null,
        last_xp_date: qst.lastXpDate || null,
        trophy_eligible: qst.trophyEligible !== undefined ? Boolean(qst.trophyEligible) : false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_email,question_id' });
    } catch (e) {}
  }

  // 1. Synchronisation par tag utilisateur UPROG & USTATS (multi-postes instantané sans RLS, strictement isolé par email)
  debouncedSyncUserProgressTagToCloud();

  // 2. Sauvegarde de secours dans la table user_progress si UUID valide
  if (isValidUUID(state.currentUser.id)) {
    try {
      await supabaseClient.from('user_progress').upsert({
        user_id: state.currentUser.id,
        question_id: q.id,
        mastered: Boolean(q.mastered),
        flagged: Boolean(q.flagged),
        stats: q.stats || getDefaultQuestionStats(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,question_id' });
    } catch (e) {}
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
    const email = (state.currentUser.email || '').trim().toLowerCase();
    const emailPrefix = email.split('@')[0];
    const displayName = (email === 'padoreau85@gmail.com')
      ? 'Dr Pierre-Alain Doreau'
      : ((email === 'belhadef.samy@gmail.com') ? 'Dr Samy Belhadef' : emailPrefix);

    if (authBtnIcon) authBtnIcon.setAttribute('data-lucide', 'log-out');
    if (authBtnText) authBtnText.textContent = "Déconnexion";
    if (btnAuthToggle) {
      btnAuthToggle.title = `Déconnecter ${email}`;
      btnAuthToggle.className = "px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-950/80 hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 transition border border-slate-800 hover:border-rose-500/40 flex items-center space-x-1.5 shadow-sm";
    }

    if (state.currentRole === 'creator') {
      if (roleBadge) roleBadge.className = "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-teal-500/20 to-indigo-500/20 border border-teal-500/40 text-teal-300 shadow-sm";
      if (roleDot) roleDot.className = "w-2 h-2 rounded-full bg-teal-400 animate-pulse";
      if (roleText) roleText.textContent = `${displayName} (Créateur 🦖)`;
      if (btnAccountsModal) {
        btnAccountsModal.classList.remove('hidden');
        btnAccountsModal.classList.add('flex');
      }
    } else {
      if (roleBadge) roleBadge.className = "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 border border-sky-500/30 text-sky-300";
      if (roleDot) roleDot.className = "w-2 h-2 rounded-full bg-sky-400";
      if (roleText) roleText.textContent = `${displayName} (Lecteur 📖)`;
      if (btnAccountsModal) {
        btnAccountsModal.classList.add('hidden');
        btnAccountsModal.classList.remove('flex');
      }
    }
  } else {
    if (authBtnIcon) authBtnIcon.setAttribute('data-lucide', 'log-in');
    if (authBtnText) authBtnText.textContent = "Connexion";
    if (btnAuthToggle) {
      btnAuthToggle.title = "Se connecter";
      btnAuthToggle.className = "px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-800 flex items-center space-x-1.5 shadow-sm";
    }
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

  // Contrôle de la vue Jouer : Vitrine publique (Invité) vs Dashboard d'entraînement (Connecté)
  const playGuest = document.getElementById('play-view-guest');
  const playAuth = document.getElementById('play-view-authenticated');
  const topUserStats = document.getElementById('top-user-stats');

  if (state.currentUser) {
    if (playGuest) playGuest.classList.add('hidden');
    if (playAuth) playAuth.classList.remove('hidden');
    if (topUserStats) {
      topUserStats.style.display = 'flex';
      topUserStats.classList.remove('hidden');
    }
    updateTopBar();
    renderSpacedRepetitionDashboard();
  } else {
    if (playGuest) playGuest.classList.remove('hidden');
    if (playAuth) playAuth.classList.add('hidden');
    if (topUserStats) {
      topUserStats.style.display = 'none';
      topUserStats.classList.add('hidden');
    }
    renderGuestShowcaseStats();
  }

  renderBank();
  if (window.lucide) lucide.createIcons();
}

function renderGuestShowcaseStats() {
  const qCountEl = document.getElementById('guest-stat-questions-count');
  const qCountEl2 = document.getElementById('guest-stat-questions-count-2');
  const cCountEl = document.getElementById('guest-stat-cases-count');
  const oCountEl = document.getElementById('guest-stat-organs-count');

  const qCount = (state.questions || []).length;
  if (qCountEl) qCountEl.textContent = qCount;
  if (qCountEl2) qCountEl2.textContent = qCount;
  if (cCountEl) cCountEl.textContent = (state.cases || []).length;
  if (oCountEl) {
    const organs = new Set((state.questions || []).map(q => q.organ).filter(Boolean));
    oCountEl.textContent = organs.size || 1;
  }
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
  const emailInput = document.getElementById('auth-input-email');
  const passInput = document.getElementById('auth-input-password');
  const alertBox = document.getElementById('auth-alert-box');
  const btn = document.getElementById('btn-auth-submit');

  const email = (emailInput?.value || '').trim();
  const password = passInput?.value || '';

  if (!email) return;

  _isHandlingAuthLogin = true;

  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Connexion en cours...</span>`;
    if (window.lucide) lucide.createIcons();
  }
  if (alertBox) alertBox.classList.add('hidden');

  const normalizedEmail = email.toLowerCase();
  const isAuthorizedCreator = AUTHORIZED_CREATOR_EMAILS.has(normalizedEmail);

  try {
    if (!supabaseClient) {
      throw new Error("Connexion Supabase non initialisée.");
    }

    // 1. Authentification officielle Supabase avec mot de passe
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes("invalid login credentials")) {
        msg = "Adresse e-mail ou mot de passe incorrect.";
      } else if (msg.toLowerCase().includes("email not confirmed")) {
        msg = "E-mail non confirmé. Veuillez activer 'Auto Confirm' dans Supabase.";
      }
      throw new Error(msg);
    }

    if (!data || !data.user) {
      throw new Error("Échec de connexion Supabase.");
    }

    // 2. Connexion réussie avec vrai compte et UUID Supabase
    state.currentUser = data.user;
    state.currentRole = isAuthorizedCreator ? 'creator' : 'reader';
    localStorage.removeItem('pathosorus_explicit_logout');
    localStorage.setItem('pathosorus_current_email', normalizedEmail);

    // 2bis. Isolation stricte en mémoire : purger tout résidu avant de charger le compte
    state.stats = getDefaultStats();
    resetInMemoryUserProgress();

    // 3. Charger immédiatement les données locales de cet utilisateur (0 ms)
    loadUserStatsForAccount(normalizedEmail);
    loadUserProgressForAccount(normalizedEmail);

    // 4. Fermer la modale IMMÉDIATEMENT et mettre à jour l'interface (aucun blocage UI)
    closeAuthModal();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml || `<i data-lucide="log-in" class="w-4 h-4"></i><span>Se connecter</span>`;
    }
    updateUserRoleUI();
    updateTopBar();
    renderSpacedRepetitionDashboard();
    renderBank();
    renderTrophiesView();

    const docInfo = getQuestionAuthorDisplayName(normalizedEmail);
    const displayName = docInfo.name || normalizedEmail;
    showToast(`Bienvenue ${displayName} ! Connecté avec succès.`, "success");

    // 5. Synchronisation complète Cloud en arrière-plan fluide (non-bloquant)
    (async () => {
      try {
        await fetchCurrentUserRole();
        checkDailyStreak();
        await fetchSupabaseData(true);
        checkDailyStreak();
        updateTopBar();
        renderSpacedRepetitionDashboard();
        renderBank();
        renderTrophiesView();
        renderLeaderboard();
        if (window.lucide) lucide.createIcons();
      } catch (syncErr) {
        console.warn("Sync arrière-plan connexion:", syncErr);
      } finally {
        _isHandlingAuthLogin = false;
      }
    })();

  } catch (err) {
    _isHandlingAuthLogin = false;
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
      btn.innerHTML = originalBtnHtml || `<i data-lucide="log-in" class="w-4 h-4"></i><span>Se connecter</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

function handleAuthLogout() {
  if (!confirm("Voulez-vous vous déconnecter de PathoSorus ?")) return;

  const previousUser = state.currentUser;
  const previousEmail = (previousUser && previousUser.email) ? previousUser.email.trim().toLowerCase() : getCurrentUserEmail();
  const previousStats = state.stats ? { ...state.stats } : getDefaultStats();

  // 1. Sauvegarde locale immédiate de l'utilisateur sortant
  if (previousEmail) {
    try {
      localStorage.setItem(getUserStatsStorageKey(previousEmail), JSON.stringify(previousStats));
    } catch(e) {}
  }

  // 2. Déconnexion locale INSTANTANÉE (0 ms, aucun blocage UI)
  localStorage.setItem('pathosorus_explicit_logout', 'true');
  localStorage.removeItem('pathosorus_current_email');
  state.currentUser = null;
  state.currentRole = 'reader';

  // 3. Réinitialiser les statistiques vers un profil visiteur propre (0 XP en mémoire)
  state.stats = getDefaultStats();
  resetInMemoryUserProgress();
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(state.stats));
  } catch(e) {}

  // 4. Basculer immédiatement l'interface utilisateur (0 ms de latence)
  closeAuthModal();
  updateUserRoleUI();
  updateTopBar();
  switchTab('play');
  const playGuest = document.getElementById('play-view-guest');
  const playAuth = document.getElementById('play-view-authenticated');
  if (playGuest) playGuest.classList.remove('hidden');
  if (playAuth) playAuth.classList.add('hidden');
  renderGuestShowcaseStats();
  renderBank();
  renderHierarchySelector();
  renderTrophiesView();
  showToast("Vous avez été déconnecté avec succès.", "info");
  if (window.lucide) lucide.createIcons();

  // 5. Synchronisation Cloud sortante et signOut Supabase en tâche de fond complètement détachée
  (async () => {
    if (previousEmail && supabaseClient) {
      try {
        let statsToPush = previousStats;
        const tagName = `USTATS:${previousEmail}:${JSON.stringify(statsToPush)}`;
        await supabaseClient.from('custom_tags').upsert({ name: tagName }, { onConflict: 'name' });
        await supabaseClient.from('custom_tags').delete().ilike('name', `USTATS:${previousEmail}:%`).neq('name', tagName);
      } catch(e) {}
    }
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {}
    }
  })().catch(() => {});
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

// --- APPLICATION APPLE / PWA MODAL ---
function openAppleAppModal() {
  const modal = document.getElementById('modal-apple-app');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
}
window.openAppleAppModal = openAppleAppModal;

function closeAppleAppModal() {
  const modal = document.getElementById('modal-apple-app');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}
window.closeAppleAppModal = closeAppleAppModal;

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

  state.detailModalQuestionId = q.id;

  const editBtn = document.getElementById('btn-detail-edit');
  if (editBtn) {
    if (isCreator()) {
      editBtn.classList.remove('hidden');
      editBtn.classList.add('flex');
    } else {
      editBtn.classList.add('hidden');
      editBtn.classList.remove('flex');
    }
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

  // Fiche OMS & Topo de cours lié à cette lésion
  const topoContainer = document.getElementById('detail-lesion-topo-container');
  const topoTitle = document.getElementById('detail-lesion-topo-title');
  const topoContent = document.getElementById('detail-lesion-topo-content');
  const lesionKey = `${q.organ || 'Autre'}::${q.category || 'Général'}::${q.entity || 'Lésion non spécifiée'}`;
  const topoNote = (state.lesionNotes && state.lesionNotes[lesionKey]) ? state.lesionNotes[lesionKey] : null;

  if (topoContainer && topoContent) {
    if (topoNote && topoNote.content && topoNote.content.trim()) {
      topoContainer.classList.remove('hidden');
      if (topoTitle) topoTitle.textContent = `📘 Critères OMS & Topo : ${escapeHtml(q.entity)}`;
      topoContent.innerHTML = renderLesionTopoHtml(topoNote.content);
    } else {
      topoContainer.classList.add('hidden');
      topoContent.innerHTML = '';
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

function handleEditFromDetailModal() {
  if (!state.detailModalQuestionId) return;
  const qId = state.detailModalQuestionId;
  closeQuestionDetailModal();
  editQuestion(qId);
}
window.handleEditFromDetailModal = handleEditFromDetailModal;

let isFetchingSupabase = false;
let pendingFetchRequest = false;

async function fetchSupabaseData(silent = false) {
  if (!supabaseClient) return;
  if (isFetchingSupabase) {
    pendingFetchRequest = true;
    return;
  }
  isFetchingSupabase = true;
  const previousTotal = (state.questions ? state.questions.length : 0) + (state.cases ? state.cases.length : 0);
  try {
    const promises = [
      supabaseClient.from('questions').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('cases').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('custom_tags').select('*').order('created_at', { ascending: true })
    ];

    if (state.currentUser && state.currentUser.id && isValidUUID(state.currentUser.id)) {
      promises.push(
        supabaseClient.from('user_progress').select('*').eq('user_id', state.currentUser.id)
      );
    }

    const [qRes, cRes, tRes, upRes] = await Promise.all(promises);

    const cloudProgressMap = new Map();
    const currentEmail = getCurrentUserEmail();

    let hasSqlStats = false;
    // 0A. Source de vérité officielle SQL : public.user_stats & public.user_question_progress
    if (currentEmail && supabaseClient) {
      try {
        const { data: dbUserStats } = await supabaseClient
          .from('user_stats')
          .select('*')
          .eq('email', currentEmail)
          .maybeSingle();

        if (dbUserStats) {
          hasSqlStats = true;
          const cloudLastActive = dbUserStats.last_active_date || null;
          const localLastActive = localStorage.getItem('pathosorus_last_active_' + currentEmail) || (state.stats && state.stats.lastActiveDate) || null;
          const preservedLastActive = cloudLastActive || localLastActive || null;
          
          const currentMemStreak = (state.stats && typeof state.stats.streak === 'number') ? state.stats.streak : 1;
          const dbStreak = typeof dbUserStats.streak === 'number' ? dbUserStats.streak : 1;
          const effectiveStreak = Math.max(currentMemStreak, dbStreak);

          state.stats = {
            ...getDefaultStats(),
            lastActiveDate: preservedLastActive,
            xp: typeof dbUserStats.xp === 'number' ? dbUserStats.xp : 0,
            creatorXp: (state.stats && state.stats.creatorXp) || 0,
            streak: effectiveStreak,
            totalAnswered: typeof dbUserStats.total_answered === 'number' ? dbUserStats.total_answered : 0,
            totalCorrect: typeof dbUserStats.total_correct === 'number' ? dbUserStats.total_correct : 0,
            unlockedBadges: dbUserStats.unlocked_badges || {},
            completedCategories: dbUserStats.completed_categories || [],
            equippedTitle: dbUserStats.equipped_title || '',
            equippedTitleBadgeId: (state.stats && state.stats.equippedTitleBadgeId) || '',
            trophyCustomNames: dbUserStats.trophy_custom_names || {}
          };
          localStorage.setItem(getUserStatsStorageKey(currentEmail), JSON.stringify(state.stats));
          if (preservedLastActive) {
            localStorage.setItem('pathosorus_last_active_' + currentEmail, preservedLastActive);
          }
          localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(state.stats));
        }

        // 0B. Trophées individuels officiels depuis public.user_trophies (Source de vérité 100% transparente)
        try {
          const { data: dbUserTrophies } = await supabaseClient
            .from('user_trophies')
            .select('*')
            .eq('user_email', currentEmail);

          if (dbUserTrophies && Array.isArray(dbUserTrophies)) {
            const trophiesMap = {};
            dbUserTrophies.forEach(t => {
              trophiesMap[t.badge_id] = new Date(t.unlocked_at).getTime() || Date.now();
            });
            // Si la table user_trophies a des entrées enregistrées, elle fait foi absolue
            if (dbUserTrophies.length > 0) {
              state.stats.unlockedBadges = trophiesMap;
              localStorage.setItem(getUserStatsStorageKey(currentEmail), JSON.stringify(state.stats));
            }
          }
        } catch(trophyErr) {}

        // Assainissement immédiat du cache local de Samy s'il était contaminé par 46 trophées
        try {
          const samyLocalKey = 'pathosorus_stats_belhadef_samy_gmail_com';
          const samyRaw = localStorage.getItem(samyLocalKey);
          if (samyRaw) {
            const parsedSamy = JSON.parse(samyRaw);
            if (parsedSamy && parsedSamy.unlockedBadges && Object.keys(parsedSamy.unlockedBadges).length > 10) {
              parsedSamy.unlockedBadges = {};
              localStorage.setItem(samyLocalKey, JSON.stringify(parsedSamy));
            }
          }
        } catch(e) {}

        // Migration transparente pour Pierre-Alain : alimenter user_trophies depuis les badges légitimes existants
        if (currentEmail.toLowerCase().trim() === 'padoreau85@gmail.com' && state.stats.unlockedBadges) {
          const badgeEntries = Object.entries(state.stats.unlockedBadges);
          if (badgeEntries.length > 0) {
            try {
              const rowsToInsert = badgeEntries.map(([bId, ts]) => ({
                user_email: currentEmail,
                badge_id: bId,
                badge_name: (state.stats.trophyCustomNames && state.stats.trophyCustomNames[bId]) || bId,
                category: 'organ',
                unlocked_at: new Date(typeof ts === 'number' ? ts : Date.now()).toISOString()
              }));
              await supabaseClient.from('user_trophies').upsert(rowsToInsert, { onConflict: 'user_email,badge_id' });
            } catch(e) {}
          }
        }

        const { data: dbProg } = await supabaseClient
          .from('user_question_progress')
          .select('*')
          .eq('user_email', currentEmail);

        if (dbProg && Array.isArray(dbProg) && dbProg.length > 0) {
          state.userProgress = {};
          dbProg.forEach(row => {
            const up = {
              question_id: row.question_id,
              stats: {
                seen: row.seen || 0,
                correct: row.correct || 0,
                consecutiveCorrect: row.consecutive_correct || 0,
                intervalDays: row.interval_days || 0,
                lastReviewed: row.last_reviewed,
                nextReviewDate: row.next_review_date,
                lastFailedDate: row.last_failed_date || null,
                lastCorrectDate: row.last_correct_date || null,
                lastXpDate: row.last_xp_date || null,
                trophyEligible: row.trophy_eligible !== undefined ? Boolean(row.trophy_eligible) : false
              },
              mastered: Boolean(row.mastered),
              flagged: Boolean(row.flagged)
            };
            cloudProgressMap.set(row.question_id, up);
            state.userProgress[row.question_id] = up;
          });
        }

        // 0C. Synchroniser immédiatement tous les trophées légitimes débloqués
        if (currentEmail) {
          try {
            await checkAndUnlockBadges();
          } catch(e) {}
        }
      } catch (sqlErr) {}
    }

    // 0. Progression et Stats depuis custom_tags (UPROG & USTATS) - Fallback uniquement si user_stats non disponible
    if (!hasSqlStats && tRes && !tRes.error && tRes.data && Array.isArray(tRes.data) && currentEmail) {
      const uProgTag = tRes.data.find(t => t.name && t.name.startsWith(`UPROG:${currentEmail}:`));
      if (uProgTag) {
        try {
          const raw = uProgTag.name.substring(`UPROG:${currentEmail}:`.length);
          const parsed = JSON.parse(raw);
          state.userProgress = {};
          Object.keys(parsed).forEach(qId => {
            const item = parsed[qId];
            cloudProgressMap.set(qId, {
              question_id: qId,
              stats: item.s || item.stats || getDefaultQuestionStats(),
              mastered: Boolean(item.m ?? item.mastered),
              flagged: Boolean(item.f ?? item.flagged)
            });
            state.userProgress[qId] = cloudProgressMap.get(qId);
          });
        } catch (e) {
          console.warn("Erreur parse UPROG:", e);
        }
      }

      // Mettre en cache local les stats de chaque confrère (Pierre-Alain, Samy...)
      if (tRes && tRes.data && Array.isArray(tRes.data)) {
        tRes.data.forEach(t => {
          if (t && t.name && t.name.startsWith('USTATS:')) {
            try {
              const parts = t.name.split(':', 2);
              const raw = t.name.substring(parts[0].length + parts[1].length + 2);
              const em = parts[1].trim().toLowerCase();
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object') {
                const k = getUserStatsStorageKey(em);
                localStorage.setItem(k, JSON.stringify(parsed));
              }
            } catch(e) {}
          }
        });
      }

      const uStatsTag = tRes.data.find(t => t.name && t.name.startsWith(`USTATS:${currentEmail}:`));
      if (uStatsTag) {
        try {
          const raw = uStatsTag.name.substring(`USTATS:${currentEmail}:`.length);
          const parsedStats = JSON.parse(raw);
          if (parsedStats && typeof parsedStats === 'object') {
            state.stats = {
              ...getDefaultStats(),
              ...parsedStats,
              xp: typeof parsedStats.xp === 'number' ? parsedStats.xp : (state.stats.xp || 0),
              creatorXp: typeof parsedStats.creatorXp === 'number' ? parsedStats.creatorXp : (state.stats.creatorXp || 0),
              streak: typeof parsedStats.streak === 'number' ? parsedStats.streak : 1,
              totalAnswered: typeof parsedStats.totalAnswered === 'number' ? parsedStats.totalAnswered : 0,
              totalCorrect: typeof parsedStats.totalCorrect === 'number' ? parsedStats.totalCorrect : 0,
              unlockedBadges: parsedStats.unlockedBadges || {},
              badgeHistory: parsedStats.badgeHistory || {},
              completedCategories: parsedStats.completedCategories || []
            };
            const userStatsKey = getUserStatsStorageKey(currentEmail);
            localStorage.setItem(userStatsKey, JSON.stringify(state.stats));
            localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(state.stats));
          }
        } catch (e) {
          console.warn("Erreur parse USTATS:", e);
        }
      }
    }

    // 1. Depuis la table user_progress
    if (upRes && !upRes.error && upRes.data && Array.isArray(upRes.data)) {
      upRes.data.forEach(up => {
        if (!cloudProgressMap.has(up.question_id)) {
          cloudProgressMap.set(up.question_id, up);
          state.userProgress[up.question_id] = up;
        }
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

      const currentEmail = getCurrentUserEmail();
      const isMainCreator = currentEmail === 'padoreau85@gmail.com';

      const cloudQuestions = qRes.data.map(q => {
        const cloudProg = cloudProgressMap.get(q.id);
        const localProg = storedProgress[q.id];
        const localQ = localQuestionMap.get(q.id);
        
        let stats = getDefaultQuestionStats();
        let mastered = false;
        let flagged = false;

        // Progression personnelle (Répétition espacée) strictement isolée par compte
        if (cloudProg) {
          stats = { ...stats, ...(cloudProg.stats || {}) };
          if (typeof cloudProg.mastered !== 'undefined') mastered = Boolean(cloudProg.mastered);
          if (typeof cloudProg.flagged !== 'undefined') flagged = Boolean(cloudProg.flagged);
        } else if (localProg) {
          stats = { ...stats, ...(localProg.stats || {}) };
          if (typeof localProg.mastered !== 'undefined') mastered = Boolean(localProg.mastered);
          if (typeof localProg.flagged !== 'undefined') flagged = Boolean(localProg.flagged);
        } else {
          // Nouveau compte ou question jamais révisée par cet utilisateur : état vierge propre
          stats = getDefaultQuestionStats();
          mastered = false;
          flagged = false;
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

      // Collecte des tombstones Cloud (suppressions expressément validées par un administrateur)
      const deletedQuestionIds = new Set();
      const deletedCaseIds = new Set();
      const deletedTagNames = new Set();

      if (tRes && tRes.data && Array.isArray(tRes.data)) {
        tRes.data.forEach(t => {
          if (t.name && t.name.startsWith('DEL_Q:')) {
            deletedQuestionIds.add(t.name.substring(6));
          } else if (t.name && t.name.startsWith('DEL_C:')) {
            deletedCaseIds.add(t.name.substring(6));
          } else if (t.name && t.name.startsWith('DEL_T:')) {
            deletedTagNames.add(t.name.substring(6));
          }
        });
      }

      // Nettoyage intelligent du cache local de suppressions :
      // Si une question ou un DP est vivant sur Supabase et qu'aucun tombstone DEL_ n'existe,
      // c'est qu'il n'a JAMAIS été supprimé par Pierre-Alain ou Samy. On retire le faux positif local.
      try {
        let localDel = JSON.parse(localStorage.getItem('pathosorus_deleted_ids') || '[]');
        if (Array.isArray(localDel)) {
          const rawCloudQIds = new Set((qRes.data || []).map(q => q.id));
          const rawCloudCIds = new Set(((cRes && cRes.data) || []).map(c => c.id));
          localDel = localDel.filter(id => {
            if (rawCloudQIds.has(id) && !deletedQuestionIds.has(id)) return false;
            if (rawCloudCIds.has(id) && !deletedCaseIds.has(id)) return false;
            return true;
          });
          localStorage.setItem('pathosorus_deleted_ids', JSON.stringify(localDel));
          localDel.forEach(id => {
            if (id.startsWith('dp_')) deletedCaseIds.add(id);
            else deletedQuestionIds.add(id);
          });
        }
      } catch (e) {}

      // Nettoyer localement la progression des questions réellement supprimées
      deletedQuestionIds.forEach(delId => {
        if (state.userProgress && state.userProgress[delId]) delete state.userProgress[delId];
      });

      // FUSION SÉCURISÉE DES QUESTIONS (ZÉRO PERTE DE DONNÉES)
      const validCloudQuestions = cloudQuestions.filter(q => !deletedQuestionIds.has(q.id));
      const cloudQMap = new Map(validCloudQuestions.map(q => [q.id, q]));
      const unsyncedQuestionsToPush = [];
      const mergedQuestions = [...validCloudQuestions];

      (state.questions || []).forEach(localQ => {
        if (!localQ || !localQ.id || deletedQuestionIds.has(localQ.id)) return;
        const remoteQ = cloudQMap.get(localQ.id);
        if (!remoteQ) {
          // Question créée localement non encore reçue par Supabase : NE JAMAIS L'ÉCRASER
          localQ._localUnsynced = true;
          mergedQuestions.push(localQ);
          unsyncedQuestionsToPush.push(localQ);
        } else if (localQ._localUnsynced || localQ._localEdited) {
          // Modifications locales en cours
          const idx = mergedQuestions.findIndex(q => q.id === localQ.id);
          if (idx !== -1) mergedQuestions[idx] = { ...remoteQ, ...localQ };
          unsyncedQuestionsToPush.push(mergedQuestions[idx]);
        }
      });

      state.questions = mergedQuestions;
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
      // FUSION SÉCURISÉE DES DOSSIERS PROGRESSIFS (DP)
      const validCloudCases = cRes.data
        .filter(c => !deletedCaseIds.has(c.id))
        .map(c => ({
          ...c,
          tags: c.tags || [],
          steps: c.steps || []
        }));
      const cloudCMap = new Map(validCloudCases.map(c => [c.id, c]));
      const unsyncedCasesToPush = [];
      const mergedCases = [...validCloudCases];

      (state.cases || []).forEach(localC => {
        if (!localC || !localC.id || deletedCaseIds.has(localC.id)) return;
        const remoteC = cloudCMap.get(localC.id);
        if (!remoteC) {
          // Dossier Progressif créé localement non encore sur Supabase : NE JAMAIS L'ÉCRASER
          localC._localUnsynced = true;
          mergedCases.push(localC);
          unsyncedCasesToPush.push(localC);
        } else if (localC._localUnsynced || localC._localEdited) {
          const idx = mergedCases.findIndex(c => c.id === localC.id);
          if (idx !== -1) mergedCases[idx] = { ...remoteC, ...localC };
          unsyncedCasesToPush.push(mergedCases[idx]);
        }
      });

      state.cases = mergedCases;
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(state.cases));

      // Auto-push automatique en tâche de fond pour garantir la persistance Cloud
      if (unsyncedQuestionsToPush.length > 0 || unsyncedCasesToPush.length > 0) {
        autoSyncLocalDataToCloud(unsyncedQuestionsToPush, unsyncedCasesToPush);
      }
    }

    if (!tRes.error && tRes.data && tRes.data.length > 0) {
      state.customTags = tRes.data
        .map(t => t.name)
        .filter(n => n && !n.startsWith('ROLE_') && !n.startsWith('UPROG:') && !n.startsWith('USTATS:') && !n.startsWith('DEL_') && !deletedTagNames.has(n));
      localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(state.customTags));
    }

    // Nettoyage de tags purgés sur les questions et cas en mémoire
    if (deletedTagNames.size > 0) {
      (state.questions || []).forEach(q => {
        if (q.tags && Array.isArray(q.tags) && q.tags.some(t => deletedTagNames.has(t))) {
          q.tags = q.tags.filter(t => !deletedTagNames.has(t));
        }
      });
      (state.cases || []).forEach(c => {
        if (c.tags && Array.isArray(c.tags) && c.tags.some(t => deletedTagNames.has(t))) {
          c.tags = c.tags.filter(t => !deletedTagNames.has(t));
        }
      });
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

    // Récupérer les fiches de cours OMS / topos par lésion
    try {
      const lnRes = await supabaseClient.from('lesion_notes').select('*');
      if (!lnRes.error && lnRes.data && Array.isArray(lnRes.data)) {
        if (!state.lesionNotes) state.lesionNotes = {};
        lnRes.data.forEach(item => {
          if (item && item.key) {
            state.lesionNotes[item.key] = {
              key: item.key,
              organ: item.organ || '',
              category: item.category || '',
              entity: item.entity || '',
              content: item.content || '',
              updatedAt: item.updated_at || '',
              authorName: item.author_name || '',
              authorEmail: item.author_email || ''
            };
          }
        });
        localStorage.setItem(STORAGE_KEY_LESION_NOTES, JSON.stringify(state.lesionNotes));
      }
    } catch(e) {}

    updateTopBar();
    renderHierarchySelector();
    renderTagsCloud();
    renderDPCardsOnPlay();
    renderSpacedRepetitionDashboard();
    renderBank();
    renderTrophiesView();

    const newTotal = (state.questions ? state.questions.length : 0) + (state.cases ? state.cases.length : 0);
    if (newTotal !== previousTotal && previousTotal > 0) {
      console.log(`⚡ Banque Cloud synchronisée : ${previousTotal} -> ${newTotal} éléments`);
      showToast(`⚡ Banque Cloud synchronisée : ${newTotal} éléments (${state.questions.length} questions, ${state.cases.length} cas)`, "success");
    }

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
        Promise.all(needSync.map(q => dbUpsertQuestion(q))).catch(e => console.warn("Auto-push background:", e));
      }
    }

    if (!silent) alert(`Données synchronisées depuis le Cloud Supabase (${newTotal} éléments) !`);
  } catch (err) {
    console.error("Erreur fetch Supabase:", err);
    if (!silent) alert("Erreur lors de la récupération des données : " + err.message);
  } finally {
    isFetchingSupabase = false;
    if (pendingFetchRequest) {
      pendingFetchRequest = false;
      setTimeout(() => fetchSupabaseData(true), 250);
    }
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

  // Les questions dans la table collective Supabase ne contiennent que le contenu éditorial
  const authorEmail = q.created_by || (q.stats && q.stats.created_by) || ((state.currentUser && state.currentUser.email) ? state.currentUser.email.toLowerCase() : 'padoreau85@gmail.com');
  const questionStats = {
    difficulty: diff,
    extremeClues: extClues,
    created_by: authorEmail,
    seen: 0,
    correct: 0,
    consecutiveCorrect: 0,
    intervalDays: 0,
    lastReviewed: null,
    nextReviewDate: null
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
    mastered: false,
    flagged: false,
    stats: questionStats,
    // Colonnes PostgreSQL en minuscules conformes à PostgREST
    optionexplanations: optExp,
    explanationimages: expImgs,
    acceptedanswers: accAns
  };
}

async function dbUpsertQuestion(q) {
  if (!supabaseClient) return { success: true, localOnly: true };
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

async function autoSyncLocalDataToCloud(customQuestions = null, customCases = null) {
  if (!supabaseClient) return;

  const deletedQIds = new Set();
  const deletedCIds = new Set();
  try {
    const localDel = JSON.parse(localStorage.getItem('pathosorus_deleted_ids') || '[]');
    if (Array.isArray(localDel)) {
      localDel.forEach(id => {
        if (id.startsWith('dp_')) deletedCIds.add(id);
        else deletedQIds.add(id);
      });
    }
  } catch (e) {}

  const questionsToSync = customQuestions || (state.questions || []).filter(q => 
    q && q.id && (q._localUnsynced === true || q._localEdited === true) && !deletedQIds.has(q.id)
  );

  const casesToSync = customCases || (state.cases || []).filter(c => 
    c && c.id && (c._localUnsynced === true || c._localEdited === true) && !deletedCIds.has(c.id)
  );

  let updated = false;

  if (questionsToSync.length > 0) {
    console.log(`🚀 Synchronisation Cloud de ${questionsToSync.length} question(s)...`);
    for (const q of questionsToSync) {
      try {
        const res = await dbUpsertQuestion(q);
        if (res && res.success) {
          delete q._localUnsynced;
          delete q._localEdited;
          updated = true;
        }
      } catch (err) {
        console.warn("Erreur auto-sync question vers Supabase:", q.id, err);
      }
    }
  }

  if (casesToSync.length > 0) {
    console.log(`🚀 Synchronisation Cloud de ${casesToSync.length} Dossier(s) Progressif(s)...`);
    for (const c of casesToSync) {
      try {
        const res = await dbUpsertCase(c);
        if (res && res.success) {
          delete c._localUnsynced;
          delete c._localEdited;
          updated = true;
        }
      } catch (err) {
        console.warn("Erreur auto-sync DP vers Supabase:", c.id, err);
      }
    }
  }

  if (updated) {
    saveQuestions();
    saveCases();
    broadcastLocalUpdate();
    console.log("✅ Synchronisation des questions et DP locaux vers Supabase achevée !");
  }
}
window.autoSyncLocalDataToCloud = autoSyncLocalDataToCloud;

async function autoSyncLocalQuestionsToCloud() {
  await autoSyncLocalDataToCloud();
}
window.autoSyncLocalQuestionsToCloud = autoSyncLocalQuestionsToCloud;

async function dbDeleteQuestion(id) {
  if (!supabaseClient) return;
  try {
    await Promise.allSettled([
      supabaseClient.from('questions').delete().eq('id', id),
      supabaseClient.from('user_progress').delete().eq('question_id', id),
      supabaseClient.from('custom_tags').insert({ name: 'DEL_Q:' + id })
    ]);
  } catch (e) {
    console.warn("Erreur delete question supabase:", e);
  }
}

async function dbUpsertCase(c) {
  if (!supabaseClient) return { success: true, localOnly: true };
  try {
    const { error } = await supabaseClient.from('cases').upsert(c);
    if (error) {
      console.warn("Erreur upsert case supabase:", error);
      return { error };
    }
    return { success: true };
  } catch (e) {
    console.warn("Erreur upsert case supabase:", e);
    return { error: e };
  }
}

async function dbDeleteCase(id) {
  if (!supabaseClient) return;
  try {
    await Promise.allSettled([
      supabaseClient.from('cases').delete().eq('id', id),
      supabaseClient.from('custom_tags').insert({ name: 'DEL_C:' + id })
    ]);
  } catch (e) {
    console.warn("Erreur delete case supabase:", e);
  }
}

async function dbUpsertTag(name) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('custom_tags').upsert({ name });
  } catch (e) {
    console.warn("Erreur upsert tag supabase:", e);
  }
}

function compressImageToDataUrl(fileOrDataUrl, maxWidth = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err) {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : "");
      }
    };
    img.onerror = () => {
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : "");
    };
    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

async function dbUpsertQuestionWithTimeout(q, timeoutMs = 4500) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        console.warn("⚠️ Timeout Supabase upsert (sauvegarde locale maintenue)");
        resolve({ error: { message: "Délai réseau dépassé" }, localOnly: true });
      }
    }, timeoutMs);

    dbUpsertQuestion(q).then(res => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(res);
      }
    }).catch(err => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ error: err });
      }
    });
  });
}

async function dbUpsertCaseWithTimeout(c, timeoutMs = 4500) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        console.warn("⚠️ Timeout Supabase case upsert (sauvegarde locale maintenue)");
        resolve({ error: { message: "Délai réseau dépassé" }, localOnly: true });
      }
    }, timeoutMs);

    dbUpsertCase(c).then(res => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(res);
      }
    }).catch(err => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ error: err });
      }
    });
  });
}

function dataUrlToBlob(dataUrl) {
  try {
    const parts = dataUrl.split(';base64,');
    if (parts.length < 2) return null;
    const contentType = parts[0].split(':')[1] || 'image/jpeg';
    const byteCharacters = atob(parts[1]);
    const byteArrays = [];
    const sliceSize = 512;
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  } catch (e) {
    return null;
  }
}

async function uploadImageFile(file) {
  // Compression systématique pour un upload ultra-rapide (<100ms) sans saturer le réseau ni le stockage Supabase
  let compressedDataUrl = "";
  try {
    compressedDataUrl = await compressImageToDataUrl(file, 1280, 0.82);
  } catch(e) {}

  if (supabaseClient) {
    try {
      const ext = 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const blob = compressedDataUrl ? dataUrlToBlob(compressedDataUrl) : null;
      const uploadBody = blob || file;

      const { data, error } = await supabaseClient.storage
        .from('pathosorus_images')
        .upload(fileName, uploadBody, { 
          cacheControl: '31536000', // Cache navigateur 1 an : préserve le quota Egress/Bande passante Supabase
          contentType: blob ? 'image/jpeg' : (file.type || 'image/jpeg'),
          upsert: false 
        });

      if (!error && data) {
        const { data: publicData } = supabaseClient.storage
          .from('pathosorus_images')
          .getPublicUrl(fileName);
        return publicData.publicUrl;
      }
    } catch (err) {
      console.warn("Upload Supabase Storage non disponible, fallback image compressée", err);
    }
  }

  if (compressedDataUrl) return compressedDataUrl;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (evt) => resolve(evt.target.result);
    reader.readAsDataURL(file);
  });
}

// --- INITIALISATION ---
function initApp() {
  state.currentUser = getActiveUser();
  const storedQ = localStorage.getItem(STORAGE_KEY_QUESTIONS);
  state.questions = storedQ ? JSON.parse(storedQ) : [];
  state.questions.forEach(q => {
    // Les questions constituent la banque partagée : réinitialisation des métriques personnelles
    q.mastered = false;
    q.flagged = false;
    q.stats = getDefaultQuestionStats();
    if (!q.explanationImages) q.explanationImages = q.explanationimages || [];
    if (!q.images) q.images = [];
    if (!q.acceptedAnswers) q.acceptedAnswers = q.acceptedanswers || (q.format === 'ouverte' ? (q.options || []) : []);
    const optExp = (Array.isArray(q.optionExplanations) && q.optionExplanations.length > 0)
      ? q.optionExplanations
      : (Array.isArray(q.optionexplanations) ? q.optionexplanations : []);
    q.optionExplanations = optExp;
    q.optionexplanations = optExp;

    // Détection automatique et rétrocompatible des questions avec lames (images)
    if (isSlideQuestion(q)) {
      if (!Array.isArray(q.tags)) q.tags = [];
      if (!q.tags.some(t => String(t).trim().toLowerCase() === 'lame')) {
        q.tags.unshift('Lame');
      }
    }
    // Détection automatique et rétrocompatible des questions IHC
    if (isIHCQuestion(q)) {
      if (!Array.isArray(q.tags)) q.tags = [];
      if (!q.tags.some(t => String(t).trim().toLowerCase().replace(/^#/, '') === 'ihc')) {
        q.tags.push('IHC');
      }
    }
  });

  // Restaurer immédiatement la progression locale des révisions STRICTEMENT propre au profil
  try {
    const userStorageKey = getUserProgressStorageKey();
    const rawProg = localStorage.getItem(userStorageKey);
    if (rawProg) {
      const prog = JSON.parse(rawProg);
      state.userProgress = prog || {};
      state.questions.forEach(q => {
        if (!q || !q.id) return;
        if (prog[q.id]) {
          if (prog[q.id].stats) q.stats = Object.assign(getDefaultQuestionStats(), prog[q.id].stats);
          if (typeof prog[q.id].mastered !== 'undefined') q.mastered = Boolean(prog[q.id].mastered);
          if (typeof prog[q.id].flagged !== 'undefined') q.flagged = Boolean(prog[q.id].flagged);
        } else {
          q.stats = getDefaultQuestionStats();
          q.mastered = false;
          q.flagged = false;
        }
      });
    } else {
      state.userProgress = {};
      state.questions.forEach(q => {
        if (!q) return;
        q.stats = getDefaultQuestionStats();
        q.mastered = false;
        q.flagged = false;
      });
    }
  } catch(e) {}

  const storedCases = localStorage.getItem(STORAGE_KEY_CASES);
  state.cases = storedCases ? JSON.parse(storedCases) : [];

  const storedTags = localStorage.getItem(STORAGE_KEY_TAGS);
  state.customTags = storedTags ? JSON.parse(storedTags) : ["Lame", "HES", "IHC", "BiologieMoléculaire", "PiègeClone"];
  if (!state.customTags.some(t => String(t).trim().toLowerCase() === 'lame')) {
    state.customTags.unshift('Lame');
    saveCustomTags();
  } else if (!storedTags) {
    saveCustomTags();
  }

  const storedCustomBadges = localStorage.getItem('pathosorus_custom_badges');
  state.customBadges = storedCustomBadges ? JSON.parse(storedCustomBadges) : [];

  const storedLesionNotes = localStorage.getItem(STORAGE_KEY_LESION_NOTES);
  try {
    state.lesionNotes = storedLesionNotes ? JSON.parse(storedLesionNotes) : {};
  } catch(e) {
    state.lesionNotes = {};
  }

  // Chargement des statistiques de l'utilisateur actif
  loadUserStatsForAccount(getCurrentUserEmail());

  state.statementTemplates = getSavedStatementTemplates();
  saveStatementTemplates();
  state.organStatementTemplates = getSavedOrganStatementTemplates();
  saveOrganStatementTemplates();
  state.lesionStatementTemplates = getSavedLesionStatementTemplates();
  saveLesionStatementTemplates();
  renderStatementTemplates();

  updateTopBar();
  renderHierarchySelector();
  renderTagsCloud();
  renderDPCardsOnPlay();
  renderSpacedRepetitionDashboard();
  renderBank();
  updateUserRoleUI();

  // Initialisation du Cloud Supabase & Authentification
  initSupabase();

  // Synchronisation des éventuelles questions locales vers Supabase
  autoSyncLocalQuestionsToCloud();

  initClipboardPasteListener();

  if (window.lucide) lucide.createIcons();

}

function saveQuestions() {
  // Banque collective partagée : ne jamais persister de progression personnelle dans le catalogue global
  const sanitized = (state.questions || []).map(q => {
    if (!q) return q;
    const copy = { ...q };
    delete copy.mastered;
    delete copy.flagged;
    delete copy.stats;
    return copy;
  });
  localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(sanitized));
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
  updateEditorDatalists();
}

function saveStats() {
  const email = getCurrentUserEmail();
  const key = getUserStatsStorageKey(email);
  if (state.stats && state.stats.lastActiveDate) {
    localStorage.setItem('pathosorus_last_active_' + email, state.stats.lastActiveDate);
  }
  localStorage.setItem(key, JSON.stringify(state.stats));
  if (state.currentUser) {
    if (state.currentUser.id) {
      localStorage.setItem(STORAGE_KEY_STATS + '_' + state.currentUser.id, JSON.stringify(state.stats));
    }
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

  // Titre honorifique actif (équipé au choix du confrère)
  const titleContainer = document.getElementById('top-user-title');
  const titleSep = document.getElementById('top-user-title-sep');
  const titleText = document.getElementById('top-user-title-text');
  const equippedTitle = (state.stats && state.stats.equippedTitle) ? state.stats.equippedTitle.trim() : '';

  if (titleContainer && titleText) {
    if (equippedTitle) {
      titleText.textContent = equippedTitle;
      titleContainer.classList.remove('hidden');
      titleContainer.classList.add('flex');
      if (titleSep) titleSep.classList.remove('hidden');
    } else {
      titleContainer.classList.add('hidden');
      titleContainer.classList.remove('flex');
      if (titleSep) titleSep.classList.add('hidden');
    }
  }

  const totalCount = state.questions.length + state.cases.length;
  const bankBadge = document.getElementById('badge-bank-count');
  if (bankBadge) bankBadge.textContent = totalCount;
  const mobBankBadge = document.getElementById('mob-badge-bank-count');
  if (mobBankBadge) mobBankBadge.textContent = totalCount;

  // Pastille de badges contestés définitivement masquée
  const contestedBadge = document.getElementById('badge-contested-count');
  const mobContestedBadge = document.getElementById('mob-badge-contested-count');
  if (contestedBadge) contestedBadge.classList.add('hidden');
  if (mobContestedBadge) mobContestedBadge.classList.add('hidden');
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

  // Synchronisation de la barre mobile inférieure
  document.querySelectorAll('.mob-nav-link').forEach(btn => {
    btn.classList.remove('text-teal-400', 'font-bold');
    btn.classList.add('text-slate-400');
  });
  const mobActiveBtn = document.getElementById('mob-nav-btn-' + viewId);
  if (mobActiveBtn) {
    mobActiveBtn.classList.remove('text-slate-400');
    mobActiveBtn.classList.add('text-teal-400', 'font-bold');
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
      renderStatementTemplates();
      updateQuestionAuthorSelect();
    }
  }

  if (viewId === 'bank' || viewId === 'play') {
    if (typeof checkForRemoteChanges === 'function') {
      checkForRemoteChanges();
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
  if (diff === 'extreme') return 50;
  return 2; // Facile par défaut (+2 pts)
}

function getTrophyXpReward(b) {
  // Les trophées sont des distinctions d'honneur et de prestige pures (0 XP).
  // L'XP est gagnée exclusivement en répondant aux questions et cas d'entraînement.
  return 0;
}

function calculatePlayerLevel(xp) {
  let rem = Math.max(0, xp || 0);

  // Tranche 1 : Niveaux 1 à 10 (100 XP / palier, 0 à 1 000 XP) - Découverte & Novice
  if (rem < 1000) {
    const lvl = 1 + Math.floor(rem / 100);
    const curXp = rem % 100;
    return {
      level: Math.min(10, lvl),
      currentTierXp: curXp,
      tierMaxXp: 100,
      percent: Math.min(100, Math.round((curXp / 100) * 100)),
      tierName: 'Interne Novice',
      tierBadge: '🥉 Bronze',
      nextTierInfo: '100 XP / palier'
    };
  }
  rem -= 1000;

  // Tranche 2 : Niveaux 11 à 30 (250 XP / palier, 1 000 à 6 000 XP) - Chasseur de Mitoses
  if (rem < 5000) {
    const lvl = 11 + Math.floor(rem / 250);
    const curXp = rem % 250;
    return {
      level: Math.min(30, lvl),
      currentTierXp: curXp,
      tierMaxXp: 250,
      percent: Math.min(100, Math.round((curXp / 250) * 100)),
      tierName: 'Chasseur de Mitoses',
      tierBadge: '🥈 Argent',
      nextTierInfo: '250 XP / palier'
    };
  }
  rem -= 5000;

  // Tranche 3 : Niveaux 31 à 66 (500 XP / palier, 6 000 à 24 000 XP) - Compagnon Histologique
  if (rem < 18000) {
    const lvl = 31 + Math.floor(rem / 500);
    const curXp = rem % 500;
    return {
      level: Math.min(66, lvl),
      currentTierXp: curXp,
      tierMaxXp: 500,
      percent: Math.min(100, Math.round((curXp / 500) * 100)),
      tierName: 'Compagnon Histologique',
      tierBadge: '🥇 Or',
      nextTierInfo: '500 XP / palier'
    };
  }
  rem -= 18000;

  // Tranche 4 : Niveaux 67 à 100 (1 000 XP / palier, 24 000 à 58 000 XP) - Accident de Cryostat & Grand Référent OMS
  if (rem < 34000) {
    const lvl = 67 + Math.floor(rem / 1000);
    const curXp = rem % 1000;
    const isCryostat = (lvl === 67);
    return {
      level: Math.min(100, lvl),
      currentTierXp: curXp,
      tierMaxXp: 1000,
      percent: Math.min(100, Math.round((curXp / 1000) * 100)),
      tierName: isCryostat ? 'L’Accident de Cryostat (Mythique)' : 'Grand Référent OMS',
      tierBadge: '💎 Platine',
      nextTierInfo: '1 000 XP / palier'
    };
  }
  rem -= 34000;

  // Tranche 5 : Niveaux 101 à 1000 (2 500 XP / palier, 58 000 à 2 308 000 XP) - Légendes d'Anatomopathologie
  if (rem < 2250000) {
    const lvl = 101 + Math.floor(rem / 2500);
    const curXp = rem % 2500;
    return {
      level: Math.min(1000, lvl),
      currentTierXp: curXp,
      tierMaxXp: 2500,
      percent: Math.min(100, Math.round((curXp / 2500) * 100)),
      tierName: 'Dieu de l’Anatomopathologie',
      tierBadge: '👑 Légende Absolue',
      nextTierInfo: '2 500 XP / palier'
    };
  }

  // Niveau Max 1000
  return {
    level: 1000,
    currentTierXp: 2500,
    tierMaxXp: 2500,
    percent: 100,
    tierName: 'Dieu Vivant de l’Anatomopathologie',
    tierBadge: '👑 Légende Absolue',
    nextTierInfo: 'Niveau Maximum Atteint'
  };
}

function calculateCreatorLevel(creatorXp) {
  return { level: 1, currentTierXp: 0, tierMaxXp: 20, percent: 0, tierName: 'Banque' };
}

function getCreatorStats() {
  return {
    createdQuestions: (state.questions || []).length,
    extremeQuestions: (state.questions || []).filter(q => q.difficulty === 'extreme').length,
    creatorXp: 0,
    level: 1,
    currentTierXp: 0,
    tierMaxXp: 20,
    percent: 0,
    tierName: 'Banque'
  };
}

const _checkedStreakTodayForUser = {};

function checkDailyStreak() {
  if (!state.currentUser) return;
  const email = getCurrentUserEmail();
  if (!email) return;

  const today = getLocalDateString();

  // Guard 1 : Ne vérifier qu'une seule fois par jour pour ce compte dans cette session
  if (_checkedStreakTodayForUser[email] === today) {
    return;
  }

  // Guard 2 : Vérifier la dernière date enregistrée
  const keyActive = 'pathosorus_last_active_' + email;
  let rawLast = (state.stats && state.stats.lastActiveDate) || localStorage.getItem(keyActive) || '';
  let lastActive = rawLast ? rawLast.split('T')[0] : '';

  // Récupération de l'activité réelle via les questions si lastActive est absent ou antérieur à aujourd'hui
  if (!lastActive || lastActive < today) {
    let mostRecentActivityDate = '';
    const progressList = Object.values(state.userProgress || {});
    for (const up of progressList) {
      if (up && up.stats) {
        const d = up.stats.lastCorrectDate || up.stats.lastReviewed || up.stats.lastFailedDate;
        if (d) {
          const dStr = String(d).slice(0, 10);
          if (dStr <= today && dStr > mostRecentActivityDate) {
            mostRecentActivityDate = dStr;
          }
        }
      }
    }
    if (mostRecentActivityDate && (!lastActive || mostRecentActivityDate > lastActive)) {
      lastActive = mostRecentActivityDate;
    }
  }

  // Cas explicite des confrères actifs (Dr Pierre-Alain Doreau & Dr Samy Belhadef) : connexion effective hier
  if ((email === 'padoreau85@gmail.com' || email === 'belhadef.samy@gmail.com') && (!state.stats.streak || state.stats.streak < 2)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    if (!lastActive || lastActive === yesterdayStr) {
      lastActive = yesterdayStr;
    }
  }

  // Si c'est déjà aujourd'hui, marquer la session et quitter immédiatement sans toucher au streak
  if (lastActive === today) {
    _checkedStreakTodayForUser[email] = today;
    if (state.stats) state.stats.lastActiveDate = today;
    localStorage.setItem(keyActive, today);
    return;
  }

  // Si premier lancement / pas d'historique connu : initialiser à aujourd'hui SANS incrémenter
  if (!lastActive) {
    _checkedStreakTodayForUser[email] = today;
    if (state.stats) {
      state.stats.lastActiveDate = today;
      state.stats.streak = Math.max(1, state.stats.streak || 1);
    }
    localStorage.setItem(keyActive, today);
    saveStats();
    updateTopBar();
    return;
  }

  const [ly, lm, ld] = lastActive.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const dLast = new Date(ly, lm - 1, ld);
  const dToday = new Date(ty, tm - 1, td);
  const diffTime = dToday.getTime() - dLast.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Marquer immédiatement que c'est traité aujourd'hui pour ne jamais rejouer dans cette session
  _checkedStreakTodayForUser[email] = today;
  localStorage.setItem(keyActive, today);
  if (state.stats) state.stats.lastActiveDate = today;

  if (diffDays <= 0) {
    return;
  }

  if (diffDays === 1) {
    state.stats.streak = (state.stats.streak || 1) + 1;
    state.stats.xp = (state.stats.xp || 0) + 10;
    showRewardToast(`🔥 Connexion consécutive : ${state.stats.streak} jours actifs (+10 XP) !`, 'flame');
    saveStats();
    updateTopBar();
  } else if (diffDays > 1) {
    state.stats.streak = 1;
    saveStats();
    updateTopBar();
  }
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
    showRewardToast(`Catégorie terminée : "${category}" (+5 XP Bonus permanent) !`, 'check-circle');
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
  { id: 'extreme_first', category: 'extreme', icon: 'help-circle', name: 'Sherlock des Lames', description: 'Résoudre avec succès une énigme diagnostique de difficulté Extrême (+100 XP)', tier: 'gold' }
];

// --- MOTEUR D'ÉVALUATION DYNAMIQUE DES BADGES INDÉPENDANTS & PERMANENTS ---
function getBadgesStatus() {
  if (!state.stats.badgeHistory) state.stats.badgeHistory = {};
  if (!state.stats.unlockedBadges) state.stats.unlockedBadges = {};

  // Nettoyage rétroactif des anciens trophées de rédaction obsolètes
  ['creator_1', 'creator_10', 'creator_50', 'creator_extreme'].forEach(oldId => {
    delete state.stats.unlockedBadges[oldId];
    delete state.stats.badgeHistory[oldId];
  });

  const playerLvl = calculatePlayerLevel(state.stats.xp || 0).level;
  const streak = state.stats.streak || 1;

  const results = [];

  // 1. Évaluation des badges statiques (Niveaux, Séries, Cas Extrêmes)
  STATIC_BADGES_DEFINITIONS.forEach(b => {
    let isNowMet = false;
    let progressPercent = 0;
    let progressText = '';
    let missingCount = 0;

    if (b.category === 'streak') {
      isNowMet = streak >= b.target;
      progressPercent = Math.min(100, Math.round((streak / b.target) * 100));
      progressText = `${streak} / ${b.target} jours`;
      missingCount = Math.max(0, b.target - streak);
    } else if (b.category === 'level') {
      isNowMet = playerLvl >= b.targetLevel;
      progressPercent = Math.min(100, Math.round((playerLvl / b.targetLevel) * 100));
      progressText = `Niveau ${playerLvl} / ${b.targetLevel}`;
      missingCount = Math.max(0, b.targetLevel - playerLvl);
    } else if (b.id === 'patho_phyllode_3') {
      const correctPhyllodes = (state.questions || []).filter(q => (q.entity || '').toLowerCase().includes('phyllode') && isQuestionTrophyQualified(q)).length;
      isNowMet = correctPhyllodes >= 3;
      progressPercent = Math.min(100, Math.round((correctPhyllodes / 3) * 100));
      progressText = `${correctPhyllodes} / 3 questions`;
      missingCount = Math.max(0, 3 - correctPhyllodes);
    } else if (b.id === 'patho_phyllode_filou') {
      const phyllodeQuestions = (state.questions || []).filter(q => (q.entity || '').toLowerCase().includes('phyllode'));
      const totalPhyllodes = phyllodeQuestions.length;
      const correctPhyllodes = phyllodeQuestions.filter(q => isQuestionTrophyQualified(q)).length;
      const targetCount = Math.max(1, Math.ceil(totalPhyllodes * 0.8));
      isNowMet = totalPhyllodes > 0 && correctPhyllodes >= targetCount;
      progressPercent = totalPhyllodes > 0 ? Math.min(100, Math.round((correctPhyllodes / targetCount) * 100)) : 0;
      progressText = `${correctPhyllodes} / ${targetCount} réussies (80%)`;
      missingCount = Math.max(0, targetCount - correctPhyllodes);
    } else if (b.id === 'patho_colon_parasite') {
      const parasiteQuestions = (state.questions || []).filter(q => {
        const text = `${q.organ} ${q.category} ${q.entity} ${q.question} ${(q.tags || []).join(' ')}`.toLowerCase();
        return text.includes('parasit') || text.includes('amibe') || text.includes('oxyur');
      });
      const totalP = parasiteQuestions.length;
      const correctP = parasiteQuestions.filter(q => isQuestionTrophyQualified(q)).length;
      isNowMet = totalP > 0 && correctP >= totalP;
      progressPercent = totalP > 0 ? Math.min(100, Math.round((correctP / totalP) * 100)) : 0;
      progressText = `${correctP} / ${totalP || 1} questions`;
      missingCount = Math.max(0, totalP - correctP);
    } else if (b.category === 'extreme') {
      const solvedExtreme = (state.questions || []).filter(q => q.difficulty === 'extreme' && isQuestionTrophyQualified(q)).length;
      isNowMet = solvedExtreme >= 1;
      progressPercent = isNowMet ? 100 : 0;
      progressText = isNowMet ? '1 / 1 résolue' : '0 / 1 résolue';
      missingCount = isNowMet ? 0 : 1;
    }

    const isUnlockedInStats = !!(state.stats.unlockedBadges && state.stats.unlockedBadges[b.id]);
    const wasUnlocked = isUnlockedInStats || !!(state.stats.badgeHistory && state.stats.badgeHistory[b.id] && state.stats.badgeHistory[b.id].unlocked);
    const isUnlocked = wasUnlocked || isNowMet;
    const status = isUnlocked ? 'unlocked' : 'locked';

    if (isUnlocked && !isUnlockedInStats) {
      if (!state.stats.unlockedBadges) state.stats.unlockedBadges = {};
      state.stats.unlockedBadges[b.id] = Date.now();
    }

    const displayName = (state.stats && state.stats.trophyCustomNames && state.stats.trophyCustomNames[b.id]) || b.name;
    results.push({
      ...b,
      name: displayName,
      status,
      progressPercent: isUnlocked ? 100 : progressPercent,
      progressText: isUnlocked ? '🏆 Débloqué' : progressText,
      missingCount: isUnlocked ? 0 : missingCount
    });
  });

  // 2. Évaluation des 5 trophées standards par groupe d'organe (10%, 25%, 50%, 80%, 100%)
  const organs = new Set();
  (state.questions || []).forEach(q => { if (q && q.organ) organs.add(q.organ.trim()); });
  (state.cases || []).forEach(c => { if (c && c.organ) organs.add(c.organ.trim()); });

  const sortedOrgans = Array.from(organs).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  sortedOrgans.forEach(org => {
    const orgQuestions = (state.questions || []).filter(q => q && (q.organ || "Autre").trim().toLowerCase() === org.toLowerCase());
    const totalInOrg = orgQuestions.length;
    if (totalInOrg === 0) return;

    // Seules les questions qualifiées (réussies sans échec immédiat ou après 24h si ratées) comptent pour le trophée
    const qualifiedInOrg = orgQuestions.filter(q => isQuestionTrophyQualified(q)).length;

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
      const isNowMet = qualifiedInOrg >= targetCount;
      const isUnlockedInStats = !!(state.stats.unlockedBadges && state.stats.unlockedBadges[badgeId]);
      const wasUnlocked = isUnlockedInStats || !!(state.stats.badgeHistory && state.stats.badgeHistory[badgeId] && state.stats.badgeHistory[badgeId].unlocked);

      // Attribution indépendante et permanente : une fois obtenu, le trophée reste acquis à vie
      const isUnlocked = wasUnlocked || isNowMet;
      const status = isUnlocked ? 'unlocked' : 'locked';

      if (isUnlocked && !isUnlockedInStats) {
        if (!state.stats.unlockedBadges) state.stats.unlockedBadges = {};
        state.stats.unlockedBadges[badgeId] = Date.now();
      }

      const progressPercent = isUnlocked ? 100 : Math.min(100, Math.round((qualifiedInOrg / targetCount) * 100));
      const progressText = isUnlocked ? '🏆 Débloqué' : `${qualifiedInOrg} / ${targetCount} Q (${t.pct}%)`;
      const missingCount = isUnlocked ? 0 : Math.max(0, targetCount - qualifiedInOrg);

      const defaultLabel = t.label;
      const displayName = (state.stats && state.stats.trophyCustomNames && state.stats.trophyCustomNames[badgeId]) || defaultLabel;

      results.push({
        id: badgeId,
        category: 'organ',
        organ: org,
        icon: t.pct === 100 ? 'crown' : (t.pct >= 80 ? 'shield-check' : 'folder'),
        name: displayName,
        description: `Réussir au moins ${t.pct}% des questions de la rubrique ${org} (${targetCount} Q requises)`,
        tier: t.tier,
        status,
        progressPercent,
        progressText,
        missingCount
      });
    });
  });

  // 3. Évaluation des trophées personnalisés créés par les rédacteurs (ciblage par Tag, Organe, etc.)
  (state.customBadges || []).forEach(b => {
    let isNowMet = false;
    let progressPercent = 0;
    let progressText = '';
    let missingCount = 0;

    const isUnlockedInStats = !!(state.stats.unlockedBadges && state.stats.unlockedBadges[b.id]);
    const wasUnlocked = isUnlockedInStats || !!(state.stats.badgeHistory && state.stats.badgeHistory[b.id] && state.stats.badgeHistory[b.id].unlocked);

    if (b.conditionType === 'tag_mastery') {
      const cleanTag = (b.targetTag || b.targetOrgan || '').trim().toLowerCase().replace(/^#/, '');
      const tagQuestions = (state.questions || []).filter(q => 
        Array.isArray(q.tags) && q.tags.some(t => String(t).trim().toLowerCase().replace(/^#/, '') === cleanTag)
      );
      const totalInTag = tagQuestions.length;
      const targetCount = b.targetCount || Math.max(1, totalInTag);
      const qualifiedWithTag = tagQuestions.filter(q => isQuestionTrophyQualified(q)).length;
      isNowMet = targetCount > 0 && qualifiedWithTag >= targetCount;
      progressPercent = targetCount > 0 ? Math.min(100, Math.round((qualifiedWithTag / targetCount) * 100)) : 0;
      progressText = `${qualifiedWithTag} / ${targetCount} réussies (#${b.targetTag || cleanTag})`;
      missingCount = Math.max(0, targetCount - qualifiedWithTag);
    } else if (b.conditionType === 'organ_mastery') {
      const orgQuestions = (state.questions || []).filter(q => (q.organ || '').toLowerCase() === (b.targetOrgan || '').toLowerCase());
      const totalInOrg = orgQuestions.length;
      // Pourcentage de maîtrise requis (ex: 50% = moitié des questions)
      const pct = b.targetPercent || (b.targetCount && b.targetCount <= 100 && b.targetCount >= 5 ? b.targetCount : null);
      const targetCount = pct ? Math.max(1, Math.ceil((pct / 100) * totalInOrg)) : (b.targetCount || Math.max(1, totalInOrg));
      const qualifiedInOrg = orgQuestions.filter(q => isQuestionTrophyQualified(q)).length;
      isNowMet = totalInOrg > 0 && qualifiedInOrg >= targetCount;
      progressPercent = totalInOrg > 0 ? Math.min(100, Math.round((qualifiedInOrg / targetCount) * 100)) : 0;
      progressText = pct 
        ? `${qualifiedInOrg} / ${targetCount} réussies (${pct}% de ${b.targetOrgan})`
        : `${qualifiedInOrg} / ${targetCount} réussies (${b.targetOrgan})`;
      missingCount = Math.max(0, targetCount - qualifiedInOrg);
    } else if (b.conditionType === 'question_count') {
      const qualifiedTotal = (state.questions || []).filter(q => isQuestionTrophyQualified(q)).length;
      const target = b.targetCount || 10;
      isNowMet = qualifiedTotal >= target;
      progressPercent = Math.min(100, Math.round((qualifiedTotal / target) * 100));
      progressText = `${qualifiedTotal} / ${target} réussies`;
      missingCount = Math.max(0, target - qualifiedTotal);
    } else if (b.conditionType === 'streak') {
      const target = b.targetCount || 3;
      isNowMet = streak >= target;
      progressPercent = Math.min(100, Math.round((streak / target) * 100));
      progressText = `${streak} / ${target} jours`;
      missingCount = Math.max(0, target - streak);
    } else {
      isNowMet = wasUnlocked;
      progressPercent = wasUnlocked ? 100 : 0;
      progressText = wasUnlocked ? 'Défi accompli !' : 'Défi d\'honneur';
      missingCount = wasUnlocked ? 0 : 1;
    }

    const isUnlocked = wasUnlocked || isNowMet;
    const status = isUnlocked ? 'unlocked' : 'locked';

    if (isUnlocked && !isUnlockedInStats) {
      if (!state.stats.unlockedBadges) state.stats.unlockedBadges = {};
      state.stats.unlockedBadges[b.id] = Date.now();
    }

    const displayName = (state.stats && state.stats.trophyCustomNames && state.stats.trophyCustomNames[b.id]) || b.name;
    results.push({
      ...b,
      name: displayName,
      isCustom: true,
      organ: b.targetOrgan,
      status,
      progressPercent: isUnlocked ? 100 : progressPercent,
      progressText: isUnlocked ? '🏆 Débloqué' : progressText,
      missingCount: isUnlocked ? 0 : missingCount
    });
  });

  return results;
}

function getContestedBadgesCount() {
  return 0; // Système contesté désactivé : les trophées restent définitivement acquis à vie
}

async function checkAndUnlockBadges() {
  const currentEmail = getCurrentUserEmail();
  if (!currentEmail || !state.currentUser) return;

  const badges = getBadgesStatus();
  let newlyUnlocked = false;
  const allUnlockedRows = [];

  for (const b of badges) {
    if (b.status === 'unlocked') {
      if (!state.stats.unlockedBadges) state.stats.unlockedBadges = {};
      if (!state.stats.unlockedBadges[b.id]) {
        state.stats.unlockedBadges[b.id] = Date.now();
        if (!state.stats.badgeHistory) state.stats.badgeHistory = {};
        state.stats.badgeHistory[b.id] = { unlocked: true, unlockedAt: Date.now() };
        newlyUnlocked = true;
        showRewardToast(`🏆 Trophée d'Honneur Débloqué : "${b.name}" !`, 'award');
      }

      const unlockedTimestamp = state.stats.unlockedBadges[b.id];
      allUnlockedRows.push({
        user_email: currentEmail.toLowerCase().trim(),
        badge_id: b.id,
        badge_name: b.name,
        category: b.category || 'organ',
        unlocked_at: new Date(typeof unlockedTimestamp === 'number' ? unlockedTimestamp : Date.now()).toISOString()
      });
    }
  }

  // Toujours synchroniser l'ensemble des trophées débloqués dans la table SQL public.user_trophies
  if (supabaseClient && allUnlockedRows.length > 0) {
    try {
      await supabaseClient.from('user_trophies').upsert(allUnlockedRows, { onConflict: 'user_email,badge_id' });
    } catch(e) {}
  }

  if (newlyUnlocked) {
    saveStats();
  }
}

// --- VUE PALMARÈS & TROPHÉES (VIEW-TROPHIES) ---
function renderTrophiesView() {
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

  // 2. Rendu Carte Rédacteur / Créateur (remplit la boîte de droite)
  const creatorCard = document.getElementById('trophies-creator-card');
  if (creatorCard) {
    const totalQ = (state.questions || []).length;
    const totalC = (state.cases || []).length;
    const isMaster = (state.currentUser && state.currentUser.email === 'padoreau85@gmail.com');

    creatorCard.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3.5">
          <div class="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center font-black text-xl shadow-inner">
            <i data-lucide="edit-3" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                ${isMaster ? '👑 Maître Rédacteur' : '✍️ Créateur'}
              </span>
              <span class="text-xs text-slate-400 font-mono">Banque Partagée</span>
            </div>
            <h2 class="text-lg font-black text-white mt-0.5 tracking-tight">Atelier de Rédaction</h2>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xl font-black text-white font-mono">${totalQ + totalC}</span>
          <span class="text-xs text-teal-400 font-bold block">Fiches en Banque</span>
        </div>
      </div>

      <div class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Contribution à la Banque Collective</span>
          <span class="font-mono text-teal-300 font-bold">${totalQ} Q • ${totalC} Cas DP</span>
        </div>
        <div class="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shadow-inner p-0.5">
          <div class="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500" style="width: 100%;"></div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
        <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs font-bold text-teal-400 font-mono block">${totalQ}</span>
          <span class="text-[10px] text-slate-400">Questions</span>
        </div>
        <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs font-bold text-indigo-400 font-mono block">${totalC}</span>
          <span class="text-[10px] text-slate-400">Cas DP</span>
        </div>
        <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs font-bold text-amber-400 font-mono block">${(state.questions || []).filter(q => isSlideQuestion(q)).length}</span>
          <span class="text-[10px] text-slate-400">🔬 Lames</span>
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

  // Sous-onglet actif (Trophées ou Classement)
  if (state.trophiesSubtab === 'leaderboard') {
    const gallery = document.getElementById('trophies-gallery-content');
    const leaderboard = document.getElementById('trophies-leaderboard-container');
    if (gallery) gallery.classList.add('hidden');
    if (leaderboard) {
      leaderboard.classList.remove('hidden');
      renderLeaderboard();
    }
  } else {
    const gallery = document.getElementById('trophies-gallery-content');
    const leaderboard = document.getElementById('trophies-leaderboard-container');
    if (gallery) gallery.classList.remove('hidden');
    if (leaderboard) leaderboard.classList.add('hidden');
    renderTrophiesGrid();
  }

  if (window.lucide) lucide.createIcons();
}

function switchTrophiesSubtab(subtab = 'trophies') {
  state.trophiesSubtab = subtab;
  const btnTrophies = document.getElementById('btn-subtab-trophies');
  const btnLeaderboard = document.getElementById('btn-subtab-leaderboard');
  const gallery = document.getElementById('trophies-gallery-content');
  const leaderboard = document.getElementById('trophies-leaderboard-container');

  if (subtab === 'leaderboard') {
    if (btnTrophies) {
      btnTrophies.className = "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 bg-slate-900 text-slate-400 hover:text-white border border-slate-800";
    }
    if (btnLeaderboard) {
      btnLeaderboard.className = "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 bg-indigo-600 text-white shadow-sm shadow-indigo-600/30";
    }
    if (gallery) gallery.classList.add('hidden');
    if (leaderboard) {
      leaderboard.classList.remove('hidden');
      renderLeaderboard();
    }
  } else {
    if (btnTrophies) {
      btnTrophies.className = "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 bg-amber-500 text-slate-950 shadow-sm";
    }
    if (btnLeaderboard) {
      btnLeaderboard.className = "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 bg-slate-900 text-slate-400 hover:text-white border border-slate-800";
    }
    if (gallery) gallery.classList.remove('hidden');
    if (leaderboard) leaderboard.classList.add('hidden');
    renderTrophiesView();
  }
}
window.switchTrophiesSubtab = switchTrophiesSubtab;

function sortLeaderboardAccounts(accounts, sort) {
  const list = [...(accounts || [])];
  if (sort === 'correct') {
    list.sort((a, b) => (b.totalCorrect || 0) - (a.totalCorrect || 0) || (b.xp || 0) - (a.xp || 0));
  } else if (sort === 'streak') {
    list.sort((a, b) => (b.streak || 0) - (a.streak || 0) || (b.xp || 0) - (a.xp || 0));
  } else {
    // 'xp' par défaut
    list.sort((a, b) => (b.xp || 0) - (a.xp || 0) || (b.totalCorrect || 0) - (a.totalCorrect || 0));
  }
  return list;
}

function updateLeaderboardSortButtons(currentSort) {
  const sorts = ['xp', 'correct', 'streak'];
  sorts.forEach(s => {
    const btn = document.getElementById(`btn-lb-sort-${s}`);
    if (btn) {
      if (s === currentSort) {
        btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50";
      } else {
        btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition bg-slate-950 text-slate-400 hover:text-white border border-slate-800";
      }
    }
  });
}

function setLeaderboardSort(sort) {
  state.leaderboardSortBy = sort;
  updateLeaderboardSortButtons(sort);

  if (state.lastLeaderboardAccounts && state.lastLeaderboardAccounts.length > 0) {
    const sorted = sortLeaderboardAccounts(state.lastLeaderboardAccounts, sort);
    renderLeaderboardBody(sorted, sort);
  } else {
    renderLeaderboard(true);
  }
}
window.setLeaderboardSort = setLeaderboardSort;

async function refreshLeaderboard() {
  const icon = document.getElementById('lb-refresh-icon');
  if (icon) icon.classList.add('animate-spin');
  try {
    await renderLeaderboard(true);
    showToast("Classement actualisé en direct !", "success");
  } catch (e) {
    console.warn("Erreur actualisation classement:", e);
  } finally {
    if (icon) icon.classList.remove('animate-spin');
  }
}
window.refreshLeaderboard = refreshLeaderboard;

function getLeadBadge(valA, valB, nameA = 'Dr A', nameB = 'Dr B') {
  if (valA > valB) {
    return {
      text: `👑 ${nameA} (+${valA - valB})`,
      cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    };
  } else if (valB > valA) {
    return {
      text: `👑 ${nameB} (+${valB - valA})`,
      cls: 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
    };
  }
  return {
    text: '🤝 Égalité',
    cls: 'bg-slate-800 text-slate-400 border border-slate-700'
  };
}

function setDuelOpponent(opponentEmail) {
  state.duelOpponentEmail = opponentEmail ? opponentEmail.trim().toLowerCase() : null;
  if (state.lastLeaderboardAccounts) {
    const currentSort = state.leaderboardSortBy || 'xp';
    const sorted = sortLeaderboardAccounts(state.lastLeaderboardAccounts, currentSort);
    renderLeaderboardBody(sorted, currentSort);
  }
}
window.setDuelOpponent = setDuelOpponent;

function renderLeaderboardBody(list, currentSort) {
  const bodyEl = document.getElementById('leaderboard-body');
  if (!bodyEl) return;
  if (!Array.isArray(list) || list.length === 0) return;

  // 1. Détection dynamique de Joueur A (Vous / Joueur connecté ou 1er du classement)
  const currentEmail = (state.currentUser && state.currentUser.email) ? state.currentUser.email.trim().toLowerCase() : null;
  let playerA = null;
  if (currentEmail) {
    playerA = list.find(a => a.email === currentEmail);
  }
  if (!playerA) {
    playerA = list[0];
  }

  // Candidats possibles pour Joueur B (tous les confrères sauf Joueur A)
  const availableOpponents = list.filter(a => a.email !== playerA.email);

  // Joueur B : sélectionné par l'utilisateur OU Rival direct par défaut
  let playerB = null;
  if (state.duelOpponentEmail && availableOpponents.some(a => a.email === state.duelOpponentEmail)) {
    playerB = availableOpponents.find(a => a.email === state.duelOpponentEmail);
  } else {
    // Si Joueur A est 1er, le rival par défaut est le 2e.
    // Si Joueur A n'est pas 1er, le rival par défaut est le confrère immédiatement au-dessus de lui !
    const rankA = list.findIndex(a => a.email === playerA.email);
    if (rankA > 0) {
      playerB = list[rankA - 1];
    } else {
      playerB = availableOpponents[0] || null;
    }
  }

  // Fallback sécurisé
  if (!playerB) {
    playerB = {
      name: (playerA.email === 'belhadef.samy@gmail.com') ? 'Dr Pierre-Alain Doreau' : 'Dr Samy Belhadef',
      email: (playerA.email === 'belhadef.samy@gmail.com') ? 'padoreau85@gmail.com' : 'belhadef.samy@gmail.com',
      xp: 0,
      totalCorrect: 0,
      unlockedBadgesCount: 0,
      createdQuestions: 0,
      streak: 1,
      level: 1,
      tierName: 'Interne Novice'
    };
  }

  const totalDuelXp = (playerA.xp || 0) + (playerB.xp || 0);
  let percentA = 50;
  let percentB = 50;
  if (totalDuelXp > 0) {
    percentA = Math.round(((playerA.xp || 0) / totalDuelXp) * 100);
    percentB = 100 - percentA;
  }

  const shortA = getQuestionAuthorDisplayName(playerA.email).short || playerA.name;
  const shortB = getQuestionAuthorDisplayName(playerB.email).short || playerB.name;

  const xpLead = getLeadBadge(playerA.xp || 0, playerB.xp || 0, shortA, shortB);
  const correctLead = getLeadBadge(playerA.totalCorrect || 0, playerB.totalCorrect || 0, shortA, shortB);
  const badgesLead = getLeadBadge(playerA.unlockedBadgesCount || 0, playerB.unlockedBadgesCount || 0, shortA, shortB);
  const createdLead = getLeadBadge(playerA.createdQuestions || 0, playerB.createdQuestions || 0, shortA, shortB);

  // Carte Duel Médical
  const headToHeadHtml = `
    <div class="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4 mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-lg shadow-sm">
            🔬
          </div>
          <div>
            <h3 class="font-black text-base text-white flex items-center space-x-2">
              <span>Duel Confraternel & Avancement Comparatif</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">Direct</span>
            </h3>
            <p class="text-xs text-slate-400">
              <span class="text-amber-300 font-semibold">${escapeHtml(playerA.name)}</span>
              <span class="text-slate-500 font-bold mx-1">vs</span>
              <span class="text-teal-300 font-semibold">${escapeHtml(playerB.name)}</span>
              • Points acquis aux révisions
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-3 self-end sm:self-auto">
          ${availableOpponents.length > 1 ? `
          <div class="flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-indigo-500/30 shadow-sm">
            <label for="select-duel-opponent" class="text-[11px] text-slate-400 font-medium">Adversaire :</label>
            <select id="select-duel-opponent" onchange="setDuelOpponent(this.value)" class="bg-transparent text-teal-300 text-xs font-bold focus:outline-none cursor-pointer">
              ${availableOpponents.map(op => `
                <option value="${escapeHtml(op.email)}" class="bg-slate-900 text-white" ${op.email === playerB.email ? 'selected' : ''}>
                  ${escapeHtml(op.name)} (${op.xp} XP)
                </option>
              `).join('')}
            </select>
          </div>
          ` : ''}
          <div class="text-right">
            <span class="text-[11px] font-semibold text-slate-400">Total duel :</span>
            <span class="text-xs font-mono font-black text-indigo-300 ml-1.5">${totalDuelXp} XP</span>
          </div>
        </div>
      </div>

      <!-- Barre de progression comparative -->
      <div class="space-y-1.5 mb-5">
        <div class="flex justify-between items-center text-xs font-mono">
          <span class="font-bold text-amber-300 flex items-center space-x-1.5 truncate">
            <span class="truncate">${escapeHtml(playerA.name)}</span>
            <span class="text-[10px] text-amber-400/90 font-black shrink-0">(${playerA.xp} XP - ${percentA}%)</span>
          </span>
          <span class="font-bold text-teal-300 flex items-center space-x-1.5 truncate justify-end">
            <span class="text-[10px] text-teal-400/90 font-black shrink-0">(${percentB}% - ${playerB.xp} XP)</span>
            <span class="truncate">${escapeHtml(playerB.name)}</span>
          </span>
        </div>
        <div class="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex p-0.5 border border-slate-800">
          <div class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-l-full transition-all duration-500" style="width: ${percentA}%"></div>
          <div class="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-r-full transition-all duration-500" style="width: ${percentB}%"></div>
        </div>
      </div>

      <!-- 4 Statistiques Clés en face à face -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <!-- XP Joueur -->
        <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-400 text-[11px]">
            <span class="font-semibold">⚡ XP Révisions</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded ${xpLead.cls}">${xpLead.text}</span>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-amber-400 font-mono font-black text-sm">${playerA.xp} <span class="text-[10px] text-slate-500 font-normal">${escapeHtml(shortA)}</span></div>
            <div class="text-slate-600 font-black text-xs">vs</div>
            <div class="text-teal-400 font-mono font-black text-sm">${playerB.xp} <span class="text-[10px] text-slate-500 font-normal">${escapeHtml(shortB)}</span></div>
          </div>
        </div>

        <!-- Questions Réussies -->
        <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-400 text-[11px]">
            <span class="font-semibold">✅ Réussies</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded ${correctLead.cls}">${correctLead.text}</span>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-amber-400 font-mono font-black text-sm">${playerA.totalCorrect || 0} <span class="text-[10px] text-slate-500 font-normal">${escapeHtml(shortA)}</span></div>
            <div class="text-slate-600 font-black text-xs">vs</div>
            <div class="text-teal-400 font-mono font-black text-sm">${playerB.totalCorrect || 0} <span class="text-[10px] text-slate-500 font-normal">${escapeHtml(shortB)}</span></div>
          </div>
        </div>

        <!-- Trophées d'Honneur -->
        <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-400 text-[11px]">
            <span class="font-semibold">🏆 Trophées</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded ${badgesLead.cls}">${badgesLead.text}</span>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-amber-400 font-mono font-black text-sm">${playerA.unlockedBadgesCount || 0} <span class="text-[10px] text-slate-500 font-normal">${escapeHtml(shortA)}</span></div>
            <div class="text-slate-600 font-black text-xs">vs</div>
            <div class="text-teal-400 font-mono font-black text-sm">${playerB.unlockedBadgesCount || 0} <span class="text-[10px] text-slate-500 font-normal">${escapeHtml(shortB)}</span></div>
          </div>
        </div>

        <!-- Questions Rédigées -->
        <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-400 text-[11px]">
            <span class="font-semibold">✍️ Rédaction</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded ${createdLead.cls}">${createdLead.text}</span>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-amber-400 font-mono font-black text-sm">${playerA.createdQuestions || 0} <span class="text-[10px] text-slate-500 font-normal">${escapeHtml(shortA)}</span></div>
            <div class="text-slate-600 font-black text-xs">vs</div>
            <div class="text-teal-400 font-mono font-black text-sm">${playerB.createdQuestions || 0} <span class="text-[10px] text-slate-500 font-normal">${escapeHtml(shortB)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 2. Podium (Top 3)
  const top1 = list[0];
  const top2 = list[1];
  const top3 = list[2];

  let podiumHtml = '';
  if (list.length >= 2) {
    podiumHtml = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
        <!-- 2e Place -->
        ${top2 ? `
        <div class="order-2 md:order-1 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/60 rounded-2xl p-5 text-center shadow-lg relative flex flex-col justify-between">
          <div class="w-10 h-10 mx-auto -mt-8 rounded-full bg-slate-800 border-2 border-slate-400 text-slate-300 flex items-center justify-center font-bold text-base shadow">
            🥈
          </div>
          <div class="mt-3 space-y-1">
            <h4 class="font-extrabold text-sm text-white truncate">${escapeHtml(top2.name)}</h4>
            <p class="text-[11px] text-slate-400 font-mono truncate">${escapeHtml(top2.email)}</p>
            <div class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 mt-1">
              Nv ${top2.level} • ${escapeHtml(top2.tierName)}
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-around text-xs">
            <div>
              <span class="font-black text-white font-mono block">${top2.xp}</span>
              <span class="text-[10px] text-slate-500">XP</span>
            </div>
            <div>
              <span class="font-black text-amber-400 font-mono block">${top2.unlockedBadgesCount || 0}</span>
              <span class="text-[10px] text-slate-500">Trophées</span>
            </div>
            <div>
              <span class="font-black text-teal-300 font-mono block">${top2.totalCorrect || 0}</span>
              <span class="text-[10px] text-slate-500">Réussies</span>
            </div>
            <div>
              <span class="font-black text-amber-300 font-mono block">${top2.streak}j</span>
              <span class="text-[10px] text-slate-500">Série</span>
            </div>
          </div>
        </div>
        ` : '<div></div>'}

        <!-- 1ère Place (Leader) -->
        ${top1 ? `
        <div class="order-1 md:order-2 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-2xl p-6 text-center shadow-xl relative -mt-3 flex flex-col justify-between">
          <div class="w-12 h-12 mx-auto -mt-9 rounded-full bg-amber-500 text-slate-950 border-2 border-amber-300 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30">
            👑
          </div>
          <div class="mt-3 space-y-1">
            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">1er de Promotion</span>
            <h4 class="font-black text-base text-white truncate mt-1">${escapeHtml(top1.name)}</h4>
            <p class="text-xs text-amber-200/80 font-mono truncate">${escapeHtml(top1.email)}</p>
            <div class="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 mt-1">
              Nv ${top1.level} • ${escapeHtml(top1.tierName)}
            </div>
          </div>
          <div class="mt-5 pt-3 border-t border-amber-500/20 flex items-center justify-around text-xs">
            <div>
              <span class="font-black text-lg text-amber-400 font-mono block">${top1.xp}</span>
              <span class="text-[10px] text-amber-200/60 font-semibold">XP Totale</span>
            </div>
            <div>
              <span class="font-black text-lg text-amber-300 font-mono block">${top1.unlockedBadgesCount || 0}</span>
              <span class="text-[10px] text-amber-200/60 font-semibold">Trophées</span>
            </div>
            <div>
              <span class="font-black text-lg text-teal-300 font-mono block">${top1.totalCorrect || 0}</span>
              <span class="text-[10px] text-slate-400 font-semibold">Réussies</span>
            </div>
            <div>
              <span class="font-black text-lg text-amber-300 font-mono block">${top1.streak}j</span>
              <span class="text-[10px] text-slate-400 font-semibold">Série</span>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- 3e Place -->
        ${top3 ? `
        <div class="order-3 md:order-3 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-700/40 rounded-2xl p-5 text-center shadow-lg relative flex flex-col justify-between">
          <div class="w-10 h-10 mx-auto -mt-8 rounded-full bg-slate-800 border-2 border-amber-700 text-amber-600 flex items-center justify-center font-bold text-base shadow">
            🥉
          </div>
          <div class="mt-3 space-y-1">
            <h4 class="font-extrabold text-sm text-white truncate">${escapeHtml(top3.name)}</h4>
            <p class="text-[11px] text-slate-400 font-mono truncate">${escapeHtml(top3.email)}</p>
            <div class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 mt-1">
              Nv ${top3.level} • ${escapeHtml(top3.tierName)}
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-around text-xs">
            <div>
              <span class="font-black text-white font-mono block">${top3.xp}</span>
              <span class="text-[10px] text-slate-500">XP</span>
            </div>
            <div>
              <span class="font-black text-amber-400 font-mono block">${top3.unlockedBadgesCount || 0}</span>
              <span class="text-[10px] text-slate-500">Trophées</span>
            </div>
            <div>
              <span class="font-black text-teal-300 font-mono block">${top3.totalCorrect || 0}</span>
              <span class="text-[10px] text-slate-500">Réussies</span>
            </div>
            <div>
              <span class="font-black text-amber-400 font-mono block">${top3.streak}j</span>
              <span class="text-[10px] text-slate-500">Série</span>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  // 3. Tableau complet
  const tableRowsHtml = list.map((u, idx) => {
    const isSelf = !!u.isSelf;
    const rank = idx + 1;
    let medal = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `#${rank}`));
    const isCreatorRole = u.role === 'creator' || u.email === 'padoreau85@gmail.com' || u.email === 'belhadef.samy@gmail.com';
    const displayName = u.name || (u.email ? u.email.split('@')[0] : 'Confrère');
    const initial = (displayName.replace(/^Dr\s+/i, '').charAt(0) || 'P').toUpperCase();

    return `
      <tr class="border-b border-slate-800/80 ${isSelf ? 'bg-indigo-950/20 hover:bg-indigo-950/30 font-bold' : 'hover:bg-slate-900/60'} transition">
        <td class="py-3 px-3.5 text-center font-bold text-xs ${rank === 1 ? 'text-amber-400' : 'text-slate-400'}">
          ${medal}
        </td>
        <td class="py-3 px-3.5">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-xl ${isCreatorRole ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              ${escapeHtml(initial)}
            </div>
            <div class="min-w-0">
              <div class="text-xs font-bold text-white flex items-center space-x-1.5 truncate">
                <span class="truncate">${escapeHtml(displayName)}</span>
                ${isSelf ? '<span class="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">Vous</span>' : ''}
                ${u.email === 'padoreau85@gmail.com' ? '<span class="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">Master</span>' : ''}
              </div>
              <p class="text-[10px] text-slate-500 font-mono truncate">${escapeHtml(u.email || '')}</p>
            </div>
          </div>
        </td>
        <td class="py-3 px-3.5 text-xs text-slate-300">
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${isCreatorRole ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'bg-slate-800 text-slate-400'}">
            ${isCreatorRole ? '✍️ Rédacteur' : '📖 Lecteur'}
          </span>
        </td>
        <td class="py-3 px-3.5">
          <div class="text-xs font-extrabold text-white flex items-center space-x-1.5">
            <span class="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-mono text-[11px]">Nv ${u.level}</span>
            <span class="text-[11px] text-slate-400 truncate">${escapeHtml(u.tierName)}</span>
          </div>
        </td>
        <td class="py-3 px-3.5 text-right font-mono font-black text-xs text-white">
          ${u.xp} <span class="text-[10px] text-indigo-400 font-bold">XP</span>
        </td>
        <td class="py-3 px-3.5 text-center font-mono font-bold text-xs text-amber-400 cursor-pointer hover:underline" onclick="setLeaderboardSort('badges')">
          🏆 ${u.unlockedBadgesCount || 0}
        </td>
        <td class="py-3 px-3.5 text-center font-mono font-bold text-xs text-teal-300 cursor-pointer hover:underline" onclick="setLeaderboardSort('correct')">
          ✅ ${u.totalCorrect || 0}
        </td>
        <td class="py-3 px-3.5 text-center font-mono font-bold text-xs text-slate-300 cursor-pointer hover:underline" onclick="setLeaderboardSort('streak')">
          🔥 ${u.streak || 1}j
        </td>
      </tr>
    `;
  }).join('');

  bodyEl.innerHTML = `
    ${headToHeadHtml}

    ${podiumHtml}

    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th class="py-3 px-3.5 text-center w-12">#</th>
              <th class="py-3 px-3.5">Confrère</th>
              <th class="py-3 px-3.5">Rôle</th>
              <th class="py-3 px-3.5">Niveau Joueur</th>
              <th class="py-3 px-3.5 text-right cursor-pointer hover:text-white" onclick="setLeaderboardSort('xp')">XP Totale ↕</th>
              <th class="py-3 px-3.5 text-center cursor-pointer hover:text-white" onclick="setLeaderboardSort('badges')">Trophées ↕</th>
              <th class="py-3 px-3.5 text-center cursor-pointer hover:text-white" onclick="setLeaderboardSort('correct')">Questions Réussies ↕</th>
              <th class="py-3 px-3.5 text-center cursor-pointer hover:text-white" onclick="setLeaderboardSort('streak')">Série ↕</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function computeLeaderboardList(accountsMap) {
  const questionsByAuthor = {};
  (state.questions || []).forEach(q => {
    const aut = getQuestionAuthorEmail(q);
    questionsByAuthor[aut] = (questionsByAuthor[aut] || 0) + 1;
  });

  return Array.from(accountsMap.values()).map(acc => {
    const qCount = questionsByAuthor[acc.email] || 0;
    const lvlInfo = calculatePlayerLevel(acc.xp || 0);
    const docInfo = getQuestionAuthorDisplayName(acc.email);
    const dName = acc.name || docInfo.name;
    return {
      ...acc,
      name: dName,
      equippedTitle: acc.equippedTitle || '',
      createdQuestions: qCount,
      level: lvlInfo.level,
      tierName: lvlInfo.tierName,
      tierBadge: lvlInfo.tierBadge
    };
  });
}

async function renderLeaderboard(forceRefresh = false) {
  const container = document.getElementById('trophies-leaderboard-container');
  if (!container) return;

  const currentSort = state.leaderboardSortBy || 'xp';

  // Si le squelette de la vue n'est pas encore présent ou refresh forcé
  if (!document.getElementById('leaderboard-body') || forceRefresh) {
    container.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold shrink-0">
            <i data-lucide="trending-up" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-sm sm:text-base text-white">Classement Général & Duel Médical</h3>
            <p class="text-xs text-slate-400">Avancement individuel, révisions espacées et comparaisons directes en direct.</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button id="btn-lb-sort-xp" onclick="setLeaderboardSort('xp')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${currentSort === 'xp' ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}">🏆 Par XP Joueur</button>
            <button id="btn-lb-sort-correct" onclick="setLeaderboardSort('correct')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${currentSort === 'correct' ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}">✅ Par Réussites</button>
            <button id="btn-lb-sort-streak" onclick="setLeaderboardSort('streak')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${currentSort === 'streak' ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}">🔥 Par Série</button>
          </div>
          <button onclick="refreshLeaderboard()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm" title="Actualiser le classement depuis Supabase">
            <i id="lb-refresh-icon" data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Actualiser</span>
          </button>
        </div>
      </div>
      <div id="leaderboard-body" class="space-y-6"></div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  const accountsMap = new Map();

  // 1. Initialiser immédiatement avec les données locales de chaque confrère (0 ms de latence)
  const paKey = getUserStatsStorageKey('padoreau85@gmail.com');
  const samyKey = getUserStatsStorageKey('belhadef.samy@gmail.com');
  let paLocalStats = null;
  let samyLocalStats = null;
  try {
    const raw = localStorage.getItem(paKey);
    if (raw) paLocalStats = JSON.parse(raw);
  } catch(e) {}
  try {
    const raw = localStorage.getItem(samyKey);
    if (raw) samyLocalStats = JSON.parse(raw);
  } catch(e) {}

  accountsMap.set('padoreau85@gmail.com', {
    email: 'padoreau85@gmail.com',
    name: 'Dr Pierre-Alain Doreau',
    role: 'creator',
    xp: (paLocalStats && typeof paLocalStats.xp === 'number') ? paLocalStats.xp : 0,
    streak: (paLocalStats && typeof paLocalStats.streak === 'number') ? paLocalStats.streak : 1,
    totalCorrect: (paLocalStats && typeof paLocalStats.totalCorrect === 'number') ? paLocalStats.totalCorrect : 0,
    createdQuestions: 0,
    unlockedBadgesCount: (paLocalStats && paLocalStats.unlockedBadges) ? Object.keys(paLocalStats.unlockedBadges).length : 0
  });

  const samyXp = (samyLocalStats && typeof samyLocalStats.xp === 'number') ? samyLocalStats.xp : 0;
  const samyCorrect = (samyLocalStats && typeof samyLocalStats.totalCorrect === 'number') ? samyLocalStats.totalCorrect : 0;
  let samyBadges = (samyLocalStats && samyLocalStats.unlockedBadges) ? Object.keys(samyLocalStats.unlockedBadges).length : 0;
  if (samyBadges >= 40 && samyCorrect <= 10) {
    samyBadges = 6;
    if (samyLocalStats) {
      delete samyLocalStats.unlockedBadges;
    }
  }

  accountsMap.set('belhadef.samy@gmail.com', {
    email: 'belhadef.samy@gmail.com',
    name: 'Dr Samy Belhadef',
    role: 'creator',
    xp: samyXp,
    streak: (samyLocalStats && typeof samyLocalStats.streak === 'number' && samyLocalStats.streak >= 2) ? samyLocalStats.streak : 2,
    totalCorrect: samyCorrect,
    createdQuestions: 0,
    unlockedBadgesCount: samyBadges
  });

  // 2. Profils connus en local (collègues invités)
  try {
    const known = JSON.parse(localStorage.getItem('pathosorus_known_colleagues') || '[]');
    if (Array.isArray(known)) {
      known.forEach(c => {
        if (c && c.email) {
          const em = c.email.trim().toLowerCase();
          const docInfo = getQuestionAuthorDisplayName(em);
          if (!accountsMap.has(em)) {
            let colleagueLocalStats = null;
            try {
              const r = localStorage.getItem(getUserStatsStorageKey(em));
              if (r) colleagueLocalStats = JSON.parse(r);
            } catch(e) {}
            accountsMap.set(em, {
              email: em,
              name: c.name || docInfo.name,
              role: c.role || 'reader',
              xp: (colleagueLocalStats && typeof colleagueLocalStats.xp === 'number') ? colleagueLocalStats.xp : 0,
              streak: (colleagueLocalStats && typeof colleagueLocalStats.streak === 'number') ? colleagueLocalStats.streak : 1,
              totalCorrect: (colleagueLocalStats && typeof colleagueLocalStats.totalCorrect === 'number') ? colleagueLocalStats.totalCorrect : 0,
              createdQuestions: 0,
              unlockedBadgesCount: (colleagueLocalStats && colleagueLocalStats.unlockedBadges) ? Object.keys(colleagueLocalStats.unlockedBadges).length : 0
            });
          }
        }
      });
    }
  } catch (e) {}

  // 3. Injecter les données temps réel du compte connecté
  if (state.currentUser && state.currentUser.email) {
    const curEmail = state.currentUser.email.trim().toLowerCase();
    const docInfo = getQuestionAuthorDisplayName(curEmail);
    // Calcul direct des trophées réellement qualifiés en direct
    const myRealBadges = getBadgesStatus().filter(b => b.status === 'unlocked');
    const selfBadgesCount = Math.max(myRealBadges.length, (state.stats && state.stats.unlockedBadges) ? Object.keys(state.stats.unlockedBadges).length : 0);
    const existing = accountsMap.get(curEmail) || {};

    accountsMap.set(curEmail, {
      ...existing,
      email: curEmail,
      name: (accountsMap.get(curEmail)?.name) || docInfo.name,
      role: 'creator',
      xp: (typeof state.stats.xp === 'number') ? state.stats.xp : (existing.xp || 0),
      streak: (typeof state.stats.streak === 'number') ? state.stats.streak : (existing.streak || 1),
      totalCorrect: (typeof state.stats.totalCorrect === 'number') ? state.stats.totalCorrect : (existing.totalCorrect || 0),
      unlockedBadgesCount: selfBadgesCount,
      isSelf: true
    });
  }

  // 4. RENDU IMMÉDIAT (0 ms, AUCUN SPINNER BLOQUANT)
  const initialList = computeLeaderboardList(accountsMap);
  state.lastLeaderboardAccounts = initialList;
  const initialSorted = sortLeaderboardAccounts(initialList, currentSort);
  renderLeaderboardBody(initialSorted, currentSort);

  // 5. Synchronisation Cloud en tâche de fond (silencieuse, fluide et non-bloquante)
  (async () => {
    try {
      // 5A. Priorité absolue : Tables SQL dédiées public.user_stats & public.user_trophies
      if (supabaseClient) {
        try {
          const [dbStatsRes, dbTrophiesRes] = await Promise.all([
            supabaseClient.from('user_stats').select('*').order('xp', { ascending: false }),
            supabaseClient.from('user_trophies').select('user_email,badge_id')
          ]);

          const dbStats = dbStatsRes.data;
          const dbTrophies = dbTrophiesRes.data;

          const trophiesCountMap = new Map();
          if (dbTrophies && Array.isArray(dbTrophies)) {
            dbTrophies.forEach(t => {
              if (t && t.user_email) {
                const em = t.user_email.trim().toLowerCase();
                trophiesCountMap.set(em, (trophiesCountMap.get(em) || 0) + 1);
              }
            });
          }

          if (dbStats && Array.isArray(dbStats) && dbStats.length > 0) {
            let hasChanges = false;
            dbStats.forEach(row => {
              if (row && row.email) {
                const em = row.email.trim().toLowerCase();
                const existing = accountsMap.get(em) || {};
                const badgesMap = (row.unlocked_badges && typeof row.unlocked_badges === 'object') ? row.unlocked_badges : {};
                
                // Priorité au comptage de la table public.user_trophies
                let badgesCount = trophiesCountMap.has(em) 
                  ? trophiesCountMap.get(em) 
                  : Object.keys(badgesMap).length;

                // Si c'est le compte connecté, conserver le décompte temps réel exact calculé
                if (state.currentUser && state.currentUser.email && em === state.currentUser.email.trim().toLowerCase()) {
                  const liveUnlocked = getBadgesStatus().filter(b => b.status === 'unlocked').length;
                  badgesCount = Math.max(badgesCount, liveUnlocked);
                }

                // Assainissement strict pour Samy s'il était contaminé par l'ancien bug des 46 faux trophées
                if (em === 'belhadef.samy@gmail.com' && badgesCount >= 40 && (row.total_correct || 0) <= 10) {
                  badgesCount = trophiesCountMap.get(em) || 6;
                }

                const cleanObj = {
                  ...getDefaultStats(),
                  xp: typeof row.xp === 'number' ? row.xp : 0,
                  streak: typeof row.streak === 'number' ? row.streak : 1,
                  totalCorrect: typeof row.total_correct === 'number' ? row.total_correct : 0,
                  totalAnswered: typeof row.total_answered === 'number' ? row.total_answered : 0,
                  unlockedBadges: em === 'belhadef.samy@gmail.com' && Object.keys(badgesMap).length >= 40 && (row.total_correct || 0) <= 10 ? {} : badgesMap,
                  completedCategories: row.completed_categories || []
                };
                try {
                  localStorage.setItem(getUserStatsStorageKey(em), JSON.stringify(cleanObj));
                } catch(e) {}

                if (state.currentUser && state.currentUser.email && em === state.currentUser.email.trim().toLowerCase()) {
                  state.stats = {
                    ...state.stats,
                    ...cleanObj,
                    unlockedBadges: (state.stats && state.stats.unlockedBadges && Object.keys(state.stats.unlockedBadges).length > 0)
                      ? state.stats.unlockedBadges
                      : cleanObj.unlockedBadges
                  };
                  updateTopBar();
                }

                accountsMap.set(em, {
                  ...existing,
                  email: em,
                  name: row.name || existing.name || getQuestionAuthorDisplayName(em).name,
                  role: row.role || (em === 'padoreau85@gmail.com' || em === 'belhadef.samy@gmail.com' ? 'creator' : 'reader'),
                  xp: cleanObj.xp,
                  streak: cleanObj.streak,
                  totalCorrect: cleanObj.totalCorrect,
                  unlockedBadgesCount: badgesCount
                });
                hasChanges = true;
              }
            });

            if (hasChanges) {
              const updatedList = computeLeaderboardList(accountsMap);
              state.lastLeaderboardAccounts = updatedList;
              const updatedSorted = sortLeaderboardAccounts(updatedList, state.leaderboardSortBy || 'xp');
              renderLeaderboardBody(updatedSorted, state.leaderboardSortBy || 'xp');
              return; // Terminé, source de données SQL officielle chargée !
            }
          }
        } catch(e) {}
      }

      // 5B. Fallback sur custom_tags si user_stats pas encore disponible
      let allTags = [];
      if (supabaseClient) {
        try {
          const res = await supabaseClient.from('custom_tags').select('*');
          if (res && res.data && Array.isArray(res.data)) {
            allTags = res.data;
          }
        } catch(e) {}
      }
      if (!allTags || allTags.length === 0) {
        try {
          const { url, key } = getSupabaseCredentials();
          if (url && key) {
            const resp = await fetch(`${url}/rest/v1/custom_tags?select=*`, {
              headers: { apikey: key, Authorization: `Bearer ${key}` }
            });
            const json = await resp.json();
            if (Array.isArray(json)) allTags = json;
          }
        } catch(e) {}
      }

      if (Array.isArray(allTags) && allTags.length > 0) {
        let hasChanges = false;
        allTags.forEach(t => {
          if (t && t.name && t.name.startsWith('USTATS:')) {
            try {
              const parts = t.name.split(':', 2);
              const rawJson = t.name.substring(parts[0].length + parts[1].length + 2);
              const em = parts[1].trim().toLowerCase();
              const st = JSON.parse(rawJson);
              const existing = accountsMap.get(em) || {};
              const docInfo = getQuestionAuthorDisplayName(em);
              let tagBadgesCount = 0;
              if (st.unlockedBadges && typeof st.unlockedBadges === 'object') {
                tagBadgesCount = Object.keys(st.unlockedBadges).length;
              } else if (typeof st.unlockedBadgesCount === 'number') {
                tagBadgesCount = st.unlockedBadgesCount;
              }

              // Sauvegarder en cache local par profil
              try {
                localStorage.setItem(getUserStatsStorageKey(em), JSON.stringify(st));
              } catch(e) {}

              accountsMap.set(em, {
                ...existing,
                email: em,
                name: existing.name || docInfo.name,
                role: (em === 'padoreau85@gmail.com' || em === 'belhadef.samy@gmail.com') ? 'creator' : (existing.role || 'reader'),
                xp: (typeof st.xp === 'number') ? st.xp : (existing.xp || 0),
                streak: (typeof st.streak === 'number') ? st.streak : (existing.streak || 1),
                totalCorrect: (typeof st.totalCorrect === 'number') ? st.totalCorrect : (existing.totalCorrect || 0),
                unlockedBadgesCount: (typeof tagBadgesCount === 'number') ? tagBadgesCount : (existing.unlockedBadgesCount || 0)
              });
              hasChanges = true;
            } catch(e) {}
          }
        });

        if (hasChanges) {
          // Re-injecter la session connectée si présente
          if (state.currentUser && state.currentUser.email) {
            const curEmail = state.currentUser.email.trim().toLowerCase();
            const docInfo = getQuestionAuthorDisplayName(curEmail);
            const selfBadgesCount = (state.stats && state.stats.unlockedBadges) ? Object.keys(state.stats.unlockedBadges).length : 0;
            const existing = accountsMap.get(curEmail) || {};

            accountsMap.set(curEmail, {
              ...existing,
              email: curEmail,
              name: (accountsMap.get(curEmail)?.name) || docInfo.name,
              role: 'creator',
              xp: (typeof state.stats.xp === 'number') ? state.stats.xp : (existing.xp || 0),
              streak: (typeof state.stats.streak === 'number') ? state.stats.streak : (existing.streak || 1),
              totalCorrect: (typeof state.stats.totalCorrect === 'number') ? state.stats.totalCorrect : (existing.totalCorrect || 0),
              unlockedBadgesCount: selfBadgesCount,
              isSelf: true
            });
          }

          const updatedList = computeLeaderboardList(accountsMap);
          state.lastLeaderboardAccounts = updatedList;
          const updatedSorted = sortLeaderboardAccounts(updatedList, state.leaderboardSortBy || 'xp');
          renderLeaderboardBody(updatedSorted, state.leaderboardSortBy || 'xp');
        }
      }
    } catch(bgErr) {
      console.warn("Sync arrière-plan leaderboard:", bgErr);
    }
  })();
}
window.renderLeaderboard = renderLeaderboard;

function getTrophyPillar(b) {
  if (b.category === 'organ') return 'organ';
  if (b.category === 'custom') return 'custom';
  return 'progression';
}
window.getTrophyPillar = getTrophyPillar;

function setTrophyCategoryFilter(cat) {
  state.trophyCategoryFilter = cat;
  ['all', 'organ', 'custom', 'progression'].forEach(c => {
    const btn = document.getElementById(`btn-trophy-cat-${c}`);
    if (btn) {
      const isSel = (c === cat);
      if (isSel) {
        btn.className = "p-3.5 rounded-2xl border transition text-left flex items-center space-x-3 bg-slate-900 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30";
      } else {
        btn.className = "p-3.5 rounded-2xl border transition text-left flex items-center space-x-3 bg-slate-950/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100";
      }
    }
  });
  renderTrophiesGrid();
}
window.setTrophyCategoryFilter = setTrophyCategoryFilter;

function setTrophyFilter(filter) {
  state.trophyFilter = filter;
  ['all', 'unlocked', 'locked'].forEach(f => {
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
window.setTrophyFilter = setTrophyFilter;

function renderTrophiesGrid() {
  const grid = document.getElementById('trophies-grid');
  if (!grid) return;

  const allBadges = getBadgesStatus();

  // 1. Calcul dynamique des compteurs de chaque pilier thématique
  const counts = {
    all: { total: allBadges.length, unlocked: allBadges.filter(b => b.status === 'unlocked').length },
    organ: { total: 0, unlocked: 0 },
    custom: { total: 0, unlocked: 0 },
    progression: { total: 0, unlocked: 0 }
  };

  allBadges.forEach(b => {
    const p = getTrophyPillar(b);
    if (counts[p]) {
      counts[p].total += 1;
      if (b.status === 'unlocked') counts[p].unlocked += 1;
    }
  });

  ['all', 'organ', 'custom', 'progression'].forEach(c => {
    const el = document.getElementById(`trophy-cat-count-${c}`);
    if (el) {
      el.textContent = `${counts[c].unlocked} / ${counts[c].total} débloqués`;
    }
  });

  // 2. Filtrage combiné (Pilier thématique + Statut débloqué/verrouillé)
  const categoryFilter = state.trophyCategoryFilter || 'all';
  const statusFilter = state.trophyFilter || 'all';

  const filtered = allBadges.filter(b => {
    // Filtre thématique
    if (categoryFilter !== 'all') {
      const p = getTrophyPillar(b);
      if (p !== categoryFilter) return false;
    }
    // Filtre de statut
    if (statusFilter === 'unlocked') return b.status === 'unlocked';
    if (statusFilter === 'locked') return b.status === 'locked';
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
        <p class="text-xs">Aucun trophée ne correspond à cette combinaison de filtres.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(b => {
    const isUnlocked = b.status === 'unlocked';
    const pillar = getTrophyPillar(b);

    const cardBorder = isUnlocked
      ? 'border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 shadow-md shadow-amber-500/5'
      : 'border-slate-800 bg-slate-900/60 opacity-65 hover:opacity-95';

    const iconBg = isUnlocked
      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
      : 'bg-slate-800 text-slate-500';

    const statusBadge = isUnlocked
      ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">🏆 Débloqué</span>'
      : '<span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">🔒 À conquérir</span>';

    // Badge de pilier thématique
    let pillarBadge = '';
    if (pillar === 'organ') {
      const label = b.organ ? b.organ : 'Organes & Lésions';
      pillarBadge = `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/25 flex items-center space-x-1 shrink-0"><i data-lucide="microscope" class="w-3 h-3 text-rose-400"></i><span>${escapeHtml(label)}</span></span>`;
    } else if (pillar === 'custom') {
      const tagLabel = b.targetTag ? `#${b.targetTag}` : (b.targetOrgan ? b.targetOrgan : 'Défi Rédacteur');
      pillarBadge = `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/25 flex items-center space-x-1 shrink-0"><i data-lucide="tag" class="w-3 h-3 text-teal-400"></i><span>${escapeHtml(tagLabel)}</span></span>`;
    } else {
      const isStreak = (b.category === 'streak');
      pillarBadge = `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 flex items-center space-x-1 shrink-0"><i data-lucide="${isStreak ? 'flame' : 'award'}" class="w-3 h-3 text-indigo-400"></i><span>${isStreak ? 'Série de Jours' : 'Niveau Joueur'}</span></span>`;
    }

    const isCurrentTitle = (state.stats && (state.stats.equippedTitleBadgeId === b.id || (state.stats.equippedTitle && state.stats.equippedTitle === b.name)));

    return `
      <div class="rounded-2xl p-4 sm:p-5 border transition flex flex-col justify-between space-y-4 ${cardBorder}">
        <div class="space-y-3">
          
          <!-- En-tête de carte avec le Pilier thématique, Statut et Actions -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            ${pillarBadge}
            <div class="flex items-center space-x-1.5">
              ${statusBadge}
              ${isCreator() ? `
                <button onclick="${b.isCustom ? `openEditTrophyModal('${escapeJsString(b.id)}')` : `renameTrophyPrompt('${escapeJsString(b.id)}')`}" class="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition" title="Renommer ce trophée">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
              ${(b.isCustom && isAuthorizedToDelete()) ? `
                <button onclick="deleteCustomBadge('${escapeJsString(b.id)}')" class="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition" title="Supprimer ce trophée (Dr Doreau / Dr Belhadef)">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Icône & Distinction -->
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}">
              ${(b.icon && b.icon.length > 2) ? `<i data-lucide="${b.icon}" class="w-5 h-5"></i>` : `<span class="text-xl">${b.icon || '🏆'}</span>`}
            </div>
            <div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 block w-fit">🏆 Trophée d'Honneur (0 XP)</span>
            </div>
          </div>

          <div>
            <h4 class="font-extrabold text-sm text-white flex items-center space-x-1.5">
              <span>${escapeHtml(b.name)}</span>
              ${isCurrentTitle ? '<span class="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 shadow-sm shrink-0">👑 Titre Actif</span>' : ''}
            </h4>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">${escapeHtml(b.description)}</p>
            ${b.created_by ? `<div class="text-[10px] text-amber-400/80 mt-1.5 font-mono">👑 Créé par : ${escapeHtml(b.created_by)}</div>` : ''}
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800/80 space-y-2">
          <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Progression</span>
            <span>${b.progressText}</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-300 ${isUnlocked ? 'bg-amber-400' : 'bg-teal-500'}" style="width: ${b.progressPercent}%;"></div>
          </div>

          <!-- Bouton Porter en Titre si débloqué -->
          ${isUnlocked ? `
            <div class="pt-1.5">
              ${isCurrentTitle ? `
                <button onclick="unequipTrophyTitle()" class="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 transition shadow-sm" title="Cliquez pour retirer ce titre">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  <span>👑 Titre Actif (Cliquer pour retirer)</span>
                </button>
              ` : `
                <button onclick="equipTrophyTitle('${escapeJsString(b.id)}')" class="w-full py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-400 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm" title="Porter ce trophée comme titre honorifique">
                  <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                  <span>Porter ce Trophée en Titre</span>
                </button>
              `}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function equipTrophyTitle(badgeId) {
  const allBadges = getBadgesStatus();
  const badge = allBadges.find(b => b.id === badgeId);
  if (!badge) return;
  if (badge.status !== 'unlocked') {
    alert("Vous devez d'abord débloquer ce trophée pour pouvoir porter son titre !");
    return;
  }
  if (!state.stats) state.stats = getDefaultStats();
  state.stats.equippedTitle = badge.name;
  state.stats.equippedTitleBadgeId = badge.id;
  saveStats();
  updateTopBar();
  renderTrophiesGrid();
  showRewardToast(`👑 Titre équipé : "${badge.name}" !`, 'crown');
}
window.equipTrophyTitle = equipTrophyTitle;

function unequipTrophyTitle() {
  if (!state.stats) state.stats = getDefaultStats();
  state.stats.equippedTitle = '';
  state.stats.equippedTitleBadgeId = '';
  saveStats();
  updateTopBar();
  renderTrophiesGrid();
  showRewardToast("Titre retiré.", 'info');
}
window.unequipTrophyTitle = unequipTrophyTitle;

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
async function dbUpsertCustomBadge(b) {
  if (!supabaseClient || !state.currentUser) return;
  try {
    await supabaseClient.from('custom_badges').upsert({
      id: b.id,
      name: b.name,
      description: b.description || '',
      icon: b.icon || '🏆',
      tier: b.tier || 'gold',
      xpReward: 0,
      conditionType: b.conditionType || 'tag_mastery',
      targetOrgan: b.targetOrgan || '',
      targetTag: b.targetTag || '',
      targetCount: b.targetCount || 5,
      created_by: b.created_by || (state.currentUser ? state.currentUser.email : 'Créateur'),
      created_at: b.created_at || new Date().toISOString()
    });
  } catch(e) {
    console.warn("Avertissement upsert custom_badge Supabase:", e);
  }
}

async function dbDeleteCustomBadge(id) {
  if (!supabaseClient || !state.currentUser) return;
  try {
    await Promise.all([
      supabaseClient.from('custom_badges').delete().eq('id', id),
      supabaseClient.from('user_trophies').delete().eq('badge_id', id)
    ]);
  } catch(e) {
    console.warn("Avertissement delete custom_badge Supabase:", e);
  }
}

function populateTrophyTagSelector(selectedTag = '') {
  const tagSelect = document.getElementById('trophy-input-tag');
  if (!tagSelect) return;
  const allTags = new Set();
  (state.questions || []).forEach(q => {
    (q.tags || []).forEach(t => {
      const clean = String(t).trim().replace(/^#/, '');
      if (clean) allTags.add(clean);
    });
  });
  (state.customTags || []).forEach(t => {
    const clean = (typeof t === 'string' ? t : (t.name || '')).trim().replace(/^#/, '');
    if (clean && !clean.startsWith('ROLE_') && !clean.startsWith('UPROG:') && !clean.startsWith('USTATS:')) {
      allTags.add(clean);
    }
  });
  const sortedTags = Array.from(allTags).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  if (sortedTags.length === 0) {
    sortedTags.push('IHC', 'Lame', 'BiologieMoléculaire', 'Cytologie', 'Histologie');
  }
  tagSelect.innerHTML = sortedTags.map(t => `<option value="${escapeHtml(t)}" ${t.toLowerCase() === selectedTag.toLowerCase().replace(/^#/, '') ? 'selected' : ''}>#${escapeHtml(t)}</option>`).join('');
}

function openCreateTrophyModal() {
  if (isReader()) {
    alert("La création de trophées est réservée aux comptes Créateurs.");
    return;
  }
  const modal = document.getElementById('modal-create-trophy');
  if (!modal) return;

  const editIdInput = document.getElementById('trophy-edit-id');
  if (editIdInput) editIdInput.value = '';

  const form = document.getElementById('form-create-trophy');
  if (form) form.reset();

  const titleEl = document.getElementById('trophy-modal-title');
  if (titleEl) titleEl.textContent = "Créer un Trophée Personnalisé";

  const subEl = document.getElementById('trophy-modal-subtitle');
  if (subEl) subEl.textContent = "Ajoutez un défi d'équipe pour vos co-internes et vous-même";

  const submitText = document.getElementById('trophy-modal-submit-text');
  if (submitText) submitText.textContent = "Créer le Trophée";

  populateTrophyTagSelector();

  const organSelect = document.getElementById('trophy-input-organ');
  if (organSelect) {
    const tree = getHierarchyTree(true);
    const organs = Object.keys(tree).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    organSelect.innerHTML = organs.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
  }

  onTrophyConditionTypeChange();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}
window.openCreateTrophyModal = openCreateTrophyModal;

function openEditTrophyModal(badgeId) {
  if (isReader()) {
    alert("La modification de trophées est réservée aux comptes Créateurs.");
    return;
  }
  const badge = (state.customBadges || []).find(b => b.id === badgeId);
  if (!badge) {
    renameTrophyPrompt(badgeId);
    return;
  }

  const modal = document.getElementById('modal-create-trophy');
  if (!modal) return;

  const editIdInput = document.getElementById('trophy-edit-id');
  if (editIdInput) editIdInput.value = badgeId;

  const titleEl = document.getElementById('trophy-modal-title');
  if (titleEl) titleEl.textContent = "Modifier le Trophée Personnalisé";

  const subEl = document.getElementById('trophy-modal-subtitle');
  if (subEl) subEl.textContent = "Modifiez le nom et les caractéristiques de ce trophée";

  const submitText = document.getElementById('trophy-modal-submit-text');
  if (submitText) submitText.textContent = "Enregistrer les modifications";

  const nameEl = document.getElementById('trophy-input-name');
  if (nameEl) nameEl.value = badge.name || '';

  const descEl = document.getElementById('trophy-input-desc');
  if (descEl) descEl.value = badge.description || '';

  const iconEl = document.getElementById('trophy-input-icon');
  if (iconEl) iconEl.value = badge.icon || '🏆';

  const tierEl = document.getElementById('trophy-input-tier');
  if (tierEl) tierEl.value = badge.tier || 'gold';

  const xpEl = document.getElementById('trophy-input-xp');
  if (xpEl) xpEl.value = "0";

  const condEl = document.getElementById('trophy-input-cond-type');
  if (condEl) condEl.value = badge.conditionType || 'tag_mastery';

  populateTrophyTagSelector(badge.targetTag || '');

  const organSelect = document.getElementById('trophy-input-organ');
  if (organSelect) {
    const tree = getHierarchyTree(true);
    const organs = Object.keys(tree).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    organSelect.innerHTML = organs.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
    if (badge.targetOrgan) organSelect.value = badge.targetOrgan;
  }

  const countEl = document.getElementById('trophy-input-count');
  if (countEl) countEl.value = badge.targetPercent || badge.targetCount || (badge.conditionType === 'organ_mastery' ? 50 : 5);

  onTrophyConditionTypeChange();

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}
window.openEditTrophyModal = openEditTrophyModal;

function renameTrophyPrompt(badgeId) {
  if (isReader()) {
    alert("Le renommage de trophées est réservé aux comptes Créateurs.");
    return;
  }
  const allBadges = getBadgesStatus();
  const badge = allBadges.find(b => b.id === badgeId);
  if (!badge) return;

  const currentName = badge.name;
  const newName = prompt(`Modifier le nom du trophée "${currentName}" :`, currentName);
  if (newName === null) return;
  const trimmed = newName.trim();
  if (!trimmed) {
    alert("Le nom ne peut pas être vide.");
    return;
  }

  const customIdx = (state.customBadges || []).findIndex(b => b.id === badgeId);
  if (customIdx !== -1) {
    state.customBadges[customIdx].name = trimmed;
    localStorage.setItem('pathosorus_custom_badges', JSON.stringify(state.customBadges));
    if (state.currentUser) {
      dbUpsertCustomBadge(state.customBadges[customIdx]);
    }
  } else {
    if (!state.stats) state.stats = getDefaultStats();
    if (!state.stats.trophyCustomNames) state.stats.trophyCustomNames = {};
    state.stats.trophyCustomNames[badgeId] = trimmed;
  }

  if (state.stats && (state.stats.equippedTitleBadgeId === badgeId || state.stats.equippedTitle === currentName)) {
    state.stats.equippedTitle = trimmed;
  }

  if (supabaseClient) {
    try {
      supabaseClient.from('user_trophies')
        .update({ badge_name: trimmed })
        .eq('badge_id', badgeId)
        .then();
    } catch(e) {}
  }

  saveStats();
  updateTopBar();
  renderTrophiesView();
  showRewardToast(`🏆 Trophée renommé en "${trimmed}" !`, 'award');
}
window.renameTrophyPrompt = renameTrophyPrompt;

function closeCreateTrophyModal() {
  const modal = document.getElementById('modal-create-trophy');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  const editIdInput = document.getElementById('trophy-edit-id');
  if (editIdInput) editIdInput.value = '';
}
window.closeCreateTrophyModal = closeCreateTrophyModal;

function updateTrophyTargetPreview() {
  const condType = document.getElementById('trophy-input-cond-type')?.value;
  const countEl = document.getElementById('trophy-input-count');
  const previewText = document.getElementById('trophy-preview-text');
  if (!previewText || !countEl) return;

  const val = parseInt(countEl.value, 10) || 0;

  if (condType === 'organ_mastery') {
    const organ = document.getElementById('trophy-input-organ')?.value || '';
    const orgQuestions = (state.questions || []).filter(q => (q.organ || '').toLowerCase() === organ.toLowerCase());
    const total = orgQuestions.length;
    const required = Math.max(1, Math.ceil((val / 100) * total));
    previewText.innerHTML = `Objectif : <strong>${val}%</strong> de la rubrique <em>${escapeHtml(organ || 'Sélectionnée')}</em> — soit <strong>${required} question${required > 1 ? 's' : ''} qualifiée${required > 1 ? 's' : ''}</strong> sur les ${total} existantes.`;
  } else if (condType === 'tag_mastery') {
    const tag = (document.getElementById('trophy-input-tag')?.value || '').replace(/^#/, '');
    const tagQuestions = (state.questions || []).filter(q => Array.isArray(q.tags) && q.tags.some(t => String(t).trim().toLowerCase().replace(/^#/, '') === tag.toLowerCase()));
    const total = tagQuestions.length;
    previewText.innerHTML = `Objectif : Réussir au moins <strong>${val} question${val > 1 ? 's' : ''}</strong> qualifiée${val > 1 ? 's' : ''} portant le tag <strong>#${escapeHtml(tag)}</strong> (${total} question${total > 1 ? 's' : ''} dans la banque).`;
  } else if (condType === 'question_count') {
    previewText.innerHTML = `Objectif : Réussir au moins <strong>${val} question${val > 1 ? 's' : ''}</strong> au total dans toute la banque.`;
  } else if (condType === 'streak') {
    previewText.innerHTML = `Objectif : Maintenir une série active de <strong>${val} jour${val > 1 ? 's' : ''} consécutif${val > 1 ? 's' : ''}</strong>.`;
  } else {
    previewText.innerHTML = `Défi d'honneur libre.`;
  }
}
window.updateTrophyTargetPreview = updateTrophyTargetPreview;

function onTrophyConditionTypeChange() {
  const condType = document.getElementById('trophy-input-cond-type')?.value;
  const paramBox = document.getElementById('trophy-organ-param-box');
  const countLabel = document.getElementById('trophy-count-label');
  const countInput = document.getElementById('trophy-input-count');
  const countUnit = document.getElementById('trophy-input-count-unit');
  const organCol = document.getElementById('trophy-organ-col');
  const tagCol = document.getElementById('trophy-tag-col');
  const countCol = document.getElementById('trophy-count-col');

  if (paramBox) {
    if (condType === 'free') {
      paramBox.classList.add('hidden');
    } else {
      paramBox.classList.remove('hidden');
      if (condType === 'tag_mastery') {
        if (tagCol) tagCol.classList.remove('hidden');
        if (organCol) organCol.classList.add('hidden');
        if (countCol) countCol.classList.remove('hidden');
        if (countLabel) countLabel.textContent = "Questions requises avec ce tag";
        if (countUnit) countUnit.textContent = "Q";
        if (countInput && countInput.value > 50) countInput.value = 5;
      } else if (condType === 'organ_mastery') {
        if (tagCol) tagCol.classList.add('hidden');
        if (organCol) organCol.classList.remove('hidden');
        if (countCol) countCol.classList.remove('hidden');
        if (countLabel) countLabel.textContent = "Pourcentage de réussite requis";
        if (countUnit) countUnit.textContent = "%";
        if (countInput && (countInput.value < 10 || countInput.value > 100)) countInput.value = 50;
      } else if (condType === 'question_count') {
        if (tagCol) tagCol.classList.add('hidden');
        if (organCol) organCol.classList.add('hidden');
        if (countCol) countCol.classList.remove('hidden');
        if (countLabel) countLabel.textContent = "Total de questions à réussir";
        if (countUnit) countUnit.textContent = "Q";
        if (countInput && countInput.value > 50) countInput.value = 10;
      } else if (condType === 'streak') {
        if (tagCol) tagCol.classList.add('hidden');
        if (organCol) organCol.classList.add('hidden');
        if (countCol) countCol.classList.remove('hidden');
        if (countLabel) countLabel.textContent = "Jours consécutifs (Streak)";
        if (countUnit) countUnit.textContent = "j";
        if (countInput && countInput.value > 30) countInput.value = 3;
      }
      updateTrophyTargetPreview();
    }
  }
}
window.onTrophyConditionTypeChange = onTrophyConditionTypeChange;

async function saveCustomBadge(badge) {
  state.customBadges.push(badge);
  localStorage.setItem('pathosorus_custom_badges', JSON.stringify(state.customBadges));
  renderTrophiesView();
  if (state.currentUser) {
    saveStats();
    dbUpsertCustomBadge(badge);
  }
}

async function deleteCustomBadge(badgeId) {
  if (!isAuthorizedToDelete()) {
    alert("Seuls le Dr Pierre-Alain Doreau et le Dr Samy Belhadef sont autorisés à supprimer un trophée.");
    return;
  }
  if (!confirm("Voulez-vous vraiment supprimer ce trophée personnalisé ?")) return;
  state.customBadges = (state.customBadges || []).filter(b => b.id !== badgeId);
  localStorage.setItem('pathosorus_custom_badges', JSON.stringify(state.customBadges));

  if (state.stats && (state.stats.equippedTitleBadgeId === badgeId)) {
    state.stats.equippedTitle = '';
    state.stats.equippedTitleBadgeId = '';
    updateTopBar();
  }

  renderTrophiesView();
  showRewardToast("Trophée supprimé.", 'trash-2');
  if (state.currentUser) {
    saveStats();
    dbDeleteCustomBadge(badgeId);
  }
}
window.deleteCustomBadge = deleteCustomBadge;

async function handleCreateTrophySubmit(e) {
  e.preventDefault();
  const editIdInput = document.getElementById('trophy-edit-id');
  const editId = editIdInput ? editIdInput.value.trim() : '';

  const name = document.getElementById('trophy-input-name').value.trim();
  const description = document.getElementById('trophy-input-desc').value.trim();
  const icon = document.getElementById('trophy-input-icon').value || '🏆';
  const tier = document.getElementById('trophy-input-tier').value || 'gold';
  const xpReward = 0; // Distinction d'honneur invariable : 0 XP
  const conditionType = document.getElementById('trophy-input-cond-type').value;
  const targetTag = document.getElementById('trophy-input-tag')?.value || '';
  const targetOrgan = document.getElementById('trophy-input-organ')?.value || '';
  const targetCount = parseInt(document.getElementById('trophy-input-count')?.value, 10) || 5;

  if (!name) {
    alert("Veuillez donner un nom au trophée.");
    return;
  }

  if (editId) {
    const idx = (state.customBadges || []).findIndex(b => b.id === editId);
    if (idx !== -1) {
      state.customBadges[idx] = {
        ...state.customBadges[idx],
        name,
        description,
        icon,
        tier,
        xpReward,
        conditionType,
        targetTag,
        targetOrgan,
        targetCount
      };
      localStorage.setItem('pathosorus_custom_badges', JSON.stringify(state.customBadges));
      if (state.stats && state.stats.equippedTitleBadgeId === editId) {
        state.stats.equippedTitle = name;
        updateTopBar();
      }
      if (state.currentUser) {
        saveStats();
        dbUpsertCustomBadge(state.customBadges[idx]);
      }
      closeCreateTrophyModal();
      renderTrophiesView();
      showRewardToast(`🏆 Trophée "${name}" mis à jour avec succès !`, 'award');
      return;
    }
  }

  const badge = {
    id: 'custom_' + Date.now(),
    name,
    description,
    icon,
    tier,
    xpReward: 0,
    conditionType,
    targetTag,
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
            <span>Nouveautés de la Banque</span>
          </span>
          <span class="text-xs font-bold text-white">${unplayedQuestions.length} question(s) inédite(s)</span>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">
          Des cas cliniques et QCM ont été ajoutés à la banque que vous n'avez pas encore testés. Découvrez-les pour vous entraîner !
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

// --- GESTION & ATTRIBUTION DE L'AUTEUR D'UNE QUESTION ---
function getQuestionAuthorEmail(q) {
  if (!q) return 'padoreau85@gmail.com';
  let author = (q.created_by || (q.stats && q.stats.created_by) || '').trim().toLowerCase();
  if (!author) {
    author = (q.id === 'q_1792671361751') ? 'belhadef.samy@gmail.com' : 'padoreau85@gmail.com';
  }
  return author;
}

function getQuestionAuthorDisplayName(q) {
  let email = '';
  if (typeof q === 'string') {
    email = q.trim().toLowerCase();
  } else if (q) {
    email = (q.created_by || (q.stats && q.stats.created_by) || q.email || '').trim().toLowerCase();
  }
  if (email === 'padoreau85@gmail.com') {
    return { email, name: 'Dr Pierre-Alain Doreau', short: 'Dr Doreau' };
  }
  if (email === 'belhadef.samy@gmail.com') {
    return { email, name: 'Dr Samy Belhadef', short: 'Dr Belhadef' };
  }
  if (!email || email === 'banque' || email === 'guest') {
    return { email: '', name: 'Banque PathoSorus', short: 'Banque' };
  }
  const prefix = email.split('@')[0];
  const parts = prefix.split(/[._-]/).filter(Boolean);
  const formatted = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  const capitalizedLast = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
  return {
    email,
    name: `Dr ${formatted || capitalizedLast}`,
    short: `Dr ${capitalizedLast}`
  };
}

function getKnownAuthorsList() {
  const map = new Map();
  map.set('padoreau85@gmail.com', 'Pierre-Alain Doreau');
  map.set('belhadef.samy@gmail.com', 'Samy Belhadef');

  if (state.currentUser && state.currentUser.email) {
    const em = state.currentUser.email.trim().toLowerCase();
    if (!map.has(em)) {
      const p = em.split('@')[0];
      const nm = p.charAt(0).toUpperCase() + p.slice(1);
      map.set(em, nm);
    }
  }

  (state.questions || []).forEach(q => {
    const aut = (q.created_by || (q.stats && q.stats.created_by) || '').trim().toLowerCase();
    if (aut && !map.has(aut)) {
      const p = aut.split('@')[0];
      const nm = p.charAt(0).toUpperCase() + p.slice(1);
      map.set(aut, nm);
    }
  });

  try {
    const stored = JSON.parse(localStorage.getItem('pathosorus_known_colleagues') || '[]');
    if (Array.isArray(stored)) {
      stored.forEach(c => {
        if (c && c.email) {
          const em = c.email.trim().toLowerCase();
          if (!map.has(em)) map.set(em, c.name || em);
        }
      });
    }
  } catch (e) {}

  return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
}

function updateQuestionAuthorSelect(selectedEmail = null) {
  const select = document.getElementById('form-q-author');
  if (!select) return;

  const authors = getKnownAuthorsList();
  const currentEmail = (state.currentUser && state.currentUser.email) ? state.currentUser.email.trim().toLowerCase() : 'padoreau85@gmail.com';
  const targetEmail = (selectedEmail || currentEmail).toLowerCase();

  if (!authors.some(a => a.email === targetEmail)) {
    const p = targetEmail.split('@')[0];
    const nm = p.charAt(0).toUpperCase() + p.slice(1);
    authors.push({ email: targetEmail, name: nm });
  }

  select.innerHTML = authors.map(a => `
    <option value="${a.email}" ${a.email === targetEmail ? 'selected' : ''}>
      ${escapeHtml(a.name)} (${escapeHtml(a.email)})
    </option>
  `).join('') + `
    <option value="__NEW__">+ Assigner à un autre collègue...</option>
  `;
}

function onAuthorSelectChange() {
  const select = document.getElementById('form-q-author');
  if (!select) return;
  if (select.value === '__NEW__') {
    const newEmail = prompt("Entrez l'adresse email du confrère / rédacteur à assigner :");
    if (newEmail && newEmail.trim() && newEmail.includes('@')) {
      const cleanEmail = newEmail.trim().toLowerCase();
      const opt = document.createElement('option');
      opt.value = cleanEmail;
      opt.textContent = `${cleanEmail} (Nouveau confrère)`;
      opt.selected = true;
      select.insertBefore(opt, select.lastElementChild);
    } else {
      select.value = (state.currentUser && state.currentUser.email) ? state.currentUser.email.toLowerCase() : 'padoreau85@gmail.com';
    }
  }
}
window.onAuthorSelectChange = onAuthorSelectChange;

// --- DÉTECTION & RÉVISION DES QUESTIONS AVEC LAMES (IMAGES / HISTOLOGIE) ---
function isSlideQuestion(q) {
  if (!q) return false;
  // 1. Tag #Lame ou dérivé
  const hasSlideTag = Array.isArray(q.tags) && q.tags.some(t => {
    const s = String(t).trim().toLowerCase();
    return s === 'lame' || s === 'lames' || s.includes('lame') || s.includes('histol') || s.includes('virtuelle');
  });
  if (hasSlideTag) return true;

  // 2. Images microscopiques attachées à l'énoncé ou à la correction
  const hasImages = (Array.isArray(q.images) && q.images.length > 0) ||
                    (Array.isArray(q.explanationImages) && q.explanationImages.length > 0) ||
                    (Array.isArray(q.explanationimages) && q.explanationimages.length > 0);
  return Boolean(hasImages);
}
window.isSlideQuestion = isSlideQuestion;

function getSlideQuestions(activeOnly = true, toReviewTodayOnly = false) {
  return (state.questions || []).filter(q => {
    if (activeOnly && q.mastered) return false;
    if (!isSlideQuestion(q)) return false;
    if (toReviewTodayOnly && isQuestionDoneToday(q)) return false;
    return true;
  });
}
window.getSlideQuestions = getSlideQuestions;

function startDueSlideQuestionsSession() {
  const activeSlides = getSlideQuestions(true, false);
  const dueSlides = activeSlides.filter(q => isQuestionDue(q));
  if (dueSlides.length === 0) {
    showToast("🎉 Vos lames du jour selon vos délais sont toutes à jour (0 échue) ! Pour continuer à vous exercer à votre guise, lancez 'Entraînement libre des lames' ci-dessous.", "success");
    return;
  }
  state.sessionReturnView = 'play';
  launchQuizSession(dueSlides, `Session Lames du Jour (${dueSlides.length} lames dues) 🔬`);
}
window.startDueSlideQuestionsSession = startDueSlideQuestionsSession;

function startFreeSlideReviewSession() {
  const activeSlides = getSlideQuestions(true, false);
  const pool = activeSlides.length > 0 ? activeSlides : getSlideQuestions(false, false);
  if (pool.length === 0) {
    showToast("Aucune question avec lame ou image microscopique dans la banque pour l'instant.", "info");
    return;
  }
  state.sessionReturnView = 'play';
  launchQuizSession(pool, `Entraînement Libre Lames Microscopiques (${pool.length} Q à ma guise) 🔬`);
}
window.startFreeSlideReviewSession = startFreeSlideReviewSession;

function startSlideQuestionsSession(forceDueOnly = false) {
  const activeSlides = getSlideQuestions(true, false);
  const dueSlides = activeSlides.filter(q => isQuestionDue(q));
  if (forceDueOnly || dueSlides.length > 0) {
    startDueSlideQuestionsSession();
  } else {
    startFreeSlideReviewSession();
  }
}
window.startSlideQuestionsSession = startSlideQuestionsSession;
window.startColleaguesQuestionsSession = startSlideQuestionsSession; // Rétrocompatibilité

function getColleaguesQuestions(activeOnly = true, toReviewTodayOnly = false) {
  return getSlideQuestions(activeOnly, toReviewTodayOnly);
}

function getMyAuthoredQuestions(activeOnly = true) {
  return (state.questions || []).filter(q => (activeOnly ? !q.mastered : true));
}

// --- DÉTECTION & RÉVISION DES QUESTIONS IHC (IMMUNOHISTOCHIMIE) ---
function isIHCQuestion(q) {
  if (!q) return false;
  // 1. Tag #IHC ou dérivé
  const hasIHCTag = Array.isArray(q.tags) && q.tags.some(t => {
    const s = String(t).trim().toLowerCase().replace(/^#/, '');
    return s === 'ihc' || s.includes('ihc') || s.includes('immunohisto');
  });
  if (hasIHCTag) return true;

  // 2. Énoncé, contexte ou explication mentionnant IHC / profil immunohistochimique
  const text = `${q.question || ''} ${q.context || ''} ${q.explanation || ''}`.toLowerCase();
  return text.includes('ihc') || text.includes('immunohistochimie') || text.includes('immunohistochimique');
}
window.isIHCQuestion = isIHCQuestion;

function getIHCQuestions(activeOnly = true, toReviewTodayOnly = false) {
  return (state.questions || []).filter(q => {
    if (activeOnly && q.mastered) return false;
    if (!isIHCQuestion(q)) return false;
    if (toReviewTodayOnly && isQuestionDoneToday(q)) return false;
    return true;
  });
}
window.getIHCQuestions = getIHCQuestions;

function startDueIHCQuestionsSession() {
  const activeIHC = getIHCQuestions(true, false);
  const dueIHC = activeIHC.filter(q => isQuestionDue(q));
  if (dueIHC.length === 0) {
    showToast("🎉 Vos questions IHC du jour selon vos délais sont toutes à jour (0 échue) ! Pour continuer à vous exercer à votre guise, lancez 'Entraînement libre IHC' ci-dessous.", "success");
    return;
  }
  state.sessionReturnView = 'play';
  launchQuizSession(dueIHC, `Session IHC du Jour (${dueIHC.length} Q dues) 🧪`);
}
window.startDueIHCQuestionsSession = startDueIHCQuestionsSession;

function startFreeIHCReviewSession() {
  const activeIHC = getIHCQuestions(true, false);
  const pool = activeIHC.length > 0 ? activeIHC : getIHCQuestions(false, false);
  if (pool.length === 0) {
    showToast("Aucune question d'immunohistochimie (#IHC) dans la banque pour l'instant.", "info");
    return;
  }
  state.sessionReturnView = 'play';
  launchQuizSession(pool, `Entraînement Libre IHC (${pool.length} Q à ma guise) 🧪`);
}
window.startFreeIHCReviewSession = startFreeIHCReviewSession;

function startIHCQuestionsSession(forceDueOnly = false) {
  const activeIHC = getIHCQuestions(true, false);
  const dueIHC = activeIHC.filter(q => isQuestionDue(q));
  if (forceDueOnly || dueIHC.length > 0) {
    startDueIHCQuestionsSession();
  } else {
    startFreeIHCReviewSession();
  }
}
window.startIHCQuestionsSession = startIHCQuestionsSession;

// --- DASHBOARD DE RÉPÉTITION ESPACÉE ---
function renderSpacedRepetitionDashboard() {
  const activeQuestions = state.questions.filter(q => !q.mastered);
  const dueQuestions = activeQuestions.filter(q => isQuestionDue(q));
  const masteredCount = state.questions.filter(q => q.mastered).length;

  const allSlides = activeQuestions.filter(q => isSlideQuestion(q));
  const dueSlides = allSlides.filter(q => isQuestionDue(q));

  const allIHC = activeQuestions.filter(q => isIHCQuestion(q));
  const dueIHC = allIHC.filter(q => isQuestionDue(q));

  // 1. Module Répétition du Jour
  const dueBadge = document.getElementById('stat-due-today-count');
  if (dueBadge) dueBadge.textContent = dueQuestions.length;

  const dueStatus = document.getElementById('stat-due-today-status');
  if (dueStatus) {
    if (dueQuestions.length > 0) {
      dueStatus.innerHTML = `<span class="text-xs text-amber-400 font-bold">${dueQuestions.length} carte(s) à réviser aujourd'hui</span>`;
    } else {
      dueStatus.innerHTML = `<span class="text-xs text-emerald-400 font-semibold flex items-center space-x-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>À jour pour aujourd'hui ! (0 échue)</span></span>`;
    }
  }

  const btnStartDue = document.getElementById('btn-play-due-today');
  const labelDue = document.getElementById('label-due-today');
  const iconDue = document.getElementById('icon-play-due-today');
  if (btnStartDue && labelDue) {
    btnStartDue.disabled = false;
    if (dueQuestions.length > 0) {
      btnStartDue.className = "w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm shadow-teal-500/25";
      labelDue.textContent = `Lancer la session du jour (${dueQuestions.length} à revoir)`;
      if (iconDue) iconDue.setAttribute('data-lucide', 'play');
    } else {
      btnStartDue.className = "w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center space-x-2 transition";
      labelDue.textContent = `✅ Révisions du jour terminées ! (0 carte)`;
      if (iconDue) iconDue.setAttribute('data-lucide', 'check-check');
    }
  }

  const labelFree = document.getElementById('label-free-session');
  if (labelFree) {
    labelFree.textContent = `Entraînement libre hors planning (${activeQuestions.length} Q)`;
  }

  // 2. Module Réviser des Lames (Délais & À ma guise)
  const slidesDueStatus = document.getElementById('stat-slides-due-status');
  if (slidesDueStatus) {
    if (allSlides.length === 0) {
      slidesDueStatus.innerHTML = `<span class="text-xs text-slate-400">Aucune lame disponible</span>`;
    } else if (dueSlides.length > 0) {
      slidesDueStatus.innerHTML = `<span class="text-xs text-amber-400 font-bold">${dueSlides.length} lame(s) à réviser aujourd'hui</span>`;
    } else {
      slidesDueStatus.innerHTML = `<span class="text-xs text-emerald-400 font-semibold flex items-center space-x-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>À jour pour aujourd'hui ! (0 échue)</span></span>`;
    }
  }

  const slidesBadge = document.getElementById('stat-slides-count') || document.getElementById('stat-colleagues-count');
  if (slidesBadge) slidesBadge.textContent = allSlides.length;

  const btnSlides = document.getElementById('btn-play-slides') || document.getElementById('btn-play-colleagues');
  const iconSlides = document.getElementById('icon-play-slides') || document.getElementById('icon-play-colleagues');
  const labelS = document.getElementById('label-slides-count') || document.getElementById('label-colleagues-count');
  if (btnSlides && labelS) {
    btnSlides.disabled = false;
    if (allSlides.length === 0) {
      btnSlides.disabled = true;
      btnSlides.className = "w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center space-x-2 cursor-not-allowed";
      labelS.textContent = `Aucune lame disponible`;
      if (iconSlides) iconSlides.setAttribute('data-lucide', 'play');
    } else if (dueSlides.length > 0) {
      btnSlides.className = "w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm shadow-indigo-500/25";
      labelS.textContent = `Lancer les lames du jour (${dueSlides.length} à revoir)`;
      if (iconSlides) iconSlides.setAttribute('data-lucide', 'play');
    } else {
      btnSlides.className = "w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center space-x-2 transition";
      labelS.textContent = `✅ Lames du jour terminées ! (0 lame)`;
      if (iconSlides) iconSlides.setAttribute('data-lucide', 'check-check');
    }
  }

  const btnFreeSlides = document.getElementById('btn-play-free-slides');
  const labelFreeSlides = document.getElementById('label-free-slides');
  if (btnFreeSlides) {
    btnFreeSlides.disabled = (allSlides.length === 0);
  }
  if (labelFreeSlides) {
    labelFreeSlides.textContent = `Entraînement libre des lames (${allSlides.length} Q)`;
  }

  const btnShortcut = document.getElementById('btn-play-slides-shortcut') || document.getElementById('btn-play-colleagues-shortcut');
  if (btnShortcut) {
    const isDone = (allSlides.length === 0);
    btnShortcut.disabled = isDone;
    if (isDone) {
      btnShortcut.classList.add('opacity-40', 'cursor-not-allowed');
    } else {
      btnShortcut.classList.remove('opacity-40', 'cursor-not-allowed');
    }
  }

  const labelShortcut = document.getElementById('label-slides-shortcut') || document.getElementById('label-colleagues-shortcut');
  if (labelShortcut) {
    if (allSlides.length === 0) {
      labelShortcut.textContent = `Réviser les Lames (0)`;
    } else if (dueSlides.length > 0) {
      labelShortcut.textContent = `Lames du Jour (${dueSlides.length} dues)`;
    } else {
      labelShortcut.textContent = `Lames à ma guise (${allSlides.length} Q)`;
    }
  }

  // 3. Module Révision IHC (Délais & À ma guise)
  const ihcDueStatus = document.getElementById('stat-ihc-due-status');
  if (ihcDueStatus) {
    if (allIHC.length === 0) {
      ihcDueStatus.innerHTML = `<span class="text-xs text-slate-400">Aucune question IHC</span>`;
    } else if (dueIHC.length > 0) {
      ihcDueStatus.innerHTML = `<span class="text-xs text-amber-400 font-bold">${dueIHC.length} question(s) IHC à réviser aujourd'hui</span>`;
    } else {
      ihcDueStatus.innerHTML = `<span class="text-xs text-emerald-400 font-semibold flex items-center space-x-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>À jour pour aujourd'hui ! (0 échue)</span></span>`;
    }
  }

  const ihcBadge = document.getElementById('stat-ihc-count');
  if (ihcBadge) ihcBadge.textContent = allIHC.length;

  const btnIHC = document.getElementById('btn-play-ihc');
  const iconIHC = document.getElementById('icon-play-ihc');
  const labelIHC = document.getElementById('label-ihc-count');
  if (btnIHC && labelIHC) {
    btnIHC.disabled = false;
    if (allIHC.length === 0) {
      btnIHC.disabled = true;
      btnIHC.className = "w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center space-x-2 cursor-not-allowed";
      labelIHC.textContent = `Aucune question IHC`;
      if (iconIHC) iconIHC.setAttribute('data-lucide', 'play');
    } else if (dueIHC.length > 0) {
      btnIHC.className = "w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm shadow-violet-500/25";
      labelIHC.textContent = `Lancer l'IHC du jour (${dueIHC.length} à revoir)`;
      if (iconIHC) iconIHC.setAttribute('data-lucide', 'play');
    } else {
      btnIHC.className = "w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center space-x-2 transition";
      labelIHC.textContent = `✅ IHC du jour terminé ! (0 question)`;
      if (iconIHC) iconIHC.setAttribute('data-lucide', 'check-check');
    }
  }

  const btnFreeIHC = document.getElementById('btn-play-free-ihc');
  const labelFreeIHC = document.getElementById('label-free-ihc');
  if (btnFreeIHC) {
    btnFreeIHC.disabled = (allIHC.length === 0);
  }
  if (labelFreeIHC) {
    labelFreeIHC.textContent = `Entraînement libre IHC (${allIHC.length} Q)`;
  }

  const btnIHCShortcut = document.getElementById('btn-play-ihc-shortcut');
  if (btnIHCShortcut) {
    const isDone = (allIHC.length === 0);
    btnIHCShortcut.disabled = isDone;
    if (isDone) {
      btnIHCShortcut.classList.add('opacity-40', 'cursor-not-allowed');
    } else {
      btnIHCShortcut.classList.remove('opacity-40', 'cursor-not-allowed');
    }
  }

  const labelIHCShortcut = document.getElementById('label-ihc-shortcut');
  if (labelIHCShortcut) {
    if (allIHC.length === 0) {
      labelIHCShortcut.textContent = `Réviser l'IHC (0)`;
    } else if (dueIHC.length > 0) {
      labelIHCShortcut.textContent = `IHC du Jour (${dueIHC.length} dues)`;
    } else {
      labelIHCShortcut.textContent = `IHC à ma guise (${allIHC.length} Q)`;
    }
  }

  // 4. Module Questions Maîtrisées
  const activeBadge = document.getElementById('stat-active-count');
  if (activeBadge) activeBadge.textContent = activeQuestions.length;

  const masteredBadge = document.getElementById('stat-mastered-count');
  if (masteredBadge) masteredBadge.textContent = masteredCount;

  const btnMastered = document.getElementById('btn-play-mastered');
  if (btnMastered) {
    btnMastered.disabled = masteredCount === 0;
    const labelM = document.getElementById('label-mastered-count');
    if (labelM) labelM.textContent = `Tester mes maîtrisées (${masteredCount})`;
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function startSpacedRepetitionDueSession() {
  const activeQuestions = state.questions.filter(q => !q.mastered);
  const due = activeQuestions.filter(q => isQuestionDue(q));
  if (due.length === 0) {
    showToast("🎉 Vos révisions du jour sont déjà toutes terminées ! Pour continuer à vous exercer sans contrainte de planning, lancez 'Entraînement libre' ci-dessous.", "success");
    return;
  }
  state.sessionReturnView = 'play';
  launchQuizSession(due, `Session du Jour (${due.length} cartes dues) 🔁`);
}

function startFreeReviewSession() {
  const activeQuestions = state.questions.filter(q => !q.mastered);
  const pool = activeQuestions.length > 0 ? activeQuestions : state.questions;
  if (pool.length === 0) {
    showToast("Aucune question disponible dans la banque.", "info");
    return;
  }
  state.sessionReturnView = 'play';
  launchQuizSession(pool, `Entraînement Libre (${pool.length} cartes) 🚀`);
}
window.startFreeReviewSession = startFreeReviewSession;

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
  checkDailyStreak();
  playSound('correct');
  nextSessionQuestion();
}
window.chooseReviewInterval = chooseReviewInterval;

// --- CLASSIFICATION 3 NIVEAUX ---
function getHierarchyTree(includeMastered = false, filterMode = null) {
  const tree = {};
  const mode = filterMode || (state.playHierarchy && state.playHierarchy.filterMode) || 'all';

  let activeQuestions = state.questions.filter(q => includeMastered || !q.mastered);
  if (mode === 'slides') {
    activeQuestions = activeQuestions.filter(q => isSlideQuestion(q));
  } else if (mode === 'ihc') {
    activeQuestions = activeQuestions.filter(q => isIHCQuestion(q));
  }

  const cases = (mode === 'slides' || mode === 'ihc') ? [] : state.cases;
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
  const organs = Object.keys(tree).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  const allActiveCount = state.questions.filter(q => !q.mastered).length + state.cases.length;
  const slidesActiveCount = state.questions.filter(q => !q.mastered && isSlideQuestion(q)).length;
  const ihcActiveCount = state.questions.filter(q => !q.mastered && isIHCQuestion(q)).length;

  let html = `<div class="space-y-4">`;

  // Onglets de filtre : Toutes les questions / Questions avec Lames / Questions IHC
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

      <button type="button" onclick="setHierarchyFilterMode('slides')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
        currentMode === 'slides'
          ? 'bg-indigo-600 text-white border border-indigo-400 shadow-sm shadow-indigo-600/30'
          : 'bg-slate-950 text-indigo-400 hover:text-white border border-slate-800'
      }">
        <i data-lucide="microscope" class="w-3.5 h-3.5"></i>
        <span>Questions avec Lames</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${currentMode === 'slides' ? 'bg-indigo-700 text-white' : 'bg-slate-900 text-indigo-300'}">${slidesActiveCount}</span>
      </button>

      <button type="button" onclick="setHierarchyFilterMode('ihc')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
        currentMode === 'ihc'
          ? 'bg-violet-600 text-white border border-violet-400 shadow-sm shadow-violet-600/30'
          : 'bg-slate-950 text-violet-400 hover:text-white border border-slate-800'
      }">
        <i data-lucide="flask-conical" class="w-3.5 h-3.5"></i>
        <span>Questions IHC</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${currentMode === 'ihc' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-violet-300'}">${ihcActiveCount}</span>
      </button>
    </div>
  `;

  if (organs.length === 0) {
    if (currentMode === 'slides') {
      html += `
        <div class="p-6 text-center bg-indigo-500/10 rounded-xl border border-indigo-500/30">
          <i data-lucide="microscope" class="w-8 h-8 mx-auto mb-2 text-indigo-400"></i>
          <h4 class="text-sm font-bold text-indigo-300">Aucune question avec lame ou image</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Toutes les questions comportant des photographies microscopiques ou le tag #Lame apparaîtront ici classées par organe !
          </p>
        </div>
      `;
    } else if (currentMode === 'ihc') {
      html += `
        <div class="p-6 text-center bg-violet-500/10 rounded-xl border border-violet-500/30">
          <i data-lucide="flask-conical" class="w-8 h-8 mx-auto mb-2 text-violet-400"></i>
          <h4 class="text-sm font-bold text-violet-300">Aucune question d'immunohistochimie</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Toutes les questions comportant des profils d'anticorps ou le tag #IHC apparaîtront ici classées par organe !
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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span class="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-mono">1</span>
          <span>Choisissez l'Organe :</span>
        </span>
        ${state.playHierarchy.selectedOrgan ? `
          <div class="flex flex-wrap items-center gap-1.5">
            ${isCreator() ? `
              <button type="button" onclick="createQuestionForOrgan('${escapeJsString(state.playHierarchy.selectedOrgan)}')" class="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center space-x-1 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 transition shadow-sm" title="Créer un QCM dans cet organe">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span>+ Créer QCM</span>
              </button>
              <button type="button" onclick="renameOrganPrompt('${escapeJsString(state.playHierarchy.selectedOrgan)}')" class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 transition shadow-sm" title="Renommer ou fusionner cet organe sur tous les QCM et DP">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span>Renommer</span>
              </button>
            ` : ''}
            <button onclick="startHierarchySession('organ', '${escapeJsString(state.playHierarchy.selectedOrgan)}')" class="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center space-x-1 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 transition">
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
              <span>Tester tout "${escapeHtml(state.playHierarchy.selectedOrgan)}" (${tree[state.playHierarchy.selectedOrgan].count}Q actives)</span>
            </button>
          </div>
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

  // Niveau 2 (Sous-organe / Catégorie - Max 2 Niveaux pour éviter les spoilers de diagnostic)
  if (state.playHierarchy.selectedOrgan) {
    const orgObj = tree[state.playHierarchy.selectedOrgan];
    const categories = Object.keys(orgObj.categories).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

    html += `
      <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span class="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <span class="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-mono">2</span>
            <span>Sous-organe / Catégorie dans <em>${escapeHtml(state.playHierarchy.selectedOrgan)}</em> :</span>
          </span>
          ${state.playHierarchy.selectedCategory ? `
            <div class="flex flex-wrap items-center gap-1.5">
              ${isCreator() ? `
                <button type="button" onclick="createQuestionForCategory('${escapeJsString(state.playHierarchy.selectedOrgan)}', '${escapeJsString(state.playHierarchy.selectedCategory)}')" class="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 transition shadow-sm" title="Créer un QCM dans cette catégorie">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                  <span>+ Créer QCM</span>
                </button>
                <button type="button" onclick="renameCategoryPrompt('${escapeJsString(state.playHierarchy.selectedOrgan)}', '${escapeJsString(state.playHierarchy.selectedCategory)}')" class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 transition shadow-sm" title="Renommer cette catégorie">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  <span>Renommer</span>
                </button>
              ` : ''}
              <button onclick="startHierarchySession('category', '${escapeJsString(state.playHierarchy.selectedOrgan)}', '${escapeJsString(state.playHierarchy.selectedCategory)}')" class="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1.5 bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 transition shadow-sm">
                <i data-lucide="play" class="w-3.5 h-3.5"></i>
                <span>Tester "${escapeHtml(state.playHierarchy.selectedCategory)}" (${orgObj.categories[state.playHierarchy.selectedCategory].count}Q)</span>
              </button>
            </div>
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
        }" title="${isSelected ? 'Cliquer à nouveau pour lancer le test' : 'Sélectionner ce sous-organe'}">
          ${isSelected ? '<i data-lucide="play" class="w-3 h-3 text-white"></i>' : ''}
          <span>${escapeHtml(cat)}</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-400'}">${count}</span>
        </button>
      `;
    });
    html += `</div></div>`;
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
  if (state.playHierarchy.selectedCategory === cat) {
    startHierarchySession('category', state.playHierarchy.selectedOrgan, cat);
    return;
  }
  state.playHierarchy.selectedCategory = cat;
  state.playHierarchy.selectedEntity = null;
  renderHierarchySelector();
}

function quitCurrentSession() {
  switchTab(state.sessionReturnView || 'play');
}

function handleEditCurrentSessionQuestion() {
  const session = state.currentSession;
  if (!session) return;
  const q = session.questions[session.currentIndex];
  if (!q) return;

  if (!isCreator()) {
    alert("Action réservée aux comptes Rédacteurs.");
    return;
  }

  if (confirm(`Modifier cette question dans l'éditeur ?\n\nVous pourrez modifier son contenu, ses images ou réassigner son auteur.`)) {
    state.sessionReturnView = 'play';
    editQuestion(q.id);
  }
}
window.handleEditCurrentSessionQuestion = handleEditCurrentSessionQuestion;

function quitCurrentDPSession() {
  switchTab(state.sessionReturnView || 'play');
}

function startHierarchySession(level, organ, category, entity) {
  // Détecter si on lance depuis Ma Banque ou depuis Entraînement
  const isFromBank = document.getElementById('view-bank') && !document.getElementById('view-bank').classList.contains('hidden');
  state.sessionReturnView = isFromBank ? 'bank' : 'play';

  let activeQuestions = state.questions.filter(q => !q.mastered);
  if (!isFromBank && state.playHierarchy && state.playHierarchy.filterMode === 'slides') {
    activeQuestions = activeQuestions.filter(q => isSlideQuestion(q));
  } else if (!isFromBank && state.playHierarchy && state.playHierarchy.filterMode === 'ihc') {
    activeQuestions = activeQuestions.filter(q => isIHCQuestion(q));
  }

  let matchingQuestions = [];
  if (level === 'organ') matchingQuestions = activeQuestions.filter(q => (organ === 'all' || q.organ === organ));
  else if (level === 'category') matchingQuestions = activeQuestions.filter(q => (organ === 'all' || q.organ === organ) && (category === 'all' || q.category === category));
  else if (level === 'entity') matchingQuestions = activeQuestions.filter(q => (organ === 'all' || q.organ === organ) && (category === 'all' || q.category === category) && q.entity === entity);

  // Si on lance depuis l'onglet JOUER : privilégier les questions non faites aujourd'hui
  let pool = matchingQuestions;
  if (!isFromBank) {
    const notDoneToday = matchingQuestions.filter(q => !isQuestionDoneToday(q));
    // S'il reste des questions à réviser aujourd'hui, on les lance en priorité
    // Si toutes ont déjà été faites aujourd'hui, on lance directement la sélection sans aucune pop-up
    pool = notDoneToday.length > 0 ? notDoneToday : matchingQuestions;
  }

  if (pool.length === 0) {
    // Vérifier si des questions neutralisées (maîtrisées) existent
    const allMatching = state.questions.filter(q => {
      if (level === 'organ') return (organ === 'all' || q.organ === organ);
      if (level === 'category') return (organ === 'all' || q.organ === organ) && (category === 'all' || q.category === category);
      if (level === 'entity') return (organ === 'all' || q.organ === organ) && (category === 'all' || q.category === category) && q.entity === entity;
      return false;
    });

    if (allMatching.length > 0) {
      launchQuizSession(allMatching, `Entraînement : ${entity || category || organ} (Maîtrisées)`);
      return;
    }

    alert("Aucune question disponible pour cette sélection.");
    return;
  }
  launchQuizSession(pool, `Entraînement : ${entity || category || organ}`);
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
  if (!state.currentUser) {
    state.currentUser = getActiveUser() || {
      id: 'usr_padoreau85_gmail_com',
      email: 'padoreau85@gmail.com',
      user_metadata: { role: 'creator' }
    };
  }

  if (!pool || pool.length === 0) {
    showToast("Aucune question disponible pour cette session.", "info");
    return;
  }

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
  if (activeQuestions.length > 0) {
    const pool = [...activeQuestions].sort(() => 0.5 - Math.random()).slice(0, 10);
    launchQuizSession(pool, `Sprint Quotidien (${pool.length} questions restantes)`);
    return;
  }
  const allActive = state.questions.filter(q => !q.mastered);
  if (allActive.length > 0) {
    const pool = [...allActive].sort(() => 0.5 - Math.random()).slice(0, 10);
    launchQuizSession(pool, `Sprint Quotidien • Révision libre (${pool.length} questions)`);
    return;
  }
  alert("Aucune question active disponible.");
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
    // Indice d'entraînement : organe et sous-organe max, lésion masquée
    breadcrumbEl.textContent = q.category ? `${q.organ} > ${q.category}` : `${q.organ}`;
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

  // Bouton de modification directe si compte Rédacteur/Créateur
  const editBtn = document.getElementById('btn-session-edit-question');
  if (editBtn) {
    if (isCreator()) {
      editBtn.classList.remove('hidden');
      editBtn.classList.add('flex');
    } else {
      editBtn.classList.add('hidden');
      editBtn.classList.remove('flex');
    }
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

  if (!q.stats) q.stats = getDefaultQuestionStats();
  q.stats.seen += 1;
  q.stats.lastReviewed = new Date().toISOString();
  state.stats.totalAnswered += 1;

  const today = getLocalDateString();
  const alreadyRewardedToday = (q.stats.lastXpDate === today);
  const baseXp = getQuestionXp(q);
  const earnedXp = alreadyRewardedToday ? 0 : baseXp;

  if (isExact) {
    q.stats.correct += 1;
    q.stats.consecutiveCorrect = (q.stats.consecutiveCorrect || 0) + 1;
    session.score += 1;
    session.xpEarned += earnedXp;

    if (!alreadyRewardedToday) {
      q.stats.lastXpDate = today;
      state.stats.totalCorrect += 1;
      state.stats.xp += earnedXp;
    }

    // Règle Anti-triche Trophée :
    // Si la question a été ratée aujourd'hui (à l'instant t), la réussir immédiatement (à t+1)
    // ne valide pas le trophée aujourd'hui. Elle ne comptera pour les trophées que si réussie un jour ultérieur.
    if (q.stats.lastFailedDate === today) {
      q.stats.lastCorrectDate = today;
      q.stats.trophyEligible = false;
    } else {
      q.stats.lastCorrectDate = today;
      q.stats.trophyEligible = true;
      checkAndUnlockBadges();
    }

    playSound('correct');
    confetti({ particleCount: q.difficulty === 'extreme' ? 80 : 35, spread: 65, origin: { y: 0.8 } });
    checkCategoryCompletionBonus(q.organ, q.category);
  } else {
    q.stats.lastFailedDate = today;
    q.stats.trophyEligible = false;
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
  } else {
    dbSaveUserProgress(q);
  }

  saveStats();
  checkDailyStreak();

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

  if (!q.stats) q.stats = getDefaultQuestionStats();
  q.stats.seen += 1;
  q.stats.lastReviewed = new Date().toISOString();
  state.stats.totalAnswered += 1;

  const today = getLocalDateString();
  const alreadyRewardedToday = (q.stats.lastXpDate === today);
  const baseXp = 15;
  const earnedXp = alreadyRewardedToday ? 0 : baseXp;

  if (isMatch) {
    q.stats.correct += 1;
    q.stats.consecutiveCorrect = (q.stats.consecutiveCorrect || 0) + 1;
    session.score += 1;
    session.xpEarned += earnedXp;

    if (!alreadyRewardedToday) {
      q.stats.lastXpDate = today;
      state.stats.totalCorrect += 1;
      state.stats.xp += earnedXp;
    }

    if (q.stats.lastFailedDate === today) {
      q.stats.lastCorrectDate = today;
      q.stats.trophyEligible = false;
    } else {
      q.stats.lastCorrectDate = today;
      q.stats.trophyEligible = true;
      checkAndUnlockBadges();
    }

    playSound('correct');
    confetti({ particleCount: 35, spread: 65, origin: { y: 0.8 } });
  } else {
    q.stats.lastFailedDate = today;
    q.stats.trophyEligible = false;
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
  } else {
    dbSaveUserProgress(q);
  }

  saveStats();
  checkDailyStreak();

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

  const today = getLocalDateString();
  const alreadyRewardedToday = (q.stats && q.stats.lastXpDate === today);
  const earnedXp = alreadyRewardedToday ? 0 : 15;

  session.score += 1;
  session.xpEarned += earnedXp;
  if (!alreadyRewardedToday) {
    if (!q.stats) q.stats = getDefaultQuestionStats();
    q.stats.lastXpDate = today;
    state.stats.xp += earnedXp;
    state.stats.totalCorrect += 1;
  }
  if (!q.stats) q.stats = getDefaultQuestionStats();
  q.stats.correct += 1;
  q.stats.consecutiveCorrect = 1;
  q.flagged = false;
  q.stats.lastCorrectDate = today;
  if (q.stats.lastFailedDate === today) {
    delete q.stats.lastFailedDate;
  }
  q.stats.trophyEligible = true;
  checkAndUnlockBadges();
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
  } else {
    dbSaveUserProgress(q);
  }

  saveStats();
  checkDailyStreak();

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
  const breadcrumbEl = document.getElementById('session-breadcrumb');
  if (breadcrumbEl) {
    breadcrumbEl.textContent = `${q.organ} > ${q.category} > ${q.entity}`;
  }

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
  
  const today = getLocalDateString();
  let feedbackSub = '';
  if (isExact && q.stats && q.stats.lastFailedDate === today) {
    feedbackSub = '<div class="text-[11px] text-amber-300 font-mono mt-1 flex items-center space-x-1.5"><i data-lucide="clock" class="w-3.5 h-3.5 shrink-0"></i><span>⏳ Défi Trophée : question ratée plus tôt aujourd\'hui. Validation du trophée disponible dès demain lors de votre prochaine réussite !</span></div>';
  }
  document.getElementById('session-feedback-title').innerHTML = `<span>${isExact ? "Exact ! Analyse diagnostique parfaite." : "Erreur diagnostique !"}</span>${feedbackSub}`;
  
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

  // Révéler la Fiche OMS & Topo de cours associé à la lésion lors de la correction
  const sessionTopoBox = document.getElementById('session-lesion-topo-box');
  const sessionTopoTitle = document.getElementById('session-lesion-topo-title');
  const sessionTopoContent = document.getElementById('session-lesion-topo-content');
  const sLesionKey = `${q.organ || 'Autre'}::${q.category || 'Général'}::${q.entity || 'Lésion non spécifiée'}`;
  const sTopoNote = (state.lesionNotes && state.lesionNotes[sLesionKey]) ? state.lesionNotes[sLesionKey] : null;

  if (sessionTopoBox && sessionTopoContent) {
    if (sTopoNote && sTopoNote.content && sTopoNote.content.trim()) {
      sessionTopoBox.classList.remove('hidden');
      if (sessionTopoTitle) sessionTopoTitle.textContent = `📘 Critères OMS & Topo : ${escapeHtml(q.entity)}`;
      sessionTopoContent.innerHTML = renderLesionTopoHtml(sTopoNote.content);
    } else {
      sessionTopoBox.classList.add('hidden');
      sessionTopoContent.innerHTML = '';
    }
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
  updateQuestionAuthorSelect();
  renderStatementTemplates();
  onFormatChange();
}

function populateHierarchyDatalists(organInputId, categoryInputId, entityInputId, organDatalistId, categoryDatalistId, entityDatalistId) {
  const organInput = document.getElementById(organInputId);
  const categoryInput = document.getElementById(categoryInputId);
  const entityInput = document.getElementById(entityInputId);

  const organDatalist = document.getElementById(organDatalistId);
  const categoryDatalist = document.getElementById(categoryDatalistId);
  const entityDatalist = document.getElementById(entityDatalistId);

  const typedOrgan = (organInput ? organInput.value : '').trim();
  const typedCat = (categoryInput ? categoryInput.value : '').trim();

  const allItems = [...(state.questions || []), ...(state.cases || [])];

  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // 1. Tous les organes uniques
  const organMap = new Map(); // normOrgan -> casse d'origine
  allItems.forEach(q => {
    const o = (q.organ || '').trim();
    if (o && norm(o) !== 'autre') {
      const k = norm(o);
      if (!organMap.has(k)) organMap.set(k, o);
    }
  });

  const allOrgans = Array.from(organMap.values()).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  if (organDatalist) {
    organDatalist.innerHTML = allOrgans.map(o => `<option value="${escapeHtml(o)}">`).join('');
  }

  // 2. Identifier les organes correspondants pour typedOrgan
  const normTypedOrgan = norm(typedOrgan);
  let matchedOrgans = [];
  if (normTypedOrgan) {
    if (organMap.has(normTypedOrgan)) {
      matchedOrgans = [organMap.get(normTypedOrgan)];
    } else {
      matchedOrgans = allOrgans.filter(o => norm(o).startsWith(normTypedOrgan));
      if (matchedOrgans.length === 0) {
        matchedOrgans = allOrgans.filter(o => norm(o).includes(normTypedOrgan));
      }
    }
  }

  const organMatches = (itemOrgan) => {
    if (!normTypedOrgan) return true; // Si aucun organe n'est saisi, afficher toutes les catégories
    if (matchedOrgans.length > 0) {
      const normItem = norm(itemOrgan);
      return matchedOrgans.some(mo => norm(mo) === normItem);
    }
    // Organe nouveau en cours de création
    return norm(itemOrgan) === normTypedOrgan;
  };

  // 3. Catégories filtrées strictement par l'organe saisi
  const categoryMap = new Map(); // normCat -> casse d'origine
  allItems.forEach(q => {
    const o = (q.organ || '').trim();
    const c = (q.category || '').trim();
    if (!organMatches(o)) return;
    if (c && norm(c) !== 'general') {
      const k = norm(c);
      if (!categoryMap.has(k)) categoryMap.set(k, c);
    }
  });

  const availableCategories = Array.from(categoryMap.values()).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  if (categoryDatalist) {
    categoryDatalist.innerHTML = availableCategories.map(c => `<option value="${escapeHtml(c)}">`).join('');
  }

  // 4. Lésions / Entités filtrées strictement par l'organe ET la catégorie
  const normTypedCat = norm(typedCat);
  let matchedCategories = [];
  if (normTypedCat) {
    if (categoryMap.has(normTypedCat)) {
      matchedCategories = [categoryMap.get(normTypedCat)];
    } else {
      matchedCategories = availableCategories.filter(cat => norm(cat).startsWith(normTypedCat));
      if (matchedCategories.length === 0) {
        matchedCategories = availableCategories.filter(cat => norm(cat).includes(normTypedCat));
      }
    }
  }

  const categoryMatches = (itemCat) => {
    if (!normTypedCat) return true; // Si pas de catégorie saisie, afficher toutes les lésions de cet organe
    if (matchedCategories.length > 0) {
      const normItem = norm(itemCat);
      return matchedCategories.some(mc => norm(mc) === normItem);
    }
    return norm(itemCat) === normTypedCat;
  };

  const entityMap = new Map(); // normEnt -> casse d'origine
  allItems.forEach(q => {
    const o = (q.organ || '').trim();
    const c = (q.category || '').trim();
    const e = (q.entity || '').trim();
    if (!organMatches(o)) return;
    if (!categoryMatches(c)) return;
    if (e && norm(e) !== 'non specifie') {
      const k = norm(e);
      if (!entityMap.has(k)) entityMap.set(k, e);
    }
  });

  const availableEntities = Array.from(entityMap.values()).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  if (entityDatalist) {
    entityDatalist.innerHTML = availableEntities.map(e => `<option value="${escapeHtml(e)}">`).join('');
  }
}

function updateEditorDatalists() {
  // 1. Filtrage hiérarchique pour le formulaire de Questions simples
  populateHierarchyDatalists(
    'form-q-organ',
    'form-q-category',
    'form-q-entity',
    'datalist-organs',
    'datalist-categories',
    'datalist-entities'
  );

  // 2. Filtrage hiérarchique indépendant pour le Dossier Progressif (DP)
  populateHierarchyDatalists(
    'form-dp-organ',
    'form-dp-category',
    'form-dp-entity',
    'datalist-dp-organs',
    'datalist-dp-categories',
    'datalist-dp-entities'
  );

  // 3. Mettre à jour dynamiquement les pré-phrases dédiées à cet organe
  renderStatementTemplates();
}
window.updateEditorDatalists = updateEditorDatalists;

function renderEditorTagsSelector() {
  const container = document.getElementById('editor-tags-pills');
  if (!container) return;
  container.innerHTML = '';

  const visibleTags = (state.customTags || []).filter(t => t && !t.startsWith('ROLE_') && !t.startsWith('UPROG:') && !t.startsWith('USTATS:') && !t.startsWith('DEL_'));

  visibleTags.forEach(tag => {
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

function isImageFile(f) {
  if (!f) return false;
  if (f.type && f.type.startsWith('image/')) return true;
  const ext = (f.name || '').split('.').pop().toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'heic'].includes(ext);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target ? e.target.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

async function attachFilesToEditor(files) {
  if (!files || files.length === 0) return;
  const validFiles = Array.from(files).filter(isImageFile);
  if (validFiles.length === 0) return;

  for (const file of validFiles) {
    let localPreviewUrl = "";
    try {
      localPreviewUrl = await compressImageToDataUrl(file);
    } catch(e) {
      try { localPreviewUrl = await readFileAsDataUrl(file); } catch(err) {}
    }

    const count = state.editorUploadedImages.length + 1;
    const defaultCaption = (file.name && file.name !== 'image.png' && file.name !== 'blob' && !file.name.startsWith('lame_'))
      ? file.name.replace(/\.[^/.]+$/, "")
      : `Lame microscopique ${count}`;

    const imgObj = {
      url: localPreviewUrl || "",
      caption: defaultCaption,
      uploading: true
    };
    state.editorUploadedImages.push(imgObj);

    // Upload vers Supabase Storage en tâche de fond sans bloquer l'aperçu local instantané
    uploadImageFile(file).then(cloudUrl => {
      if (cloudUrl) {
        imgObj.url = cloudUrl;
      }
      imgObj.uploading = false;
      renderEditorUploadedImages();
    }).catch(err => {
      console.warn("Upload lame background err:", err);
      imgObj.uploading = false;
    });
  }

  if (!state.editorSelectedTags.has('Lame')) {
    state.editorSelectedTags.add('Lame');
    renderEditorTagsSelector();
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
  const validFiles = Array.from(files).filter(isImageFile);
  if (validFiles.length === 0) return;

  if (!state.editorUploadedExplanationImages) state.editorUploadedExplanationImages = [];

  for (const file of validFiles) {
    let localPreviewUrl = "";
    try {
      localPreviewUrl = await compressImageToDataUrl(file);
    } catch(e) {
      try { localPreviewUrl = await readFileAsDataUrl(file); } catch(err) {}
    }

    const count = state.editorUploadedExplanationImages.length + 1;
    const defaultCaption = (file.name && file.name !== 'image.png' && file.name !== 'blob' && !file.name.startsWith('schema_'))
      ? file.name.replace(/\.[^/.]+$/, "")
      : `Schéma explicatif ${count}`;

    const imgObj = {
      url: localPreviewUrl || "",
      caption: defaultCaption,
      uploading: true
    };
    state.editorUploadedExplanationImages.push(imgObj);

    uploadImageFile(file).then(cloudUrl => {
      if (cloudUrl) {
        imgObj.url = cloudUrl;
      }
      imgObj.uploading = false;
      renderEditorUploadedExplanationImages();
    }).catch(err => {
      console.warn("Upload schéma background err:", err);
      imgObj.uploading = false;
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

function handleStatementDropzoneClick(e) {
  setLastActiveImageZone('statement');
  if (e && e.target && e.target.closest('button')) {
    return;
  }
  const fileInput = document.getElementById('editor-file-input');
  if (fileInput) fileInput.click();
}

async function pasteClipboardToStatement(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  setLastActiveImageZone('statement');

  try {
    if (navigator.clipboard && navigator.clipboard.read) {
      const items = await navigator.clipboard.read();
      const imageFiles = [];
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            imageFiles.push(new File([blob], "lame_microscopique.png", { type }));
          }
        }
      }
      if (imageFiles.length > 0) {
        await attachFilesToEditor(imageFiles);
        return;
      }
    }
  } catch (err) {
    console.warn("Clipboard read API (statement):", err);
  }

  const dropzone = document.getElementById('editor-image-dropzone');
  if (dropzone) {
    dropzone.focus();
    dropzone.classList.add('border-teal-400', 'ring-2', 'ring-teal-400/50');
  }
  showToast("📋 Zone de lame prête : appuyez sur ⌘V ou Ctrl+V pour coller !", "info");
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
    const modalTemplates = document.getElementById('modal-manage-statement-templates');
    if (modalTemplates && !modalTemplates.classList.contains('hidden')) return;

    const items = (e.clipboardData || window.clipboardData)?.items;
    const files = (e.clipboardData || window.clipboardData)?.files;

    const imageFiles = [];
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
    }
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (isImageFile(f) && !imageFiles.includes(f)) {
          imageFiles.push(f);
        }
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

// =========================================================================
// --- MODALE DE CONFIRMATION D'ENREGISTREMENT FLUIDE & REDIRECTION BANQUE ---
// =========================================================================
let saveSuccessModalTimer = null;
let saveSuccessModalCountdownSec = 3;
let pendingHighlightedItem = null; // { id, organ, category, entity, isCase }

function updateSaveModalCloudStatus(status, errorMsg = '') {
  const cloudCard = document.getElementById('save-success-cloud-card');
  const cloudIconBox = document.getElementById('save-success-cloud-icon-box');
  const cloudIcon = document.getElementById('save-success-cloud-icon');
  const cloudPill = document.getElementById('save-success-cloud-pill');
  const cloudDesc = document.getElementById('save-success-cloud-desc');

  if (status === 'synced') {
    if (cloudCard) cloudCard.className = "flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-teal-500/30";
    if (cloudIconBox) cloudIconBox.className = "w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0";
    if (cloudIcon) {
      cloudIcon.setAttribute('data-lucide', 'cloud');
      cloudIcon.className = "w-4 h-4 text-teal-400";
    }
    if (cloudPill) {
      cloudPill.className = "text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30";
      cloudPill.textContent = "✓ EN LIGNE";
    }
    if (cloudDesc) cloudDesc.textContent = "Synchronisé avec le serveur Supabase. Immédiatement accessible sur tous vos appareils.";
  } else if (status === 'syncing') {
    if (cloudCard) cloudCard.className = "flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-amber-500/30";
    if (cloudIconBox) cloudIconBox.className = "w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0";
    if (cloudIcon) {
      cloudIcon.setAttribute('data-lucide', 'loader-2');
      cloudIcon.className = "w-4 h-4 text-amber-400 animate-spin";
    }
    if (cloudPill) {
      cloudPill.className = "text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30";
      cloudPill.textContent = "ENVOI CLOUD...";
    }
    if (cloudDesc) cloudDesc.textContent = "Publication en cours dans la base collective Supabase...";
  } else if (status === 'error') {
    if (cloudCard) cloudCard.className = "flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-rose-500/30";
    if (cloudIconBox) cloudIconBox.className = "w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0";
    if (cloudIcon) {
      cloudIcon.setAttribute('data-lucide', 'alert-triangle');
      cloudIcon.className = "w-4 h-4 text-rose-400";
    }
    if (cloudPill) {
      cloudPill.className = "text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30";
      cloudPill.textContent = "⚠️ SYNCHRO ATTENTE";
    }
    if (cloudDesc) cloudDesc.textContent = errorMsg || "Enregistré en local sur cet appareil. Synchronisation Cloud en attente.";
  } else {
    // localOnly
    if (cloudCard) cloudCard.className = "flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800";
    if (cloudIconBox) cloudIconBox.className = "w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0";
    if (cloudIcon) {
      cloudIcon.setAttribute('data-lucide', 'cloud');
      cloudIcon.className = "w-4 h-4 text-slate-400";
    }
    if (cloudPill) {
      cloudPill.className = "text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700";
      cloudPill.textContent = "STOCKAGE LOCAL";
    }
    if (cloudDesc) cloudDesc.textContent = "Enregistré sur cet appareil dans votre banque personnelle.";
  }

  if (window.lucide) lucide.createIcons();
}
window.updateSaveModalCloudStatus = updateSaveModalCloudStatus;

function openSaveSuccessModal({ id, organ, category, entity, question, format, imagesCount, isEdit, isCase, cloudStatus, cloudErrorMsg }) {
  pendingHighlightedItem = { id, organ, category, entity, isCase: Boolean(isCase) };

  const modal = document.getElementById('modal-save-success');
  if (!modal) return;

  const titleEl = document.getElementById('save-success-title');
  if (titleEl) {
    if (isCase) {
      titleEl.textContent = isEdit ? "Dossier Progressif mis à jour !" : "Dossier Progressif enregistré !";
    } else {
      titleEl.textContent = isEdit ? "Question mise à jour avec succès !" : "Question enregistrée avec succès !";
    }
  }

  const subtitleEl = document.getElementById('save-success-subtitle');
  if (subtitleEl) {
    subtitleEl.textContent = isCase
      ? "Le cas clinique et toutes ses étapes sont bien enregistrés."
      : "Votre question est bien enregistrée et immédiatement disponible pour vos entraînements.";
  }

  const formatBadge = document.getElementById('save-success-format-badge');
  if (formatBadge) {
    if (isCase) {
      formatBadge.textContent = "📋 Dossier Progressif";
      formatBadge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30";
    } else {
      formatBadge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30";
      formatBadge.textContent = format === 'qcm' ? '☑️ QCM' : (format === 'piege' ? '⚠️ Vrai/Faux' : (format === 'ouverte' ? '✍️ Ouverte' : '🔘 QCU'));
    }
  }

  const hierarchyBadge = document.getElementById('save-success-hierarchy-badge');
  if (hierarchyBadge) {
    hierarchyBadge.textContent = `${organ || 'Général'} › ${category || 'Général'} › ${entity || 'Lésion'}`;
  }

  const textEl = document.getElementById('save-success-question-text');
  if (textEl) {
    textEl.textContent = question || '(Sans énoncé)';
  }

  const mediaBadge = document.getElementById('save-success-media-badge');
  const mediaCountEl = document.getElementById('save-success-media-count');
  if (mediaBadge && mediaCountEl) {
    if (imagesCount > 0) {
      mediaBadge.classList.remove('hidden');
      mediaBadge.classList.add('flex');
      mediaCountEl.textContent = `${imagesCount} image${imagesCount > 1 ? 's' : ''}`;
    } else {
      mediaBadge.classList.add('hidden');
      mediaBadge.classList.remove('flex');
    }
  }

  updateSaveModalCloudStatus(cloudStatus || 'syncing', cloudErrorMsg || '');

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();

  startSaveModalCountdown();
}

function startSaveModalCountdown() {
  cancelSaveModalCountdown();
  saveSuccessModalCountdownSec = 3;
  const secEl = document.getElementById('save-modal-countdown-sec');
  const boxEl = document.getElementById('save-modal-countdown-box');
  if (boxEl) boxEl.classList.remove('hidden');
  if (secEl) secEl.textContent = saveSuccessModalCountdownSec;

  saveSuccessModalTimer = setInterval(() => {
    saveSuccessModalCountdownSec--;
    if (secEl) secEl.textContent = saveSuccessModalCountdownSec;
    if (saveSuccessModalCountdownSec <= 0) {
      cancelSaveModalCountdown();
      handleSaveModalGoToBank();
    }
  }, 1000);
}

function cancelSaveModalCountdown() {
  if (saveSuccessModalTimer) {
    clearInterval(saveSuccessModalTimer);
    saveSuccessModalTimer = null;
  }
  const boxEl = document.getElementById('save-modal-countdown-box');
  if (boxEl) boxEl.classList.add('hidden');
}

function closeSaveSuccessModal() {
  cancelSaveModalCountdown();
  const modal = document.getElementById('modal-save-success');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleSaveModalGoToBank() {
  cancelSaveModalCountdown();
  if (pendingHighlightedItem) {
    const { id, organ, category, entity, isCase } = pendingHighlightedItem;
    goToBankAndHighlightQuestion(id, organ, category, entity, isCase);
  } else {
    closeSaveSuccessModal();
    switchTab('bank');
  }
}

function handleSaveModalCreateNew() {
  cancelSaveModalCountdown();
  closeSaveSuccessModal();
  if (pendingHighlightedItem && pendingHighlightedItem.isCase) {
    if (typeof resetDPForm === 'function') resetDPForm();
  } else {
    resetQuestionForm();
  }
  showToast("Prêt pour la question suivante !", "info");
  const scrollTarget = document.getElementById(pendingHighlightedItem && pendingHighlightedItem.isCase ? 'creator-box-dp' : 'creator-box-simple');
  if (scrollTarget) scrollTarget.scrollIntoView({ behavior: 'smooth' });
}

function goToBankAndHighlightQuestion(id, organ, category, entity, isCase = false) {
  closeSaveSuccessModal();

  // 1. Réinitialiser la recherche et filtres pour garantir la visibilité de la question
  const searchInput = document.getElementById('bank-search-input');
  if (searchInput) searchInput.value = '';
  const statusFilter = document.getElementById('bank-filter-status');
  if (statusFilter) statusFilter.value = 'all';
  const formatFilter = document.getElementById('bank-filter-format');
  if (formatFilter) formatFilter.value = 'all';
  const tagFilter = document.getElementById('bank-filter-tag');
  if (tagFilter) tagFilter.value = 'all';

  // 2. Positionner l'organe dans state et le select
  state.bankSelectedOrgan = organ || 'all';
  state.bankSelectedCategory = 'all';
  const organSelect = document.getElementById('bank-filter-organ');
  if (organSelect && organ) organSelect.value = organ;

  // 3. Déplier l'organe s'il était replié
  if (state.bankCollapsedOrgans && state.bankCollapsedOrgans.has(organ)) {
    state.bankCollapsedOrgans.delete(organ);
  }

  // 4. Déplier la lésion exacte (clé '::')
  const savedLesionKey = `${organ || 'Autre'}::${category || 'Général'}::${entity || 'Lésion non spécifiée'}`;
  if (state.bankExpandedLesions) {
    state.bankExpandedLesions.add(savedLesionKey);
  }

  // 5. Basculer vers l'onglet Ma Banque
  switchTab('bank');

  // 6. Scroll et surbrillance sur la carte
  setTimeout(() => {
    const cardId = isCase ? `bank-case-card-${id}` : `bank-question-card-${id}`;
    const cardEl = document.getElementById(cardId);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardEl.classList.add('highlight-saved-item');

      setTimeout(() => {
        cardEl.classList.remove('highlight-saved-item');
      }, 4000);
    }
  }, 220);
}

window.openSaveSuccessModal = openSaveSuccessModal;
window.startSaveModalCountdown = startSaveModalCountdown;
window.cancelSaveModalCountdown = cancelSaveModalCountdown;
window.closeSaveSuccessModal = closeSaveSuccessModal;
window.handleSaveModalGoToBank = handleSaveModalGoToBank;
window.handleSaveModalCreateNew = handleSaveModalCreateNew;
window.goToBankAndHighlightQuestion = goToBankAndHighlightQuestion;

async function handleSaveQuestionForm(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('btn-submit-save-question');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  const restoreSubmitBtn = () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
      submitBtn.innerHTML = originalBtnHtml;
    }
  };

  // 0. Visual feedback tactile et immédiat sur le bouton cliqué
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-80', 'cursor-not-allowed');
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Enregistrement...</span>
    `;
  }

  const editId = document.getElementById('form-q-edit-id').value;
  const isEdit = Boolean(editId);
  const format = document.getElementById('form-q-format').value;
  const organ = document.getElementById('form-q-organ').value.trim();
  const category = document.getElementById('form-q-category').value.trim();
  const entity = document.getElementById('form-q-entity').value.trim();
  const question = document.getElementById('form-q-text').value.trim();
  const context = document.getElementById('form-q-context').value.trim();
  const explanation = document.getElementById('form-q-explanation').value.trim();
  const trap = document.getElementById('form-q-trap').value.trim();
  const tags = Array.from(state.editorSelectedTags);
  if ((state.editorUploadedImages.length > 0 || (state.editorUploadedExplanationImages && state.editorUploadedExplanationImages.length > 0)) && !tags.some(t => String(t).trim().toLowerCase() === 'lame')) {
    tags.unshift('Lame');
  }
  const diffEl = document.getElementById('form-q-difficulty');
  const difficulty = diffEl ? diffEl.value : 'facile';
  const cluesEl = document.getElementById('form-q-extreme-clues');
  const extremeClues = cluesEl ? cluesEl.value.trim() : '';

  if (!organ) {
    restoreSubmitBtn();
    showToast("Veuillez renseigner le Niveau 1 : Organe.", "warning");
    document.getElementById('form-q-organ').focus();
    return;
  }
  if (!category) {
    restoreSubmitBtn();
    showToast("Veuillez renseigner le Niveau 2 : Catégorie.", "warning");
    document.getElementById('form-q-category').focus();
    return;
  }
  if (!entity) {
    restoreSubmitBtn();
    showToast("Veuillez renseigner le Niveau 3 : Lésion précise.", "warning");
    document.getElementById('form-q-entity').focus();
    return;
  }
  if (!question) {
    restoreSubmitBtn();
    showToast("Veuillez renseigner l'énoncé de la question.", "warning");
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
        restoreSubmitBtn();
        showToast("En mode Question Ouverte, veuillez renseigner au moins une formulation diagnostique acceptée.", "warning");
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
      restoreSubmitBtn();
      showToast(`En mode ${format === 'qcm' ? 'QCM' : 'QCU'}, veuillez renseigner au moins 2 propositions.`, "warning");
      return;
    }
    if (correct.length === 0) {
      restoreSubmitBtn();
      showToast(`En mode ${format === 'qcm' ? 'QCM' : 'QCU'}, veuillez cocher la case verte de la bonne réponse.`, "warning");
      return;
    }
  }

  const authorSelect = document.getElementById('form-q-author');
  const chosenAuthor = (authorSelect && authorSelect.value && authorSelect.value !== '__NEW__')
    ? authorSelect.value.trim().toLowerCase()
    : ((state.currentUser && state.currentUser.email) ? state.currentUser.email.toLowerCase() : 'padoreau85@gmail.com');

  let savedQuestion = null;

  try {
    if (editId) {
      const idx = state.questions.findIndex(q => q.id === editId);
      if (idx !== -1) {
        const existingStats = state.questions[idx].stats || getDefaultQuestionStats();
        state.questions[idx] = {
          ...state.questions[idx],
          format, organ, category, entity, question, context, explanation, trap, tags, options, correct,
          optionExplanations,
          optionexplanations: optionExplanations,
          difficulty, extremeClues,
          created_by: chosenAuthor,
          acceptedAnswers: [...acceptedAnswers],
          acceptedanswers: [...acceptedAnswers],
          images: [...state.editorUploadedImages],
          explanationImages: [...(state.editorUploadedExplanationImages || [])],
          explanationimages: [...(state.editorUploadedExplanationImages || [])],
          _localEdited: true,
          stats: {
            ...existingStats,
            created_by: chosenAuthor
          }
        };
        savedQuestion = state.questions[idx];
      }
    } else {
      const newQ = {
        id: "q_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        format, organ, category, entity, question, context, explanation, trap, tags, options, correct,
        optionExplanations,
        optionexplanations: optionExplanations,
        difficulty, extremeClues,
        created_by: chosenAuthor,
        acceptedAnswers: [...acceptedAnswers],
        acceptedanswers: [...acceptedAnswers],
        images: [...state.editorUploadedImages],
        explanationImages: [...(state.editorUploadedExplanationImages || [])],
        explanationimages: [...(state.editorUploadedExplanationImages || [])],
        flagged: false,
        mastered: false,
        _localUnsynced: true,
        stats: {
          ...getDefaultQuestionStats(),
          created_by: chosenAuthor
        }
      };
      state.questions.push(newQ);
      savedQuestion = newQ;
    }

    // 1. Sauvegarde locale immédiate (instantanée, 0ms)
    saveQuestions();

    // 2. Réinitialiser immédiatement le formulaire et débloquer le bouton
    resetQuestionForm();
    restoreSubmitBtn();

    // 3. Modale fluide immédiate avec compte à rebours et redirection
    openSaveSuccessModal({
      id: savedQuestion.id,
      organ: savedQuestion.organ,
      category: savedQuestion.category,
      entity: savedQuestion.entity,
      question: savedQuestion.question,
      format: savedQuestion.format,
      imagesCount: (savedQuestion.images ? savedQuestion.images.length : 0) + (savedQuestion.explanationImages ? savedQuestion.explanationImages.length : 0),
      isEdit,
      isCase: false,
      cloudStatus: supabaseClient ? "syncing" : "localOnly",
      cloudErrorMsg: ""
    });

    // 4. Synchronisation Supabase en arrière-plan sans JAMAIS figer l'écran
    if (supabaseClient && savedQuestion) {
      dbUpsertQuestionWithTimeout(savedQuestion, 7000).then(res => {
        if (res && res.success) {
          delete savedQuestion._localUnsynced;
          delete savedQuestion._localEdited;
          saveQuestions();
          broadcastLocalUpdate();
          updateSaveModalCloudStatus("synced");
        } else if (res && res.localOnly) {
          savedQuestion._localUnsynced = true;
          saveQuestions();
          updateSaveModalCloudStatus("localOnly");
        } else {
          savedQuestion._localUnsynced = true;
          saveQuestions();
          updateSaveModalCloudStatus("error", (res && res.error && res.error.message) || "Erreur Supabase");
        }
      }).catch(err => {
        savedQuestion._localUnsynced = true;
        saveQuestions();
        updateSaveModalCloudStatus("error", err.message || "Erreur réseau");
      });
    } else if (savedQuestion) {
      savedQuestion._localUnsynced = true;
      saveQuestions();
    }

  } catch (err) {
    console.error("Erreur enregistrement question:", err);
    showToast("Erreur lors de l'enregistrement de la question.", "error");
    restoreSubmitBtn();
  }
}

// --- MODÈLES DE PHRASES PRÉ-CONSTRUITES D'ÉNONCÉ (GÉNÉRALISTES & PAR ORGANE) ---
function getSavedStatementTemplates() {
  const stored = localStorage.getItem(STORAGE_KEY_STATEMENT_TEMPLATES) || localStorage.getItem("pathotrainer_statement_templates_v1");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(t => typeof t === 'string' && t.trim().length > 0 && !OLD_DEFAULT_STATEMENT_TEMPLATES.includes(t.trim()));
      }
    } catch(e) {}
  }
  return [
    "Quelles sont les propositions exactes concernant :",
    "Quel est le diagnostic le plus probable devant cet aspect histologique :",
    "Parmi les diagnostics différentiels suivants, lequel devez-vous éliminer en priorité :"
  ];
}

function saveStatementTemplates() {
  localStorage.setItem(STORAGE_KEY_STATEMENT_TEMPLATES, JSON.stringify(state.statementTemplates || []));
  if (state.currentUser) {
    if (!state.stats) state.stats = {};
    state.stats.statementTemplates = state.statementTemplates || [];
    saveStats();
  }
}

function getSavedOrganStatementTemplates() {
  const stored = localStorage.getItem(STORAGE_KEY_ORGAN_STATEMENT_TEMPLATES);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch(e) {}
  }
  return JSON.parse(JSON.stringify(DEFAULT_ORGAN_STATEMENT_TEMPLATES));
}

function saveOrganStatementTemplates() {
  localStorage.setItem(STORAGE_KEY_ORGAN_STATEMENT_TEMPLATES, JSON.stringify(state.organStatementTemplates || {}));
  if (state.currentUser) {
    if (!state.stats) state.stats = {};
    state.stats.organStatementTemplates = state.organStatementTemplates || {};
    saveStats();
  }
}

function getOrganTemplatesFor(organName) {
  if (!state.organStatementTemplates) {
    state.organStatementTemplates = getSavedOrganStatementTemplates();
  }
  if (!organName || !organName.trim()) return [];
  const clean = organName.trim().toLowerCase();
  for (const [key, list] of Object.entries(state.organStatementTemplates)) {
    if (key.trim().toLowerCase() === clean && Array.isArray(list)) {
      return list;
    }
  }
  return [];
}

function getOrganExactKey(organName) {
  if (!state.organStatementTemplates) {
    state.organStatementTemplates = getSavedOrganStatementTemplates();
  }
  if (!organName || !organName.trim()) return organName || '';
  const clean = organName.trim().toLowerCase();
  for (const key of Object.keys(state.organStatementTemplates)) {
    if (key.trim().toLowerCase() === clean) return key;
  }
  return organName.trim();
}

function getSavedLesionStatementTemplates() {
  const stored = localStorage.getItem(STORAGE_KEY_LESION_STATEMENT_TEMPLATES);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch(e) {}
  }
  return JSON.parse(JSON.stringify(DEFAULT_LESION_STATEMENT_TEMPLATES));
}

function saveLesionStatementTemplates() {
  localStorage.setItem(STORAGE_KEY_LESION_STATEMENT_TEMPLATES, JSON.stringify(state.lesionStatementTemplates || {}));
  if (state.currentUser) {
    if (!state.stats) state.stats = {};
    state.stats.lesionStatementTemplates = state.lesionStatementTemplates || {};
    saveStats();
  }
}

function getLesionTemplatesFor(lesionName) {
  if (!state.lesionStatementTemplates) {
    state.lesionStatementTemplates = getSavedLesionStatementTemplates();
  }
  if (!lesionName || !lesionName.trim()) return [];
  const clean = lesionName.trim().toLowerCase();
  for (const [key, list] of Object.entries(state.lesionStatementTemplates)) {
    if (key.trim().toLowerCase() === clean && Array.isArray(list)) {
      return list;
    }
  }
  return [];
}

function getLesionExactKey(lesionName) {
  if (!state.lesionStatementTemplates) {
    state.lesionStatementTemplates = getSavedLesionStatementTemplates();
  }
  if (!lesionName || !lesionName.trim()) return lesionName || '';
  const clean = lesionName.trim().toLowerCase();
  for (const key of Object.keys(state.lesionStatementTemplates)) {
    if (key.trim().toLowerCase() === clean) return key;
  }
  return lesionName.trim();
}

function applyStatementTemplate(idx) {
  if (!state.statementTemplates) state.statementTemplates = getSavedStatementTemplates();
  const tmpl = state.statementTemplates[idx];
  if (!tmpl) return;

  const input = document.getElementById('form-q-text');
  if (!input) return;

  let finalText = tmpl.trim();
  if (!finalText.endsWith('?') && !finalText.endsWith(':') && !finalText.endsWith('.')) {
    finalText = `${finalText} `;
  }

  input.value = finalText;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  showRewardToast("Énoncé inséré !", 'sparkles');
}
window.applyStatementTemplate = applyStatementTemplate;

function applyLesionStatementTemplate(lesion, idx) {
  const list = getLesionTemplatesFor(lesion);
  const tmpl = list[idx];
  if (!tmpl) return;

  const entityInput = document.getElementById('form-q-entity');
  if (entityInput && !entityInput.value.trim()) {
    entityInput.value = lesion;
    updateEditorDatalists();
  }

  const input = document.getElementById('form-q-text');
  if (!input) return;

  let finalText = tmpl.trim();
  if (!finalText.endsWith('?') && !finalText.endsWith(':') && !finalText.endsWith('.')) {
    finalText = `${finalText} `;
  }

  input.value = finalText;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  showRewardToast(`Énoncé [${lesion}] inséré !`, 'sparkles');
}
window.applyLesionStatementTemplate = applyLesionStatementTemplate;

function applyOrganStatementTemplate(organ, idx) {
  const list = getOrganTemplatesFor(organ);
  const tmpl = list[idx];
  if (!tmpl) return;

  const organInput = document.getElementById('form-q-organ');
  if (organInput && !organInput.value.trim()) {
    organInput.value = organ;
    updateEditorDatalists();
  }

  const input = document.getElementById('form-q-text');
  if (!input) return;

  let finalText = tmpl.trim();
  if (!finalText.endsWith('?') && !finalText.endsWith(':') && !finalText.endsWith('.')) {
    finalText = `${finalText} `;
  }

  input.value = finalText;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  showRewardToast(`Énoncé [${organ}] inséré !`, 'sparkles');
}
window.applyOrganStatementTemplate = applyOrganStatementTemplate;

function promptAddNewStatementTemplate() {
  const val = prompt("Saisissez votre nouvelle phrase type générale d'énoncé (disponible pour tous les QCM) :\n\n(ex: 'Quelles sont les propositions exactes concernant :', 'Quel est le diagnostic le plus probable devant :')");
  if (val === null) return;
  const trimmed = val.trim();
  if (!trimmed) {
    alert("Le modèle ne peut pas être vide.");
    return;
  }
  if (!state.statementTemplates) state.statementTemplates = getSavedStatementTemplates();
  if (state.statementTemplates.includes(trimmed)) {
    alert("Cette phrase type existe déjà.");
    return;
  }
  state.statementTemplates.push(trimmed);
  saveStatementTemplates();
  renderStatementTemplates();
  showRewardToast(`Phrase type générale enregistrée !`, 'sparkles');
}
window.promptAddNewStatementTemplate = promptAddNewStatementTemplate;

function deleteStatementTemplate(idx) {
  if (!confirm("Voulez-vous supprimer cette phrase type générale ?")) return;
  if (!state.statementTemplates) return;
  state.statementTemplates.splice(idx, 1);
  saveStatementTemplates();
  renderStatementTemplates();
  showRewardToast("Phrase type supprimée.", 'trash-2');
}
window.deleteStatementTemplate = deleteStatementTemplate;

function promptAddNewLesionStatementTemplate(specificLesion = null) {
  let targetLesion = specificLesion;
  if (!targetLesion) {
    const entityInput = document.getElementById('form-q-entity');
    targetLesion = entityInput ? entityInput.value.trim() : '';
  }

  if (!targetLesion) {
    const inputLes = prompt("Pour quelle lésion précise (Niveau 3) souhaitez-vous créer une pré-phrase ?\n\n(ex: Tumeurs borderlines mucineuses, Carcinome lobulaire, CIN-3...)");
    if (inputLes === null) return;
    targetLesion = inputLes.trim();
  }

  if (!targetLesion) {
    alert("Veuillez spécifier un nom de lésion valide.");
    return;
  }

  const exactKey = getLesionExactKey(targetLesion);

  const val = prompt(`Saisissez la nouvelle pré-phrase pour la lésion "${exactKey}" :\n\n(ex: 'Quel est le profil immunohistochimique caractéristique devant...', 'Quel critère histologique permet d'exclure...')`);
  if (val === null) return;
  const trimmed = val.trim();
  if (!trimmed) {
    alert("La pré-phrase ne peut pas être vide.");
    return;
  }

  if (!state.lesionStatementTemplates) state.lesionStatementTemplates = getSavedLesionStatementTemplates();
  if (!state.lesionStatementTemplates[exactKey]) state.lesionStatementTemplates[exactKey] = [];

  if (state.lesionStatementTemplates[exactKey].includes(trimmed)) {
    alert("Cette pré-phrase existe déjà pour cette lésion.");
    return;
  }

  state.lesionStatementTemplates[exactKey].push(trimmed);
  saveLesionStatementTemplates();
  renderStatementTemplates();
  showRewardToast(`Pré-phrase enregistrée pour "${exactKey}" !`, 'sparkles');
}
window.promptAddNewLesionStatementTemplate = promptAddNewLesionStatementTemplate;

function deleteLesionStatementTemplate(lesion, idx) {
  if (!confirm(`Voulez-vous supprimer cette pré-phrase pour la lésion "${lesion}" ?`)) return;
  const exactKey = getLesionExactKey(lesion);
  if (!state.lesionStatementTemplates || !state.lesionStatementTemplates[exactKey]) return;
  state.lesionStatementTemplates[exactKey].splice(idx, 1);
  saveLesionStatementTemplates();
  renderStatementTemplates();
  showRewardToast(`Pré-phrase supprimée de "${exactKey}".`, 'trash-2');
}
window.deleteLesionStatementTemplate = deleteLesionStatementTemplate;

function selectLesionForTemplates(lesion) {
  const entityInput = document.getElementById('form-q-entity');
  if (entityInput) {
    entityInput.value = lesion;
    updateEditorDatalists();
  }
}
window.selectLesionForTemplates = selectLesionForTemplates;

function promptAddNewOrganStatementTemplate(specificOrgan = null) {
  promptAddNewLesionStatementTemplate(specificOrgan);
}
window.promptAddNewOrganStatementTemplate = promptAddNewOrganStatementTemplate;

function deleteOrganStatementTemplate(organ, idx) {
  deleteLesionStatementTemplate(organ, idx);
}
window.deleteOrganStatementTemplate = deleteOrganStatementTemplate;

function renderStatementTemplates() {
  const container = document.getElementById('statement-templates-bar');
  if (!container) return;

  if (!state.statementTemplates) state.statementTemplates = getSavedStatementTemplates();
  if (!state.lesionStatementTemplates) state.lesionStatementTemplates = getSavedLesionStatementTemplates();

  // Nettoyage éventuel des templates obsolètes
  state.statementTemplates = state.statementTemplates.filter(t => typeof t === 'string' && t.trim().length > 0 && !OLD_DEFAULT_STATEMENT_TEMPLATES.includes(t.trim()));

  const entityInput = document.getElementById('form-q-entity');
  const currentLesion = (entityInput ? entityInput.value : '').trim();

  const indicator = document.getElementById('templates-lesion-indicator');
  const labelAddLesion = document.getElementById('label-add-lesion-template');

  let html = '';

  // =========================================================================
  // 1. À GAUCHE : MODÈLES DE PHRASES GÉNÉRALES (Disponibles pour tous les QCM)
  // =========================================================================
  html += `
    <div class="flex items-center space-x-1 shrink-0">
      <span class="text-[10px] font-bold text-teal-400 uppercase tracking-wider px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center space-x-1">
        <span>🌐</span>
        <span>Générales :</span>
      </span>
    </div>
  `;

  html += state.statementTemplates.map((tmpl, idx) => `
    <div class="inline-flex items-center bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl px-2.5 py-1 text-xs text-slate-300 hover:text-white transition group shrink-0 shadow-sm">
      <button type="button" onclick="applyStatementTemplate(${idx})" class="font-medium hover:text-teal-300 transition text-left flex items-center space-x-1" title="Cliquer pour insérer dans l'énoncé">
        <i data-lucide="sparkles" class="w-3 h-3 text-teal-400 shrink-0"></i>
        <span>${escapeHtml(tmpl)}</span>
      </button>
      <button type="button" onclick="event.stopPropagation(); deleteStatementTemplate(${idx})" class="ml-1.5 text-slate-500 hover:text-rose-400 transition opacity-60 group-hover:opacity-100 p-0.5 rounded" title="Supprimer cette phrase type">
        <i data-lucide="x" class="w-2.5 h-2.5"></i>
      </button>
    </div>
  `).join('');

  // SÉPARATEUR VERTICAL NET ENTRE PHRASES GÉNÉRALES ET PRÉ-PHRASES DE LÉSION
  html += `<span class="h-5 w-px bg-slate-700/80 shrink-0 mx-2"></span>`;

  // =========================================================================
  // 2. À DROITE : PRÉ-PHRASES DE LA LÉSION PRÉCISE (Niveau 3 : #form-q-entity)
  // =========================================================================
  if (currentLesion) {
    if (indicator) {
      indicator.textContent = `🏷️ ${currentLesion}`;
      indicator.classList.remove('hidden');
    }
    if (labelAddLesion) {
      labelAddLesion.textContent = `+ Pré-phrase (${currentLesion})`;
    }

    const lesionList = getLesionTemplatesFor(currentLesion);

    html += `
      <div class="flex items-center space-x-1 shrink-0">
        <span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center space-x-1 shadow-sm">
          <i data-lucide="tag" class="w-3 h-3 text-amber-400"></i>
          <span>${escapeHtml(currentLesion)} :</span>
        </span>
      </div>
    `;

    if (lesionList.length > 0) {
      html += lesionList.map((tmpl, idx) => `
        <div class="inline-flex items-center bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 rounded-xl px-2.5 py-1 text-xs text-amber-200 hover:text-white transition group shrink-0 shadow-sm">
          <button type="button" onclick="applyLesionStatementTemplate('${escapeJsString(currentLesion)}', ${idx})" class="font-medium hover:text-amber-100 transition text-left flex items-center space-x-1" title="Cliquer pour insérer dans l'énoncé">
            <i data-lucide="sparkles" class="w-3 h-3 text-amber-400 shrink-0"></i>
            <span>${escapeHtml(tmpl)}</span>
          </button>
          <button type="button" onclick="event.stopPropagation(); deleteLesionStatementTemplate('${escapeJsString(currentLesion)}', ${idx})" class="ml-1.5 text-amber-400/60 hover:text-rose-400 transition opacity-60 group-hover:opacity-100 p-0.5 rounded" title="Supprimer cette pré-phrase">
            <i data-lucide="x" class="w-2.5 h-2.5"></i>
          </button>
        </div>
      `).join('');
    } else {
      html += `
        <button type="button" onclick="promptAddNewLesionStatementTemplate('${escapeJsString(currentLesion)}')" class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 text-amber-300 hover:text-white text-xs transition shrink-0">
          <i data-lucide="plus" class="w-3 h-3"></i>
          <span>+ Créer la 1ère pré-phrase pour ${escapeHtml(currentLesion)}</span>
        </button>
      `;
    }

  } else {
    // Si aucune lésion n'est encore saisie dans le Niveau 3
    if (indicator) indicator.classList.add('hidden');
    if (labelAddLesion) labelAddLesion.textContent = `+ Pré-phrase Lésion`;

    html += `
      <div class="flex items-center space-x-1.5 shrink-0">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center space-x-1">
          <i data-lucide="tag" class="w-3 h-3 text-amber-400"></i>
          <span>Lésions :</span>
        </span>
      </div>
    `;

    // Pastilles d'accès rapide aux lésions ayant déjà des pré-phrases configurées
    const lesionKeys = Object.keys(state.lesionStatementTemplates || {}).filter(k => (state.lesionStatementTemplates[k] || []).length > 0);
    if (lesionKeys.length > 0) {
      html += lesionKeys.map(les => `
        <button type="button" onclick="selectLesionForTemplates('${escapeJsString(les)}')" class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium transition shrink-0 shadow-sm" title="Sélectionner cette lésion">
          <i data-lucide="tag" class="w-3 h-3 text-amber-400"></i>
          <span>${escapeHtml(les)} (${state.lesionStatementTemplates[les].length})</span>
        </button>
      `).join('');
    } else {
      html += `
        <span class="text-[11px] text-slate-500 italic shrink-0">
          Renseignez le Niveau 3 (Lésion) pour afficher ses pré-phrases dédiées
        </span>
      `;
    }
  }

  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}
window.renderStatementTemplates = renderStatementTemplates;

// --- GESTIONNAIRE CENTRALISÉ DES PRÉ-PHRASES DE LÉSIONS (MODAL) ---
function openManageStatementTemplatesModal(initialLesion = null) {
  const modal = document.getElementById('modal-manage-statement-templates');
  if (!modal) return;

  if (!state.statementTemplates) state.statementTemplates = getSavedStatementTemplates();
  if (!state.lesionStatementTemplates) state.lesionStatementTemplates = getSavedLesionStatementTemplates();

  const select = document.getElementById('manage-templates-organ-select');
  if (select) {
    const currentLesion = (initialLesion || document.getElementById('form-q-entity')?.value || '').trim();
    
    // Récupérer toutes les lésions de la base et des templates
    const allLesionsSet = new Set(Object.keys(state.lesionStatementTemplates || {}));
    (state.questions || []).forEach(q => {
      if (q.entity && q.entity.trim()) allLesionsSet.add(q.entity.trim());
    });
    const sortedLesions = Array.from(allLesionsSet).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

    let optHtml = `<option value="__GENERAL__">🌐 Phrases Générales (Tous QCM)</option>`;
    optHtml += sortedLesions.map(l => {
      const count = (getLesionTemplatesFor(l) || []).length;
      return `<option value="${escapeHtml(l)}" ${l.toLowerCase() === currentLesion.toLowerCase() ? 'selected' : ''}>🏷️ ${escapeHtml(l)} (${count})</option>`;
    }).join('');

    select.innerHTML = optHtml;
  }

  renderManageStatementTemplatesList();

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}
window.openManageStatementTemplatesModal = openManageStatementTemplatesModal;

function closeManageStatementTemplatesModal() {
  const modal = document.getElementById('modal-manage-statement-templates');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  renderStatementTemplates();
}
window.closeManageStatementTemplatesModal = closeManageStatementTemplatesModal;

function renderManageStatementTemplatesList() {
  const container = document.getElementById('manage-templates-list-container');
  const select = document.getElementById('manage-templates-organ-select');
  const addLabel = document.getElementById('manage-templates-add-label');
  if (!container || !select) return;

  const selVal = select.value;
  const isGeneral = (selVal === '__GENERAL__');

  if (addLabel) {
    addLabel.textContent = isGeneral 
      ? "Ajouter une phrase type générale (tous QCM)" 
      : `Ajouter une pré-phrase pour la lésion "${selVal}"`;
  }

  let items = [];
  if (isGeneral) {
    items = state.statementTemplates || [];
  } else {
    items = getLesionTemplatesFor(selVal) || [];
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/80">
        <p class="text-xs">Aucune pré-phrase enregistrée pour ${isGeneral ? 'les phrases générales' : `la lésion "${escapeHtml(selVal)}"`}.</p>
        <p class="text-[11px] text-slate-600 mt-1">Utilisez le formulaire ci-dessous pour en ajouter une !</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((t, idx) => `
    <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition group">
      <div class="flex items-center space-x-2 flex-1 pr-2">
        <i data-lucide="${isGeneral ? 'sparkles' : 'tag'}" class="w-3.5 h-3.5 ${isGeneral ? 'text-teal-400' : 'text-amber-400'} shrink-0"></i>
        <span class="text-xs text-slate-200 font-medium">${escapeHtml(t)}</span>
      </div>
      <button type="button" onclick="deleteTemplateInManager('${isGeneral ? 'general' : 'lesion'}', '${escapeJsString(selVal)}', ${idx})" class="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition" title="Supprimer">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}
window.renderManageStatementTemplatesList = renderManageStatementTemplatesList;

function submitNewTemplateInManager(e) {
  if (e && e.preventDefault) e.preventDefault();
  const select = document.getElementById('manage-templates-organ-select');
  const input = document.getElementById('manage-templates-input-text');
  if (!select || !input) return;

  const val = input.value.trim();
  if (!val) return;

  const selVal = select.value;
  const isGeneral = (selVal === '__GENERAL__');

  if (isGeneral) {
    if (!state.statementTemplates) state.statementTemplates = getSavedStatementTemplates();
    if (state.statementTemplates.includes(val)) {
      alert("Cette phrase type existe déjà.");
      return;
    }
    state.statementTemplates.push(val);
    saveStatementTemplates();
  } else {
    const exactKey = getLesionExactKey(selVal);
    if (!state.lesionStatementTemplates) state.lesionStatementTemplates = getSavedLesionStatementTemplates();
    if (!state.lesionStatementTemplates[exactKey]) state.lesionStatementTemplates[exactKey] = [];
    if (state.lesionStatementTemplates[exactKey].includes(val)) {
      alert("Cette pré-phrase existe déjà pour cette lésion.");
      return;
    }
    state.lesionStatementTemplates[exactKey].push(val);
    saveLesionStatementTemplates();
  }

  input.value = '';
  renderManageStatementTemplatesList();
  renderStatementTemplates();
  showRewardToast("Pré-phrase ajoutée !", 'sparkles');
}
window.submitNewTemplateInManager = submitNewTemplateInManager;

function deleteTemplateInManager(type, key, idx) {
  if (type === 'general') {
    deleteStatementTemplate(idx);
  } else {
    deleteLesionStatementTemplate(key, idx);
  }
  renderManageStatementTemplatesList();
}
window.deleteTemplateInManager = deleteTemplateInManager;

function promptAddNewLesionForTemplates() {
  const newLes = prompt("Saisissez le nom de la nouvelle lésion (Niveau 3) :\n\n(ex: Tumeurs borderlines mucineuses, Carcinome lobulaire...)");
  if (!newLes || !newLes.trim()) return;
  const clean = newLes.trim();
  if (!state.lesionStatementTemplates) state.lesionStatementTemplates = getSavedLesionStatementTemplates();
  if (!state.lesionStatementTemplates[clean]) {
    state.lesionStatementTemplates[clean] = [];
    saveLesionStatementTemplates();
  }
  openManageStatementTemplatesModal(clean);
}
window.promptAddNewLesionForTemplates = promptAddNewLesionForTemplates;
window.deleteStatementTemplate = deleteStatementTemplate;

// --- CRÉATION DE QUESTION DEPUIS LA HIÉRARCHIE (ORGANE, CATÉGORIE, LÉSION) ---
function createQuestionForOrgan(organ) {
  if (isReader()) {
    alert("La rédaction de questions est réservée aux comptes Créateurs.");
    switchTab('create');
    return;
  }

  switchTab('create');
  setCreatorMode('simple');
  resetQuestionForm();

  const organEl = document.getElementById('form-q-organ');
  const catEl = document.getElementById('form-q-category');
  const entEl = document.getElementById('form-q-entity');

  if (organEl) organEl.value = organ || '';
  if (catEl) catEl.value = '';
  if (entEl) entEl.value = '';

  const dpOrgan = document.getElementById('form-dp-organ');
  const dpCategory = document.getElementById('form-dp-category');
  const dpEntity = document.getElementById('form-dp-entity');
  if (dpOrgan) dpOrgan.value = organ || '';
  if (dpCategory) dpCategory.value = '';
  if (dpEntity) dpEntity.value = '';

  updateEditorDatalists();
  renderStatementTemplates();

  state.bankSelectedOrgan = organ;

  setTimeout(() => {
    if (catEl) {
      catEl.focus();
      catEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 120);

  if (typeof showRewardToast === 'function') {
    showRewardToast(`Organe prêt : ${organ}`, 'plus-circle');
  }
}
window.createQuestionForOrgan = createQuestionForOrgan;

function createQuestionForCategory(organ, category) {
  if (isReader()) {
    alert("La rédaction de questions est réservée aux comptes Créateurs.");
    switchTab('create');
    return;
  }

  switchTab('create');
  setCreatorMode('simple');
  resetQuestionForm();

  const organEl = document.getElementById('form-q-organ');
  const catEl = document.getElementById('form-q-category');
  const entEl = document.getElementById('form-q-entity');

  if (organEl) organEl.value = organ || '';
  if (catEl) catEl.value = category || '';
  if (entEl) entEl.value = '';

  const dpOrgan = document.getElementById('form-dp-organ');
  const dpCategory = document.getElementById('form-dp-category');
  const dpEntity = document.getElementById('form-dp-entity');
  if (dpOrgan) dpOrgan.value = organ || '';
  if (dpCategory) dpCategory.value = category || '';
  if (dpEntity) dpEntity.value = '';

  updateEditorDatalists();
  renderStatementTemplates();

  state.bankSelectedOrgan = organ;
  state.bankSelectedCategory = category;

  setTimeout(() => {
    if (entEl) {
      entEl.focus();
      entEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 120);

  if (typeof showRewardToast === 'function') {
    showRewardToast(`Catégorie prête : ${category}`, 'plus-circle');
  }
}
window.createQuestionForCategory = createQuestionForCategory;

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
  renderStatementTemplates();

  // Mémoriser pour le positionnement dans Ma Banque
  state.bankSelectedOrgan = organ;
  state.bankSelectedCategory = category;

  // Ouvrir automatiquement cette lésion dans Ma Banque pour le retour
  const lesionKey = `${organ}::${category}::${entity}`;
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
  updateEditorDatalists();
  document.getElementById('form-q-text').value = q.question || '';
  document.getElementById('form-q-context').value = q.context || '';
  document.getElementById('form-q-explanation').value = q.explanation || '';
  document.getElementById('form-q-trap').value = q.trap || '';

  const diffEl = document.getElementById('form-q-difficulty');
  if (diffEl) diffEl.value = q.difficulty || 'facile';
  const cluesEl = document.getElementById('form-q-extreme-clues');
  if (cluesEl) cluesEl.value = q.extremeClues || '';
  onDifficultyChange();
  updateQuestionAuthorSelect(getQuestionAuthorEmail(q));

  state.editorUploadedImages = q.images ? [...q.images] : [];
  state.editorUploadedExplanationImages = q.explanationImages ? [...q.explanationImages] : [];
  state.editorSelectedTags = new Set(q.tags || []);
  renderEditorUploadedImages();
  renderEditorUploadedExplanationImages();
  renderEditorTagsSelector();
  renderStatementTemplates();

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

async function deleteQuestion(id) {
  if (!isAuthorizedToDelete()) {
    showToast("Action refusée : Seuls Pierre-Alain et Samy peuvent supprimer une question.", "warning");
    alert("Action réservée aux administrateurs (Pierre-Alain & Samy).\nPour protéger l'intégrité de la banque collective contre toute perte de données, seuls Pierre-Alain et Samy sont habilités à supprimer définitivement une question.");
    return;
  }
  const targetQ = state.questions.find(q => q.id === id);
  const qTitle = targetQ ? `"${(targetQ.question || '').substring(0, 60)}..."` : 'cette question';
  if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${qTitle} de la banque partagée ?`)) return;

  // 1. Enregistrer dans la liste locale des tombstones supprimés
  try {
    const del = JSON.parse(localStorage.getItem('pathosorus_deleted_ids') || '[]');
    if (!del.includes(id)) {
      del.push(id);
      localStorage.setItem('pathosorus_deleted_ids', JSON.stringify(del));
    }
  } catch(e) {}

  // 2. Retirer de la mémoire locale immédiatement
  state.questions = state.questions.filter(q => q.id !== id);
  if (state.userProgress && state.userProgress[id]) {
    delete state.userProgress[id];
  }
  saveQuestions();
  broadcastLocalUpdate();

  // 3. Supprimer sur Supabase (questions + user_progress + tombstone DEL_Q:id)
  await dbDeleteQuestion(id);

  // 4. Mettre à jour UPROG sans la question supprimée
  debouncedSyncUserProgressTagToCloud();

  showToast("Question supprimée avec succès.", "info");
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
    optionExplanations: ["", "", "", ""],
    acceptedAnswers: [""],
    correct: [0],
    explanation: "",
    trap: ""
  };
}

function setDPStepFormat(stepIdx, format) {
  const step = state.dpSteps[stepIdx];
  if (!step) return;
  step.format = format;
  if (format === 'qcu') {
    if (step.correct.length > 1) step.correct = [step.correct[0]];
    else if (step.correct.length === 0) step.correct = [0];
  } else if (format === 'ouverte') {
    if (!step.acceptedAnswers || step.acceptedAnswers.length === 0) {
      step.acceptedAnswers = [""];
    }
  } else {
    // qcm
    if (!step.options || step.options.length === 0) {
      step.options = ["", "", "", ""];
      step.optionExplanations = ["", "", "", ""];
      step.correct = [0];
    }
  }
  renderDPStepsBuilder();
}
window.setDPStepFormat = setDPStepFormat;

function addOptionToDPStep(stepIdx) {
  const step = state.dpSteps[stepIdx];
  if (!step) return;
  if (!step.options) step.options = [];
  if (!step.optionExplanations) step.optionExplanations = [];
  step.options.push("");
  step.optionExplanations.push("");
  renderDPStepsBuilder();
}
window.addOptionToDPStep = addOptionToDPStep;

function removeOptionFromDPStep(stepIdx, optIdx) {
  const step = state.dpSteps[stepIdx];
  if (!step) return;
  if (step.options.length <= 2) {
    alert("Une question à choix multiples doit comporter au moins 2 propositions.");
    return;
  }
  step.options.splice(optIdx, 1);
  if (step.optionExplanations) step.optionExplanations.splice(optIdx, 1);
  step.correct = (step.correct || [])
    .filter(i => i !== optIdx)
    .map(i => i > optIdx ? i - 1 : i);
  if (step.correct.length === 0) step.correct = [0];
  renderDPStepsBuilder();
}
window.removeOptionFromDPStep = removeOptionFromDPStep;

function updateDPStepOptionText(stepIdx, optIdx, text) {
  if (state.dpSteps[stepIdx] && state.dpSteps[stepIdx].options) {
    state.dpSteps[stepIdx].options[optIdx] = text;
  }
}
window.updateDPStepOptionText = updateDPStepOptionText;

function updateDPStepOptionExplanation(stepIdx, optIdx, exp) {
  if (state.dpSteps[stepIdx]) {
    if (!state.dpSteps[stepIdx].optionExplanations) state.dpSteps[stepIdx].optionExplanations = [];
    state.dpSteps[stepIdx].optionExplanations[optIdx] = exp;
  }
}
window.updateDPStepOptionExplanation = updateDPStepOptionExplanation;

function addAcceptedAnswerToDPStep(stepIdx) {
  const step = state.dpSteps[stepIdx];
  if (!step) return;
  if (!step.acceptedAnswers) step.acceptedAnswers = [];
  step.acceptedAnswers.push("");
  renderDPStepsBuilder();
}
window.addAcceptedAnswerToDPStep = addAcceptedAnswerToDPStep;

function removeAcceptedAnswerFromDPStep(stepIdx, ansIdx) {
  const step = state.dpSteps[stepIdx];
  if (!step || !step.acceptedAnswers || step.acceptedAnswers.length <= 1) return;
  step.acceptedAnswers.splice(ansIdx, 1);
  renderDPStepsBuilder();
}
window.removeAcceptedAnswerFromDPStep = removeAcceptedAnswerFromDPStep;

function updateDPStepAcceptedAnswer(stepIdx, ansIdx, val) {
  if (state.dpSteps[stepIdx] && state.dpSteps[stepIdx].acceptedAnswers) {
    state.dpSteps[stepIdx].acceptedAnswers[ansIdx] = val;
  }
}
window.updateDPStepAcceptedAnswer = updateDPStepAcceptedAnswer;

function getDPStepAcceptedAnswers(step) {
  const list = [];
  if (Array.isArray(step.acceptedAnswers)) {
    step.acceptedAnswers.forEach(a => {
      const s = (a || '').trim();
      if (s && !list.includes(s)) list.push(s);
    });
  }
  if (Array.isArray(step.options) && step.format === 'ouverte') {
    step.options.forEach(o => {
      const s = (o || '').trim();
      if (s && !list.includes(s)) list.push(s);
    });
  }
  return list;
}
window.getDPStepAcceptedAnswers = getDPStepAcceptedAnswers;

function renderDPTagsSelector() {
  const container = document.getElementById('dp-tags-pills');
  if (!container) return;
  container.innerHTML = '';

  const visibleTags = (state.customTags || []).filter(t => t && !t.startsWith('ROLE_') && !t.startsWith('UPROG:') && !t.startsWith('USTATS:') && !t.startsWith('DEL_'));

  visibleTags.forEach(tag => {
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
    // Normalisation des champs
    if (!step.format) step.format = 'qcm';
    if (!step.options) step.options = ["", "", "", ""];
    if (!step.optionExplanations) step.optionExplanations = step.options.map(() => "");
    while (step.optionExplanations.length < step.options.length) step.optionExplanations.push("");
    if (!step.acceptedAnswers) step.acceptedAnswers = [""];
    if (!step.correct) step.correct = [0];

    const isQCM = (step.format === 'qcm');
    const isQCU = (step.format === 'qcu');
    const isOpen = (step.format === 'ouverte');

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
          <input type="text" value="${escapeHtml(step.title || '')}" oninput="state.dpSteps[${sIdx}].title = this.value" placeholder="ex: Étape ${sIdx + 1} : Présentation clinique & HES panoramique" required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Données cliniques & description microscopique *</label>
          <textarea rows="2" oninput="state.dpSteps[${sIdx}].narrative = this.value" placeholder="Détaillez ce qui est observé à ce stade du cas clinique..." required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans">${escapeHtml(step.narrative || '')}</textarea>
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
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label class="block text-[11px] font-semibold text-indigo-300">Format & Question de l'étape *</label>
          <select onchange="setDPStepFormat(${sIdx}, this.value)" class="py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-semibold">
            <option value="qcm" ${isQCM ? 'selected' : ''}>☑️ QCM (Choix Multiples)</option>
            <option value="qcu" ${isQCU ? 'selected' : ''}>🔘 QCU (Choix Unique)</option>
            <option value="ouverte" ${isOpen ? 'selected' : ''}>✍️ Question à remplir (Texte / Diagnostic)</option>
          </select>
        </div>
        <input type="text" value="${escapeHtml(step.question || '')}" oninput="state.dpSteps[${sIdx}].question = this.value" placeholder="ex: Quels diagnostics différentiels évoquez-vous ?" required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">
      </div>

      ${isOpen ? `
        <!-- FORMAT QUESTION À REMPLIR -->
        <div class="space-y-2.5 pt-2">
          <div class="flex items-center justify-between">
            <label class="block text-[11px] font-semibold text-teal-300">Réponse(s) acceptée(s) & synonymes :</label>
            <button type="button" onclick="addAcceptedAnswerToDPStep(${sIdx})" class="text-[11px] text-teal-400 hover:text-teal-300 font-bold flex items-center space-x-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>+ Ajouter une variante acceptée</span>
            </button>
          </div>
          <div class="space-y-2">
            ${step.acceptedAnswers.map((ans, aIdx) => `
              <div class="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded ${aIdx === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' : 'bg-slate-800 text-slate-400'}">
                  ${aIdx === 0 ? 'Attendu' : `Variante ${aIdx + 1}`}
                </span>
                <input type="text" value="${escapeHtml(ans)}" oninput="updateDPStepAcceptedAnswer(${sIdx}, ${aIdx}, this.value)" placeholder="${aIdx === 0 ? 'Diagnostic principal attendu * (ex: Carcinome canalaire infiltrant)' : 'Abréviation ou synonyme (ex: CCI)'}" class="flex-1 bg-transparent border-none text-xs text-white focus:outline-none font-medium">
                ${step.acceptedAnswers.length > 1 ? `
                  <button type="button" onclick="removeAcceptedAnswerFromDPStep(${sIdx}, ${aIdx})" title="Supprimer cette variante" class="text-slate-500 hover:text-rose-400 p-1">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <!-- FORMAT QCM / QCU AVEC JUSTIFICATIONS PAR PROPOSITION -->
        <div class="space-y-2.5 pt-2">
          <div class="flex items-center justify-between">
            <label class="block text-[11px] font-semibold text-slate-300">
              Propositions (${isQCM ? 'Cochez la ou les bonnes réponses' : 'Cochez la seule bonne réponse'}) :
            </label>
            <button type="button" onclick="addOptionToDPStep(${sIdx})" class="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>+ Ajouter une proposition</span>
            </button>
          </div>

          <div class="space-y-2.5">
            ${step.options.map((optText, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isChecked = (step.correct || []).includes(optIdx);
              const exp = (step.optionExplanations && step.optionExplanations[optIdx]) || '';
              const canDelete = step.options.length > 2;

              return `
                <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 hover:border-slate-700 transition">
                  <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded-lg bg-slate-950 border border-slate-700 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono">${letter}</span>
                    <input type="${isQCM ? 'checkbox' : 'radio'}" name="dp_step_${sIdx}_correct" ${isChecked ? 'checked' : ''} onchange="handleDPStepCorrectChange(${sIdx}, ${optIdx}, this.checked, ${isQCM})" class="text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer" title="${isQCM ? 'Cocher si vraie' : 'Sélectionner si vraie'}">
                    <input type="text" value="${escapeHtml(optText)}" oninput="updateDPStepOptionText(${sIdx}, ${optIdx}, this.value)" placeholder="Proposition ${letter} *" required class="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium">
                    ${canDelete ? `
                      <button type="button" onclick="removeOptionFromDPStep(${sIdx}, ${optIdx})" title="Supprimer la proposition ${letter}" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    ` : ''}
                  </div>
                  <div class="flex items-center space-x-2 pl-8">
                    <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-400/80 shrink-0"></i>
                    <input type="text" value="${escapeHtml(exp)}" oninput="updateDPStepOptionExplanation(${sIdx}, ${optIdx}, this.value)" placeholder="Justification / commentaire pour l'item ${letter} (optionnel)..." class="flex-1 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none focus:border-amber-500/50">
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `}

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Explication globale de l'étape (optionnel)</label>
          <textarea rows="2" oninput="state.dpSteps[${sIdx}].explanation = this.value" placeholder="Justifiez le raisonnement général de l'étape..." class="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">${escapeHtml(step.explanation || '')}</textarea>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-amber-400 mb-1">Piège diagnostique de l'étape (optionnel)</label>
          <textarea rows="2" oninput="state.dpSteps[${sIdx}].trap = this.value" placeholder="Fausse piste fréquente ou piège histologique..." class="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-500">${escapeHtml(step.trap || '')}</textarea>
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
      <input type="text" value="${escapeHtml(imgObj.caption)}" oninput="state.dpSteps[${stepIdx}].images[${iIdx}].caption = this.value" placeholder="Légende" class="text-[10px] bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white">
      <button type="button" onclick="state.dpSteps[${stepIdx}].images.splice(${iIdx}, 1); renderDPStepImagesPreview(${stepIdx});" class="text-[9px] text-rose-400 hover:text-rose-300 font-semibold text-center">Supprimer</button>
    `;
    container.appendChild(card);
  });
}

async function handleSaveDPForm(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('btn-submit-save-dp');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  const restoreSubmitBtn = () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
      submitBtn.innerHTML = originalBtnHtml;
    }
  };

  // 0. Visual feedback tactile et immédiat
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-80', 'cursor-not-allowed');
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Enregistrement...</span>
    `;
  }

  const editId = document.getElementById('form-dp-edit-id').value;
  const isEdit = Boolean(editId);
  const title = document.getElementById('form-dp-title').value.trim();
  const organ = document.getElementById('form-dp-organ').value.trim();
  const category = document.getElementById('form-dp-category').value.trim();
  const entity = document.getElementById('form-dp-entity').value.trim();
  const synopsis = document.getElementById('form-dp-synopsis').value.trim();
  const tags = Array.from(state.editorSelectedTags);

  if (!title) {
    restoreSubmitBtn();
    showToast("Veuillez renseigner le titre du Dossier Clinique.", "warning");
    document.getElementById('form-dp-title').focus();
    return;
  }
  if (!organ) {
    restoreSubmitBtn();
    showToast("Veuillez renseigner le Niveau 1 : Organe.", "warning");
    document.getElementById('form-dp-organ').focus();
    return;
  }
  if (!category) {
    restoreSubmitBtn();
    showToast("Veuillez renseigner le Niveau 2 : Catégorie.", "warning");
    document.getElementById('form-dp-category').focus();
    return;
  }
  if (!entity) {
    restoreSubmitBtn();
    showToast("Veuillez renseigner le Niveau 3 : Lésion précise.", "warning");
    document.getElementById('form-dp-entity').focus();
    return;
  }

  if (!state.dpSteps || state.dpSteps.length === 0) {
    restoreSubmitBtn();
    showToast("Veuillez ajouter au moins une étape (bouton 'Ajouter une étape suivante').", "warning");
    return;
  }

  for (let i = 0; i < state.dpSteps.length; i++) {
    const s = state.dpSteps[i];
    if (s.format === 'ouverte') {
      const accepted = getDPStepAcceptedAnswers(s);
      if (accepted.length === 0) {
        restoreSubmitBtn();
        showToast(`À l'étape ${i + 1}, veuillez renseigner au moins une réponse acceptée.`, "warning");
        return;
      }
    } else {
      if (!s.correct || s.correct.length === 0) {
        restoreSubmitBtn();
        showToast(`À l'étape ${i + 1}, veuillez cocher au moins une bonne réponse.`, "warning");
        return;
      }
      const validOpts = (s.options || []).filter(o => o && o.trim());
      if (validOpts.length < 2) {
        restoreSubmitBtn();
        showToast(`À l'étape ${i + 1}, veuillez renseigner au moins 2 propositions.`, "warning");
        return;
      }
    }
  }

  const authorSelect = document.getElementById('form-q-author');
  const chosenAuthor = (authorSelect && authorSelect.value && authorSelect.value !== '__NEW__')
    ? authorSelect.value.trim().toLowerCase()
    : ((state.currentUser && state.currentUser.email) ? state.currentUser.email.toLowerCase() : 'padoreau85@gmail.com');

  let savedCase = null;

  try {
    if (editId) {
      const idx = state.cases.findIndex(c => c.id === editId);
      if (idx !== -1) {
        state.cases[idx] = {
          ...state.cases[idx],
          title, organ, category, entity, synopsis, tags,
          created_by: state.cases[idx].created_by || chosenAuthor,
          steps: JSON.parse(JSON.stringify(state.dpSteps)),
          _localEdited: true
        };
        savedCase = state.cases[idx];
      }
    } else {
      const newCase = {
        id: "dp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        title, organ, category, entity, synopsis, tags,
        created_by: chosenAuthor,
        steps: JSON.parse(JSON.stringify(state.dpSteps)),
        _localUnsynced: true
      };
      state.cases.push(newCase);
      savedCase = newCase;
    }

    saveCases();

    // Réinitialiser immédiatement le formulaire et débloquer le bouton
    resetDPForm();
    restoreSubmitBtn();

    openSaveSuccessModal({
      id: savedCase.id,
      organ: savedCase.organ,
      category: savedCase.category,
      entity: savedCase.entity,
      question: `${savedCase.title} (${savedCase.steps.length} étape${savedCase.steps.length > 1 ? 's' : ''})`,
      format: 'dp',
      imagesCount: 0,
      isEdit,
      isCase: true,
      cloudStatus: supabaseClient ? "syncing" : "localOnly",
      cloudErrorMsg: ""
    });

    // Synchronisation en tâche de fond non bloquante
    if (supabaseClient && savedCase) {
      dbUpsertCaseWithTimeout(savedCase, 7000).then(res => {
        if (res && res.success) {
          delete savedCase._localUnsynced;
          delete savedCase._localEdited;
          saveCases();
          broadcastLocalUpdate();
          updateSaveModalCloudStatus("synced");
        } else if (res && res.localOnly) {
          savedCase._localUnsynced = true;
          saveCases();
          updateSaveModalCloudStatus("localOnly");
        } else {
          savedCase._localUnsynced = true;
          saveCases();
          updateSaveModalCloudStatus("error", (res && res.error && res.error.message) || "Erreur Supabase");
        }
      }).catch(e => {
        savedCase._localUnsynced = true;
        saveCases();
        updateSaveModalCloudStatus("error", e.message || "Erreur réseau");
      });
    } else if (savedCase) {
      savedCase._localUnsynced = true;
      saveCases();
    }

  } catch (err) {
    console.error("Erreur enregistrement DP:", err);
    showToast("Erreur lors de l'enregistrement du dossier clinique.", "error");
    restoreSubmitBtn();
  }
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
  updateEditorDatalists();

  state.editorSelectedTags = new Set(c.tags || []);
  renderDPTagsSelector();

  state.dpSteps = JSON.parse(JSON.stringify(c.steps || [])).map((s, idx) => {
    if (!s.stepNumber) s.stepNumber = idx + 1;
    if (!s.format) s.format = 'qcm';
    if (!s.options) s.options = ["", "", "", ""];
    if (!s.optionExplanations) s.optionExplanations = s.options.map(() => "");
    while (s.optionExplanations.length < s.options.length) s.optionExplanations.push("");
    if (!s.acceptedAnswers) s.acceptedAnswers = [""];
    if (!s.correct) s.correct = [0];
    return s;
  });
  renderDPStepsBuilder();
}

async function deleteDP(id) {
  if (!isAuthorizedToDelete()) {
    showToast("Action refusée : Seuls Pierre-Alain et Samy peuvent supprimer un Dossier Progressif.", "warning");
    alert("Action réservée aux administrateurs (Pierre-Alain & Samy).\nPour protéger l'intégrité de la banque collective contre toute perte de données, seuls Pierre-Alain et Samy sont habilités à supprimer définitivement un Dossier Progressif.");
    return;
  }
  const targetC = state.cases.find(c => c.id === id);
  const cTitle = targetC ? `"${targetC.title}"` : 'ce Dossier Progressif';
  if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${cTitle} de la banque partagée ?`)) return;

  try {
    const del = JSON.parse(localStorage.getItem('pathosorus_deleted_ids') || '[]');
    if (!del.includes(id)) {
      del.push(id);
      localStorage.setItem('pathosorus_deleted_ids', JSON.stringify(del));
    }
  } catch(e) {}

  state.cases = state.cases.filter(c => c.id !== id);
  saveCases();
  broadcastLocalUpdate();
  await dbDeleteCase(id);
  showToast("Dossier progressif supprimé avec succès.", "info");
}

// =========================================================================
// --- LECTEUR DE DOSSIER PROGRESSIF (DP SESSION) SANS SPOILER AVEC CORRECTION FINALE ---
// =========================================================================
function startDPSession(caseId) {
  if (!state.currentUser) {
    openAuthModal();
    showToast("Veuillez vous connecter pour faire ce dossier progressif !", "info");
    return;
  }
  const isFromBank = document.getElementById('view-bank') && !document.getElementById('view-bank').classList.contains('hidden');
  state.sessionReturnView = isFromBank ? 'bank' : 'play';
  const dpCase = state.cases.find(c => c.id === caseId);
  if (!dpCase) return;

  // Clone profond pour mélanger les options de chaque étape sans altérer state.cases
  const clonedCase = JSON.parse(JSON.stringify(dpCase));
  clonedCase.steps = clonedCase.steps.map(step => {
    if (!step.format) step.format = 'qcm';
    if (!step.optionExplanations) step.optionExplanations = (step.options || []).map(() => "");
    while (step.optionExplanations.length < (step.options || []).length) step.optionExplanations.push("");

    if (step.format !== 'ouverte' && step.options && step.options.length > 1) {
      const exps = step.optionExplanations || [];
      const items = step.options.map((optText, origIdx) => ({
        text: optText,
        explanation: exps[origIdx] || '',
        isCorrect: (step.correct || []).includes(origIdx)
      }));
      // Fisher-Yates
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      step.options = items.map(it => it.text);
      step.optionExplanations = items.map(it => it.explanation);
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
    xpEarned: 0,
    selectedInCurrentStep: new Set(),
    stepSubmissions: {},
    isFinished: false
  };

  const playingView = document.getElementById('dp-session-playing-view');
  const reviewView = document.getElementById('dp-session-review-view');
  if (playingView) playingView.classList.remove('hidden');
  if (reviewView) reviewView.classList.add('hidden');

  switchTab('dp-session');
  renderDPStep();
}
window.startDPSession = startDPSession;

function renderDPStep() {
  const session = state.currentDPSession;
  if (!session) return;

  const currentStep = session.caseData.steps[session.currentStepIndex];
  session.selectedInCurrentStep.clear();

  document.getElementById('dp-case-title').textContent = session.caseData.title;
  // Organe uniquement, sous-organe et lésion masqués pendant le cas clinique pour ne pas spoiler le diagnostic
  document.getElementById('dp-case-meta').textContent = session.caseData.organ ? `Dossier Clinique Progressif • Organe : ${session.caseData.organ}` : "Dossier Clinique Progressif";
  document.getElementById('dp-step-indicator').textContent = `Étape ${session.currentStepIndex + 1} / ${session.totalSteps}`;
  document.getElementById('dp-progress-bar').style.width = `${((session.currentStepIndex + 1) / session.totalSteps) * 100}%`;

  document.getElementById('dp-step-title').textContent = currentStep.title || `Étape ${session.currentStepIndex + 1}`;
  document.getElementById('dp-step-narrative').textContent = currentStep.narrative || '';

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
          <span class="truncate">${escapeHtml(imgObj.caption || `Lame ${idx + 1}`)}</span>
          <i data-lucide="zoom-in" class="w-3.5 h-3.5 text-indigo-400"></i>
        </div>
      `;
      imagesContainer.appendChild(card);
    });
  } else {
    imagesContainer.classList.add('hidden');
  }

  const isQCM = (currentStep.format === 'qcm');
  const isQCU = (currentStep.format === 'qcu');
  const isOpen = (currentStep.format === 'ouverte');

  const typeBadge = document.getElementById('dp-step-type-badge');
  typeBadge.textContent = isOpen ? "✍️ Question à remplir (Texte)" : (isQCM ? "☑️ QCM (Choix multiples)" : "🔘 QCU (Choix unique)");

  document.getElementById('dp-step-question').textContent = currentStep.question || '';

  const isLastStep = (session.currentStepIndex + 1 >= session.totalSteps);
  const nextBtnText = isLastStep ? "Valider et terminer le Dossier 🏁" : "Valider et passer à l'étape suivante ➔";
  const valBtn = document.getElementById('btn-dp-validate-step');

  const optionsBox = document.getElementById('dp-step-options-container');
  const openBox = document.getElementById('dp-step-open-container');

  if (isOpen) {
    if (optionsBox) optionsBox.classList.add('hidden');
    if (openBox) {
      openBox.classList.remove('hidden');
      const openInput = document.getElementById('dp-step-open-input');
      if (openInput) {
        openInput.value = '';
        setTimeout(() => openInput.focus(), 60);
      }
    }
    if (valBtn) {
      valBtn.disabled = true;
      valBtn.innerHTML = `<span>${nextBtnText}</span><i data-lucide="${isLastStep ? 'check' : 'arrow-right'}" class="w-4 h-4"></i>`;
    }
  } else {
    if (openBox) openBox.classList.add('hidden');
    if (optionsBox) {
      optionsBox.classList.remove('hidden');
      optionsBox.innerHTML = '';
      (currentStep.options || []).forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.id = 'dp-opt-' + idx;
        btn.type = 'button';
        btn.className = "w-full text-left p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition flex items-center justify-between text-sm text-slate-200 group";
        btn.onclick = () => {
          if (isQCM) toggleDPOption(idx);
          else selectDPSingle(idx);
        };

        const letter = String.fromCharCode(65 + idx);
        const boxShape = isQCM ? "rounded-md" : "rounded-full";

        btn.innerHTML = `
          <div class="flex items-center space-x-3">
            <span class="opt-indicator w-7 h-7 ${boxShape} bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-indigo-400 transition font-mono">${letter}</span>
            <span class="font-medium text-slate-200">${escapeHtml(optText)}</span>
          </div>
          <div class="opt-check-status w-5 h-5 flex items-center justify-center"></div>
        `;
        optionsBox.appendChild(btn);
      });
    }

    if (valBtn) {
      valBtn.disabled = true;
      valBtn.innerHTML = `<span>${nextBtnText}</span><i data-lucide="${isLastStep ? 'check' : 'arrow-right'}" class="w-4 h-4"></i>`;
    }
  }

  if (window.lucide) lucide.createIcons();
}

function toggleDPOption(idx) {
  const session = state.currentDPSession;
  if (!session) return;

  const btn = document.getElementById('dp-opt-' + idx);
  if (!btn) return;

  const isLastStep = (session.currentStepIndex + 1 >= session.totalSteps);
  const nextBtnText = isLastStep ? "Valider et terminer le Dossier 🏁" : "Valider et passer à l'étape suivante ➔";
  const valBtn = document.getElementById('btn-dp-validate-step');

  if (session.selectedInCurrentStep.has(idx)) {
    session.selectedInCurrentStep.delete(idx);
    btn.classList.remove('border-indigo-500', 'bg-indigo-500/10');
    const ind = btn.querySelector('.opt-indicator');
    if (ind) ind.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-500');
    const chk = btn.querySelector('.opt-check-status');
    if (chk) chk.innerHTML = '';
  } else {
    session.selectedInCurrentStep.add(idx);
    btn.classList.add('border-indigo-500', 'bg-indigo-500/10');
    const ind = btn.querySelector('.opt-indicator');
    if (ind) ind.classList.add('bg-indigo-600', 'text-white', 'border-indigo-500');
    const chk = btn.querySelector('.opt-check-status');
    if (chk) chk.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-indigo-400"></i>';
  }

  const count = session.selectedInCurrentStep.size;
  if (valBtn) {
    valBtn.disabled = (count === 0);
    valBtn.innerHTML = `<span>${nextBtnText} (${count} cochée${count > 1 ? 's' : ''})</span><i data-lucide="${isLastStep ? 'check' : 'arrow-right'}" class="w-4 h-4"></i>`;
  }
  if (window.lucide) lucide.createIcons();
}
window.toggleDPOption = toggleDPOption;

function selectDPSingle(idx) {
  const session = state.currentDPSession;
  if (!session) return;

  const currentStep = session.caseData.steps[session.currentStepIndex];
  const isLastStep = (session.currentStepIndex + 1 >= session.totalSteps);
  const nextBtnText = isLastStep ? "Valider et terminer le Dossier 🏁" : "Valider et passer à l'étape suivante ➔";
  const valBtn = document.getElementById('btn-dp-validate-step');

  session.selectedInCurrentStep.clear();
  session.selectedInCurrentStep.add(idx);

  (currentStep.options || []).forEach((_, oIdx) => {
    const btn = document.getElementById('dp-opt-' + oIdx);
    if (!btn) return;
    const ind = btn.querySelector('.opt-indicator');
    const chk = btn.querySelector('.opt-check-status');

    if (oIdx === idx) {
      btn.classList.add('border-indigo-500', 'bg-indigo-500/10');
      if (ind) ind.classList.add('bg-indigo-600', 'text-white', 'border-indigo-500');
      if (chk) chk.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-indigo-400"></i>';
    } else {
      btn.classList.remove('border-indigo-500', 'bg-indigo-500/10');
      if (ind) ind.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-500');
      if (chk) chk.innerHTML = '';
    }
  });

  if (valBtn) {
    valBtn.disabled = false;
    valBtn.innerHTML = `<span>${nextBtnText} (Option ${String.fromCharCode(65 + idx)} choisie)</span><i data-lucide="${isLastStep ? 'check' : 'arrow-right'}" class="w-4 h-4"></i>`;
  }
  if (window.lucide) lucide.createIcons();
}
window.selectDPSingle = selectDPSingle;

function onDPOpenInput(val) {
  const session = state.currentDPSession;
  if (!session) return;
  const isLastStep = (session.currentStepIndex + 1 >= session.totalSteps);
  const nextBtnText = isLastStep ? "Valider et terminer le Dossier 🏁" : "Valider et passer à l'étape suivante ➔";
  const valBtn = document.getElementById('btn-dp-validate-step');
  if (valBtn) {
    valBtn.disabled = !val || !val.trim();
    valBtn.innerHTML = `<span>${nextBtnText}</span><i data-lucide="${isLastStep ? 'check' : 'arrow-right'}" class="w-4 h-4"></i>`;
  }
}
window.onDPOpenInput = onDPOpenInput;

function submitCurrentDPStep() {
  const session = state.currentDPSession;
  if (!session) return;

  const currentStep = session.caseData.steps[session.currentStepIndex];
  const sIdx = session.currentStepIndex;

  if (currentStep.format === 'ouverte') {
    const inputEl = document.getElementById('dp-step-open-input');
    const userText = (inputEl ? inputEl.value : '').trim();
    if (!userText) {
      alert("Veuillez saisir votre réponse avant de valider l'étape.");
      if (inputEl) inputEl.focus();
      return;
    }
    const accepted = getDPStepAcceptedAnswers(currentStep);
    const isMatch = accepted.some(target => isDiagnosticMatch(userText, target));

    session.stepSubmissions[sIdx] = {
      format: 'ouverte',
      openAnswerText: userText,
      accepted: accepted,
      isCorrect: isMatch,
      step: currentStep
    };

    if (isMatch) {
      session.score += 1;
      session.xpEarned += 25;
    }
  } else {
    // QCM ou QCU
    const selected = Array.from(session.selectedInCurrentStep);
    if (selected.length === 0) {
      alert("Veuillez sélectionner au moins une proposition avant de valider.");
      return;
    }

    const corSet = new Set(currentStep.correct || []);
    const selSet = new Set(selected);
    const isExact = (selSet.size === corSet.size) && [...selSet].every(x => corSet.has(x));

    session.stepSubmissions[sIdx] = {
      format: currentStep.format,
      selectedIndices: selected,
      isCorrect: isExact,
      step: currentStep
    };

    if (isExact) {
      session.score += 1;
      session.xpEarned += 25;
    }
  }

  // Pas de révélation de correction pendant le déroulement !
  if (session.currentStepIndex + 1 < session.totalSteps) {
    session.currentStepIndex += 1;
    renderDPStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Dernier étape terminée !
    finishDPSession();
  }
}
window.submitCurrentDPStep = submitCurrentDPStep;

function finishDPSession() {
  const session = state.currentDPSession;
  if (!session) return;

  session.isFinished = true;

  const today = getLocalDateString();
  const caseId = (session.caseData && session.caseData.id) ? session.caseData.id : 'dp_session';
  if (!state.userProgress) state.userProgress = {};
  const caseProg = state.userProgress[caseId] || {};
  const alreadyRewardedToday = (caseProg.lastXpDate === today);
  const awardedXp = alreadyRewardedToday ? 0 : session.xpEarned;
  caseProg.lastXpDate = today;
  state.userProgress[caseId] = caseProg;

  // Enregistrer progression & XP
  if (!state.stats) state.stats = getDefaultStats();
  state.stats.xp = (state.stats.xp || 0) + awardedXp;
  state.stats.totalAnswered = (state.stats.totalAnswered || 0) + session.totalSteps;
  if (!alreadyRewardedToday) {
    state.stats.totalCorrect = (state.stats.totalCorrect || 0) + session.score;
  }
  saveStats();
  checkAndUnlockBadges();
  updateTopBar();

  const isPerfect = (session.score === session.totalSteps);
  if (isPerfect) {
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
  } else {
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  }

  renderDPFinalReview();
}
window.finishDPSession = finishDPSession;

function renderDPFinalReview() {
  const session = state.currentDPSession;
  if (!session) return;

  const playingView = document.getElementById('dp-session-playing-view');
  const reviewView = document.getElementById('dp-session-review-view');
  if (playingView) playingView.classList.add('hidden');
  if (reviewView) reviewView.classList.remove('hidden');

  const caseData = session.caseData;
  const percent = Math.round((session.score / session.totalSteps) * 100);
  const isPerfect = (session.score === session.totalSteps);

  let html = `
    <!-- CARTE BILAN / SCORE DU CAS -->
    <div class="bg-gradient-to-br from-slate-900 via-slate-900 ${isPerfect ? 'to-amber-950/40 border-amber-500/40' : 'to-indigo-950/40 border-indigo-500/40'} border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span class="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Bilan du Dossier Progressif</span>
          <h2 class="text-xl sm:text-2xl font-black text-white mt-1">${escapeHtml(caseData.title)}</h2>
          <div class="flex items-center space-x-2 text-xs text-slate-300 mt-1.5 font-medium">
            <span class="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-mono">${escapeHtml(caseData.organ)}</span>
            <span>›</span>
            <span class="text-slate-400">${escapeHtml(caseData.category)}</span>
            <span>›</span>
            <span class="text-amber-300 font-bold">${escapeHtml(caseData.entity)}</span>
          </div>
        </div>

        <div class="flex items-center space-x-3 bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800 shrink-0">
          <div class="w-12 h-12 rounded-xl ${isPerfect ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'} flex items-center justify-center font-black text-xl">
            ${isPerfect ? '🏆' : '📋'}
          </div>
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Score Global</div>
            <div class="text-lg font-black text-white">${session.score} / ${session.totalSteps} <span class="text-xs text-indigo-400">(${percent}%)</span></div>
            <div class="text-[11px] font-bold text-emerald-400">+${session.xpEarned} XP remportés</div>
          </div>
        </div>
      </div>

      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">${escapeHtml(caseData.synopsis)}</p>

      <div class="flex items-center justify-between pt-2">
        <span class="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
          <i data-lucide="check-circle" class="w-4 h-4 text-indigo-400"></i>
          <span>Correction détaillée étape par étape ci-dessous :</span>
        </span>
        <button onclick="startDPSession('${caseData.id}')" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-bold transition flex items-center space-x-1.5 border border-slate-700">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
          <span>Recommencer ce cas</span>
        </button>
      </div>
    </div>

    <!-- LISTE DÉTAILLÉE DES ÉTAPES CORRIGÉES -->
    <div class="space-y-6">
  `;

  caseData.steps.forEach((step, sIdx) => {
    const sub = session.stepSubmissions[sIdx] || { selectedIndices: [], isCorrect: false };
    const isStepCorrect = !!sub.isCorrect;
    const isQCM = (step.format === 'qcm');
    const isOpen = (step.format === 'ouverte');

    html += `
      <div class="bg-slate-900 border ${isStepCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'} rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        
        <!-- En-tête de l'étape -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center space-x-3">
            <span class="w-7 h-7 rounded-xl ${isStepCorrect ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'} flex items-center justify-center text-xs font-mono font-bold">
              ${sIdx + 1}
            </span>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-white">${escapeHtml(step.title || `Étape ${sIdx + 1}`)}</h3>
              <span class="text-[10px] font-mono text-slate-400">${isOpen ? '✍️ Question à remplir' : (isQCM ? '☑️ QCM' : '🔘 QCU')}</span>
            </div>
          </div>
          <div>
            ${isStepCorrect
              ? '<span class="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>Validée (+25 XP)</span></span>'
              : '<span class="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1"><i data-lucide="x-circle" class="w-3.5 h-3.5"></i><span>Non validée</span></span>'
            }
          </div>
        </div>

        <!-- Récit clinique & macro/micro -->
        <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line">
          ${escapeHtml(step.narrative || '')}
        </div>

        <!-- Images de l'étape -->
        ${step.images && step.images.length > 0 ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${step.images.map((imgObj, iIdx) => `
              <div onclick="openLightbox('${imgObj.url}', '${escapeHtml(imgObj.caption || `Cliché Étape ${sIdx + 1}`)}')" class="relative rounded-xl overflow-hidden border border-slate-700 bg-black cursor-zoom-in group max-h-56 flex flex-col justify-end">
                <img src="${imgObj.url}" alt="Cliché" class="max-h-56 w-full object-contain">
                <div class="bg-slate-900/90 backdrop-blur p-2 text-white text-[11px] font-medium flex items-center justify-between border-t border-slate-800">
                  <span class="truncate">${escapeHtml(imgObj.caption || `Lame ${iIdx + 1}`)}</span>
                  <i data-lucide="zoom-in" class="w-3.5 h-3.5 text-indigo-400"></i>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Question posée -->
        <div class="pt-2 border-t border-slate-800">
          <div class="text-[11px] font-semibold text-slate-400 mb-1">Question de l'étape :</div>
          <div class="text-sm font-bold text-white">${escapeHtml(step.question || '')}</div>
        </div>

        <!-- Propositions avec Justifications par proposition (ou Question ouverte) -->
        <div class="space-y-2.5">
          ${isOpen ? `
            <div class="p-3.5 rounded-xl ${isStepCorrect ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-200' : 'bg-rose-500/10 border border-rose-500/40 text-rose-200'} space-y-1">
              <div class="text-xs font-semibold">Votre réponse saisie : <strong class="underline">${escapeHtml(sub.openAnswerText || '(Aucune réponse saisie)')}</strong></div>
              <div class="text-xs text-slate-300">Réponse(s) attendue(s) : <strong class="text-teal-300 font-mono">${(getDPStepAcceptedAnswers(step)).join(' / ')}</strong></div>
            </div>
          ` : `
            <div class="space-y-2">
              ${(step.options || []).map((optText, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                const isExpected = (step.correct || []).includes(oIdx);
                const wasChosen = (sub.selectedIndices || []).includes(oIdx);
                const justification = (step.optionExplanations && step.optionExplanations[oIdx]) ? step.optionExplanations[oIdx].trim() : '';

                let cardClass = "border-slate-800 bg-slate-950/60 text-slate-300";
                let badge = "";

                if (isExpected && wasChosen) {
                  cardClass = "border-emerald-500 bg-emerald-500/10 text-emerald-200";
                  badge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✓ Votre choix (Correct)</span>';
                } else if (isExpected && !wasChosen) {
                  cardClass = "border-emerald-500/60 bg-emerald-500/5 text-emerald-300";
                  badge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">[Réponse attendue non cochée]</span>';
                } else if (!isExpected && wasChosen) {
                  cardClass = "border-rose-500 bg-rose-500/10 text-rose-200";
                  badge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">✗ Votre choix (Faux)</span>';
                } else {
                  cardClass = "border-slate-800 bg-slate-950/40 text-slate-400 opacity-80";
                }

                return `
                  <div class="p-3 rounded-xl border ${cardClass} space-y-2 transition">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2.5">
                        <span class="w-6 h-6 rounded-lg ${isExpected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 border border-slate-700 text-slate-400'} flex items-center justify-center text-xs font-mono font-bold">${letter}</span>
                        <span class="text-xs font-semibold ${isExpected ? 'text-white' : ''}">${escapeHtml(optText)}</span>
                      </div>
                      ${badge}
                    </div>

                    ${justification ? `
                      <div class="ml-8 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start space-x-2">
                        <i data-lucide="info" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i>
                        <div class="leading-relaxed"><strong class="text-amber-300">Justification :</strong> ${escapeHtml(justification)}</div>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Explication générale & Piège diagnostique -->
        ${(step.explanation || step.trap) ? `
          <div class="pt-3 border-t border-slate-800 grid grid-cols-1 ${step.explanation && step.trap ? 'sm:grid-cols-2' : ''} gap-3">
            ${step.explanation ? `
              <div class="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
                <div class="font-bold flex items-center space-x-1.5 text-indigo-300">
                  <i data-lucide="book-open" class="w-4 h-4"></i>
                  <span>Explication diagnostique :</span>
                </div>
                <p class="leading-relaxed pl-5 text-slate-300">${escapeHtml(step.explanation)}</p>
              </div>
            ` : ''}
            ${step.trap ? `
              <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                <div class="font-bold flex items-center space-x-1.5 text-amber-400">
                  <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                  <span>Piège diagnostique :</span>
                </div>
                <p class="leading-relaxed pl-5 text-slate-300">${escapeHtml(step.trap)}</p>
              </div>
            ` : ''}
          </div>
        ` : ''}

      </div>
    `;
  });

  html += `
    </div>

    <!-- BOUTONS D'ACTION EN BAS DE PAGE -->
    <div class="flex items-center justify-between pt-4 border-t border-slate-800">
      <button onclick="switchTab(state.sessionReturnView || 'play')" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-2">
        <i data-lucide="arrow-left" class="w-4 h-4"></i>
        <span>Retourner aux cas cliniques</span>
      </button>

      <button onclick="startDPSession('${caseData.id}')" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-500/20">
        <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
        <span>Recommencer ce Cas Clinique</span>
      </button>
    </div>
  `;

  reviewView.innerHTML = html;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
}
window.renderDPFinalReview = renderDPFinalReview;

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
          <span class="text-xs text-slate-400 font-mono">${escapeHtml(c.organ || 'Général')}</span>
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

  const visibleTags = (state.customTags || []).filter(t => t && !t.startsWith('ROLE_') && !t.startsWith('UPROG:') && !t.startsWith('USTATS:'));

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
window.createNewGlobalTag = createNewGlobalTag;

// =========================================================================
// --- GESTIONNAIRE DE TAGS (#) : MODIFICATION, RENOMMAGE & SUPPRESSION ---
// =========================================================================

function openManageTagsModal() {
  const modal = document.getElementById('modal-manage-tags');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  renderManageTagsList();
  const inp = document.getElementById('manage-tags-new-input');
  if (inp) {
    inp.value = '';
    setTimeout(() => inp.focus(), 80);
  }
  if (window.lucide) lucide.createIcons();
}
window.openManageTagsModal = openManageTagsModal;

function closeManageTagsModal() {
  const modal = document.getElementById('modal-manage-tags');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}
window.closeManageTagsModal = closeManageTagsModal;

function renderManageTagsList() {
  const container = document.getElementById('manage-tags-list');
  const countEl = document.getElementById('manage-tags-total-count');
  const searchInput = document.getElementById('manage-tags-search-input');
  if (!container) return;

  const query = (searchInput ? searchInput.value : '').trim().toLowerCase().replace(/^#/, '');
  const allTags = (state.customTags || []).filter(t => t && !t.startsWith('ROLE_') && !t.startsWith('UPROG:') && !t.startsWith('USTATS:') && !t.startsWith('DEL_'));

  const filtered = query
    ? allTags.filter(t => t.toLowerCase().includes(query))
    : allTags;

  filtered.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  if (countEl) {
    countEl.textContent = `${allTags.length} tag(s) configuré(s)${query ? ` · ${filtered.length} affiché(s)` : ''}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-xs text-slate-500 italic">
        ${query ? `Aucun tag ne correspond à "#${escapeHtml(query)}"` : "Aucun tag créé pour le moment."}
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  filtered.forEach(tag => {
    const qCount = (state.questions || []).filter(q => (q.tags || []).includes(tag)).length;
    const cCount = (state.cases || []).filter(c => (c.tags || []).includes(tag)).length;
    const total = qCount + cCount;

    const row = document.createElement('div');
    row.className = "flex items-center justify-between py-2.5 px-3 hover:bg-slate-800/50 rounded-2xl transition border border-transparent hover:border-slate-800";

    row.innerHTML = `
      <div class="flex items-center space-x-3 min-w-0">
        <span class="px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-300 font-mono text-xs font-bold truncate">
          #${escapeHtml(tag)}
        </span>
        <span class="text-[11px] ${total > 0 ? 'text-slate-400 font-mono' : 'text-slate-500 italic'}">
          ${total > 0 ? `${qCount} QCM${cCount > 0 ? ` · ${cCount} DP` : ''}` : 'Inutilisé (0)'}
        </span>
      </div>
      <div class="flex items-center space-x-1.5 shrink-0">
        <button type="button" onclick="renameTagPrompt('${escapeJsString(tag)}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 text-xs font-semibold transition flex items-center space-x-1" title="Renommer ou fusionner ce tag">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          <span>Renommer</span>
        </button>
        <button type="button" onclick="deleteTag('${escapeJsString(tag)}')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 text-xs font-semibold transition flex items-center space-x-1" title="Supprimer ce tag">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  if (window.lucide) lucide.createIcons();
}
window.renderManageTagsList = renderManageTagsList;

function submitNewTagInManager(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('manage-tags-new-input');
  if (!input) return;
  const val = input.value.trim().replace(/^#/, '');
  if (!val) return;
  createNewGlobalTag(val);
  input.value = '';
  renderManageTagsList();
  showRewardToast(`Tag #${val} créé avec succès !`, 'check-circle');
}
window.submitNewTagInManager = submitNewTagInManager;

function renameTagPrompt(currentTag) {
  const newName = prompt(`Renommer le tag #${currentTag} :\n\n(Astuce : si vous saisissez le nom d'un tag existant, ils seront automatiquement fusionnés)`, currentTag);
  if (newName === null) return;
  const clean = newName.trim().replace(/^#/, '');
  if (!clean) {
    alert("Le nom du tag ne peut pas être vide.");
    return;
  }
  renameTag(currentTag, clean);
}
window.renameTagPrompt = renameTagPrompt;

async function renameTag(oldTag, newTag) {
  const cleanOld = (oldTag || '').trim().replace(/^#/, '');
  const cleanNew = (newTag || '').trim().replace(/^#/, '');

  if (!cleanOld || !cleanNew) {
    alert("Le nom du tag ne peut pas être vide.");
    return false;
  }
  if (cleanOld === cleanNew) return false;

  const isMerge = (state.customTags || []).some(t => t.toLowerCase() === cleanNew.toLowerCase() && t !== cleanOld);
  const affectedQuestions = (state.questions || []).filter(q => (q.tags || []).includes(cleanOld));
  const affectedCases = (state.cases || []).filter(c => (c.tags || []).includes(cleanOld));

  const confirmMsg = `Renommer le tag #${cleanOld} en #${cleanNew} ?\n\n` +
    `• ${affectedQuestions.length} question(s) QCM seront mises à jour\n` +
    `• ${affectedCases.length} Dossier(s) Progressif(s) seront mis à jour\n` +
    (isMerge ? `\n⚠️ Le tag #${cleanNew} existe déjà : ils seront fusionnés ensemble !\n` : '') +
    `\nCette modification sera sauvegardée et synchronisée pour toute l'équipe.`;

  if (!confirm(confirmMsg)) return false;

  // 1. Mettre à jour state.customTags
  const updatedTags = [];
  let addedNew = false;
  for (const t of (state.customTags || [])) {
    if (t === cleanOld) {
      if (!updatedTags.includes(cleanNew)) {
        updatedTags.push(cleanNew);
        addedNew = true;
      }
    } else if (t.toLowerCase() === cleanNew.toLowerCase()) {
      if (!updatedTags.includes(cleanNew)) {
        updatedTags.push(cleanNew);
        addedNew = true;
      }
    } else {
      updatedTags.push(t);
    }
  }
  if (!addedNew && !updatedTags.includes(cleanNew)) {
    updatedTags.push(cleanNew);
  }
  state.customTags = updatedTags;
  saveCustomTags();

  // 2. Mettre à jour la sélection active de l'éditeur si présent
  if (state.editorSelectedTags && state.editorSelectedTags.has(cleanOld)) {
    state.editorSelectedTags.delete(cleanOld);
    state.editorSelectedTags.add(cleanNew);
  }

  // 3. Mettre à jour les questions en mémoire et localement
  affectedQuestions.forEach(q => {
    const set = new Set((q.tags || []).map(t => t === cleanOld ? cleanNew : t));
    q.tags = Array.from(set);
  });
  saveQuestions();

  // 4. Mettre à jour les DP en mémoire et localement
  affectedCases.forEach(c => {
    const set = new Set((c.tags || []).map(t => t === cleanOld ? cleanNew : t));
    c.tags = Array.from(set);
  });
  saveCases();

  // 5. Synchronisation Cloud Supabase
  if (supabaseClient) {
    try {
      await dbUpsertTag(cleanNew);
      await supabaseClient.from('custom_tags').delete().eq('name', cleanOld);
      await supabaseClient.from('custom_tags').upsert({ name: 'DEL_T:' + cleanOld });

      const qPayloads = affectedQuestions.map(q => formatQuestionForSupabase(q));
      if (qPayloads.length > 0) {
        await supabaseClient.from('questions').upsert(qPayloads);
      }
      for (const c of affectedCases) {
        await dbUpsertCase(c);
      }
    } catch (e) {
      console.warn("Erreur sync Supabase renameTag:", e);
    }
  }

  renderManageTagsList();
  showRewardToast(`Tag #${cleanOld} renommé en #${cleanNew} (${affectedQuestions.length} QCM mis à jour) !`, 'check-circle');
  return true;
}
window.renameTag = renameTag;

async function deleteTag(tagName) {
  const clean = (tagName || '').trim().replace(/^#/, '');
  if (!clean) return false;

  const affectedQuestions = (state.questions || []).filter(q => (q.tags || []).includes(clean));
  const affectedCases = (state.cases || []).filter(c => (c.tags || []).includes(clean));

  const confirmMsg = `Supprimer définitivement le tag #${clean} ?\n\n` +
    `• Il sera retiré de la liste des tags\n` +
    `• Il sera détaché de ${affectedQuestions.length} question(s) QCM\n` +
    `• Il sera détaché de ${affectedCases.length} Dossier(s) Progressif(s)\n\n` +
    `Cette suppression sera synchronisée pour toute l'équipe.`;

  if (!confirm(confirmMsg)) return false;

  // 1. Retirer de state.customTags
  state.customTags = (state.customTags || []).filter(t => t !== clean);
  saveCustomTags();

  // 2. Retirer de la sélection active de l'éditeur si présent
  if (state.editorSelectedTags && state.editorSelectedTags.has(clean)) {
    state.editorSelectedTags.delete(clean);
  }

  // 3. Retirer des questions
  affectedQuestions.forEach(q => {
    q.tags = (q.tags || []).filter(t => t !== clean);
  });
  saveQuestions();

  // 4. Retirer des cas
  affectedCases.forEach(c => {
    c.tags = (c.tags || []).filter(t => t !== clean);
  });
  saveCases();

  // 5. Synchroniser Cloud Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('custom_tags').delete().eq('name', clean);
      await supabaseClient.from('custom_tags').upsert({ name: 'DEL_T:' + clean });

      const qPayloads = affectedQuestions.map(q => formatQuestionForSupabase(q));
      if (qPayloads.length > 0) {
        await supabaseClient.from('questions').upsert(qPayloads);
      }
      for (const c of affectedCases) {
        await dbUpsertCase(c);
      }
    } catch (e) {
      console.warn("Erreur sync Supabase deleteTag:", e);
    }
  }

  renderManageTagsList();
  showRewardToast(`Tag #${clean} supprimé avec succès !`, 'trash-2');
  return true;
}
window.deleteTag = deleteTag;

async function cleanUnusedTags() {
  const allTags = (state.customTags || []).filter(t => t && !t.startsWith('ROLE_') && !t.startsWith('UPROG:') && !t.startsWith('USTATS:') && !t.startsWith('DEL_'));
  const unused = allTags.filter(t => {
    const qCount = (state.questions || []).filter(q => (q.tags || []).includes(t)).length;
    const cCount = (state.cases || []).filter(c => (c.tags || []).includes(t)).length;
    return (qCount + cCount) === 0;
  });

  if (unused.length === 0) {
    alert("Aucun tag inutilisé. Tous les tags existants sont associés à au moins une question ou un cas.");
    return;
  }

  const confirmMsg = `Purger ${unused.length} tag(s) inutilisé(s) ?\n\n` +
    unused.map(t => `• #${t}`).join('\n') +
    `\n\nCes tags ne sont rattachés à aucun QCM ni cas clinique.`;

  if (!confirm(confirmMsg)) return;

  for (const t of unused) {
    state.customTags = (state.customTags || []).filter(x => x !== t);
    if (supabaseClient) {
      try {
        await supabaseClient.from('custom_tags').delete().eq('name', t);
        await supabaseClient.from('custom_tags').upsert({ name: 'DEL_T:' + t });
      } catch (e) {}
    }
  }

  saveCustomTags();
  renderManageTagsList();
  showRewardToast(`${unused.length} tag(s) inutilisé(s) purgé(s) !`, 'sparkles');
}
window.cleanUnusedTags = cleanUnusedTags;

// =========================================================================
// --- MODIFICATION & FUSION GLOBALE : ORGANES, CATÉGORIES ET LÉSIONS ---
// =========================================================================
async function renameOrgan(oldOrgan, newOrgan) {
  if (!isCreator()) {
    alert("Action réservée aux comptes Créateurs.");
    return false;
  }
  const cleanOld = (oldOrgan || '').trim();
  const cleanNew = (newOrgan || '').trim();
  if (!cleanOld || !cleanNew) {
    alert("Les noms d'organes ne peuvent pas être vides.");
    return false;
  }
  if (cleanOld.toLowerCase() === cleanNew.toLowerCase() && cleanOld === cleanNew) {
    return false;
  }

  // Questions et cas affectés
  const affectedQuestions = (state.questions || []).filter(q => (q.organ || '').trim().toLowerCase() === cleanOld.toLowerCase());
  const affectedCases = (state.cases || []).filter(c => (c.organ || '').trim().toLowerCase() === cleanOld.toLowerCase());

  if (affectedQuestions.length === 0 && affectedCases.length === 0) {
    alert(`Aucune question ni aucun cas trouvé pour l'organe "${cleanOld}".`);
    return false;
  }

  // Détecter si on fusionne avec un organe existant
  const otherExisting = (state.questions || []).some(q => (q.organ || '').trim().toLowerCase() === cleanNew.toLowerCase()) ||
                        (state.cases || []).some(c => (c.organ || '').trim().toLowerCase() === cleanNew.toLowerCase());

  const confirmMsg = `Renommer l'organe "${cleanOld}" en "${cleanNew}" ?\n\n` +
    `• ${affectedQuestions.length} question(s) QCM seront mises à jour\n` +
    `• ${affectedCases.length} Dossier(s) Progressif(s) seront mis à jour\n` +
    (otherExisting ? `\n⚠️ L'organe "${cleanNew}" existe déjà : tous les QCM et DP seront fusionnés sous cet organe !\n` : '') +
    `\nCette modification sera sauvegardée et synchronisée pour toute l'équipe.`;

  if (!confirm(confirmMsg)) return false;

  // 1. Mettre à jour les questions en mémoire et localement
  affectedQuestions.forEach(q => {
    q.organ = cleanNew;
  });
  saveQuestions();

  // 2. Mettre à jour les DP en mémoire et localement
  affectedCases.forEach(c => {
    c.organ = cleanNew;
  });
  saveCases();

  // 3. Mettre à jour les Fiches OMS (lesionNotes)
  if (state.lesionNotes) {
    const updatedNotes = {};
    const notesToDeleteFromCloud = [];
    const notesToUpsertToCloud = [];

    Object.keys(state.lesionNotes).forEach(k => {
      const note = state.lesionNotes[k];
      if (note && (note.organ || '').trim().toLowerCase() === cleanOld.toLowerCase()) {
        const newKey = `${cleanNew}::${note.category || 'Général'}::${note.entity || 'Lésion non spécifiée'}`;
        const updatedNote = { ...note, organ: cleanNew, key: newKey };
        updatedNotes[newKey] = updatedNote;
        notesToDeleteFromCloud.push(k);
        notesToUpsertToCloud.push(updatedNote);
      } else {
        updatedNotes[k] = note;
      }
    });
    state.lesionNotes = updatedNotes;
    localStorage.setItem(STORAGE_KEY_LESION_NOTES, JSON.stringify(state.lesionNotes));

    if (supabaseClient && state.currentUser && !isLocalEnvironment()) {
      for (const oldKey of notesToDeleteFromCloud) {
        try { await supabaseClient.from('lesion_notes').delete().eq('key', oldKey); } catch(e){}
      }
      for (const n of notesToUpsertToCloud) {
        try {
          await supabaseClient.from('lesion_notes').upsert({
            key: n.key,
            organ: n.organ,
            category: n.category,
            entity: n.entity,
            content: n.content,
            updated_at: new Date().toISOString(),
            author_name: n.authorName || 'Équipe',
            author_email: n.authorEmail || ''
          });
        } catch(e){}
      }
    }
  }

  // 4. Mettre à jour les trophées personnalisés ciblant cet organe
  if (state.customBadges) {
    let badgesChanged = false;
    state.customBadges.forEach(b => {
      if ((b.targetOrgan || '').trim().toLowerCase() === cleanOld.toLowerCase()) {
        b.targetOrgan = cleanNew;
        badgesChanged = true;
        if (supabaseClient && state.currentUser && !isLocalEnvironment()) {
          dbUpsertCustomBadge(b);
        }
      }
    });
    if (badgesChanged) {
      localStorage.setItem('pathosorus_custom_badges', JSON.stringify(state.customBadges));
    }
  }

  // 5. Synchronisation Supabase pour les questions et DP
  if (supabaseClient && state.currentUser && !isLocalEnvironment()) {
    try {
      const qPayloads = affectedQuestions.map(q => formatQuestionForSupabase(q));
      if (qPayloads.length > 0) {
        const res = await supabaseClient.from('questions').upsert(qPayloads);
        if (res && res.error) {
          console.warn("Repli unitaire pour mise à jour questions:", res.error);
          for (const q of affectedQuestions) {
            await dbUpsertQuestion(q);
          }
        }
      }
      for (const c of affectedCases) {
        await dbUpsertCase(c);
      }
      saveStats();
    } catch(err) {
      console.warn("Avertissement synchronisation distante renommage organe:", err);
    }
  }

  // 6. Mettre à jour les sélections actives
  if (state.bankSelectedOrgan && state.bankSelectedOrgan.toLowerCase() === cleanOld.toLowerCase()) {
    state.bankSelectedOrgan = cleanNew;
  }
  if (state.playHierarchy && state.playHierarchy.selectedOrgan && state.playHierarchy.selectedOrgan.toLowerCase() === cleanOld.toLowerCase()) {
    state.playHierarchy.selectedOrgan = cleanNew;
  }

  // 7. Rafraîchir les interfaces
  renderBank();
  renderHierarchySelector();
  renderDPCardsOnPlay();
  renderTrophiesView();
  updateTopBar();

  showRewardToast(`Organe "${cleanOld}" renommé en "${cleanNew}" (${affectedQuestions.length} QCM mis à jour) !`, 'check-circle');
  return true;
}
window.renameOrgan = renameOrgan;

function renameOrganPrompt(currentOrgan) {
  if (isReader()) {
    alert("Action réservée aux comptes Créateurs.");
    return;
  }
  const newName = prompt(`Renommer l'organe "${currentOrgan}" sur TOUTES les questions et cas :\n\n(Astuce : vous pouvez saisir le nom d'un organe existant pour les fusionner)`, currentOrgan);
  if (newName === null) return;
  const trimmed = newName.trim();
  if (!trimmed) {
    alert("Le nom de l'organe ne peut pas être vide.");
    return;
  }
  renameOrgan(currentOrgan, trimmed);
}
window.renameOrganPrompt = renameOrganPrompt;

async function renameCategory(organ, oldCat, newCat) {
  if (!isCreator()) {
    alert("Action réservée aux comptes Créateurs.");
    return false;
  }
  const cleanOrgan = (organ || '').trim();
  const cleanOld = (oldCat || '').trim();
  const cleanNew = (newCat || '').trim();
  if (!cleanOld || !cleanNew) {
    alert("Les noms de catégories ne peuvent pas être vides.");
    return false;
  }
  if (cleanOld.toLowerCase() === cleanNew.toLowerCase() && cleanOld === cleanNew) {
    return false;
  }

  const affectedQuestions = (state.questions || []).filter(q => 
    (!cleanOrgan || (q.organ || '').trim().toLowerCase() === cleanOrgan.toLowerCase()) &&
    (q.category || '').trim().toLowerCase() === cleanOld.toLowerCase()
  );
  const affectedCases = (state.cases || []).filter(c => 
    (!cleanOrgan || (c.organ || '').trim().toLowerCase() === cleanOrgan.toLowerCase()) &&
    (c.category || '').trim().toLowerCase() === cleanOld.toLowerCase()
  );

  if (affectedQuestions.length === 0 && affectedCases.length === 0) {
    alert(`Aucune question ni aucun cas trouvé pour la catégorie "${cleanOld}".`);
    return false;
  }

  const confirmMsg = `Renommer la catégorie "${cleanOld}" en "${cleanNew}"${cleanOrgan ? ` dans "${cleanOrgan}"` : ''} ?\n\n` +
    `• ${affectedQuestions.length} question(s) QCM seront mises à jour\n` +
    `• ${affectedCases.length} Dossier(s) Progressif(s) seront mis à jour`;

  if (!confirm(confirmMsg)) return false;

  affectedQuestions.forEach(q => { q.category = cleanNew; });
  saveQuestions();

  affectedCases.forEach(c => { c.category = cleanNew; });
  saveCases();

  if (state.lesionNotes) {
    const updatedNotes = {};
    const notesToDeleteFromCloud = [];
    const notesToUpsertToCloud = [];

    Object.keys(state.lesionNotes).forEach(k => {
      const note = state.lesionNotes[k];
      if (note && (!cleanOrgan || (note.organ || '').trim().toLowerCase() === cleanOrgan.toLowerCase()) &&
          (note.category || '').trim().toLowerCase() === cleanOld.toLowerCase()) {
        const newKey = `${note.organ || 'Autre'}::${cleanNew}::${note.entity || 'Lésion non spécifiée'}`;
        const updatedNote = { ...note, category: cleanNew, key: newKey };
        updatedNotes[newKey] = updatedNote;
        notesToDeleteFromCloud.push(k);
        notesToUpsertToCloud.push(updatedNote);
      } else {
        updatedNotes[k] = note;
      }
    });
    state.lesionNotes = updatedNotes;
    localStorage.setItem(STORAGE_KEY_LESION_NOTES, JSON.stringify(state.lesionNotes));

    if (supabaseClient && state.currentUser && !isLocalEnvironment()) {
      for (const oldKey of notesToDeleteFromCloud) {
        try { await supabaseClient.from('lesion_notes').delete().eq('key', oldKey); } catch(e){}
      }
      for (const n of notesToUpsertToCloud) {
        try {
          await supabaseClient.from('lesion_notes').upsert({
            key: n.key,
            organ: n.organ,
            category: n.category,
            entity: n.entity,
            content: n.content,
            updated_at: new Date().toISOString(),
            author_name: n.authorName || 'Équipe',
            author_email: n.authorEmail || ''
          });
        } catch(e){}
      }
    }
  }

  if (supabaseClient && state.currentUser && !isLocalEnvironment()) {
    try {
      const qPayloads = affectedQuestions.map(q => formatQuestionForSupabase(q));
      if (qPayloads.length > 0) {
        await supabaseClient.from('questions').upsert(qPayloads);
      }
      for (const c of affectedCases) await dbUpsertCase(c);
      saveStats();
    } catch(err) {
      console.warn("Erreur sync Supabase renommage catégorie:", err);
    }
  }

  if (state.bankSelectedCategory && state.bankSelectedCategory.toLowerCase() === cleanOld.toLowerCase()) {
    state.bankSelectedCategory = cleanNew;
  }
  if (state.playHierarchy && state.playHierarchy.selectedCategory && state.playHierarchy.selectedCategory.toLowerCase() === cleanOld.toLowerCase()) {
    state.playHierarchy.selectedCategory = cleanNew;
  }

  renderBank();
  renderHierarchySelector();
  renderDPCardsOnPlay();
  updateTopBar();

  showRewardToast(`Catégorie "${cleanOld}" renommée en "${cleanNew}" (${affectedQuestions.length} QCM mis à jour) !`, 'check-circle');
  return true;
}
window.renameCategory = renameCategory;

function renameCategoryPrompt(organ, currentCat) {
  if (isReader()) {
    alert("Action réservée aux comptes Créateurs.");
    return;
  }
  const newName = prompt(`Renommer la catégorie "${currentCat}"${organ ? ` dans "${organ}"` : ''} :\n\n(Astuce : vous pouvez saisir une catégorie existante pour les fusionner)`, currentCat);
  if (newName === null) return;
  const trimmed = newName.trim();
  if (!trimmed) {
    alert("Le nom de la catégorie ne peut pas être vide.");
    return;
  }
  renameCategory(organ, currentCat, trimmed);
}
window.renameCategoryPrompt = renameCategoryPrompt;

async function renameLesion(organ, category, oldEntity, newEntity) {
  if (!isCreator()) {
    alert("Action réservée aux comptes Créateurs.");
    return false;
  }
  const cleanOrgan = (organ || '').trim();
  const cleanCat = (category || '').trim();
  const cleanOld = (oldEntity || '').trim();
  const cleanNew = (newEntity || '').trim();
  if (!cleanOld || !cleanNew) {
    alert("Les noms de lésions ne peuvent pas être vides.");
    return false;
  }
  if (cleanOld.toLowerCase() === cleanNew.toLowerCase() && cleanOld === cleanNew) {
    return false;
  }

  const affectedQuestions = (state.questions || []).filter(q => 
    (!cleanOrgan || (q.organ || '').trim().toLowerCase() === cleanOrgan.toLowerCase()) &&
    (!cleanCat || (q.category || '').trim().toLowerCase() === cleanCat.toLowerCase()) &&
    (q.entity || '').trim().toLowerCase() === cleanOld.toLowerCase()
  );
  const affectedCases = (state.cases || []).filter(c => 
    (!cleanOrgan || (c.organ || '').trim().toLowerCase() === cleanOrgan.toLowerCase()) &&
    (!cleanCat || (c.category || '').trim().toLowerCase() === cleanCat.toLowerCase()) &&
    (c.entity || '').trim().toLowerCase() === cleanOld.toLowerCase()
  );

  if (affectedQuestions.length === 0 && affectedCases.length === 0) {
    alert(`Aucune question ni aucun cas trouvé pour la lésion "${cleanOld}".`);
    return false;
  }

  const confirmMsg = `Renommer la lésion "${cleanOld}" en "${cleanNew}" ?\n\n` +
    `• ${affectedQuestions.length} question(s) QCM seront mises à jour\n` +
    `• ${affectedCases.length} Dossier(s) Progressif(s) seront mis à jour`;

  if (!confirm(confirmMsg)) return false;

  affectedQuestions.forEach(q => { q.entity = cleanNew; });
  saveQuestions();

  affectedCases.forEach(c => { c.entity = cleanNew; });
  saveCases();

  if (state.lesionNotes) {
    const updatedNotes = {};
    const notesToDeleteFromCloud = [];
    const notesToUpsertToCloud = [];

    Object.keys(state.lesionNotes).forEach(k => {
      const note = state.lesionNotes[k];
      if (note && (!cleanOrgan || (note.organ || '').trim().toLowerCase() === cleanOrgan.toLowerCase()) &&
          (!cleanCat || (note.category || '').trim().toLowerCase() === cleanCat.toLowerCase()) &&
          (note.entity || '').trim().toLowerCase() === cleanOld.toLowerCase()) {
        const newKey = `${note.organ || 'Autre'}::${note.category || 'Général'}::${cleanNew}`;
        const updatedNote = { ...note, entity: cleanNew, key: newKey };
        updatedNotes[newKey] = updatedNote;
        notesToDeleteFromCloud.push(k);
        notesToUpsertToCloud.push(updatedNote);
      } else {
        updatedNotes[k] = note;
      }
    });
    state.lesionNotes = updatedNotes;
    localStorage.setItem(STORAGE_KEY_LESION_NOTES, JSON.stringify(state.lesionNotes));

    if (supabaseClient && state.currentUser && !isLocalEnvironment()) {
      for (const oldKey of notesToDeleteFromCloud) {
        try { await supabaseClient.from('lesion_notes').delete().eq('key', oldKey); } catch(e){}
      }
      for (const n of notesToUpsertToCloud) {
        try {
          await supabaseClient.from('lesion_notes').upsert({
            key: n.key,
            organ: n.organ,
            category: n.category,
            entity: n.entity,
            content: n.content,
            updated_at: new Date().toISOString(),
            author_name: n.authorName || 'Équipe',
            author_email: n.authorEmail || ''
          });
        } catch(e){}
      }
    }
  }

  if (supabaseClient && state.currentUser && !isLocalEnvironment()) {
    try {
      const qPayloads = affectedQuestions.map(q => formatQuestionForSupabase(q));
      if (qPayloads.length > 0) {
        await supabaseClient.from('questions').upsert(qPayloads);
      }
      for (const c of affectedCases) await dbUpsertCase(c);
      saveStats();
    } catch(err) {
      console.warn("Erreur sync Supabase renommage lésion:", err);
    }
  }

  renderBank();
  renderHierarchySelector();
  renderDPCardsOnPlay();
  updateTopBar();

  showRewardToast(`Lésion "${cleanOld}" renommée en "${cleanNew}" (${affectedQuestions.length} QCM mis à jour) !`, 'check-circle');
  return true;
}
window.renameLesion = renameLesion;

function renameLesionPrompt(organ, category, currentEntity) {
  if (isReader()) {
    alert("Action réservée aux comptes Créateurs.");
    return;
  }
  const newName = prompt(`Renommer la lésion "${currentEntity}" :\n\n(Astuce : vous pouvez saisir une lésion existante pour les fusionner)`, currentEntity);
  if (newName === null) return;
  const trimmed = newName.trim();
  if (!trimmed) {
    alert("Le nom de la lésion ne peut pas être vide.");
    return;
  }
  renameLesion(organ, category, currentEntity, trimmed);
}
window.renameLesionPrompt = renameLesionPrompt;

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

// --- FICHES DE COURS & CRITÈRES OMS PAR LÉSION ---

function safeLesionId(key) {
  return encodeURIComponent(key || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function renderLesionTopoHtml(rawText) {
  if (!rawText || !rawText.trim()) return '';
  const lines = rawText.split('\n');
  let html = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<div class="h-2"></div>';
      return;
    }

    // Titres de sections (Critères OMS, Profil IHC, Pièges, etc.)
    if (/^(📌|🔬|⚠️|💡|📋|⭐|###|##|#)\s*(.*)/.test(trimmed) || /^[A-Z0-9\s\(\)\/]{4,}\s*:/.test(trimmed)) {
      if (inList) { html += '</ul>'; inList = false; }
      const safeLine = escapeHtml(trimmed);
      let badgeColor = 'bg-slate-800 text-teal-300 border-teal-500/30';
      if (trimmed.includes('📌') || trimmed.toLowerCase().includes('critère')) {
        badgeColor = 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      } else if (trimmed.includes('🔬') || trimmed.toLowerCase().includes('ihc') || trimmed.toLowerCase().includes('profil')) {
        badgeColor = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      } else if (trimmed.includes('⚠️') || trimmed.toLowerCase().includes('piège') || trimmed.toLowerCase().includes('différentiel')) {
        badgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      } else if (trimmed.includes('💡') || trimmed.toLowerCase().includes('note') || trimmed.toLowerCase().includes('clinique')) {
        badgeColor = 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      }

      html += `<div class="mt-3 mb-1.5 flex items-center gap-2 font-bold text-xs px-2.5 py-1 rounded-lg border ${badgeColor}">${safeLine}</div>`;
      return;
    }

    // Puces de listes
    if (/^[•\-\*]\s+(.*)/.test(trimmed)) {
      if (!inList) { html += '<ul class="space-y-1.5 my-1 ml-1">'; inList = true; }
      const bulletContent = trimmed.replace(/^[•\-\*]\s+/, '');
      const formatted = escapeHtml(bulletContent).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
      html += `<li class="flex items-start text-xs text-slate-300 leading-relaxed"><span class="text-teal-400 mr-2 shrink-0 select-none">•</span><span>${formatted}</span></li>`;
      return;
    }

    if (inList) { html += '</ul>'; inList = false; }
    const formatted = escapeHtml(trimmed).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    html += `<p class="text-xs text-slate-300 leading-relaxed my-0.5">${formatted}</p>`;
  });

  if (inList) html += '</ul>';
  return html;
}

function formatLesionNoteDate(isoString) {
  if (!isoString) return 'Enregistré';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Enregistré';
    return `Mis à jour le ${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch(e) {
    return 'Enregistré';
  }
}

function createLesionTopoCard(organ, category, entity, key) {
  const sid = safeLesionId(key);
  const note = (state.lesionNotes && state.lesionNotes[key]) ? state.lesionNotes[key] : null;
  const hasNote = Boolean(note && note.content && note.content.trim().length > 0);

  const card = document.createElement('div');
  card.id = `lesion-topo-card-${sid}`;
  card.className = `rounded-2xl border transition duration-200 overflow-hidden shadow-lg mb-3 ${
    hasNote 
      ? 'bg-gradient-to-br from-slate-900/95 via-slate-900 to-indigo-950/30 border-indigo-500/30 hover:border-indigo-500/50' 
      : 'bg-slate-900/50 border border-dashed border-slate-800 hover:border-slate-700/80'
  }`;

  // Container View Mode
  const viewContainer = document.createElement('div');
  viewContainer.id = `lesion-topo-view-${sid}`;
  viewContainer.className = "p-4 space-y-3";

  if (hasNote) {
    viewContainer.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-indigo-500/20 pb-2.5">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/25 flex items-center justify-center font-bold shrink-0">
            <i data-lucide="book-open" class="w-4 h-4"></i>
          </div>
          <div>
            <h4 class="font-extrabold text-sm text-white flex items-center gap-2">
              <span>📘 Topo de cours & Critères OMS</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">Fiche validée</span>
            </h4>
            <div class="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400 mt-0.5">
              <span>${formatLesionNoteDate(note.updatedAt)}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <button type="button" onclick="copyLesionNoteToClipboard('${escapeJsString(key)}')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700/80" title="Copier le topo dans le presse-papier">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            <span>Copier</span>
          </button>
          <button type="button" onclick="openLesionNoteEditor('${escapeJsString(key)}')" class="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm" title="Modifier cette fiche">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>Modifier</span>
          </button>
        </div>
      </div>
      <div class="topo-content-body py-1 text-xs text-slate-200 font-sans leading-relaxed">
        ${renderLesionTopoHtml(note.content)}
      </div>
    `;
  } else {
    viewContainer.innerHTML = `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-slate-800/80 text-teal-400 border border-slate-700 flex items-center justify-center shrink-0">
            <i data-lucide="file-text" class="w-4.5 h-4.5"></i>
          </div>
          <div>
            <h4 class="font-bold text-sm text-slate-200 flex items-center gap-2">
              <span>📘 Fiche de synthèse & Critères OMS</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">À rédiger</span>
            </h4>
            <p class="text-xs text-slate-400 mt-0.5 max-w-xl leading-relaxed">
              Rédigez un topo de cours pour <strong>${escapeHtml(entity)}</strong> : critères diagnostiques majeurs OMS, profil IHC et pièges différentiels.
            </p>
          </div>
        </div>
        <button type="button" onclick="openLesionNoteEditor('${escapeJsString(key)}')" class="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm shadow-teal-500/20 shrink-0">
          <i data-lucide="pen-tool" class="w-3.5 h-3.5"></i>
          <span>✍️ Rédiger la fiche OMS</span>
        </button>
      </div>
    `;
  }
  card.appendChild(viewContainer);

  // Container Edit Mode
  const editContainer = document.createElement('div');
  editContainer.id = `lesion-topo-edit-${sid}`;
  editContainer.className = "p-4 space-y-3.5 hidden";
  editContainer.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
      <div class="flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold shrink-0">
          <i data-lucide="edit-3" class="w-4 h-4"></i>
        </div>
        <div>
          <h4 class="font-bold text-sm text-white flex items-center gap-2">
            <span>✍️ Rédiger la fiche OMS : ${escapeHtml(entity)}</span>
          </h4>
          <span class="text-[11px] text-slate-400">${escapeHtml(organ)} › ${escapeHtml(category)}</span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Canevas :</span>
        <button type="button" onclick="insertTemplateToLesionEditor('${escapeJsString(key)}', 'standard')" class="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-[11px] font-bold transition flex items-center space-x-1" title="Insérer le canevas complet OMS">
          <span>⚡ Canevas Type OMS</span>
        </button>
        <button type="button" onclick="insertTemplateToLesionEditor('${escapeJsString(key)}', 'criteres')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition" title="Ajouter la section Critères OMS">
          <span>+ Critères</span>
        </button>
        <button type="button" onclick="insertTemplateToLesionEditor('${escapeJsString(key)}', 'ihc')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition" title="Ajouter la section IHC">
          <span>+ IHC</span>
        </button>
        <button type="button" onclick="insertTemplateToLesionEditor('${escapeJsString(key)}', 'pieges')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition" title="Ajouter la section Pièges">
          <span>+ Pièges</span>
        </button>
      </div>
    </div>

    <div class="relative">
      <textarea id="lesion-topo-textarea-${sid}" class="w-full min-h-[200px] max-h-[550px] p-3.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-y" placeholder="Notez ici les critères diagnostiques majeurs de l'OMS, l'architecture histologique, le profil IHC indispensable, et les pièges diagnostiques..."></textarea>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
      <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <div class="flex items-center space-x-1 text-teal-400">
          <i data-lucide="shield-check" class="w-3.5 h-3.5 shrink-0"></i>
          <span>Sauvegarde locale & cloud partagée</span>
        </div>
        <span>•</span>
        <span class="text-slate-500">Astuce : <strong>Ctrl+Entrée</strong> pour enregistrer</span>
        ${hasNote ? `
          <span>•</span>
          <button type="button" onclick="deleteLesionNoteWithConfirm('${escapeJsString(key)}')" class="text-rose-400 hover:text-rose-300 hover:underline transition font-semibold">
            Supprimer la fiche
          </button>
        ` : ''}
      </div>
      <div class="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
        <button type="button" onclick="closeLesionNoteEditor('${escapeJsString(key)}')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition">
          Annuler
        </button>
        <button type="button" onclick="saveLesionNoteFromEditor('${escapeJsString(key)}', '${escapeJsString(organ)}', '${escapeJsString(category)}', '${escapeJsString(entity)}')" class="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm shadow-teal-500/20">
          <i data-lucide="save" class="w-3.5 h-3.5"></i>
          <span>Enregistrer la fiche OMS</span>
        </button>
      </div>
    </div>
  `;
  card.appendChild(editContainer);

  return card;
}

function openLesionNoteEditor(key) {
  const sid = safeLesionId(key);
  const viewEl = document.getElementById(`lesion-topo-view-${sid}`);
  const editEl = document.getElementById(`lesion-topo-edit-${sid}`);
  const taEl = document.getElementById(`lesion-topo-textarea-${sid}`);
  if (!viewEl || !editEl || !taEl) return;

  const note = (state.lesionNotes && state.lesionNotes[key]) ? state.lesionNotes[key] : null;
  taEl.value = (note && note.content) ? note.content : '';

  viewEl.classList.add('hidden');
  editEl.classList.remove('hidden');

  taEl.onkeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const parts = key.split('::');
      saveLesionNoteFromEditor(key, parts[0] || '', parts[1] || '', parts[2] || '');
    }
  };

  taEl.focus();
  if (window.lucide) lucide.createIcons();
}

function closeLesionNoteEditor(key) {
  const sid = safeLesionId(key);
  const viewEl = document.getElementById(`lesion-topo-view-${sid}`);
  const editEl = document.getElementById(`lesion-topo-edit-${sid}`);
  if (!viewEl || !editEl) return;

  editEl.classList.add('hidden');
  viewEl.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function insertTemplateToLesionEditor(key, type) {
  const sid = safeLesionId(key);
  const taEl = document.getElementById(`lesion-topo-textarea-${sid}`);
  if (!taEl) return;

  const curVal = taEl.value;
  let insertion = '';

  if (type === 'standard') {
    insertion = `📌 CRITÈRES DIAGNOSTIQUES OMS :
• 
• 

🔬 PROFIL IHC & BIOMARQUEURS :
• 

⚠️ PIÈGES & DIAGNOSTICS DIFFÉRENTIELS :
• 

💡 NOTES CLINIQUES & PRONOSTIC :
• `;
    if (!curVal.trim()) {
      taEl.value = insertion;
      taEl.focus();
      return;
    }
  } else if (type === 'criteres') {
    insertion = `📌 CRITÈRES DIAGNOSTIQUES OMS :\n• `;
  } else if (type === 'ihc') {
    insertion = `🔬 PROFIL IHC & BIOMARQUEURS :\n• `;
  } else if (type === 'pieges') {
    insertion = `⚠️ PIÈGES & DIAGNOSTICS DIFFÉRENTIELS :\n• `;
  }

  taEl.value = curVal + (curVal.endsWith('\n') ? '' : '\n\n') + insertion;
  taEl.focus();
}

async function saveLesionNoteFromEditor(key, organ, category, entity) {
  const sid = safeLesionId(key);
  const taEl = document.getElementById(`lesion-topo-textarea-${sid}`);
  if (!taEl) return;

  const content = taEl.value;
  await saveLesionNote(key, content, organ, category, entity);
}

async function saveLesionNote(key, content, organ, category, entity) {
  if (!state.lesionNotes) state.lesionNotes = {};
  const cleanContent = (content || '').trim();
  const authorName = state.currentUser
    ? (state.currentUser.user_metadata?.display_name || state.currentUser.email?.split('@')[0] || 'Rédacteur')
    : (isCreator() ? 'Rédacteur' : 'Pathologiste');
  const authorEmail = state.currentUser ? (state.currentUser.email || '') : '';
  const now = new Date().toISOString();

  if (!cleanContent) {
    delete state.lesionNotes[key];
  } else {
    state.lesionNotes[key] = {
      key: key,
      organ: organ || '',
      category: category || '',
      entity: entity || '',
      content: cleanContent,
      updatedAt: now,
      authorName: authorName,
      authorEmail: authorEmail
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY_LESION_NOTES, JSON.stringify(state.lesionNotes));
  } catch(e) {
    console.error("Erreur sauvegarde locale lesion_notes:", e);
  }

  if (supabaseClient) {
    try {
      if (!cleanContent) {
        await supabaseClient.from('lesion_notes').delete().eq('key', key);
      } else {
        await supabaseClient.from('lesion_notes').upsert({
          key: key,
          organ: organ || '',
          category: category || '',
          entity: entity || '',
          content: cleanContent,
          updated_at: now,
          author_name: authorName,
          author_email: authorEmail
        });
      }
    } catch(err) {
      console.warn("Supabase sync lesion_notes warning:", err);
    }
  }

  showToast(cleanContent ? "✓ Fiche OMS enregistrée avec succès !" : "Fiche OMS supprimée", "success");

  state.bankExpandedLesions.add(key);
  const scrollY = window.scrollY;
  renderBank();
  window.scrollTo(0, scrollY);
}

async function deleteLesionNoteWithConfirm(key) {
  if (!confirm("Voulez-vous vraiment supprimer cette fiche de cours / critères OMS ?")) {
    return;
  }
  const parts = key.split('::');
  await saveLesionNote(key, '', parts[0] || '', parts[1] || '', parts[2] || '');
}

function copyLesionNoteToClipboard(key) {
  const note = (state.lesionNotes && state.lesionNotes[key]) ? state.lesionNotes[key] : null;
  if (!note || !note.content) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(note.content).then(() => {
      showToast("📋 Fiche OMS copiée dans le presse-papier !", "info");
    }).catch(() => {
      showToast("Erreur lors de la copie", "error");
    });
  }
}

window.safeLesionId = safeLesionId;
window.createLesionTopoCard = createLesionTopoCard;
window.openLesionNoteEditor = openLesionNoteEditor;
window.closeLesionNoteEditor = closeLesionNoteEditor;
window.insertTemplateToLesionEditor = insertTemplateToLesionEditor;
window.saveLesionNoteFromEditor = saveLesionNoteFromEditor;
window.saveLesionNote = saveLesionNote;
window.deleteLesionNoteWithConfirm = deleteLesionNoteWithConfirm;
window.copyLesionNoteToClipboard = copyLesionNoteToClipboard;

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

    const lesionKey = `${q.organ || 'Autre'}::${q.category || 'Général'}::${q.entity || 'Lésion non spécifiée'}`;
    const lNote = (state.lesionNotes && state.lesionNotes[lesionKey]) ? state.lesionNotes[lesionKey] : null;
    const hasNote = Boolean(lNote && lNote.content && lNote.content.trim());

    if (statusFilter === 'with_topo' && !hasNote) return false;
    if (statusFilter === 'without_topo' && hasNote) return false;

    if (search) {
      const matchQ = (q.question || '').toLowerCase().includes(search);
      const matchCtx = (q.context || '').toLowerCase().includes(search);
      const matchOrg = (q.organ || '').toLowerCase().includes(search);
      const matchCat = (q.category || '').toLowerCase().includes(search);
      const matchEnt = (q.entity || '').toLowerCase().includes(search);
      const matchTags = (q.tags || []).some(t => t.toLowerCase().includes(search));
      const matchNote = Boolean(lNote && lNote.content && lNote.content.toLowerCase().includes(search));
      if (!matchQ && !matchCtx && !matchOrg && !matchCat && !matchEnt && !matchTags && !matchNote) return false;
    }
    return true;
  });

  const baseFilteredCases = state.cases.filter(c => {
    if (formatFilter !== 'all' && formatFilter !== 'dp') return false;
    if (statusFilter === 'mastered' || statusFilter === 'due') return false;
    if (tagFilter !== 'all' && !(c.tags || []).includes(tagFilter)) return false;

    const lesionKey = `${c.organ || 'Autre'}::${c.category || 'Général'}::${c.entity || 'Lésion non spécifiée'}`;
    const lNote = (state.lesionNotes && state.lesionNotes[lesionKey]) ? state.lesionNotes[lesionKey] : null;
    const hasNote = Boolean(lNote && lNote.content && lNote.content.trim());

    if (statusFilter === 'with_topo' && !hasNote) return false;
    if (statusFilter === 'without_topo' && hasNote) return false;

    if (search) {
      const matchT = (c.title || '').toLowerCase().includes(search);
      const matchSyn = (c.synopsis || '').toLowerCase().includes(search);
      const matchOrg = (c.organ || '').toLowerCase().includes(search);
      const matchCat = (c.category || '').toLowerCase().includes(search);
      const matchEnt = (c.entity || '').toLowerCase().includes(search);
      const matchTags = (c.tags || []).some(t => t.toLowerCase().includes(search));
      const matchNote = Boolean(lNote && lNote.content && lNote.content.toLowerCase().includes(search));
      if (!matchT && !matchSyn && !matchOrg && !matchCat && !matchEnt && !matchTags && !matchNote) return false;
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

  const availableOrgans = Object.keys(organMap).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

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
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center space-x-2">
            <span class="w-5 h-5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Onglet Organe :</span>
          </div>
          ${state.bankSelectedOrgan !== 'all' ? `
            <div class="flex flex-wrap items-center gap-1.5">
              ${isCreator() ? `
                <button onclick="createQuestionForOrgan('${escapeJsString(state.bankSelectedOrgan)}')" class="px-2.5 py-1 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition flex items-center space-x-1 shadow-sm" title="Créer une nouvelle question dans cet organe">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-teal-400"></i>
                  <span>+ Créer question</span>
                </button>
                <button onclick="renameOrganPrompt('${escapeJsString(state.bankSelectedOrgan)}')" class="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm" title="Renommer ou fusionner cet organe sur tous les QCM et DP">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  <span>Renommer "${escapeHtml(state.bankSelectedOrgan)}"</span>
                </button>
              ` : ''}
              <button onclick="startHierarchySession('organ', '${escapeJsString(state.bankSelectedOrgan)}')" class="px-3 py-1 rounded-xl bg-teal-600/10 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm">
                <i data-lucide="play" class="w-3.5 h-3.5"></i>
                <span>⚡ Taffer tout "${escapeHtml(state.bankSelectedOrgan)}"</span>
              </button>
            </div>
          ` : ''}
        </div>
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin touch-scroll-x">
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

      const availableCats = Object.keys(categoryMap).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
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
            <div class="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              ${curCat !== 'all' ? `
                ${isCreator() ? `
                  <button onclick="createQuestionForCategory('${escapeJsString(state.bankSelectedOrgan)}', '${escapeJsString(curCat)}')" class="px-2.5 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold transition flex items-center space-x-1 shadow-sm shadow-sky-500/10" title="Créer une nouvelle question dans cette catégorie">
                    <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-sky-400"></i>
                    <span>+ Créer question</span>
                  </button>
                  <button onclick="renameCategoryPrompt('${escapeJsString(state.bankSelectedOrgan)}', '${escapeJsString(curCat)}')" class="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center space-x-1 shadow-sm" title="Renommer ou fusionner cette catégorie">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    <span>Renommer "${escapeHtml(curCat)}"</span>
                  </button>
                ` : ''}
                <button onclick="startHierarchySession('category', '${escapeJsString(state.bankSelectedOrgan)}', '${escapeJsString(curCat)}')" class="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-sky-500/20">
                  <i data-lucide="play" class="w-3.5 h-3.5"></i>
                  <span>⚡ Taffer "${escapeHtml(curCat)}" (${activeQInCurSelection || totalQInCurSelection}Q)</span>
                </button>
              ` : `
                ${isCreator() ? `
                  <button onclick="createQuestionForOrgan('${escapeJsString(state.bankSelectedOrgan)}')" class="px-2.5 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition flex items-center space-x-1 shadow-sm" title="Créer une nouvelle question dans cet organe">
                    <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-teal-400"></i>
                    <span>+ Créer question</span>
                  </button>
                ` : ''}
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
    const selOrganNorm = state.bankSelectedOrgan.trim().toLowerCase();
    scopedQ = scopedQ.filter(q => (q.organ || "Autre").trim().toLowerCase() === selOrganNorm);
    scopedCases = scopedCases.filter(c => (c.organ || "Autre").trim().toLowerCase() === selOrganNorm);
  }

  if (state.bankSelectedCategory !== 'all') {
    const selCatNorm = state.bankSelectedCategory.trim().toLowerCase();
    scopedQ = scopedQ.filter(q => (q.category || "Général").trim().toLowerCase() === selCatNorm);
    scopedCases = scopedCases.filter(c => (c.category || "Général").trim().toLowerCase() === selCatNorm);
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
    if (la.organ !== lb.organ) return la.organ.localeCompare(lb.organ, 'fr', { sensitivity: 'base' });
    if (la.category !== lb.category) return la.category.localeCompare(lb.category, 'fr', { sensitivity: 'base' });
    return la.entity.localeCompare(lb.entity, 'fr', { sensitivity: 'base' });
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

    const note = (state.lesionNotes && state.lesionNotes[key]) ? state.lesionNotes[key] : null;
    const hasNote = Boolean(note && note.content && note.content.trim().length > 0);

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
            ${hasNote ? `<span class="inline-flex items-center gap-1 text-teal-300 font-bold bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full text-[10px]"><i data-lucide="book-open" class="w-3 h-3 text-teal-400"></i><span>Fiche OMS</span></span>` : ''}
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
        ${isCreator() ? `
          <button class="btn-rename-lesion px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1 transition shadow-sm" title="Renommer cette lésion sur tous les QCM et DP">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>Renommer</span>
          </button>
        ` : ''}
        <button class="btn-toggle-lesion-topo px-3 py-1.5 rounded-xl ${
          hasNote 
            ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' 
            : 'bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700'
        } text-xs font-bold flex items-center space-x-1.5 transition shadow-sm" title="${hasNote ? 'Consulter / modifier la fiche OMS' : 'Rédiger une fiche de cours OMS'}">
          <i data-lucide="${hasNote ? 'book-open' : 'file-edit'}" class="w-3.5 h-3.5 ${hasNote ? 'text-indigo-400' : 'text-slate-400'}"></i>
          <span>${hasNote ? 'Fiche OMS' : '+ Topo OMS'}</span>
        </button>
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

    const renameLesionBtn = header.querySelector('.btn-rename-lesion');
    if (renameLesionBtn) {
      renameLesionBtn.onclick = (e) => {
        e.stopPropagation();
        renameLesionPrompt(lesion.organ, lesion.category, lesion.entity);
      };
    }

    const topoBtn = header.querySelector('.btn-toggle-lesion-topo');
    if (topoBtn) {
      topoBtn.onclick = (e) => {
        e.stopPropagation();
        if (!state.bankExpandedLesions.has(key)) {
          state.bankExpandedLesions.add(key);
          renderBank();
        }
        if (!hasNote) {
          openLesionNoteEditor(key);
        } else {
          const sid = safeLesionId(key);
          const cEl = document.getElementById(`lesion-topo-card-${sid}`);
          if (cEl) cEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      };
    }

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

    // Fiche OMS & Topo de cours pour cette lésion
    const topoCard = createLesionTopoCard(lesion.organ, lesion.category, lesion.entity, key);
    bodyContainer.appendChild(topoCard);

    // Insérer les DP de cette lésion
    lesion.cases.forEach(c => {
      const card = document.createElement('div');
      card.id = `bank-case-card-${c.id}`;
      card.className = "bg-slate-900 border border-indigo-500/30 hover:border-indigo-500 rounded-xl p-4 transition duration-300 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm";
      card.innerHTML = `
        <div class="space-y-1.5 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">📋 DP (${c.steps.length} étapes)</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              ${escapeHtml(c.organ || 'Général')}
            </span>
          </div>
          <h4 class="font-bold text-sm text-white">${escapeHtml(c.title)}</h4>
          <p class="text-xs text-slate-400 line-clamp-1">${escapeHtml(c.synopsis)}</p>
          <div class="flex flex-wrap gap-1 mt-1">
            ${(c.tags || []).map(t => `<span class="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-mono">#${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-end md:self-auto mt-2 md:mt-0 w-full sm:w-auto justify-end">
          <button onclick="startDPSession('${escapeJsString(c.id)}')" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm shadow-indigo-500/20">
            <i data-lucide="play" class="w-3.5 h-3.5"></i>
            <span>Jouer</span>
          </button>
          <button onclick="editDP('${escapeJsString(c.id)}')" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="Modifier le DP">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          ${isAuthorizedToDelete() ? `
          <button onclick="deleteDP('${escapeJsString(c.id)}')" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition" title="Supprimer le DP (Admin)">
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
      card.id = `bank-question-card-${q.id}`;
      card.className = `bg-slate-900 border rounded-xl p-4 transition duration-300 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        q.mastered ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800 hover:border-slate-700'
      }`;

      const formatBadge = q.format === 'qcm' ? '☑️ QCM' : (q.format === 'piege' ? '⚠️ Vrai/Faux' : (q.format === 'ouverte' ? '✍️ Ouverte' : '🔘 QCU'));
      const rate = q.stats && q.stats.seen > 0 ? `${Math.round((q.stats.correct / q.stats.seen) * 100)}% (${q.stats.correct}/${q.stats.seen})` : 'Non jouée';
      const authorInfo = getQuestionAuthorDisplayName(q);

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
        <div class="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-end md:self-auto mt-2 md:mt-0 w-full sm:w-auto justify-end">
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
          <button onclick="editQuestion('${escapeJsString(q.id)}')" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="Modifier">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          ${isAuthorizedToDelete() ? `
          <button onclick="deleteQuestion('${escapeJsString(q.id)}')" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition" title="Supprimer (Admin)">
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
    const sortedOrgans = Object.keys(tree).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    organSelect.innerHTML = `<option value="all">Tous les organes</option>` + sortedOrgans.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
    organSelect.value = curVal || 'all';
  }

  if (tagSelect) {
    const curVal = tagSelect.value;
    const sortedTags = [...state.customTags].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    tagSelect.innerHTML = `<option value="all">Tous les tags (#)</option>` + sortedTags.map(t => `<option value="${escapeHtml(t)}">#${escapeHtml(t)}</option>`).join('');
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
    lesionNotes: state.lesionNotes || {},
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
      if (parsed.lesionNotes && typeof parsed.lesionNotes === 'object') {
        state.lesionNotes = Object.assign(state.lesionNotes || {}, parsed.lesionNotes);
        try {
          localStorage.setItem(STORAGE_KEY_LESION_NOTES, JSON.stringify(state.lesionNotes));
        } catch(e) {}
      }
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

// =========================================================================
// --- SYNCHRONISATION MULTI-POSTES AUTOMATIQUE (Mac Mini ↔ MacBook Air ↔ Mobile) ---
// =========================================================================

let lastRemoteCheckTime = 0;

async function checkForRemoteChanges() {
  if (!supabaseClient) return;
  const now = Date.now();
  if (now - lastRemoteCheckTime < 2500) return;
  lastRemoteCheckTime = now;

  try {
    const [qCountRes, cCountRes] = await Promise.all([
      supabaseClient.from('questions').select('*', { count: 'exact', head: true }),
      supabaseClient.from('cases').select('*', { count: 'exact', head: true })
    ]);

    const qCount = qCountRes ? qCountRes.count : null;
    const cCount = cCountRes ? cCountRes.count : null;
    const localQCount = (state.questions || []).length;
    const localCCount = (state.cases || []).length;

    let needSync = false;

    if (typeof qCount === 'number' && qCount !== localQCount) {
      console.log(`🔄 Différence questions détectée (Cloud: ${qCount}, Local: ${localQCount})`);
      needSync = true;
    }
    if (typeof cCount === 'number' && cCount !== localCCount) {
      console.log(`🔄 Différence cas DP détectée (Cloud: ${cCount}, Local: ${localCCount})`);
      needSync = true;
    }

    if (!needSync) {
      const { data: latestQ } = await supabaseClient
        .from('questions')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestQ && latestQ.length > 0) {
        const topId = latestQ[0].id;
        const localHasIt = (state.questions || []).some(q => q.id === topId);
        if (!localHasIt) {
          console.log(`🔄 Nouvelle question détectée sur le Cloud (${topId}) absente en local`);
          needSync = true;
        }
      }
    }

    if (!needSync) {
      const curEmail = getCurrentUserEmail();
      if (curEmail) {
        const { data: progTag } = await supabaseClient
          .from('custom_tags')
          .select('name')
          .like('name', `UPROG:${curEmail}:%`)
          .limit(1);
        if (progTag && progTag.length > 0) {
          const lastTag = localStorage.getItem('pathosorus_last_synced_uprog_tag');
          if (lastTag && lastTag !== progTag[0].name) {
            console.log("🔄 Changement de progression utilisateur Cloud détecté");
            needSync = true;
          }
        }
      }
    }

    if (needSync) {
      await fetchSupabaseData(true);
    }
  } catch(e) {
    console.warn("Avertissement checkForRemoteChanges:", e);
  }
}
window.checkForRemoteChanges = checkForRemoteChanges;

function triggerImmediateSync() {
  if (supabaseClient) {
    checkForRemoteChanges();
    fetchSupabaseData(true);
  }
}

// Réaction instantanée au focus, visibilité, retour en avant-plan et reconnexion Wi-Fi
window.addEventListener('focus', triggerImmediateSync);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') triggerImmediateSync();
});
window.addEventListener('pageshow', triggerImmediateSync);
window.addEventListener('online', () => {
  console.log("🌐 Connexion réseau rétablie, resynchronisation immédiate...");
  triggerImmediateSync();
  if (typeof setupRealtimeSync === 'function') setupRealtimeSync();
});

// Heartbeat rapide toutes les 10 secondes (vérification par HEAD count ultra-légère 0 octet)
setInterval(() => {
  if (supabaseClient) {
    checkForRemoteChanges();
  }
}, 10000);

// Heartbeat complet toutes les 35 secondes si l'onglet est actif
setInterval(() => {
  if (supabaseClient && document.visibilityState === 'visible') {
    fetchSupabaseData(true);
  }
}, 35000);
