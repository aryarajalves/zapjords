const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const artifactDir = 'C:/Users/aryar/.gemini/antigravity/brain/97d5a1f1-aa70-4136-a595-ff71f65d5e6f';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  try {
    console.log('1. Navegando para http://localhost:5176...');
    await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('2. Realizando login...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('3. Navegando para o módulo de Atendimento...');
    const atendimentoBtn = page.locator('button:has-text("Atendimento"), aside button:has-text("Atendimento"), a:has-text("Atendimento")').first();
    if (await atendimentoBtn.isVisible()) {
      await atendimentoBtn.click();
      await page.waitForTimeout(3000);
    }

    console.log('4. Localizando botão da aba Status na barra lateral de conversas...');
    const statusTabBtn = page.locator('[data-testid="filter-tab-status"], button:has-text("Status")').first();
    await statusTabBtn.waitFor({ state: 'visible', timeout: 15000 });

    console.log('5. Clicando em [Status] para abrir o Popover flutuante...');
    await statusTabBtn.click();
    await page.waitForTimeout(1000);

    console.log('6. Verificando o Popover flutuante...');
    const popover = page.locator('[data-testid="chat-status-filter-popover"]');
    await popover.waitFor({ state: 'visible', timeout: 8000 });

    console.log('7. Selecionando múltiplos filtros (Não lidas e Janela 24h)...');
    const unreadBtn = popover.locator('button:has-text("Não lidas")').first();
    await unreadBtn.click();
    await page.waitForTimeout(500);

    const windowBtn = popover.locator('button:has-text("Janela 24h")').first();
    await windowBtn.click();
    await page.waitForTimeout(500);

    const popoverOpenScreenshot = path.join(artifactDir, 'evidencia_popover_status_multiplos_filtros.png');
    await page.screenshot({ path: popoverOpenScreenshot, fullPage: false });
    console.log('Evidência 1 salva (Popover flutuante com múltiplos filtros marcados):', popoverOpenScreenshot);

    console.log('8. Clicando em Concluir para fechar o popover e verificar o badge de contagem...');
    const applyBtn = popover.locator('button:has-text("Concluir")').first();
    await applyBtn.click();
    await page.waitForTimeout(1000);

    const badgeScreenshot = path.join(artifactDir, 'evidencia_status_badge_filtros_ativos.png');
    await page.screenshot({ path: badgeScreenshot, fullPage: false });
    console.log('Evidência 2 salva (Aba Status com badge de contagem ativo):', badgeScreenshot);

    console.log('Validação visual concluída com 100% de sucesso!');
  } catch (err) {
    console.error('Erro na validação visual:', err);
  } finally {
    await browser.close();
  }
}

run();
