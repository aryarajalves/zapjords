const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    console.log('1. Acessando frontend...');
    await page.goto('http://127.0.0.1:5176', { waitUntil: 'load', timeout: 60000 });
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

    // Selecionar template pix_gerado
    console.log('Selecionando template pix_gerado...');
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
      await page.waitForTimeout(2000);
    }

    // 1. Clicar em +primeiro_nome
    console.log('Clicando em +primeiro_nome...');
    const btnPrimeiroNome = modal.locator('button:has-text("+primeiro_nome")').first();
    await btnPrimeiroNome.click();
    await page.waitForTimeout(800);

    // 2. Clicar em +nome -> Deve substituir completamente e ficar apenas {{nome}}
    console.log('Clicando em +nome (deve substituir e ficar apenas {{nome}})...');
    const btnNome = modal.locator('button:has-text("+nome")').first();
    await btnNome.click();
    await page.waitForTimeout(800);

    // Screenshot do estado substituído com apenas {{nome}}
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_variavel_substituicao_apenas_nome.png'),
      fullPage: false
    });
    console.log('✅ Evidência de substituição exclusiva por {{nome}} salva!');

    // 3. Clicar em +primeiro_nome novamente para demonstrar a troca de volta
    console.log('Clicando de volta em +primeiro_nome...');
    await btnPrimeiroNome.click();
    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_variavel_substituicao_apenas_primeiro_nome.png'),
      fullPage: false
    });
    console.log('✅ Evidência de substituição exclusiva por {{primeiro_nome}} salva!');

  } catch (err) {
    console.error('❌ Erro durante teste visual:', err);
  } finally {
    await browser.close();
  }
}

run();
