#!/usr/bin/env python3
"""
PathoSorus 🦖 - Serveur de Développement Local
Permet de tester l'application localement, avec émulation de la fonction Netlify
d'administration des utilisateurs (création directe de comptes lecteurs et créateurs).
"""

import http.server
import socketserver
import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

PORT = 8080
ROOT_DIR = Path(__file__).resolve().parent.parent

# Chargement d'un éventuel fichier .env
env_file = ROOT_DIR / ".env"
if env_file.exists():
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

DEFAULT_URL = os.environ.get("SUPABASE_URL", "https://tevcifnshxzhkdkrcrph.supabase.co").rstrip("/")
DEFAULT_ANON = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldmNpZm5zaHh6aGtka3JjcnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MDY5NzQsImV4cCI6MjEwODE4Mjk3NH0.AuRQ8LfMJWe5oaRyn79dTEQThEH8q29ckkaEg9lXGKI")
DEFAULT_SERVICE = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

class PathoSorusHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-service-key")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path.startswith("/.netlify/functions/create-user"):
            self.handle_create_user()
        else:
            self.send_error(404, "Endpoint non trouvé")

    def handle_create_user(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception as e:
            return self.send_json_response(400, {"message": "Corps JSON invalide : " + str(e)})

        email = str(body.get("email", "")).strip().lower()
        password = str(body.get("password", ""))
        role = "creator" if body.get("role") == "creator" else "reader"

        if not email or "@" not in email:
            return self.send_json_response(400, {"message": "Adresse email invalide"})
        if len(password) < 6:
            return self.send_json_response(400, {"message": "Mot de passe trop court (min 6 caractères)"})

        service_key = (
            self.headers.get("x-service-key") or
            body.get("serviceRoleKey") or
            DEFAULT_SERVICE or
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        )

        if not service_key:
            return self.send_json_response(501, {
                "message": "Clé SUPABASE_SERVICE_ROLE_KEY manquante. Renseignez-la dans le fichier .env ou dans la boîte de dialogue de gestion des comptes pour autoriser la création de comptes."
            })

        # Appel à Supabase Admin API
        url = DEFAULT_URL + "/auth/v1/admin/users"
        payload = {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"role": role}
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                user_id = resp_data.get("id")

                # Upsert dans public.profiles
                if user_id:
                    try:
                        p_url = DEFAULT_URL + "/rest/v1/profiles"
                        p_req = urllib.request.Request(
                            p_url,
                            data=json.dumps({"id": user_id, "email": email, "role": role}).encode("utf-8"),
                            headers={
                                "apikey": service_key,
                                "Authorization": f"Bearer {service_key}",
                                "Content-Type": "application/json",
                                "Prefer": "resolution=merge-duplicates"
                            },
                            method="POST"
                        )
                        urllib.request.urlopen(p_req)
                    except Exception as pe:
                        print("Warning: Upsert profiles:", pe)

                label = "Créateur" if role == "creator" else "Lecteur"
                return self.send_json_response(200, {
                    "success": True,
                    "message": f"Compte {label} créé avec succès pour {email} !",
                    "user": {"id": user_id, "email": email, "role": role}
                })
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                err_json = json.loads(err_body)
                msg = err_json.get("msg") or err_json.get("message") or err_body
            except Exception:
                msg = err_body
            return self.send_json_response(e.code, {"message": msg})
        except Exception as e:
            return self.send_json_response(500, {"message": "Erreur serveur local : " + str(e)})

    def send_json_response(self, code, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def run():
    os.chdir(str(ROOT_DIR))
    with socketserver.TCPServer(("", PORT), PathoSorusHandler) as httpd:
        print("=" * 60)
        print(f"🦖 PATHOSORUS LOCAL SERVER DÉMARRÉ SUR http://localhost:{PORT}")
        print("=" * 60)
        print(f"Racine : {ROOT_DIR}")
        print("Pour arrêter le serveur : Ctrl + C")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt du serveur.")

if __name__ == "__main__":
    run()
