#!/usr/bin/env python3
"""
scripts/release.py
Orquestrador Mestre de Pré-Push e Release do ZapVoice.

Executa as etapas obrigatórias de qualidade e segurança antes do push para o GitHub:
  1. [SECRETS] Varredura de chaves e segredos expostos
  2. [ENV SYNC] Validação do backend/.env.example contra os.getenv()
  3. [CODE LIMITS] Verificação de teto de linhas (Backend <= 1000, Frontend <= 500)
  4. [DB SCHEMA] Validação de integridade do SQLAlchemy e modelos
  5. [AUDIT ENDPOINTS] Auditoria de segurança e rotas da API FastAPI
  6. [SECURITY AUDIT] Auditoria de vulnerabilidades em bibliotecas (pip-audit + npm audit)
  7. [UNIT TESTS] Execução dos testes unitários do backend
  8. [ROOT CLEANUP] Verificação e limpeza de arquivos temporários da raiz
  9. [DOCKER & VERSION] Verificação de formato de tags de versão e imagens Docker

Uso:
  python scripts/release.py --dry-run
  python scripts/release.py --dry-run --skip-security
  python scripts/release.py --version 2.2.5
"""

import os
import re
import sys
import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Padrões de arquivos temporários permitidos para limpeza na raiz
ROOT_JUNK_PATTERNS = [
    r"^screenshot.*\.png$",
    r"^fixed_layout_.*\.png$",
    r"^modal_saved_.*\.png$",
    r"^evidencia_.*\.png$",
    r"^debug_.*\.png$",
    r"^chrome_.*\.log$",
    r"^chrome_err\.log$",
    r"^chrome_headless\.log$",
    r"^zapvoice_debug\.log$",
    r"^.*\.log$",
    r"^test_.*\.db$",
    r"^zapvoice\.db$"
]

def run_step(step_name: str, cmd: list, cwd: Path = ROOT) -> int:
    print("\n" + "=" * 70)
    print(f"🚀 [ETAPA] {step_name}")
    print(f"Comando: {' '.join(str(c) for c in cmd)}")
    print("=" * 70)

    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"

    result = subprocess.run(
        cmd,
        cwd=str(cwd),
        env=env,
        text=True
    )
    return result.returncode

def check_root_cleanup(dry_run: bool = False) -> int:
    print("\n" + "=" * 70)
    print("🧹 [ROOT CLEANUP] Verificando arquivos temporários na raiz do projeto...")
    print("=" * 70)

    junk_found = []
    for item in ROOT.iterdir():
        if item.is_file():
            # Não tocar em arquivos protegidos
            if item.name in ["verify_system.py"]:
                continue
            for pat in ROOT_JUNK_PATTERNS:
                if re.match(pat, item.name, re.IGNORECASE):
                    junk_found.append(item)
                    break

    if not junk_found:
        print("✅ Raiz limpa! Nenhum arquivo de print, log ou banco de dados temporário encontrado.")
        return 0

    print(f"⚠️  Arquivos temporários identificados na raiz ({len(junk_found)}):")
    for j in junk_found:
        print(f"   🗑️  {j.name}")

    if dry_run:
        print("ℹ️  [DRY RUN] Nenhum arquivo foi deletado.")
        return 0

    print("\nRemovendo arquivos temporários da raiz...")
    for j in junk_found:
        try:
            j.unlink()
            print(f"   ✓ Removido: {j.name}")
        except Exception as e:
            print(f"   ❌ Falha ao remover {j.name}: {e}")

    print("✅ Limpeza da raiz concluída com sucesso.")
    return 0

def check_version_and_docker_tags(target_version: str = None) -> int:
    print("\n" + "=" * 70)
    print("🐳 [DOCKER & VERSION] Validando padrões de versão e tags de imagem...")
    print("=" * 70)

    pkg_json = ROOT / "frontend" / "package.json"
    compose_prod = ROOT / "docker" / "docker-compose-producao.yml"

    # Ler versão do package.json
    frontend_ver = None
    if pkg_json.exists():
        content = pkg_json.read_text(encoding="utf-8")
        m = re.search(r'"version"\s*:\s*"([^"]+)"', content)
        if m:
            frontend_ver = m.group(1)

    print(f"📦 Versão atual no frontend/package.json: {frontend_ver}")

    # Validar docker-compose-producao.yml
    if compose_prod.exists():
        prod_content = compose_prod.read_text(encoding="utf-8")
        images = re.findall(r'image:\s*(aryalvesfernandes/zapvoice:[^\s]+)', prod_content)
        print(f"🐳 Imagens encontradas no docker-compose-producao.yml: {images}")

        # Proibir :latest
        for img in images:
            if ":latest" in img:
                print(f"❌ [ERRO] Imagem com tag :latest proibida detectada: {img}")
                return 1
            if not re.search(r'zapvoice:(backend|worker)-\d+\.\d+\.\d+', img):
                print(f"❌ [ERRO] Imagem fora do padrão semântico (backend-X.Y.Z ou worker-X.Y.Z): {img}")
                return 1

    print("✅ Padrão de versionamento e imagens Docker validado com sucesso (zero :latest)!")
    return 0

def main():
    parser = argparse.ArgumentParser(description="Pipeline Mestre Pré-Push ZapVoice")
    parser.add_argument("--dry-run", action="store_true", help="Executa todas as verificações sem modificar ou enviar arquivos")
    parser.add_argument("--version", type=str, help="Versão semântica para bump (ex: 2.2.5)")
    parser.add_argument("--skip-security", action="store_true", help="Pula auditoria de vulnerabilidades pip-audit/npm")
    parser.add_argument("--skip-tests", action="store_true", help="Pula execução dos testes unitários")
    args = parser.parse_args()

    print("=" * 70)
    print("🛡️  PIPELINE DE VALIDAÇÃO PRÉ-PUSH - PROJETO ZAPJORDS")
    print("=" * 70)
    print(f"Modo Dry-Run: {'SIM' if args.dry_run else 'NÃO'}")
    if args.version:
        print(f"Versão Alvo: {args.version}")

    failures = []

    # 1. Chaves e Segredos
    code = run_step("1. Varredura de Chaves e Segredos", [sys.executable, "scripts/check_secrets.py"])
    if code != 0:
        failures.append("1. Varredura de Segredos (check_secrets.py)")

    # 2. Sincronia de Variáveis de Ambiente
    code = run_step("2. Sincronia do .env.example", [sys.executable, "scripts/check_env_sync.py"])
    if code != 0:
        failures.append("2. Sincronia do .env.example (check_env_sync.py)")

    # 3. Limites de Linhas e Clean Code
    code = run_step("3. Limites de Linhas (Clean Code)", [sys.executable, "scripts/check_limits.py"])
    if code != 0:
        failures.append("3. Limites de Linhas (check_limits.py)")

    # 4. Integridade do Banco de Dados
    code = run_step("4. Integridade de Modelos e Banco de Dados", [sys.executable, "scripts/check_db_schema.py"])
    if code != 0:
        failures.append("4. Integridade de Banco de Dados (check_db_schema.py)")

    # 5. Auditoria de Endpoints FastAPI
    code = run_step("5. Auditoria de Endpoints e Permissões", [sys.executable, "scripts/audit_endpoints.py"])
    if code != 0:
        failures.append("5. Auditoria de Endpoints (audit_endpoints.py)")

    # 6. Auditoria de Segurança de Dependências
    if not args.skip_security:
        code = run_step("6. Auditoria de Segurança (pip-audit + npm audit)", [sys.executable, "scripts/audit_security.py"])
        if code != 0:
            failures.append("6. Auditoria de Dependências (audit_security.py)")
    else:
        print("\n⏭️  [PULADO] Auditoria de dependências (--skip-security)")

    # 7. Testes Unitários
    if not args.skip_tests:
        backend_tests_cmd = [sys.executable, "-m", "pytest", "backend/tests_unit/test_reaction_marks_read.py", "backend/tests_unit/test_crm_sales_kanban.py", "-q"]
        code = run_step("7. Testes Unitários do Backend", backend_tests_cmd)
        if code != 0:
            failures.append("7. Testes Unitários (pytest)")
    else:
        print("\n⏭️  [PULADO] Testes unitários (--skip-tests)")

    # 8. Limpeza da Raiz
    code = check_root_cleanup(dry_run=args.dry_run)
    if code != 0:
        failures.append("8. Limpeza da Raiz")

    # 9. Validação de Versão e Docker Tags
    code = check_version_and_docker_tags(args.version)
    if code != 0:
        failures.append("9. Validação de Versão / Docker")

    print("\n" + "=" * 70)
    print("📊 RESUMO GERAL DO PIPELINE PRÉ-PUSH")
    print("=" * 70)

    if failures:
        print(f"❌ [FALHA] {len(failures)} etapa(s) reprovada(s):")
        for f in failures:
            print(f"   • {f}")
        print("\nCorrija as falhas acima antes de realizar qualquer commit ou push.")
        return 1

    print("🎉 [TODAS AS ETAPAS APROVADAS] Sistema 100% validado para commit e push!")
    print("=" * 70)
    return 0

if __name__ == "__main__":
    sys.exit(main())
