const SEP = " :: ";

const ROOT = document.currentScript?.dataset.root ?? ".";

const NAV_LINKS = [
  { href: `${ROOT}/`, label: "home" },
  { href: `${ROOT}/history.html`, label: "history" },
  { href: `${ROOT}/blogs/`, label: "blogs" },
  { href: `${ROOT}/cv.html`, label: "cv" },
];

function renderNav() {
  const nav = document.querySelector("nav");
  if (!nav) return;
  const path = window.location.pathname;
  const homePath = new URL(NAV_LINKS[0].href, document.baseURI).pathname;
  nav.innerHTML = NAV_LINKS.map((link) => {
    const linkPath = new URL(link.href, document.baseURI).pathname;
    const current = path === linkPath || (linkPath !== homePath && path.startsWith(linkPath));
    return `<a href="${link.href}"${current ? ' aria-current="page"' : ""}>${link.label}</a>`;
  }).join("");
  nav.querySelectorAll('a[aria-current="page"]').forEach((a) => {
    if (new URL(a.href).pathname !== path) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

renderNav();

function wrapBrackets(html) {
  return html.replace(/\([^)]+\)/g, '<span class="nowrap">$&</span>');
}

async function loadData() {
  const res = await fetch(`${ROOT}/public/data.json`);
  return res.json();
}

function listItems(items, transform = (x) => x) {
  return `<ul>${items.map((item) => `<li>${transform(item)}</li>`).join("")}</ul>`;
}

function collapsibleSection(summary, content) {
  return `<section><details><summary>${summary}</summary>${content}</details></section>`;
}

function renderJob(job) {
  const reflection = job.reflection
    ? `<section><h4>Reflection</h4><blockquote>"${job.reflection}"</blockquote></section>`
    : "";
  const responsibilities = `<section><h4>Responsibilities</h4>${listItems(job.details, wrapBrackets)}</section>`;
  const skills = `<section><h4>Skills</h4><p class="skills">${job.skills.map((s) => `<code>${s}</code>`).join(SEP)}</p></section>`;

  return `
        <article>
            <h3><span class="nowrap">${job.role} -</span> <span class="nowrap">${job.company}</span></h3>
            <p class="meta">${job.start} - ${job.end || "Present"}${SEP}${job.location}</p>
            ${reflection}
            ${responsibilities}
            ${skills}
        </article>`;
}

function renderWork(work) {
  return work.map(renderJob).join("<hr />");
}

function renderQualification(qualification) {
  return qualification
    .split(/ (?=with |of |\()/)
    .map((p) => `<span class="nowrap">${p}</span>`)
    .join(" ");
}

function renderMajorSpecialisation(edu) {
  if (!edu.major && !edu.specialisation) return "";
  const major = edu.major ? `<div><span class="label">Major:</span> ${edu.major}</div>` : "";
  const spec = edu.specialisation ? `<div><span class="label">Specialisation:</span> ${edu.specialisation}</div>` : "";
  return `<section>${major}${spec}</section>`;
}

function renderEdu(edu) {
  const majorSpec = renderMajorSpecialisation(edu);
  const firstDetail = `<section>${listItems(edu.details.slice(0, 1), wrapBrackets)}</section>`;
  const awards =
    edu.details.length > 1 ? collapsibleSection("Academic Awards", listItems(edu.details.slice(1), wrapBrackets)) : "";
  const theatre = edu.theatre
    ? collapsibleSection(
        "Theatre Awards and Participation",
        `<p><em>And you thought I was joking about being musically involved.</em></p>${listItems(edu.theatre, wrapBrackets)}`,
      )
    : "";

  return `
        <article>
            <h3>${renderQualification(edu.qualification)}</h3>
            <p class="meta">${edu.start} - ${edu.end}${SEP}<span class="nowrap">${edu.institution}</span></p>
            ${majorSpec}
            ${firstDetail}
            ${awards}
            ${theatre}
        </article>`;
}

function renderEducation(education) {
  return education.map(renderEdu).join("<hr />");
}

function renderInterests(interests) {
  return `<div class="interests-list">${interests
    .map(
      (i) => `
        <article>
            <h3>${i.name}</h3>
            <p>${i.summary}</p>
        </article>`,
    )
    .join("")}</div>`;
}

function collectSkills(data) {
  const seen = new Set();
  for (const job of data.work) {
    for (const s of job.skills) seen.add(s);
  }
  return Array.from(seen);
}
