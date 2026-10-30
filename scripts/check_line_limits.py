import os

def check_limits():
    frontend_dir = 'frontend/src'
    backend_dir = 'backend'

    critical_frontend = []
    critical_backend = []

    for root, dirs, files in os.walk(frontend_dir):
        if 'node_modules' in root or '__tests__' in root:
            continue
        for f in files:
            if (f.endswith('.jsx') or f.endswith('.js')) and not f.endswith('.test.jsx') and not f.endswith('.test.js') and not f.endswith('.spec.jsx') and not f.endswith('.spec.js'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                    count = len(fp.readlines())
                if 370 <= count <= 500:
                    critical_frontend.append((count, path))

    for root, dirs, files in os.walk(backend_dir):
        if '__pycache__' in root or 'tests' in root or 'tests_unit' in root or 'tests_e2e' in root or 'venv' in root or '.venv' in root:
            continue
        for f in files:
            if f.endswith('.py') and not f.startswith('test_'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                    count = len(fp.readlines())
                if 801 <= count <= 1000:
                    critical_backend.append((count, path))

    critical_frontend.sort(reverse=True)
    critical_backend.sort(reverse=True)

    print("=== FRONTEND ALERTA VERMELHO (370 - 500 linhas) ===")
    for lines, p in critical_frontend:
        print(f"[ALERTA VERMELHO] {lines} linhas | {p}")

    print("\n=== BACKEND ALERTA VERMELHO (801 - 1000 linhas) ===")
    for lines, p in critical_backend:
        print(f"[ALERTA VERMELHO] {lines} linhas | {p}")

if __name__ == '__main__':
    check_limits()
