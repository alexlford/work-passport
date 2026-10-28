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

async function start(respond = async file => ({ok: true, json: async () => read(file)}), timers = {setTimeout, clearTimeout}, hash = '') {
  const nodes = new Map(Object.values(sections).map(([id]) => [id, new Element()]));
  const buttons = ['documented', 'all', 'candidate'].map(filter => {
    const button = new Element();
    button.dataset = {filter};
    button.classList = {toggle() {}};
    return button;
  });
  const requests = [];
  const errors = [];
  const windowHandlers = {};
  const documentHandlers = {};
  const location = {hash};
  const scrollTargets = [];
  const dynamicNodes = new Map();
  const document = {
    getElementById(id) {
      if (nodes.has(id)) return nodes.get(id);
      if (!nodes.get('programs-grid').innerHTML.includes('id="' + id + '"')) return undefined;
      if (!dynamicNodes.has(id)) {
        const node = new Element();
        node.id = id;
        node.focus = () => { document.activeElement = node; };
        node.scrollIntoView = () => scrollTargets.push(id);
        dynamicNodes.set(id, node);
      }
      return dynamicNodes.get(id);
    },
    querySelectorAll: selector => selector === '[data-filter]' ? buttons : [],
    addEventListener: (event, handler) => { documentHandlers[event] = handler; },
  };
  const context = vm.createContext({
    AbortController, ...timers,
    window: {location, addEventListener: (event, handler) => { windowHandlers[event] = handler; }},
    console: {error: (...args) => errors.push(args)},
    fetch: (file, options) => { requests.push(file); return respond(file, options); },
    document,
  });
  const finished = vm.runInContext(code, context);
  return {nodes, buttons, requests, errors, context, finished, document, location, windowHandlers, documentHandlers, scrollTargets};
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

test('an initial link reveals a project outside the default filter', async () => {
  const candidate = read('data/programs.json').find(row => row.status === 'candidate');
  assert.ok(candidate, 'fixture includes an unverified project');
  const app = await start(undefined, undefined, '#' + candidate.id);
  await app.finished;
  assert.ok(app.document.getElementById(candidate.id), 'linked candidate is rendered');
  assert.equal(app.buttons.find(button => button.dataset.filter === 'all').attributes['aria-pressed'], 'true');
  assert.equal(app.document.activeElement?.id, candidate.id);
  assert.ok(app.scrollTargets.includes(candidate.id));
  assert.equal(app.errors.length, 0);
});

test('hash navigation restores a documented project hidden by a filter', async () => {
  const app = await start();
  await app.finished;
  app.buttons.find(button => button.dataset.filter === 'candidate').handlers.click();
  const project = read('data/programs.json').find(row => row.status === 'documented');
  assert.equal(app.document.getElementById(project.id), undefined);
  app.location.hash = '#' + project.id;
  app.windowHandlers.hashchange?.();
  assert.ok(app.document.getElementById(project.id));
  assert.equal(app.document.activeElement?.id, project.id);
});

test('repeated current-fragment clicks recover a hidden project without hijacking modified clicks', async () => {
  const project = read('data/programs.json').find(row => row.status === 'documented');
  const app = await start(undefined, undefined, '#' + project.id);
  await app.finished;
  app.buttons.find(button => button.dataset.filter === 'candidate').handlers.click();
  let prevented = false;
  const event = {
    button: 0, ctrlKey: true,
    target: {closest: () => ({hash: '#' + project.id, target: ''})},
    preventDefault: () => { prevented = true; },
  };
  app.documentHandlers.click(event);
  assert.equal(prevented, false);
  assert.equal(app.document.getElementById(project.id), undefined);
  event.ctrlKey = false;
  app.documentHandlers.click(event);
  assert.equal(prevented, true);
  assert.ok(app.document.getElementById(project.id));
});

test('unknown and malformed fragments leave the current filter and content alone', async () => {
  const app = await start();
  await app.finished;
  const before = app.nodes.get('programs-grid').innerHTML;
  for (const hash of ['#awards', '#missing-project', '#%E0%A4%A']) {
    app.location.hash = hash;
    app.windowHandlers.hashchange();
    assert.equal(app.nodes.get('programs-grid').innerHTML, before);
  }
  assert.equal(app.scrollTargets.length, 0);
  assert.equal(app.errors.length, 0);
});

test('an initial project link resolves when its data finishes loading', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const candidate = read('data/programs.json').find(row => row.status === 'candidate');
  const app = await start(async file => {
    if (file === 'data/programs.json') await pending;
    return {ok: true, json: async () => read(file)};
  }, undefined, '#' + candidate.id);
  try {
    await new Promise(resolve => setImmediate(resolve));
    assertOtherSections(app, 'data/programs.json');
    assert.equal(app.document.getElementById(candidate.id), undefined);
  } finally {
    release();
    await app.finished;
  }
  assert.ok(app.document.getElementById(candidate.id));
  assert.equal(app.document.activeElement?.id, candidate.id);
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

