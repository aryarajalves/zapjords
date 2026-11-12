#!/usr/bin/env python3
"""
scripts/release.py
Orquestrador Mestre de Pré-Push e Release do ZapVoice.

Executa as etapas obrigatórias de qualidade e segurança antes do push para o GitHub:
  1. [SECRETS] Varredura de chaves e segredos expostos (check_secrets.py)
  2. [ENV SYNC] Validação do backend/.env.example contra os.getenv() (check_env_sync.py)
  3. [CODE LIMITS] Verificação de teto de linhas (Backend <= 1000, Frontend <= 500) (check_limits.py)
  4. [DB SCHEMA] Validação de integridade do SQLAlchemy e modelos (check_db_schema.py)
  5. [AUDIT ENDPOINTS] Auditoria de segurança e rotas da API FastAPI (audit_endpoints.py)
  6. [SECURITY AUDIT] Auditoria de vulnerabilidades em bibliotecas (pip-audit + npm audit)
  7. [UNIT TESTS] Execução dos testes unitários do backend
  8. [ROOT CLEANUP] Verificação e limpeza de arquivos temporários da raiz
  9. [DOCKER & VERSION] Geração opcional/interativa das imagens Docker para PRODUÇÃO:
     - aryalvesfernandes/zapvoice:backend-<versao> (Dockerfile.api + build Vite)
     - aryalvesfernandes/zapvoice:worker-<versao> (Dockerfile.worker)
     (PROIBIDO USO DE TAG :latest)

Uso:
  python scripts/release.py --dry-run
  python scripts/release.py --build-docker
  python scripts/release.py --no-docker
  python scripts/release.py --version 2.2.6
"""

import os
import re
import sys
import json
import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
PKG_JSON_PATH = FRONTEND_DIR / "package.json"
COMPOSE_PROD_PATH = ROOT / "docker" / "docker-compose-producao.yml"
README_PATH = ROOT / "README.md"

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
        text=True,
        shell=(os.name == "nt")
    )
    return result.returncode

def get_current_version() -> str:
    """Lê a versão atual do frontend/package.json (ou fallback para 2.2.5)."""
    if PKG_JSON_PATH.exists():
        try:
            with open(PKG_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("version", "2.2.5")
        except Exception:
            pass
    return "2.2.5"

def calculate_next_version(current_version: str) -> str:
    """
    Calcula a próxima versão seguindo a regra decimal estrita:
    X.Y.Z
    - Incrementa Z em 1.
    - Se Z > 9: Z = 0 e Y = Y + 1.
    - Se Y > 9: Y = 0 e X = X + 1.
    Exemplos:
      2.2.5 -> 2.2.6
      2.2.9 -> 2.3.0
      2.9.9 -> 3.0.0
    """
    parts = current_version.strip().split(".")
    if len(parts) != 3:
        raise ValueError(f"Formato de versão inválido: '{current_version}'. Esperado: X.Y.Z")
    try:
        x, y, z = int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError:
        raise ValueError(f"Versão contém partes não numéricas: '{current_version}'")

    z += 1
    if z > 9:
        z = 0
        y += 1
    if y > 9:
        y = 0
        x += 1

    return f"{x}.{y}.{z}"

def update_version_files(new_version: str):
    """Atualiza a versão nos arquivos do projeto."""
    print(f"\n📝 Atualizando versão para {new_version} nos arquivos do projeto...")

    # 1. frontend/package.json
    if PKG_JSON_PATH.exists():
        with open(PKG_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["version"] = new_version
        with open(PKG_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"   ✓ frontend/package.json atualizado para {new_version}")

    # 2. docker/docker-compose-producao.yml
    if COMPOSE_PROD_PATH.exists():
        content = COMPOSE_PROD_PATH.read_text(encoding="utf-8")
        # Substitui backend
        content = re.sub(
            r'image:\s*aryalvesfernandes/zapvoice:backend-\d+\.\d+\.\d+',
            f'image: aryalvesfernandes/zapvoice:backend-{new_version}',
            content
        )
        # Substitui worker
        content = re.sub(
            r'image:\s*aryalvesfernandes/zapvoice:worker-\d+\.\d+\.\d+',
            f'image: aryalvesfernandes/zapvoice:worker-{new_version}',
            content
        )
        COMPOSE_PROD_PATH.write_text(content, encoding="utf-8")
        print(f"   ✓ docker/docker-compose-producao.yml atualizado com backend-{new_version} e worker-{new_version}")

    # 3. README.md
    if README_PATH.exists():
        readme_content = README_PATH.read_text(encoding="utf-8")
        readme_content = re.sub(
            r'# ⚡ ZapVoice - Automação WhatsApp API Oficial \(v\d+\.\d+\.\d+ — Versão Estável\)',
            f'# ⚡ ZapVoice - Automação WhatsApp API Oficial (v{new_version} — Versão Estável)',
            readme_content
        )
        README_PATH.write_text(readme_content, encoding="utf-8")
        print(f"   ✓ README.md atualizado para v{new_version}")

def check_root_cleanup(dry_run: bool = False) -> int:
    print("\n" + "=" * 70)
    print("🧹 [ROOT CLEANUP] Verificando arquivos temporários na raiz do projeto...")
    print("=" * 70)

    junk_found = []
    for item in ROOT.iterdir():
        if item.is_file():
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

def check_version_and_docker_tags() -> int:
    print("\n" + "=" * 70)
    print("🐳 [DOCKER & VERSION] Validando padrões de versão e tags de imagem...")
    print("=" * 70)

    frontend_ver = get_current_version()
    print(f"📦 Versão atual no frontend/package.json: {frontend_ver}")

    if COMPOSE_PROD_PATH.exists():
        prod_content = COMPOSE_PROD_PATH.read_text(encoding="utf-8")
        images = re.findall(r'image:\s*(aryalvesfernandes/zapvoice:[^\s]+)', prod_content)
        print(f"🐳 Imagens encontradas no docker-compose-producao.yml: {images}")

        for img in images:
            if ":latest" in img:
                print(f"❌ [ERRO] Imagem com tag :latest proibida detectada: {img}")
                return 1
            if not re.search(r'zapvoice:(backend|worker)-\d+\.\d+\.\d+', img):
                print(f"❌ [ERRO] Imagem fora do padrão semântico (backend-X.Y.Z ou worker-X.Y.Z): {img}")
                return 1

    print("✅ Padrão de versionamento e imagens Docker validado com sucesso (zero :latest)!")
    return 0

def build_and_push_docker_images(target_version: str, push: bool = True) -> int:
    """
    Constrói e envia as imagens de TODOS os serviços de produção obrigatórios:
    1. Compilação do Frontend (Vite)
    2. Backend (API + Web): aryalvesfernandes/zapvoice:backend-<versao>
    3. Worker (Filas + RabbitMQ): aryalvesfernandes/zapvoice:worker-<versao>
    """
    backend_tag = f"aryalvesfernandes/zapvoice:backend-{target_version}"
    worker_tag = f"aryalvesfernandes/zapvoice:worker-{target_version}"

    print("\n" + "#" * 70)
    print("🐳 [DOCKER BUILD & RELEASE] INICIANDO CRIAÇÃO DE IMAGENS DE PRODUÇÃO")
    print(f"🏷️  Versão Alvo:  {target_version}")
    print(f"📦 Backend Tag:   {backend_tag}")
    print(f"⚙️  Worker Tag:    {worker_tag}")
    print("🚫 Regra Rígida:  NADA DE TAG :latest | Ambos os serviços são obrigatórios")
    print("#" * 70 + "\n")

    # 1. Build do Frontend (Vite)
    print("🔨 [1/3] Compilando frontend para frontend/dist...")
    code = run_step(
        "Build de Produção do Frontend (npm run build)",
        ["npm", "run", "build"],
        cwd=FRONTEND_DIR
    )
    if code != 0:
        print("❌ [ERRO] Falha ao compilar o frontend! O build do Docker foi cancelado.")
        return 1

    # 2. Build Backend (Dockerfile.api)
    print(f"\n🔨 [2/3] Criando imagem do Backend: {backend_tag}...")
    code = run_step(
        f"Docker Build Backend: {backend_tag}",
        ["docker", "build", "-t", backend_tag, "-f", "docker/Dockerfile.api", "."],
        cwd=ROOT
    )
    if code != 0:
        print(f"❌ [ERRO] Falha no build da imagem do Backend ({backend_tag})!")
        return 1

    # 3. Build Worker (Dockerfile.worker)
    print(f"\n🔨 [3/3] Criando imagem do Worker: {worker_tag}...")
    code = run_step(
        f"Docker Build Worker: {worker_tag}",
        ["docker", "build", "-t", worker_tag, "-f", "docker/Dockerfile.worker", "."],
        cwd=ROOT
    )
    if code != 0:
        print(f"❌ [ERRO] Falha no build da imagem do Worker ({worker_tag})!")
        return 1

    # 4. Push para o Docker Hub
    if push:
        print("\n" + "=" * 70)
        print("🚀 [DOCKER PUSH] Enviando imagens de produção para o Docker Hub...")
        print("=" * 70)

        code = run_step(f"Push Backend: {backend_tag}", ["docker", "push", backend_tag])
        if code != 0:
            print(f"❌ [ERRO] Falha ao enviar a imagem do backend ({backend_tag}) ao Docker Hub.")
            return 1

        code = run_step(f"Push Worker: {worker_tag}", ["docker", "push", worker_tag])
        if code != 0:
            print(f"❌ [ERRO] Falha ao enviar a imagem do worker ({worker_tag}) ao Docker Hub.")
            return 1

        print("\n✅ Todas as imagens foram enviadas com sucesso ao Docker Hub!")
    else:
        print("\nℹ️  Push ignorado (--no-push). Imagens geradas apenas localmente.")

    # 5. Atualizar versão nos arquivos
    update_version_files(target_version)
    return 0

def ask_user_docker_release(target_version: str) -> bool:
    """Pergunta interativamente se o usuário deseja gerar e enviar as imagens Docker."""
    if not sys.stdin.isatty():
        # Ambiente não interativo (pipeline sem TTY)
        return False

    print("\n" + "❓" * 35)
    print(f"❓ Deseja criar e enviar as novas imagens Docker (Backend + Worker) para a versão {target_version}?")
    print(f"   • Backend: aryalvesfernandes/zapvoice:backend-{target_version}")
    print(f"   • Worker:  aryalvesfernandes/zapvoice:worker-{target_version}")
    print("❓" * 35)

    try:
        resp = input("👉 Gerar e subir imagens para o Docker Hub agora? [s/N]: ").strip().lower()
        return resp in ["s", "sim", "y", "yes"]
    except (EOFError, KeyboardInterrupt):
        return False

def main():
    parser = argparse.ArgumentParser(description="Pipeline Mestre Pré-Push e Release ZapVoice")
    parser.add_argument("--dry-run", action="store_true", help="Executa todas as verificações sem modificar ou enviar arquivos")
    parser.add_argument("--version", type=str, help="Versão semântica para bump (ex: 2.2.6)")
    parser.add_argument("--skip-security", action="store_true", help="Pula auditoria de vulnerabilidades pip-audit/npm")
    parser.add_argument("--skip-tests", action="store_true", help="Pula execução dos testes unitários")
    parser.add_argument("--build-docker", action="store_true", help="Força a geração e push das imagens Docker (backend + worker)")
    parser.add_argument("--no-docker", action="store_true", help="Pula completamente a etapa de geração de imagens Docker")
    parser.add_argument("--no-push", action="store_true", help="Gera as imagens Docker localmente sem enviar ao Docker Hub")
    args = parser.parse_args()

    curr_version = get_current_version()
    if args.version:
        target_version = args.version.strip()
    else:
        target_version = calculate_next_version(curr_version)

    print("=" * 70)
    print("🛡️  PIPELINE DE VALIDAÇÃO PRÉ-PUSH & RELEASE - PROJETO ZAPJORDS")
    print("=" * 70)
    print(f"📌 Versão Atual:      {curr_version}")
    print(f"✨ Próxima Versão:     {target_version}")
    print(f"Modo Dry-Run:         {'SIM' if args.dry_run else 'NÃO'}")

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
        backend_tests_cmd = [sys.executable, "-m", "pytest", "backend/tests_unit/test_reaction_marks_read.py", "backend/tests_unit/test_crm_sales_kanban.py", "-v"]
        code = run_step("7. Testes Unitários do Backend (Listagem de 1 em 1)", backend_tests_cmd)
        if code != 0:
            failures.append("7. Testes Unitários (pytest)")
    else:
        print("\n⏭️  [PULADO] Testes unitários (--skip-tests)")

    # 8. Limpeza da Raiz
    code = check_root_cleanup(dry_run=args.dry_run)
    if code != 0:
        failures.append("8. Limpeza da Raiz")

    # 9. Validação de Versão e Docker Tags
    code = check_version_and_docker_tags()
    if code != 0:
        failures.append("9. Validação de Versão / Docker")

    print("\n" + "=" * 70)
    print("📊 RESUMO GERAL DAS VALIDAÇÕES PRÉ-PUSH")
    print("=" * 70)

    if failures:
        print(f"❌ [FALHA] {len(failures)} etapa(s) reprovada(s):")
        for f in failures:
            print(f"   • {f}")
        print("\nCorrija as falhas acima antes de realizar qualquer commit, push ou build de imagens.")
        return 1

    print("🎉 [TODAS AS VALIDAÇÕES APROVADAS] Sistema 100% íntegro!")

    # 10. Geração e Push das Imagens Docker (Backend + Worker)
    if args.dry_run:
        print("\n" + "=" * 70)
        print("🔍 [DRY RUN] Simulação concluída com sucesso!")
        print(f"   Imagens que seriam criadas e enviadas ao Docker Hub para v{target_version}:")
        print(f"   - aryalvesfernandes/zapvoice:backend-{target_version}")
        print(f"   - aryalvesfernandes/zapvoice:worker-{target_version}")
        print("   (Zero tag :latest)")
        print("=" * 70)
        return 0

    should_build = False
    if args.build_docker:
        should_build = True
    elif not args.no_docker:
        should_build = ask_user_docker_release(target_version)

    if should_build:
        push_images = not args.no_push
        code = build_and_push_docker_images(target_version, push=push_images)
        if code != 0:
            print(f"❌ Falha durante a geração das imagens Docker.")
            return 1
    else:
        print("\nℹ️  Geração de imagens Docker ignorada. O código está pronto para commit e push.")

    print("\n" + "=" * 70)
    print("🚀 PROCESSO CONCLUÍDO COM SUCESSO!")
    print("=" * 70)
    return 0

if __name__ == "__main__":
    sys.exit(main())
