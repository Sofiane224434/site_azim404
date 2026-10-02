#!/usr/bin/env python3
"""
setup_nginx_maintenance.py
Configure automatiquement Nginx sur le VPS pour intercepter en 1 clic
la maintenance de tous les sites / sous-domaines configurés sur le serveur.
"""

import os
import subprocess
import re

SNIPPET_PATH = "/etc/nginx/snippets/azim_maintenance.conf"
SNIPPET_CONTENT = """# Azim404 Dynamic Maintenance System
auth_request /_azim_maintenance_check;
error_page 503 = @azim_maintenance_screen;

location = /_azim_maintenance_check {
    internal;
    auth_request off;
    proxy_pass http://127.0.0.1:5005/api/site-status/check;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header X-Original-Host $host;
    proxy_set_header Host $host;
    proxy_set_header Cookie $http_cookie;
    proxy_connect_timeout 2s;
    proxy_read_timeout 2s;
}

location @azim_maintenance_screen {
    auth_request off;
    proxy_pass http://127.0.0.1:5005/api/site-status/maintenance-screen;
    proxy_set_header Host $host;
    proxy_set_header X-Original-Host $host;
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header Cookie $http_cookie;
}
"""

TARGET_SITES = [
    "cxb.azim404.com",
    "gashooter.azim404.com",
    "wikisguessr.azim404.com",
    "fansite.azim404.com",
    "kulturdb.azim404.com",
    "novakult.azim404.com",
    "sofiane-kherarfa",
]

def main():
    print("=== Configuration du système de maintenance Nginx Azim404 ===")
    
    # 1. Écriture du snippet
    os.makedirs("/etc/nginx/snippets", exist_ok=True)
    with open(SNIPPET_PATH, "w", encoding="utf-8") as f:
        f.write(SNIPPET_CONTENT)
    print(f"✓ Snippet écrit dans {SNIPPET_PATH}")

    # 2. Injection du snippet dans chaque site cible
    for site_file in TARGET_SITES:
        filepath = os.path.join("/etc/nginx/sites-available", site_file)
        if not os.path.exists(filepath):
            print(f"⚠️  Fichier introuvable: {filepath}")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Si le snippet est déjà présent, on passe
        if "azim_maintenance.conf" in content:
            print(f"ℹ️  Déjà configuré: {site_file}")
            continue

        # Sauvegarde
        bakpath = filepath + ".bak_azim"
        if not os.path.exists(bakpath):
            with open(bakpath, "w", encoding="utf-8") as f:
                f.write(content)

        # On injecte le snippet dans le bloc "server" qui écoute sur le port 443 (SSL)
        # Juste avant le premier "location /"
        pattern = r"(location\s+/\s*\{)"
        if re.search(pattern, content):
            replacement = "    # Dynamic Maintenance Interceptor\n    include /etc/nginx/snippets/azim_maintenance.conf;\n\n    \\1"
            new_content = re.sub(pattern, replacement, content, count=1)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"✓ Injecté avec succès dans {site_file}")
        else:
            print(f"⚠️  Impossible de localiser 'location /' dans {site_file}")

    # 3. Test de la configuration Nginx
    res = subprocess.run(["nginx", "-t"], capture_output=True, text=True)
    if res.returncode == 0:
        print("✓ Test de syntaxe Nginx réussi (nginx -t OK)")
        # 4. Rechargement Nginx
        subprocess.run(["systemctl", "reload", "nginx"], check=True)
        print("✓ Nginx rechargé avec succès !")
    else:
        print("❌ Erreur de syntaxe Nginx :")
        print(res.stderr)
        raise RuntimeError("nginx -t a échoué")

if __name__ == "__main__":
    main()
