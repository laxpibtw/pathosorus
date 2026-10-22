/**
 * PATHOSORUS 🦖 - NETLIFY FUNCTION: CREATE USER
 * Permet au créateur/administrateur de créer des comptes pour ses co-internes
 * avec le rôle 'creator' ou 'reader', confirmés immédiatement sans email.
 */

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-service-key",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function getBearer(event) {
  const h = event.headers.authorization || event.headers.Authorization || "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(204, {});
  }
  if (event.httpMethod !== "POST") {
    return json(405, { message: "Méthode non autorisée. Utilisez POST." });
  }

  const url = (process.env.SUPABASE_URL || "https://tevcifnshxzhkdkrcrph.supabase.co").replace(/\/$/, "");
  const anon = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldmNpZm5zaHh6aGtka3JjcnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MDY5NzQsImV4cCI6MjEwODE4Mjk3NH0.AuRQ8LfMJWe5oaRyn79dTEQThEH8q29ckkaEg9lXGKI";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || event.headers["x-service-key"] || "";

  if (!url || !anon) {
    return json(500, { message: "Supabase n'est pas configuré sur ce serveur." });
  }

  if (!service) {
    return json(501, {
      message: "Clé SUPABASE_SERVICE_ROLE_KEY manquante. Renseignez-la dans Netlify (Environment variables) ou en local pour autoriser la création de comptes sans validation d'e-mail.",
    });
  }

  const token = getBearer(event);
  if (!token && !event.headers["x-service-key"]) {
    return json(401, { message: "Vous devez être connecté pour créer un compte." });
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    body = {};
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = body.role === "creator" ? "creator" : "reader";

  if (!email || !email.includes("@")) {
    return json(400, { message: "Veuillez fournir une adresse e-mail valide." });
  }
  if (password.length < 6) {
    return json(400, { message: "Le mot de passe doit comporter au moins 6 caractères." });
  }

  // Vérification des droits créateur de l'appelant
  let isCreator = false;

  // Si une clé service_role est fournie directement dans l'entête local
  if (event.headers["x-service-key"] && event.headers["x-service-key"] === service) {
    isCreator = true;
  }

  if (!isCreator && token) {
    try {
      const userRes = await fetch(url + "/auth/v1/user", {
        headers: { apikey: anon, Authorization: "Bearer " + token },
      });
      if (userRes.ok) {
        const u = await userRes.json();
        if (u && u.email && u.email.toLowerCase() === "padoreau85@gmail.com") {
          isCreator = true;
        }
      }
    } catch (e) {}

    if (!isCreator) {
      try {
        const adminCheck = await fetch(url + "/rest/v1/rpc/is_creator", {
          method: "POST",
          headers: {
            apikey: anon,
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: "{}",
        });
        if (adminCheck.ok) {
          isCreator = (await adminCheck.json()) === true;
        }
      } catch (e) {
        isCreator = false;
      }
    }
  }

  if (!isCreator) {
    return json(403, { message: "Accès refusé. Seuls les créateurs peuvent créer de nouveaux comptes pour les collègues." });
  }

  // Création du compte utilisateur via l'API Admin de Supabase
  try {
    const createRes = await fetch(url + "/auth/v1/admin/users", {
      method: "POST",
      headers: {
        apikey: service,
        Authorization: "Bearer " + service,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { role },
      }),
    });

    const payload = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      return json(createRes.status, {
        message: payload.msg || payload.message || payload.error_description || "Impossible de créer ce compte.",
      });
    }

    // Mise à jour de la table public.profiles
    if (payload.id) {
      try {
        await fetch(url + "/rest/v1/profiles", {
          method: "POST",
          headers: {
            apikey: service,
            Authorization: "Bearer " + service,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            id: payload.id,
            email,
            role,
          }),
        });
      } catch (profErr) {
        console.warn("Profil auto-insert warning:", profErr);
      }
    }

    const label = role === "creator" ? "Créateur" : "Lecteur";
    return json(200, {
      success: true,
      message: `Compte ${label} créé avec succès pour ${email} !`,
      user: { id: payload.id, email, role },
    });
  } catch (err) {
    return json(500, { message: "Erreur serveur : " + err.message });
  }
};
