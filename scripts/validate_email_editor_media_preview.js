const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  try {
    console.log('1. Navegando para o sistema ZapVoice em http://localhost:5176...');
    await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Login se estiver na tela de login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('2. Preenchendo credenciais...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('3. Aguardando Dashboard carregar...');
    await page.waitForSelector('aside, nav', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Navegar para E-mail Marketing no menu lateral
    console.log('4. Navegando para E-mail Marketing no sidebar...');
    const emailSidebarBtn = page.locator('aside button:has-text("E-mail Marketing")');
    await emailSidebarBtn.first().click();
    await page.waitForTimeout(2000);

    // Clicar na aba "Templates"
    console.log('5. Clicando na aba Templates...');
    const templatesTabBtn = page.locator('button:has-text("Templates")');
    await templatesTabBtn.first().click();
    await page.waitForTimeout(1500);

    // Clicar em "Novo Template"
    console.log('6. Clicando em Novo Template...');
    const newTemplateBtn = page.locator('button:has-text("Novo Template")');
    await newTemplateBtn.first().click();
    await page.waitForTimeout(2000);

    // Adicionar bloco de Contador Regressivo
    console.log('7. Adicionando bloco Contador Regressivo...');
    const addCountdownBtn = page.locator('button:has-text("Contador")');
    if (await addCountdownBtn.count() > 0) {
      await addCountdownBtn.first().click();
      await page.waitForTimeout(1000);
    }

    // Adicionar bloco Card Produto
    console.log('8. Adicionando bloco Card Produto...');
    const addProductBtn = page.locator('button:has-text("Card Produto")');
    if (await addProductBtn.count() > 0) {
      await addProductBtn.first().click();
      await page.waitForTimeout(1000);
    }

    // Salvar evidência visual dos novos blocos
    const artifactPath = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f\\evidencia_novos_blocos_email_editor.png';
    await page.screenshot({ path: artifactPath, fullPage: true });
    console.log('✅ Evidência visual capturada com sucesso em:', artifactPath);

    const scriptsScreenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(scriptsScreenshotDir)) {
      fs.mkdirSync(scriptsScreenshotDir, { recursive: true });
    }
    const localScreenshotPath = path.join(scriptsScreenshotDir, 'evidencia_novos_blocos_email_editor.png');
    await page.screenshot({ path: localScreenshotPath, fullPage: true });
    console.log('✅ Cópia salva em:', localScreenshotPath);

  } catch (err) {
    console.error('❌ Erro durante teste:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
