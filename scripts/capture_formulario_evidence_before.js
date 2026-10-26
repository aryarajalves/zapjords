const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 950 });

  try {
    console.log('1. Navegando para o ZapVoice...');
    await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 30000 });

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

    console.log('4. Clicando em Nova Integração...');
    const newBtn = page.locator('button:has-text("Nova Integração")').first();
    await newBtn.click();
    await page.waitForTimeout(2000);

    console.log('5. Selecionando Formulário Personalizado...');
    const platformBtn = page.locator('label:has-text("Plataforma")').locator('..').locator('button').first();
    await platformBtn.click({ force: true });
    await page.waitForTimeout(500);

    const formOption = page.locator('li:has-text("Formulário Personalizado")').first();
    await formOption.click({ force: true });
    await page.waitForTimeout(1000);

    console.log('6. Indo para aba Gatilhos...');
    const gatilhosTab = page.locator('button:has-text("Gatilhos")').first();
    await gatilhosTab.click({ force: true });
    await page.waitForTimeout(1500);

    const addGatilhoBtn = page.locator('button:has-text("Novo Gatilho")').first();
    if (await addGatilhoBtn.count() > 0) {
      await addGatilhoBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }

    // Clica no seletor de evento para abrir opções
    console.log('7. Abrindo opções de eventos...');
    const eventTriggerBtn = page.locator('label:has-text("Evento da Plataforma")').locator('..').locator('button').first();
    if (await eventTriggerBtn.count() > 0) {
      await eventTriggerBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }

    const shotPath = path.join(ARTIFACT_DIR, 'evidencia_antes_formulario_eventos.png');
    await page.screenshot({ path: shotPath });
    console.log('Screenshot salva com sucesso em:', shotPath);

  } catch (err) {
    console.error('Erro durante captura:', err);
  } finally {
    await browser.close();
  }
}

run();
