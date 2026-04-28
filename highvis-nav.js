/* Shared topbar nav for HighVis multi-page site.
   Each page sets <body data-page="..."> matching the slug below. */
(function () {
  const PAGES = [
    { slug: 'hub',     href: 'highvis.html',         label: 'Hub' },
    { slug: 'summary', href: 'highvis-summary.html', label: 'Exec Summary' },
    { slug: 'log',     href: 'research-log.html',    label: 'Research Log' },
    { slug: 'blog',    href: 'highvis-blog.html',    label: 'VFX Blog' },
    { slug: 'social',  href: 'highvis-social.html',  label: 'Social Posts' },
    { slug: 'scripts', href: 'highvis-scripts.html', label: 'Video Scripts' },
  ];

  const active = document.body.getAttribute('data-page') || '';

  const topbar = document.createElement('header');
  topbar.className = 'topbar';

  const inner = document.createElement('div');
  inner.className = 'topbar-inner';

  const brand = document.createElement('a');
  brand.href = 'highvis.html';
  brand.className = 'brand';
  brand.innerHTML = '<span class="brand-dot"></span><span>HighVis R&amp;D</span>';

  const nav = document.createElement('nav');
  nav.className = 'topbar-nav';
  PAGES.forEach(p => {
    const a = document.createElement('a');
    a.href = p.href;
    a.textContent = p.label;
    if (p.slug === active) a.className = 'active';
    nav.appendChild(a);
  });

  const pill = document.createElement('span');
  pill.className = 'topbar-pill';
  pill.innerHTML = '<span class="pulse"></span>Living document';

  inner.appendChild(brand);
  inner.appendChild(nav);
  inner.appendChild(pill);
  topbar.appendChild(inner);

  document.body.insertBefore(topbar, document.body.firstChild);
})();
