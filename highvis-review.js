/* HighVis review + rating tooling.
   - Always-on per-section rating widgets (1-5 stars + comment, localStorage).
   - Review mode gated behind hotkey + password:
       Cmd/Ctrl+Shift+E → password prompt → "platano" unlocks.
   - Once unlocked: top-right pill, contenteditable bodies, classified
     annotations (voice / fact / cut / comment), save → JSON download.
   - Annotations carry a `type` so future sessions can learn from why a
     change was made (voice refinement vs fact correction vs clarity).
   This is a CJ-only dev tool. The password is light obfuscation, not security.
*/
(function () {
  const PASSWORD = 'platano';
  const PAGE_KEY = location.pathname.split('/').pop().replace('.html', '') || 'page';

  // ───── Style injection ──────────────────────────────────────────────
  const css = `
    .hv-rating {
      margin-top: 28px; padding: 16px 18px;
      background: var(--bg-deep); border-radius: 10px;
      font-family: var(--sans); font-size: 13px; color: var(--ink-soft);
      display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
    }
    .hv-rating-label { font-weight: 600; color: var(--ink); margin-right: 4px; }
    .hv-stars { display: inline-flex; gap: 2px; }
    .hv-star {
      cursor: pointer; font-size: 20px; line-height: 1;
      color: var(--rule); transition: color 0.1s;
      background: none; border: none; padding: 0;
    }
    .hv-star.filled, .hv-star:hover, .hv-star:hover ~ .hv-star.filled { color: var(--accent); }
    .hv-stars:hover .hv-star.filled { color: var(--rule); }
    .hv-rating-meta { color: var(--ink-muted); font-size: 12px; margin-left: auto; }
    .hv-rating-comment {
      flex-basis: 100%;
      margin-top: 4px;
      font-family: var(--sans); font-size: 13px;
      padding: 8px 10px; border-radius: 6px;
      border: 1px solid var(--rule); background: var(--surface);
      color: var(--ink); resize: vertical; min-height: 32px;
    }

    /* Review mode chrome */
    .hv-review-pill {
      position: fixed; top: 16px; right: 16px; z-index: 102;
      background: var(--accent); color: white;
      font-family: var(--sans); font-size: 12px; font-weight: 600;
      letter-spacing: 0.06em; text-transform: uppercase;
      padding: 8px 14px; border-radius: 999px;
      display: inline-flex; align-items: center; gap: 10px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
    }
    .hv-review-pill button {
      background: rgba(255,255,255,0.18); color: white;
      border: none; border-radius: 6px;
      padding: 4px 8px; font-size: 11px; font-weight: 600;
      cursor: pointer;
    }
    .hv-review-pill button:hover { background: rgba(255,255,255,0.30); }

    .hv-review-toolbar {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      z-index: 101;
      background: var(--ink); color: white;
      padding: 10px 14px; border-radius: 12px;
      display: flex; gap: 8px; align-items: center;
      font-family: var(--sans); font-size: 13px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.3);
    }
    .hv-review-toolbar button {
      background: rgba(255,255,255,0.10); color: white;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 7px 11px; border-radius: 6px;
      font-family: var(--sans); font-size: 12px; cursor: pointer;
      transition: background 0.15s;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .hv-review-toolbar button:hover { background: rgba(255,255,255,0.22); }
    .hv-review-toolbar button.primary { background: var(--accent); border-color: var(--accent); }
    .hv-review-toolbar .swatch {
      display: inline-block; width: 10px; height: 10px; border-radius: 2px;
    }
    .hv-review-toolbar .hv-spacer { flex: 1; min-width: 8px; }

    .hv-editable {
      outline: 2px dashed transparent;
      transition: outline-color 0.15s;
      border-radius: 4px;
    }
    .hv-editable:focus-within { outline-color: var(--accent-soft); }

    /* Annotation styles, color-coded by type */
    mark[data-review-type="voice"]  { background: #FFF3A6; padding: 0 2px; border-radius: 2px; }
    mark[data-review-type="fact"]   { background: #FFC9C2; padding: 0 2px; border-radius: 2px; }
    mark[data-review-type="cut"]    {
      background: transparent; color: var(--ink-muted);
      text-decoration: line-through; text-decoration-color: var(--accent);
    }
    mark[data-review-type="comment"] {
      background: #D6E4FF; padding: 0 2px; border-radius: 2px;
      border-bottom: 2px dotted #4A6FA5;
    }
    mark[data-review-type] { cursor: help; }
    mark[data-review-type]::after {
      content: attr(data-review-note);
      display: none;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ───── Ratings ──────────────────────────────────────────────────────
  function ratingKey(sectionId) { return `hv-rating::${PAGE_KEY}::${sectionId}`; }
  function readRatings(sectionId) {
    try { return JSON.parse(localStorage.getItem(ratingKey(sectionId)) || '[]'); }
    catch { return []; }
  }
  function writeRatings(sectionId, arr) {
    localStorage.setItem(ratingKey(sectionId), JSON.stringify(arr));
  }
  function renderRating(container, sectionId, label) {
    const ratings = readRatings(sectionId);
    const myRating = ratings.length ? ratings[ratings.length - 1] : null;
    const avg = ratings.length
      ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
      : null;
    const wrap = document.createElement('div');
    wrap.className = 'hv-rating';
    const lab = document.createElement('span');
    lab.className = 'hv-rating-label';
    lab.textContent = label || 'Your rating:';
    wrap.appendChild(lab);
    const stars = document.createElement('span');
    stars.className = 'hv-stars';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.className = 'hv-star' + (myRating && i <= myRating.score ? ' filled' : '');
      btn.textContent = '★';
      btn.dataset.value = i;
      btn.title = `${i} / 5`;
      btn.addEventListener('click', () => setScore(i));
      stars.appendChild(btn);
    }
    wrap.appendChild(stars);
    const meta = document.createElement('span');
    meta.className = 'hv-rating-meta';
    if (avg) meta.textContent = `avg ${avg} · ${ratings.length} rating${ratings.length === 1 ? '' : 's'}`;
    else meta.textContent = 'no ratings yet';
    wrap.appendChild(meta);
    const ta = document.createElement('textarea');
    ta.className = 'hv-rating-comment';
    ta.placeholder = 'Optional note (saved with the rating)';
    if (myRating && myRating.note) ta.value = myRating.note;
    wrap.appendChild(ta);
    container.appendChild(wrap);
    function setScore(score) {
      const arr = readRatings(sectionId);
      arr.push({ score, note: ta.value || '', ts: new Date().toISOString() });
      writeRatings(sectionId, arr);
      wrap.remove();
      renderRating(container, sectionId, label);
    }
  }
  function injectRatings() {
    document.querySelectorAll('.post-card').forEach(card => {
      const id = card.id || 'card';
      renderRating(card, id, 'Rate this:');
    });
    if (!document.querySelector('.post-card')) {
      const article = document.querySelector('article#content');
      if (article) renderRating(article.parentNode, PAGE_KEY, 'Rate this page:');
    }
  }
  function exportAllRatings() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('hv-rating::')) {
        try { out[k] = JSON.parse(localStorage.getItem(k)); } catch {}
      }
    }
    download(out, `highvis-ratings-${new Date().toISOString().slice(0,10)}.json`);
  }

  // ───── Review mode ─────────────────────────────────────────────────
  let reviewActive = false;
  const editableSelectors = ['article#content', '.post-card .post-body article'];
  const snapshots = new Map(); // node → original innerHTML

  function tryUnlock() {
    if (reviewActive) return;
    const pwd = prompt('Review mode password:');
    if (pwd === null) return; // cancelled
    if (pwd !== PASSWORD) {
      alert('Wrong password.');
      return;
    }
    activateReview();
  }

  function activateReview() {
    reviewActive = true;
    document.body.classList.add('hv-review-mode');

    const pill = document.createElement('div');
    pill.className = 'hv-review-pill';
    pill.innerHTML = 'REVIEW MODE <button data-act="exit">exit</button>';
    document.body.appendChild(pill);

    const toolbar = document.createElement('div');
    toolbar.className = 'hv-review-toolbar';
    toolbar.innerHTML = `
      <button data-act="voice" title="Flag for voice / tone refinement">
        <span class="swatch" style="background:#FFF3A6"></span>Voice
      </button>
      <button data-act="fact" title="Flag for fact-check / hallucination">
        <span class="swatch" style="background:#FFC9C2"></span>Fact
      </button>
      <button data-act="cut" title="Mark for deletion">
        <span class="swatch" style="background:#888;text-decoration:line-through"></span>Cut
      </button>
      <button data-act="comment" title="Add a comment">
        <span class="swatch" style="background:#D6E4FF"></span>Comment
      </button>
      <span class="hv-spacer"></span>
      <button data-act="save" class="primary">Save edits</button>
      <button data-act="export-ratings">Export ratings</button>
      <button data-act="exit">Exit</button>
    `;
    document.body.appendChild(toolbar);

    editableSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(node => {
        snapshots.set(node, node.innerHTML);
        node.contentEditable = 'true';
        node.classList.add('hv-editable');
      });
    });

    const handle = e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const act = btn.dataset.act;
      if (!act) return;
      if (act === 'voice')   annotate('voice');
      else if (act === 'fact')    annotate('fact');
      else if (act === 'cut')     annotate('cut');
      else if (act === 'comment') annotate('comment');
      else if (act === 'save')    saveEdits();
      else if (act === 'export-ratings') exportAllRatings();
      else if (act === 'exit')    exitReview();
    };
    pill.addEventListener('click', handle);
    toolbar.addEventListener('click', handle);

    function escHandler(e) { if (e.key === 'Escape') exitReview(); }
    document.addEventListener('keydown', escHandler);

    function exitReview() {
      pill.remove();
      toolbar.remove();
      editableSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(node => {
          node.contentEditable = 'false';
          node.classList.remove('hv-editable');
        });
      });
      document.body.classList.remove('hv-review-mode');
      document.removeEventListener('keydown', escHandler);
      reviewActive = false;
    }
  }

  function annotate(type) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      alert('Select text first.');
      return;
    }
    let note = '';
    if (type === 'comment' || type === 'fact' || type === 'voice') {
      const promptText = type === 'fact'
        ? 'Why is this wrong? (optional)'
        : type === 'voice'
        ? 'What\'s off about the voice? (optional)'
        : 'Your comment:';
      note = prompt(promptText) || '';
      if (type === 'comment' && !note) return;
    }
    const range = sel.getRangeAt(0);
    const wrap = document.createElement('mark');
    wrap.dataset.reviewType = type;
    if (note) {
      wrap.dataset.reviewNote = note;
      wrap.title = `${type}: ${note}`;
    } else {
      wrap.title = type;
    }
    try { range.surroundContents(wrap); }
    catch {
      const frag = range.extractContents();
      wrap.appendChild(frag);
      range.insertNode(wrap);
    }
    sel.removeAllRanges();
  }

  function saveEdits() {
    const payload = {
      page: PAGE_KEY,
      timestamp: new Date().toISOString(),
      sections: [],
      annotations: [],
      ratings: {}
    };
    editableSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(node => {
        const orig = snapshots.get(node) || '';
        const curr = node.innerHTML;
        const sectionId = node.closest('.post-card')?.id || node.id || 'main';
        payload.sections.push({
          section_id: sectionId,
          original_html: orig,
          edited_html: curr,
          changed: orig !== curr
        });
        node.querySelectorAll('mark[data-review-type]').forEach(m => {
          payload.annotations.push({
            section_id: sectionId,
            type: m.dataset.reviewType,
            text: m.textContent,
            note: m.dataset.reviewNote || ''
          });
        });
      });
    });
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('hv-rating::')) {
        try { payload.ratings[k] = JSON.parse(localStorage.getItem(k)); } catch {}
      }
    }
    download(payload, `highvis-edits-${PAGE_KEY}-${new Date().toISOString().slice(0,10)}.json`);
    console.log('[highvis-review] saved edits', payload);
    alert(`Saved. ${payload.annotations.length} annotation${payload.annotations.length===1?'':'s'}, ${payload.sections.filter(s=>s.changed).length} edited section${payload.sections.filter(s=>s.changed).length===1?'':'s'}. Drop the JSON in content/academic/highvis/edits/ for the next session to learn from.`);
  }

  function download(obj, name) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ───── Wire up ─────────────────────────────────────────────────────
  function start() {
    injectRatings();
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        tryUnlock();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    setTimeout(start, 100); // marked.js renders async on stacked pages
  }
})();
