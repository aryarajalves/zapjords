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
      console.log('2. Preenchendo credenciais do usuário admin...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('3. Aguardando Dashboard carregar...');
    await page.waitForSelector('aside, nav', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Forçar activeClientId = 14 no localStorage e recarregar
    await page.evaluate(() => {
      localStorage.setItem('activeClientId', '14');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Localizar item "Desempenho da Equipe"
    console.log('4. Navegando para a tela "Desempenho da Equipe"...');
    const teamMenuBtn = page.locator('button:has-text("Desempenho da Equipe"), a:has-text("Desempenho da Equipe")');
    if (await teamMenuBtn.count() > 0) {
      await teamMenuBtn.first().click();
      await page.waitForTimeout(3000);
    }

    // Validar se o título está visível
    const titleHeader = page.locator('h1:has-text("Desempenho da Equipe")');
    await titleHeader.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Título "Desempenho da Equipe" visível!');

    // Validar o Badge de Tempo Real Ativo (WebSocket)
    const wsBadge = page.locator('[data-testid="ws-status-badge"]');
    await wsBadge.waitFor({ state: 'visible', timeout: 10000 });
    const badgeText = await wsBadge.innerText();
    console.log('✅ Badge de WebSocket encontrado com texto:', badgeText);

    // Aguardar confirmação de "Tempo Real Ativo"
    await page.waitForSelector('[data-testid="ws-status-badge"]:has-text("Tempo Real Ativo")', { timeout: 10000 });
    console.log('✅ WebSocket conectado com sucesso: "Tempo Real Ativo" confirmado!');

    // Salvar evidência visual da tela atualizada em tempo real
    const artifactPath = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f\\evidencia_desempenho_equipe_tempo_real.png';
    await page.screenshot({ path: artifactPath, fullPage: true });
    console.log('✅ Evidência visual capturada com sucesso em:', artifactPath);

    const scriptsScreenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(scriptsScreenshotDir)) {
      fs.mkdirSync(scriptsScreenshotDir, { recursive: true });
    }
    const localScreenshotPath = path.join(scriptsScreenshotDir, 'evidencia_desempenho_equipe_tempo_real.png');
    await page.screenshot({ path: localScreenshotPath, fullPage: true });
    console.log('✅ Cópia local salva em:', localScreenshotPath);

  } catch (error) {
    console.error('❌ Erro durante a validação do WebSocket:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
