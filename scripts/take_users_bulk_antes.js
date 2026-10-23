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
    console.log('Navegando para login...');
    await page.goto('http://localhost:5176', { timeout: 60000 });
    const emailInput = page.locator('input[type="email"], input[name="email"], input[inputmode="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }
    await page.waitForSelector('aside, nav', { timeout: 15000 });

    console.log('Acessando Gestão de Usuários...');
    await page.locator('button:has-text("Gestão de Usuários"), a:has-text("Gestão de Usuários")').first().click();
    await page.waitForTimeout(3000);

    const fileAntes = path.join(screenshotsDir, 'usuarios_bulk_antes.png');
    await page.screenshot({ path: fileAntes, fullPage: false });
    console.log('Screenshot salvo em:', fileAntes);
    fs.copyFileSync(fileAntes, path.join(artifactDir, 'usuarios_bulk_antes.png'));
    console.log('Copiado para artifacts com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await browser.close();
  }
})();
