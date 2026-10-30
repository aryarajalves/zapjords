const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    console.log('1. Acessando a aplicação em http://127.0.0.1:5176...');
    await page.goto('http://127.0.0.1:5176', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('Realizando login...');
      await emailInput.fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    const hasNoClient = await page.locator('button:has-text("Sem cliente selecionado")').count();
    if (hasNoClient > 0) {
      console.log('Selecionando primeiro cliente...');
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

    // Selecionar conversas
    console.log('Selecionando conversas...');
    const selectAllBtn = page.locator('button:has-text("Selecionar todas")').first();
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();
      await page.waitForTimeout(1500);
    }

    // Clicar em Disparo Template
    console.log('Abrindo modal de Disparo Template...');
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

      // Clica em um template real (ex: astrowake ou o segundo botão da lista)
      let opt = page.locator('div.absolute.z-50 button:has-text("astrowake_vendas_video_v3")').first();
      if (await opt.count() === 0) {
        opt = page.locator('div.absolute.z-50 button:has-text("📌")').first();
      }
      if (await opt.count() === 0) {
        const allOpts = page.locator('div.absolute.z-50 button');
        opt = allOpts.nth(1);
      }
      await opt.click();
      await page.waitForTimeout(2500);
    }

    // 1. Capturar Aba 1: Template & Mensagem (com template selecionado e preview ativo)
    console.log('Capturando Aba 1: Template & Mensagem com preview ativo...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_aba_1_template_selecionado.png'),
      fullPage: false
    });
    console.log('✅ Aba 1 com template selecionado capturada!');

    // 2. Clicar na Aba 2: Ações & Envio
    console.log('Clicando na Aba 2: Ações & Envio...');
    const tabSettings = modal.locator('button:has-text("Ações & Envio")').first();
    await tabSettings.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_aba_2_acoes_envio_com_botoes.png'),
      fullPage: false
    });
    console.log('✅ Aba 2 com botões capturada!');

    // 3. Clicar na Aba 3: Contatos
    console.log('Clicando na Aba 3: Contatos...');
    const tabRecipients = modal.locator('button:has-text("Contatos")').first();
    await tabRecipients.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_aba_3_contatos_destinatarios.png'),
      fullPage: false
    });
    console.log('✅ Aba 3 capturada!');

    console.log('🎉 Todas as validações visuais com template selecionado foram concluídas com sucesso!');
  } catch (err) {
    console.error('❌ Erro durante teste visual:', err);
  } finally {
    await browser.close();
  }
}

run();
