const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots');

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844 },
];

async function main() {
  const pagesPath = path.join(__dirname, '..', 'screenshot-pages.json');
  const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const results = [];

  for (const page of pages) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const tab = await context.newPage();
      const url = `${BASE_URL}${page.path}`;
      const filename = `${page.name}-${vp.name}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);

      try {
        await tab.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await tab.screenshot({ path: filepath, fullPage: false });
        results.push({ name: page.name, viewport: vp.name, file: filename });
        console.log(`✅ ${page.name} (${vp.name})`);
      } catch (err) {
        console.error(`❌ ${page.name} (${vp.name}): ${err.message}`);
      }

      await context.close();
    }
  }

  await browser.close();

  // 결과 JSON 저장 (워크플로우에서 코멘트 생성 시 사용)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n📸 ${results.length}개 스크린샷 완료`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
