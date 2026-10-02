#!/usr/bin/env python3
"""
setup_nginx_maintenance.py
Configure automatiquement Nginx sur le VPS pour intercepter en 1 clic
la maintenance de tous les sites / sous-domaines configurés sur le serveur (dans le bloc 443 / SSL).
"""

import os
import subprocess
import re

SNIPPET_PATH = "/etc/nginx/snippets/azim_maintenance.conf"
SNIPPET_CONTENT = """# Azim404 Dynamic Maintenance System
auth_request /_azim_maintenance_check;
error_page 403 =503 @azim_maintenance_screen;

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
    rewrite ^ /api/site-status/maintenance-screen break;
    proxy_pass http://127.0.0.1:5005;
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

    # 2. Injection du snippet dans chaque site cible (bloc SSL 443 uniquement)
    for site_file in TARGET_SITES:
        filepath = os.path.join("/etc/nginx/sites-available", site_file)
        if not os.path.exists(filepath):
            print(f"⚠️  Fichier introuvable: {filepath}")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Nettoie les anciennes injections potentielles (y compris celles en port 80)
        cleaned = re.sub(r"\s*# Dynamic Maintenance Interceptor\s*include /etc/nginx/snippets/azim_maintenance\.conf;\s*", "\n", content)
        cleaned = re.sub(r"\s*include /etc/nginx/snippets/azim_maintenance\.conf;\s*", "\n", cleaned)

        # Divise par blocs server
        blocks = cleaned.split("server {")
        new_blocks = []
        injected = False

        for block in blocks:
            if not block.strip():
                new_blocks.append(block)
                continue

            # On injecte uniquement dans le bloc qui gère le trafic HTTPS / 443 / SSL
            if ("443" in block or "ssl" in block) and not injected:
                if re.search(r"location\s+/\s*\{", block):
                    block = re.sub(
                        r"(location\s+/\s*\{)",
                        "    # Dynamic Maintenance Interceptor\n    include /etc/nginx/snippets/azim_maintenance.conf;\n\n    \\1",
                        block,
                        count=1
                    )
                    injected = True
            new_blocks.append(block)

        new_content = "server {".join(new_blocks)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)

        if injected:
            print(f"✓ Injecté dans le bloc SSL 443 de {site_file}")
        else:
            print(f"⚠️  Bloc SSL 443 non localisé pour {site_file}")

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
