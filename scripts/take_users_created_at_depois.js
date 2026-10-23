const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const artifactDir = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\0e0eda03-2ae8-4834-a90a-b2b532b5f4a8';

  try {
    console.log('1. Acessando login...');
    await page.goto('http://localhost:5176', { timeout: 60000 });
    const emailInput = page.locator('input[type="email"], input[name="email"], input[inputmode="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }
    await page.waitForSelector('aside, nav', { timeout: 15000 });

    console.log('2. Navegando para Gestão de Usuários...');
    await page.locator('button:has-text("Gestão de Usuários"), a:has-text("Gestão de Usuários")').first().click();
    await page.waitForTimeout(3000);

    // Aguardar tabela carregar com dados
    await page.waitForSelector('th:has-text("Criado em")', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('3. Capturando screenshot da tabela com coluna de data e horário (Brasília)...');
    const destFile = path.join(artifactDir, 'usuarios_criado_em_brasilia_depois.png');
    await page.screenshot({ path: destFile, fullPage: false });
    console.log('Screenshot salvo com sucesso em:', destFile);

    console.log('✅ Evidência visual capturada com sucesso!');
  } catch (err) {
    console.error('Erro na captura visual:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
