// Exercise the real UI on localhost. External images, fonts and Life Map are
// blocked deliberately: the archive must remain usable without those services.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const root = process.cwd();
const read = name => JSON.parse(readFileSync(path.join(root, 'data', name + '.json'), 'utf8'));
const programs = read('programs');
const screenshots = path.join(root, 'test-results', 'screenshots');
mkdirSync(screenshots, {recursive: true});
const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp'};
const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    assert.ok(file.startsWith(root + path.sep) && !file.includes(path.sep + '.git'));
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(readFileSync(file));
  } catch {
    response.statusCode = 404;
    response.end('Not found');
  }
});

let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({headless: true});
  const errors = [];
  const context = await browser.newContext();
  await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));

  for (const [name, width] of [['phone', 390], ['tablet', 768], ['desktop', 1440]]) {
    const page = await context.newPage();
    await page.setViewportSize({width, height: 900});
    await page.goto(base, {waitUntil: 'domcontentloaded'});
    await page.locator('#role-timeline .role-row').first().waitFor();
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
    const counts = {
      '.chapter': read('chapters').length,
      '.conference': read('conferences').length,
      '.award-card': read('awards').length,
      '.recognition-row': read('recognitions').filter(row => row.visibility === 'public').length,
      '.role-row': read('roles').length,
      '.publication-row': read('publications').length,
      '.academic-card': read('academic-affiliations').length,
    };
    for (const [selector, expected] of Object.entries(counts)) assert.equal(await page.locator(selector).count(), expected, name + ' ' + selector);
    for (const filter of ['all', 'candidate', 'documented']) {
      const button = page.locator('[data-filter="' + filter + '"]');
      await button.focus();
      await button.press('Enter');
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.program').count(), programs.filter(row => filter === 'all' || row.status === filter).length);
    }
    const layout = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      ids: [...document.querySelectorAll('[id]')].map(node => node.id),
      missingAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => a.hash.length > 1 && !document.getElementById(a.hash.slice(1))).map(a => a.hash),
    }));
    assert.ok(layout.documentWidth <= layout.width + 3, name + ': horizontal overflow ' + JSON.stringify(layout));
    assert.equal(layout.ids.length, new Set(layout.ids).size, 'duplicate rendered IDs');
    assert.deepEqual(layout.missingAnchors, [], 'broken rendered section links');
    const passportNav = page.getByRole('navigation', {name: 'Passports', exact: true});
    const passportItems = await passportNav.locator('[data-passport]').evaluateAll(nodes => nodes.map(node => ({
      id: node.dataset.passport, current: node.getAttribute('aria-current'), href: node.getAttribute('href'),
      text: node.textContent, height: node.getBoundingClientRect().height,
    })));
    assert.equal(passportItems.length, 5);
    assert.deepEqual(passportItems.filter(item => item.current === 'true').map(item => item.id), ['work']);
    assert.ok(passportItems.find(item => item.id === 'culture').text.includes('In development'));
    assert.equal(passportItems.find(item => item.id === 'culture').href, null);
    assert.ok(passportItems.every(item => item.height >= 44), 'Passport touch targets');
    await passportNav.locator('[data-passport="sports"]').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.passport), 'adventures');
    const mapURL = new URL(await page.locator('#work-life-map').getAttribute('src'));
    assert.equal(mapURL.searchParams.get('mode'), 'work');
    assert.equal(mapURL.searchParams.get('embed'), '1');
    assert.ok((await page.locator('.map-fallback a').getAttribute('href')).includes('life-map/'));
    assert.equal(await page.locator('.section-error').count(), 0);
    await page.screenshot({path: path.join(screenshots, name + '.png'), fullPage: true, animations: 'disabled'});
    console.log('PASS', name, 'layout, data sections, filters and independent map links');
    await page.close();
  }

  // Recover one failed source using the actual button, without reloading others.
  const retryPage = await context.newPage();
  const requests = [];
  retryPage.on('request', request => { if (request.url().includes('/data/')) requests.push(new URL(request.url()).pathname); });
  let failAwards = true;
  await retryPage.route('**/data/awards.json', route => failAwards ? route.fulfill({status: 503, body: 'Unavailable'}) : route.continue());
  await retryPage.goto(base, {waitUntil: 'domcontentloaded'});
  await retryPage.locator('#awards-grid .section-error').waitFor();
  await retryPage.locator('#role-timeline .role-row').first().waitFor();
  await retryPage.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
  const before = await retryPage.locator('#programs-grid').innerHTML();
  assert.equal(await retryPage.locator('.program').count(), programs.filter(row => row.status === 'documented').length);
  failAwards = false;
  await retryPage.locator('#awards-grid').getByRole('button', {name: 'Try again'}).click();
  await retryPage.locator('#awards-grid .award-card').first().waitFor();
  assert.equal(await retryPage.locator('#programs-grid').innerHTML(), before);
  assert.equal(requests.filter(file => file.endsWith('/awards.json')).length, 2);
  for (const file of new Set(requests.filter(file => !file.endsWith('/awards.json')))) assert.equal(requests.filter(value => value === file).length, 1);
  assert.equal(await retryPage.locator('.section-error').count(), 0);
  console.log('PASS', 'awards failure isolation and section-only retry');
  await retryPage.close();

  // Optional training must not remove programs or collapse an open story.
  const trainingPage = await context.newPage();
  let releaseTraining;
  const pending = new Promise(resolve => { releaseTraining = resolve; });
  await trainingPage.route('**/data/professional-development.json', async route => {
    await pending;
    await route.fulfill({status: 503, body: 'Unavailable'});
  });
  try {
    await trainingPage.goto(base, {waitUntil: 'domcontentloaded'});
    await trainingPage.locator('#rgs-a').waitFor();
    await trainingPage.locator('#rgs-a .guam-field-note').last().locator('summary').click();
    releaseTraining();
    await trainingPage.locator('.training-unavailable').waitFor();
    assert.ok(await trainingPage.locator('#rgs-a .guam-field-note').last().getAttribute('open') !== null);
    assert.equal(await trainingPage.locator('.program').count(), programs.filter(row => row.status === 'documented').length);
    assert.equal(await trainingPage.locator('.section-error').count(), 0);
    console.log('PASS', 'optional training failure preserves program cards and open stories');
  } finally {
    releaseTraining();
    await trainingPage.close();
  }
  assert.deepEqual(errors, [], 'uncaught browser errors');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}

