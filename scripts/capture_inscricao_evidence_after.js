const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\91e31f41-6150-4e23-9764-a3bcb9d1d5e8';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 950 });

  try {
    console.log('1. Navegando para o ZapVoice...');
    await page.goto('http://127.0.0.1:5176', { waitUntil: 'networkidle', timeout: 60000 });

    console.log('2. Efetuando login...');
    await page.locator('input[type="email"]').first().fill('aryarajmarketing@gmail.com');
    await page.locator('input[type="password"]').first().fill('123456');
    await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
    await page.waitForTimeout(4000);

    const hasNoClient = await page.locator('button:has-text("Sem cliente selecionado")').count();
    if (hasNoClient > 0) {
      console.log('Selecionando cliente...');
      await page.locator('button:has-text("Sem cliente selecionado")').click();
      await page.waitForTimeout(1000);
      await page.locator('div.max-h-60 button').first().click();
      await page.waitForTimeout(3000);
    }

    console.log('3. Navegando para Integrações Webhook...');
    const navBtn = page.locator('button:has-text("Integrações Webhook")').first();
    await navBtn.click();
    await page.waitForTimeout(3000);

    console.log('4. Clicando em Editar na primeira integração...');
    const editBtn = page.locator('button[title="Editar"]').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
    } else {
      await page.locator('button:has-text("Nova Integração")').first().click();
    }
    await page.waitForTimeout(2000);

    console.log('5. Clicando na aba GATILHOS dentro do modal...');
    const modal = page.locator('.fixed.inset-0').last();
    const gatilhosTab = modal.locator('button').filter({ hasText: /GATILHOS/i }).first();
    await gatilhosTab.click({ force: true });
    await page.waitForTimeout(1500);

    console.log('6. Clicando no SearchableSelect do Evento da Plataforma...');
    const eventBlock = modal.locator('label:has-text("Evento da Plataforma")').locator('..');
    const selectTrigger = eventBlock.locator('.cursor-pointer').first();
    await selectTrigger.click({ force: true });
    await page.waitForTimeout(800);

    console.log('7. Clicando na opção Inscrição...');
    const inscricaoOpt = page.locator('span:text-is("Inscrição"), div:text-is("Inscrição")').first();
    await inscricaoOpt.click({ force: true });
    await page.waitForTimeout(1000);

    console.log('8. Capturando evidência visual com Inscrição selecionada...');
    const shotPath = path.join(ARTIFACT_DIR, 'evidencia_depois_inscricao_selecionada.png');
    await page.screenshot({ path: shotPath });
    console.log('Screenshot com Inscrição selecionada salva em:', shotPath);

  } catch (err) {
    console.error('Erro durante captura:', err);
  } finally {
    await browser.close();
  }
}

run();
