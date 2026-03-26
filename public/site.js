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
            <p class="meta">${job.start} - ${job.end || "Present"} :: ${job.location}</p>
            <ul>${job.details.map((d) => `<li>${d}</li>`).join("")}</ul>
            <p class="skills">${job.skills.join(" :: ")}</p>
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
            <p class="meta">${edu.start} - ${edu.end} :: ${edu.institution}</p>
            <ul>${edu.details.map((d) => `<li>${d}</li>`).join("")}</ul>
            ${edu.transcript ? `<p><a href="${edu.transcript}" target="_blank">transcript</a></p>` : ""}
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
