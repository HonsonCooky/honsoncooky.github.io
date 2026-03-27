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

async function loadData() {
    const res = await fetch("/public/data.json");
    return res.json();
}

function renderWork(work) {
    return work
        .map(
            (job) => `
        <article>
            <h3>${job.role} - ${job.company}</h3>
            <p class="meta">${job.start} - ${job.end || "Present"}${SEP}${job.location}</p>
            ${job.reflection ? `<blockquote>"${job.reflection}"</blockquote>` : ""}
            <ul>${job.details.map((d) => `<li>${d}</li>`).join("")}</ul>
            <p class="skills">${job.skills.join(SEP)}</p>
        </article>`,
        )
        .join("<hr />");
}

function renderEducation(education) {
    return education
        .map(
            (edu) => `
        <article>
            <h3>${edu.qualification}</h3>
            <p class="meta">${edu.start} - ${edu.end}${SEP}${edu.institution}</p>
            ${edu.major ? `<div><span class="label">Major:</span> ${edu.major}</div>` : ""}
            ${edu.specialisation ? `<div><span class="label">Specialisation:</span> ${edu.specialisation}</div>` : ""}
            ${edu.award ? `<div><span class="label">Award:</span> ${edu.award}</div>` : ""}
            <ul>${edu.details.map((d) => `<li>${d}</li>`).join("")}</ul>
        </article>`,
        )
        .join("<hr />");
}

function renderInterests(interests) {
    return interests
        .map(
            (i) => `
        <article>
            <h3>${i.name}</h3>
            <p>${i.summary}</p>
        </article>`,
        )
        .join("<hr />");
}

function collectSkills(data) {
    const seen = new Set();
    for (const job of data.work) {
        for (const s of job.skills) seen.add(s);
    }
    return Array.from(seen);
}
