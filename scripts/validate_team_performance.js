const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  try {
    console.log('1. Navegando para o sistema ZapVoice em http://localhost:5176...');
    await page.goto('http://localhost:5176', { timeout: 60000 });

    // Login se estiver na tela de login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('2. Preenchendo credenciais do usuário admin...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('3. Aguardando Dashboard carregar...');
    await page.waitForSelector('aside, nav', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Localizar item "Desempenho da Equipe"
    console.log('4. Procurando o menu "Desempenho da Equipe" no menu lateral...');
    const teamMenuBtn = page.locator('button:has-text("Desempenho da Equipe"), a:has-text("Desempenho da Equipe")');
    const isMenuVisible = await teamMenuBtn.count() > 0;
    console.log('Menu "Desempenho da Equipe" visível no sidebar:', isMenuVisible);

    if (isMenuVisible) {
      await teamMenuBtn.first().click();
      console.log('5. Clicado em "Desempenho da Equipe", aguardando carregamento da tela...');
      await page.waitForTimeout(3000);
    }

    // Validar se o título e cartões estão na tela
    const titleHeader = page.locator('h1:has-text("Desempenho da Equipe")');
    await titleHeader.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Título "Desempenho da Equipe" visível!');

    const cards = page.locator('text=Atendimentos Hoje');
    await cards.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Cartão de métricas "Atendimentos Hoje" renderizado com sucesso!');

    // Testar alternância do período
    const btn7d = page.locator('[data-testid="period-btn-7days"]');
    if (await btn7d.count() > 0) {
      console.log('6. Testando clique no botão de período "7 Dias"...');
      await btn7d.first().click();
      await page.waitForTimeout(1500);
    }

    // Salvar evidência visual
    const artifactPath = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f\\evidencia_desempenho_equipe.png';
    await page.screenshot({ path: artifactPath, fullPage: true });
    console.log('✅ Evidência visual capturada com sucesso em:', artifactPath);

    const scriptsScreenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(scriptsScreenshotDir)) {
      fs.mkdirSync(scriptsScreenshotDir, { recursive: true });
    }
    const localScreenshotPath = path.join(scriptsScreenshotDir, 'evidencia_desempenho_equipe.png');
    await page.screenshot({ path: localScreenshotPath, fullPage: true });
    console.log('✅ Cópia salva em:', localScreenshotPath);

  } catch (error) {
    console.error('❌ Erro durante a validação:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
