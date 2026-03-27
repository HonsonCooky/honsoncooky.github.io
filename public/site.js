const SEP = " :: ";

const NAV_LINKS = [
    { href: "/", label: "home" },
    { href: "/history.html", label: "history" },
    { href: "/blogs/", label: "blogs" },
    { href: "/cv.html", label: "cv" },
];

function renderNav() {
    const nav = document.querySelector("nav");
    if (!nav) return;
    const path = window.location.pathname;
    nav.innerHTML = NAV_LINKS.map((link) => {
        const current = path === link.href || (link.href !== "/" && path.startsWith(link.href));
        return `<a href="${link.href}"${current ? ' aria-current="page"' : ""}>${link.label}</a>`;
    }).join("");
}

renderNav();

function wrapBrackets(html) {
    return html.replace(/\([^)]+\)/g, '<span class="nowrap">$&</span>');
}

async function loadData() {
    const res = await fetch("/public/data.json");
    return res.json();
}

function renderWork(work) {
    return work
        .map(
            (job) => `
        <article>
            <h3><span class="nowrap">${job.role} -</span> <span class="nowrap">${job.company}</span></h3>
            <p class="meta">${job.start} - ${job.end || "Present"}${SEP}${job.location}</p>
            ${job.reflection ? `<section><h4>Reflection</h4><blockquote>"${job.reflection}"</blockquote></section>` : ""}
            <section><h4>Responsibilities</h4><ul>${job.details.map((d) => `<li>${wrapBrackets(d)}</li>`).join("")}</ul></section>
            <section><h4>Skills</h4><p class="skills">${job.skills.map((s) => `<code>${s}</code>`).join(SEP)}</p></section>
        </article>`,
        )
        .join("<hr />");
}

function renderEducation(education) {
    return education
        .map(
            (edu) => `
        <article>
            <h3>${edu.qualification.split(/ (?=with |of |\()/).map((p) => `<span class="nowrap">${p}</span>`).join(" ")}</h3>
            <p class="meta">${edu.start} - ${edu.end}${SEP}<span class="nowrap">${edu.institution}</span></p>
            ${edu.major ? `<div><span class="label">Major:</span> ${edu.major}</div>` : ""}
            ${edu.specialisation ? `<div><span class="label">Specialisation:</span> ${edu.specialisation}</div>` : ""}
            ${edu.award ? `<div><span class="label">Award:</span> ${edu.award}</div>` : ""}
            <ul>${edu.details.map((d) => `<li>${wrapBrackets(d)}</li>`).join("")}</ul>
            ${edu.theatre ? `<details><summary>Theatre Awards and Participation</summary><p><em>And you thought I was joking about being musically involved.</em></p><ul>${edu.theatre.map((t) => `<li>${wrapBrackets(t)}</li>`).join("")}</ul></details>` : ""}
        </article>`,
        )
        .join("<hr />");
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
