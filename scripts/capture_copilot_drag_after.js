const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\91e31f41-6150-4e23-9764-a3bcb9d1d5e8';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    console.log('1. Navegando para o ZapVoice...');
    await page.goto('http://localhost:5176', { waitUntil: 'networkidle', timeout: 60000 });

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

    console.log('3. Navegando para Atendimento via menu...');
    const atendBtn = page.locator('button:has-text("Atendimento"), a:has-text("Atendimento")').first();
    await atendBtn.waitFor({ state: 'visible', timeout: 10000 });
    await atendBtn.click();
    await page.waitForTimeout(3000);

    console.log('4. Clicando na conversa do Lucas...');
    const convoItem = page.locator('text="Lucas"').first();
    await convoItem.waitFor({ state: 'visible', timeout: 15000 });
    await convoItem.click();
    await page.waitForTimeout(4000);

    console.log('5. Localizando o balão Copiloto IA...');
    const copilotBtn = page.locator('button:has-text("Copiloto IA")').first();
    await copilotBtn.waitFor({ state: 'visible', timeout: 10000 });

    const box = await copilotBtn.boundingBox();
    console.log('Posição inicial do Copiloto IA:', box);

    if (box) {
      console.log('6. Simulando arrasto imediato do mouse...');
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down({ button: 'left' });
      await page.waitForTimeout(100);

      // Movimentação suave e contínua do cursor
      const targetX = startX - 250;
      const targetY = startY - 220;

      for (let step = 1; step <= 10; step++) {
        const curX = startX + ((targetX - startX) * step) / 10;
        const curY = startY + ((targetY - startY) * step) / 10;
        await page.mouse.move(curX, curY);
        await page.waitForTimeout(20);
      }

      await page.mouse.up({ button: 'left' });
      await page.waitForTimeout(500);

      const finalBox = await copilotBtn.boundingBox();
      console.log('Posição final do Copiloto IA após arrasto:', finalBox);
    }

    console.log('7. Capturando evidência visual...');
    const dest = path.join(ARTIFACT_DIR, 'evidencia_depois_arrasto_instantaneo.png');
    await page.screenshot({ path: dest, fullPage: false });
    console.log('✅ Evidência salva com sucesso em:', dest);

  } catch (err) {
    console.error('Erro na captura:', err);
    try {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'debug_atendimento_page.png') });
    } catch (_) {}
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
