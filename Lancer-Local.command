#!/usr/bin/env bash
# =========================================================================
# PATHOSORUS 🦖 - SCRIPT DE DÉMARRAGE LOCAL MAC
# =========================================================================
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "🦖 Démarrage de PathoSorus en local..."
echo "Ouverture automatique du navigateur sur http://localhost:8080"

# Ouvre le navigateur après un court délai
(sleep 1.2 && open "http://localhost:8080") &

# Lance le serveur Python local
python3 "$ROOT_DIR/scripts/dev_server.py"
