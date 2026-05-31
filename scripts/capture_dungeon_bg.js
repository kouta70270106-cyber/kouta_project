const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 750, height: 480 });
  const absPath = path.resolve(__dirname, '../public/assets/dungeon-map.html');
  const fileUrl = 'file:///' + absPath.split('\\').join('/');
  await page.goto(fileUrl);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve(__dirname, '../public/assets/dungeon_bg.png') });
  await browser.close();
  console.log('dungeon_bg.png を生成しました');
})();
