#!/usr/bin/env python3
"""
scripts/check_limits.py
Verifica limites de tamanho de arquivos de código de aplicação conforme RULE[limites-codigo.md].
- Backend (Python): Máximo 1.000 linhas. Alerta Vermelho: 801 a 1.000 linhas.
- Frontend (React/JSX/JS): Máximo 500 linhas. Alerta Vermelho: 370 a 500 linhas.
- Exceção obrigatória: Arquivos de teste (*.test.*, *.spec.*, test_*.py, pastas tests/) NUNCA entram no limite.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_SRC = ROOT / "frontend" / "src"

# Configurações de limites
LIMITS = {
    "backend": {
        "dir": BACKEND_DIR,
        "extensions": [".py"],
        "max_lines": 1000,
        "critical_min": 801,
        "name": "Backend (Python)"
    },
    "frontend": {
        "dir": FRONTEND_SRC,
        "extensions": [".js", ".jsx", ".ts", ".tsx"],
        "max_lines": 500,
        "critical_min": 370,
        "name": "Frontend (React/JS/JSX)"
    }
}

TEST_INDICATORS = [
    ".test.", ".spec.", "test_", "_test.",
    "/tests/", "\\tests\\",
    "/tests_unit/", "\\tests_unit\\",
    "/tests_e2e/", "\\tests_e2e\\"
]

def is_test_file(path: Path) -> bool:
    path_str = str(path).lower()
    return any(ind in path_str for ind in TEST_INDICATORS)

def count_lines(path: Path) -> int:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0

def check_limits():
    print("=" * 70)
    print("📏 [CHECK LIMITS] Verificando limites de linhas (Clean Code)...")
    print("=" * 70)

    hard_violations = []
    critical_alerts = []
    total_files_checked = 0

    for scope_key, cfg in LIMITS.items():
        base_dir = cfg["dir"]
        if not base_dir.exists():
            continue

        print(f"\n🔍 Verificando {cfg['name']} em: {base_dir.relative_to(ROOT)}...")

        for ext in cfg["extensions"]:
            for file_path in base_dir.rglob(f"*{ext}"):
                if is_test_file(file_path):
                    continue

                total_files_checked += 1
                lines = count_lines(file_path)
                rel_path = file_path.relative_to(ROOT)

                if lines > cfg["max_lines"]:
                    hard_violations.append((rel_path, lines, cfg["max_lines"], cfg["name"]))
                elif lines >= cfg["critical_min"]:
                    critical_alerts.append((rel_path, lines, cfg["critical_min"], cfg["max_lines"], cfg["name"]))

    print(f"\n📊 Total de arquivos de aplicação analisados: {total_files_checked}")

    if critical_alerts:
        print("\n" + "🚨 " * 20)
        print("🚨 ALERTA VERMELHO: Arquivos na Zona Crítica (quase no limite máximo):")
        for rel_path, lines, crit_min, max_l, name in critical_alerts:
            print(f"   ⚠️  [{name}] {rel_path} -> {lines} linhas (Faixa crítica: {crit_min}-{max_l})")
        print("🚨 " * 20)

    if hard_violations:
        print("\n" + "❌ " * 20)
        print("❌ VIOLAÇÕES DE LIMITE ULTRAPASSADAS:")
        for rel_path, lines, max_l, name in hard_violations:
            print(f"   ⛔ [{name}] {rel_path} -> {lines} linhas (Máximo permitido: {max_l})")
        print("❌ " * 20)
        print("\n[ERRO] Por favor, modularize os arquivos acima antes de prosseguir com o push.")
        return 1

    print("\n✅ [SUCESSO] Nenhum arquivo ultrapassou o teto máximo permitido!")
    print("=" * 70)
    return 0

if __name__ == "__main__":
    sys.exit(check_limits())
