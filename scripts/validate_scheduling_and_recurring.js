const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    console.log('1. Acessando frontend...');
    await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    const hasNoClient = await page.locator('button:has-text("Sem cliente selecionado")').count();
    if (hasNoClient > 0) {
      await page.locator('button:has-text("Sem cliente selecionado")').click();
      await page.waitForTimeout(1000);
      await page.locator('div.max-h-60 button').first().click();
      await page.waitForTimeout(3000);
    }

    console.log('Navegando para Atendimento...');
    const chatNavBtn = page.locator('button:has-text("Atendimento"), a:has-text("Atendimento")').first();
    if (await chatNavBtn.isVisible()) {
      await chatNavBtn.click();
      await page.waitForTimeout(4000);
    }

    // Selecionar conversas e abrir modal
    console.log('Selecionando conversas e abrindo modal...');
    const selectAllBtn = page.locator('button:has-text("Selecionar todas")').first();
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();
      await page.waitForTimeout(1500);
    }

    const bulkTemplateBtn = page.locator('#bulk-template-btn');
    await bulkTemplateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await bulkTemplateBtn.click();
    await page.waitForTimeout(2000);

    const modal = page.locator('div.max-w-2xl');
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    // Selecionar template
    console.log('Selecionando template...');
    const tplSelect = modal.locator('button:has-text("Selecione o template")').first();
    if (await tplSelect.isVisible()) {
      await tplSelect.click();
      await page.waitForTimeout(1000);

      const pixOpt = page.locator('div.absolute.z-50 button:has-text("pix_gerado")').first();
      if (await pixOpt.count() > 0) {
        await pixOpt.click();
      } else {
        const anyOpt = page.locator('div.absolute.z-50 button').nth(1);
        await anyOpt.click();
      }
      await page.waitForTimeout(1500);
    }

    // Ir para a Aba 2: Ações & Envio
    console.log('Indo para a Aba 2: Ações & Envio...');
    const tabSettings = modal.locator('button:has-text("Ações & Envio")').first();
    await tabSettings.click();
    await page.waitForTimeout(1200);

    // 1. Clicar em "Agendar Futuro"
    console.log('Selecionando modo "Agendar Futuro"...');
    const btnScheduled = modal.locator('button:has-text("Agendar Futuro")').first();
    await btnScheduled.click();
    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_agendamento_futuro_configurado.png'),
      fullPage: false
    });
    console.log('✅ Evidência de agendamento futuro capturada!');

    // 2. Clicar em "Recorrente"
    console.log('Selecionando modo "Recorrente"...');
    const btnRecurring = modal.locator('button:has-text("Recorrente")').first();
    await btnRecurring.click();
    await page.waitForTimeout(800);

    // Selecionar dias da semana adicionais (ex: Quarta e Sexta)
    const quartaBtn = modal.locator('button[title="Quarta"]').first();
    if (await quartaBtn.isVisible()) await quartaBtn.click();
    const sextaBtn = modal.locator('button[title="Sexta"]').first();
    if (await sextaBtn.isVisible()) await sextaBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_disparo_recorrente_configurado.png'),
      fullPage: false
    });
    console.log('✅ Evidência de disparo recorrente capturada!');

  } catch (err) {
    console.error('❌ Erro durante teste visual:', err);
  } finally {
    await browser.close();
  }
}

run();
