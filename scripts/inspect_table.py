import asyncio
from playwright.async_api import async_playwright

async def inspect_table():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({'width': 1400, 'height': 950})
        await page.goto('http://localhost:5176')
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page.wait_for_timeout(3000)
        
        await page.evaluate("""() => {
            localStorage.setItem('activeClientId', '14');
            localStorage.setItem('currentView', 'webhooks');
        }""")
        await page.goto('http://localhost:5176', wait_until='networkidle')
        await page.wait_for_timeout(3000)
        
        nav_btn = page.locator('aside button:has-text("Integrações Webhook")').first
        if await nav_btn.count() > 0:
            await nav_btn.click()
            await page.wait_for_timeout(2000)
            
        rows = await page.locator('table tbody tr').all_text_contents()
        print('Total Rows:', len(rows))
        for idx, r in enumerate(rows[:5]):
            print(f'Row {idx}:', r[:120].replace('\n', ' '))
            
        await page.screenshot(path='integrations_screen.png')
        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_table())
