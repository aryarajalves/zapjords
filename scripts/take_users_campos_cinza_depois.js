const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const artifactDir = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\0e0eda03-2ae8-4834-a90a-b2b532b5f4a8';
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  try {
    console.log('1. Navegando para o login...');
    await page.goto('http://localhost:5176', { timeout: 60000 });
    const emailInput = page.locator('input[type="email"], input[name="email"], input[inputmode="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }
    await page.waitForSelector('aside, nav', { timeout: 15000 });

    console.log('2. Acessando Gestão de Usuários...');
    await page.locator('button:has-text("Gestão de Usuários"), a:has-text("Gestão de Usuários")').first().click();
    await page.waitForTimeout(3000);

    // Abrir modal de criação direta de usuário com os campos cinzas
    console.log('3. Clicando no botão "Criar Usuário"...');
    await page.locator('button:has-text("Criar Usuário")').first().click();
    await page.waitForTimeout(1500);

    console.log('4. Capturando modal com campos cinzas...');
    const destFile = path.join(artifactDir, 'criar_usuario_campos_cinza_depois.png');
    await page.screenshot({ path: destFile, fullPage: false });
    console.log('Screenshot modal campos cinza salvo com sucesso em:', destFile);

    console.log('✅ Evidência visual salva com sucesso!');
  } catch (err) {
    console.error('Erro na captura visual:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
