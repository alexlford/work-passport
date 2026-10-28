const statusText={documented:'Documented association',candidate:'Unverified · research lead',planned:'Upcoming role'};const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));const link=(label,url)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>';let data={programs:[],conferences:[],chapters:[],awards:[],recognitions:[],roles:[],publications:[],academicAffiliations:[],professionalDevelopment:[]};let currentFilter='documented';


// Each source owns its section; optional training never blocks program cards.
const loadStates = {};
const sources = {
  programs: {file: 'data/programs.json', hosts: ['programs-grid'], label: 'Selected work', render: showPrograms},
  conferences: {file: 'data/conferences.json', hosts: ['conference-list'], label: 'Conferences', render: renderConferences},
  chapters: {file: 'data/chapters.json', hosts: ['chapters-grid'], label: 'Career chapters', render: renderChapters},
  awards: {file: 'data/awards.json', hosts: ['awards-grid'], label: 'Awards', render: renderAwards},
  recognitions: {file: 'data/recognitions.json', hosts: ['recognitions-grid'], label: 'Professional distinctions', render: renderRecognitions},
  roles: {file: 'data/roles.json', hosts: ['role-timeline'], label: 'Role progression', render: renderRoles},
  publications: {file: 'data/publications.json', hosts: ['publications-list'], label: 'Publications', render: renderPublications},
  academicAffiliations: {file: 'data/academic-affiliations.json', hosts: ['academic-affiliations'], label: 'Academic appointments', render: renderAffiliations},
  professionalDevelopment: {file: 'data/professional-development.json', hosts: [], label: 'Related training', render: refreshTraining}
};

function sourceError(key) {
  const source = sources[key];
  for (const id of source.hosts) {
    const host = document.getElementById(id);
    if (!host) continue;
    host.setAttribute('aria-busy', 'false');
    host.innerHTML = '<div class="section-error" role="status"><p>' + esc(source.label) +
      ' could not load.</p><button type="button">Try again</button> ' +
      '<a href="https://github.com/alexlford/work-passport">See source records ↗</a></div>';
    host.querySelector('button').addEventListener('click', () => loadSource(key));
  }
}

async function loadSource(key) {
  const source = sources[key];
  if (loadStates[key] === 'loading') return;
  loadStates[key] = 'loading';
  for (const id of source.hosts) {
    const host = document.getElementById(id);
    if (!host) continue;
    host.setAttribute('aria-busy', 'true');
    host.innerHTML = '<p class="section-loading" role="status">Loading ' + esc(source.label.toLowerCase()) + '…</p>';
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(source.file, {signal: controller.signal});
    if (!response.ok) throw Error(source.file + ' HTTP ' + response.status);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
      throw Error(source.file + ' must contain an array of records');
    }
    data[key] = rows;
    loadStates[key] = 'loaded';
    source.render();
    for (const id of source.hosts) document.getElementById(id)?.setAttribute('aria-busy', 'false');
  } catch (err) {
    data[key] = [];
    loadStates[key] = 'error';
    sourceError(key);
    if (key === 'professionalDevelopment') refreshTraining();
    console.error('Work Passport: ' + source.file, err);
  } finally {
    clearTimeout(timeout);
  }
}

function boot() {
  return Promise.allSettled(Object.keys(sources).map(loadSource));
}

function programTrainingMarkup(program) {
  const ids = program.relatedProfessionalDevelopmentIds || [];
  if (loadStates.professionalDevelopment === 'error') {
    return '<span class="training-unavailable">Related training details are temporarily unavailable.</span>';
  }
  if (loadStates.professionalDevelopment !== 'loaded') return '<span>Loading related training…</span>';
  return 'Related training: ' + ids.map(id => {
    const training = data.professionalDevelopment.find(row => row.id === id);
    return training ? '<strong>' + esc(training.title) + '</strong> · ' + esc(training.institution) + ' (' + esc(training.year) + ')' : '';
  }).filter(Boolean).join('; ');
}

function refreshTraining() {
  // Update only the optional text, preserving filters and open story details.
  for (const host of document.querySelectorAll('[data-program-training]')) {
    const program = data.programs.find(row => row.id === host.dataset.programTraining);
    if (program) host.innerHTML = programTrainingMarkup(program);
  }
}

function renderChapters(){document.getElementById('chapters-grid').innerHTML=data.chapters.map((c,i)=>'<article class="chapter"><div class="meta">0'+(i+1)+' / '+esc(c.years)+'</div><div class="location">'+esc(c.place)+'</div><h3>'+esc(c.title)+'</h3><p>'+esc(c.summary)+'</p></article>').join('');}

function renderConferences(){document.getElementById('conference-list').innerHTML=data.conferences.map(c=>'<article class="conference"><div class="year">'+esc(c.year)+'</div><div><h3>'+esc(c.title)+'</h3><div class="place">'+esc(c.where)+'</div></div><div><div class="kind">'+esc(c.type)+'</div><div class="work">'+esc(c.work)+'</div><p class="detail">'+esc(c.description)+'</p><p class="sub">'+esc(c.note)+'</p>'+link('Source / paper',c.url)+'</div></article>').join('');}

function renderAwards(){const el=document.getElementById('awards-grid');if(el)el.innerHTML=data.awards.map((a,i)=>'<article class="award-card"><div class="award-count">'+esc(a.awardDate)+' / '+esc(a.kind)+'</div><div class="award-symbol" aria-hidden="true">✳</div><h3>'+esc(a.displayTitle)+'</h3><div class="award-kind">'+esc(a.issuer)+'</div><p class="award-official">'+esc(a.officialTitle||a.displayTitle)+'</p><p class="award-context">'+esc(a.recognition)+'</p><div class="award-footer"><span>Source: résumé honors record</span>'+(a.programId?'<a href="#'+esc(a.programId)+'">Related project ↗</a>':'<span>Project association not yet documented</span>')+'</div></article>').join('');}

function renderRecognitions(){const honors=document.getElementById('recognitions-grid');if(honors)honors.innerHTML=data.recognitions.filter(x=>x.visibility==='public').map(x=>'<article class="recognition-row"><div class="recognition-year">'+esc(x.year)+'</div><div><h4>'+esc(x.title)+'</h4><p>'+esc(x.detail)+'</p>'+(x.personalReflection?'<blockquote class="recognition-reflection">“'+esc(x.personalReflection)+'”</blockquote>':'')+'</div><div class="recognition-issuer">'+esc(x.issuer)+'</div></article>').join('')}

function renderRoles(){const el=document.getElementById('role-timeline');if(!el)return;el.innerHTML=data.roles.slice().reverse().map(r=>'<article class="role-row"><div class="role-date">'+esc(r.start.slice(0,7))+' — '+esc(r.end?r.end.slice(0,7):'Present')+'</div><div class="role-content"><h4>'+esc(r.title)+'</h4><div class="role-meta">'+esc(r.employer)+' / '+esc(r.location)+'</div><p>'+esc(r.summary)+'</p>'+(r.earlyTechnicalReturn?'<p class="role-technical-return">'+esc(r.earlyTechnicalReturn)+'</p>':'')+(r.managementThemes?.length?'<details class="management-details"><summary>Inside this leadership role</summary><div class="management-themes">'+r.managementThemes.map(x=>'<div class="management-theme"><strong>'+esc(x.title)+'</strong><p>'+esc(x.detail)+'</p></div>').join('')+'</div>'+(r.relatedMapPlaces?.length?'<div class="management-places"><strong>Connected work locations</strong><div>'+r.relatedMapPlaces.map(p=>'<a href="https://alexlford.github.io/life-map/?mode=work&amp;place='+encodeURIComponent(p.id)+'" target="_blank" rel="noopener noreferrer">'+esc(p.label)+' ↗</a>').join('')+'</div><small>Work locations include staff assignments; not all are confirmed personal visits.</small></div>':'')+'</details>':'')+'</div></article>').join('')}

function renderPublications(){const el=document.getElementById('publications-list');if(!el)return;el.innerHTML=data.publications.map(p=>'<article class="publication-row" id="pub-'+esc(p.id)+'"><div class="publication-year">'+esc(p.year)+'</div><div><h4>'+esc(p.title)+'</h4><div class="publication-venue">'+esc(p.venue)+' · '+esc(p.publicationType)+'</div>'+(p.relatedAffiliationIds?.includes('ku-adjunct-industrial-research-associate')?'<div class="publication-affil"><a href="#ku-adjunct">Connected to KU adjunct research ↗</a></div>':'')+'<p class="publication-authors">'+esc(p.authors)+'</p><p>'+esc(p.summary)+'</p></div><div class="publication-link">'+link('Read source',p.url)+'</div></article>').join('')}

function renderAffiliations(){const el=document.getElementById('academic-affiliations');if(!el)return;el.innerHTML=data.academicAffiliations.map(a=>'<article class="academic-card" id="ku-adjunct"><div class="academic-time">'+esc(a.start)+' — Present</div><h4>'+esc(a.title)+'</h4><div class="academic-place">'+esc(a.institution)+' · '+esc(a.department)+'</div><p>'+esc(a.summary)+'</p><div class="academic-related"><a href="#pub-apj-2023-pair-plasma">2023 Astrophysical Journal paper ↗</a></div></article>').join('')}

function showPrograms(){if(loadStates.programs!=='loaded')return;let p=data.programs.filter(p=>currentFilter==='all'||p.status===currentFilter);document.getElementById('programs-grid').innerHTML=p.map(p=>'<article class="program '+(p.id==='rgs-a'?'program-featured':'')+'" id="'+esc(p.id)+'"><div class="media">'+(p.media?'<img loading="lazy" src="'+esc(p.media)+'" alt="'+esc(p.mediaAlt||p.label+' — public imagery; see media credit')+'">':'<div class="media-project-label" role="img" aria-label="Editorial project title treatment"><span>SPACE SYSTEMS / GROUND</span><strong>'+esc(p.label||'Ground systems')+'</strong><em>Ground Entry Points</em></div>')+'<span class="tag">'+esc(statusText[p.status])+'</span></div><div class="body"><div class="overline">'+esc(p.group)+' / '+esc(p.place)+' / '+esc(p.period)+'</div><h3>'+esc(p.title)+'</h3><span class="role">'+esc(p.role)+'</span><p>'+esc(p.narrative)+'</p>'+(p.phases?.length?'<div class="project-phases"><div class="project-phases-title">From pursuit to delivery</div>'+p.phases.map((phase,i)=>'<div class="project-phase"><span class="phase-index">0'+(i+1)+'</span><div><strong>'+esc(phase.label)+'</strong><p>'+esc(phase.contribution)+'</p></div></div>').join('')+'</div>':'')+(p.relatedProfessionalDevelopmentIds?.length?'<div class="project-training" data-program-training="'+esc(p.id)+'">'+programTrainingMarkup(p)+'</div>':'')+(p.id==='rgs-a'?'<div class="project-training"><strong>Agile adoption · team turning point</strong><p>A team accustomed to waterfall learned Jira boards and daily stand-ups. The team hit its stride between preliminary design review (PDR) and critical design review (CDR).</p></div>':'')+(p.travelStories?.length?'<section class="guam-field-notes" aria-label="Guam field memories"><div class="guam-field-label">FIELD NOTES / TWO TRIPS TO GUAM</div>'+p.travelStories.map((t,i)=>'<details class="guam-field-note"'+(i===0?' open':'')+'><summary><span class="guam-field-index">0'+esc(t.sequence)+'</span><span>'+esc(t.title)+'</span><span class="guam-field-toggle" aria-hidden="true">+</span></summary><p>'+esc(t.narrative)+'</p><a href="'+esc(t.adventureUrl)+'" target="_blank" rel="noopener noreferrer">Explore the '+esc(t.hike)+' hike in Adventures ↗</a>'+(t.pubMapsUrl?'<a class="guam-pub-link" href="'+esc(t.pubMapsUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(t.pubName)+' · Apple Maps ↗</a>':'')+'<small>Hike recorded '+esc(t.hikeRecordDate)+' · Exact work trip dates not established</small></details>').join('')+'</section>':'')+'<small class="credit">'+esc(p.mediaCredit)+'</small><div class="source-list">'+p.links.map(l=>link(l.label,l.url)).join('')+(p.originalUrl?link('Original historical URL (may be unavailable)',p.originalUrl):'')+'</div><div class="evidence">Evidence: '+esc(p.evidence)+'</div></div></article>').join('')}

document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>{currentFilter=el.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===el);b.setAttribute('aria-pressed',String(b===el))});showPrograms()}));boot();
