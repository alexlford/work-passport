const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const code = readFileSync(path.join(root, 'app.js'), 'utf8');
const read = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const sections = {
  'data/programs.json': ['programs-grid', 'class="program '],
  'data/conferences.json': ['conference-list', 'class="conference"'],
  'data/chapters.json': ['chapters-grid', 'class="chapter"'],
  'data/awards.json': ['awards-grid', 'class="award-card"'],
  'data/recognitions.json': ['recognitions-grid', 'class="recognition-row"'],
  'data/roles.json': ['role-timeline', 'class="role-row"'],
  'data/publications.json': ['publications-list', 'class="publication-row"'],
  'data/academic-affiliations.json': ['academic-affiliations', 'class="academic-card"'],
};

class Element {
  constructor() { this.innerHTML = ''; this.attributes = {}; this.handlers = {}; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(event, handler) { this.handlers[event] = handler; }
  querySelector() { return this.button ||= new Element(); }
}

async function start(respond = async file => ({ok: true, json: async () => read(file)}), timers = {setTimeout, clearTimeout}) {
  const nodes = new Map(Object.values(sections).map(([id]) => [id, new Element()]));
  const buttons = ['documented', 'all', 'candidate'].map(filter => {
    const button = new Element();
    button.dataset = {filter};
    button.classList = {toggle() {}};
    return button;
  });
  const requests = [];
  const errors = [];
  const context = vm.createContext({
    AbortController, ...timers,
    console: {error: (...args) => errors.push(args)},
    fetch: (file, options) => { requests.push(file); return respond(file, options); },
    document: {
      getElementById: id => nodes.get(id),
      querySelectorAll: selector => selector === '[data-filter]' ? buttons : [],
    },
  });
  const finished = vm.runInContext(code, context);
  return {nodes, buttons, requests, errors, context, finished};
}

function assertOtherSections(app, failedFile) {
  for (const [file, [id, markup]] of Object.entries(sections)) {
    if (file === failedFile) continue;
    assert.ok(app.nodes.get(id).innerHTML.includes(markup), `${id} remains available`);
    assert.equal(app.nodes.get(id).attributes['aria-busy'], 'false');
  }
}

test('all independent sources render and program filters work', async () => {
  const app = await start();
  await app.finished;
  assertOtherSections(app);
  assert.equal(app.errors.length, 0);
  for (const button of app.buttons) {
    button.handlers.click();
    const expected = read('data/programs.json').filter(row => button.dataset.filter === 'all' || row.status === button.dataset.filter).length;
    assert.equal((app.nodes.get('programs-grid').innerHTML.match(/class="program /g) || []).length, expected);
  }
});

for (const failedFile of [...Object.keys(sections), 'data/professional-development.json']) {
  test(`HTTP failure stays local: ${failedFile}`, async () => {
    const app = await start(async file => ({ok: file !== failedFile, status: 503, json: async () => read(file)}));
    await app.finished;
    assertOtherSections(app, failedFile);
    assert.equal(app.errors.length, 1);
    if (sections[failedFile]) {
      const host = app.nodes.get(sections[failedFile][0]);
      assert.ok(host.innerHTML.includes('Try again'));
      assert.equal(host.attributes['aria-busy'], 'false');
      if (failedFile === 'data/programs.json') {
        app.buttons[1].handlers.click();
        assert.ok(host.innerHTML.includes('Try again'), 'filtering preserves the retry control');
      }
    }
  });
}

for (const [label, badJSON] of [
  ['invalid JSON', () => { throw new SyntaxError('Invalid JSON'); }],
  ['wrong root shape', () => ({records: []})],
  ['invalid record shape', () => [null]],
  ['render error', () => [{...read('data/roles.json')[0], start: 123}]],
]) {
  test(`${label} only affects roles`, async () => {
    const failedFile = 'data/roles.json';
    const app = await start(async file => ({ok: true, json: async () => file === failedFile ? badJSON() : read(file)}));
    await app.finished;
    assertOtherSections(app, failedFile);
    assert.ok(app.nodes.get('role-timeline').innerHTML.includes('Try again'));
  });
}

test('retry reloads only the failed source and preserves other sections', async () => {
  let failed = true;
  const app = await start(async file => ({ok: !(failed && file === 'data/awards.json'), status: 503, json: async () => read(file)}));
  await app.finished;
  const before = app.nodes.get('programs-grid').innerHTML;
  failed = false;
  await app.nodes.get('awards-grid').button.handlers.click();
  assertOtherSections(app);
  assert.equal(app.nodes.get('programs-grid').innerHTML, before);
  assert.equal(app.requests.filter(file => file === 'data/awards.json').length, 2);
  assert.ok(app.requests.filter(file => file !== 'data/awards.json').every(file => app.requests.filter(value => value === file).length === 1));
});

test('a pending source does not delay other sections', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const app = await start(async file => {
    if (file === 'data/awards.json') await pending;
    return {ok: true, json: async () => read(file)};
  });
  try {
    await new Promise(resolve => setImmediate(resolve));
    assertOtherSections(app, 'data/awards.json');
    assert.ok(app.nodes.get('awards-grid').innerHTML.includes('Loading awards'));
  } finally {
    release();
    await app.finished;
  }
  assertOtherSections(app);
});

test('a stalled request times out locally and offers retry', async () => {
  const pendingTimers = new Set();
  const app = await start(async (file, {signal}) => {
    if (file === 'data/awards.json') {
      await new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Request aborted'))));
    }
    return {ok: true, json: async () => read(file)};
  }, {
    setTimeout(callback) { pendingTimers.add(callback); return callback; },
    clearTimeout(callback) { pendingTimers.delete(callback); },
  });
  await new Promise(resolve => setImmediate(resolve));
  assertOtherSections(app, 'data/awards.json');
  assert.equal(pendingTimers.size, 1);
  [...pendingTimers][0]();
  await app.finished;
  assertOtherSections(app, 'data/awards.json');
  assert.ok(app.nodes.get('awards-grid').innerHTML.includes('Try again'));
  assert.equal(pendingTimers.size, 0);
});
