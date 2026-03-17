const PAGES = [
    { href: "/", label: "home" },
    { href: "/about.html", label: "about" },
    { href: "/work.html", label: "work" },
    { href: "/education.html", label: "education" },
    { href: "/projects.html", label: "projects" },
    { href: "/skills.html", label: "skills" },
];

class SiteHeader extends HTMLElement {
    connectedCallback() {
        const current = this.getAttribute("page") || "home";
        const links = PAGES.map(
            (p) =>
                `<li><a href="${p.href}"${p.label === current ? ' aria-current="page"' : ""}>${p.label}</a></li>`,
        ).join("\n");

        this.innerHTML = `
<header>
    <span class="ps1-user">harrison@cook:</span><span class="ps1-path">~/</span>
    <nav>
        <details>
            <summary>${current}</summary>
            <ul>
                ${links}
            </ul>
        </details>
    </nav>
    <span class="ps1-suffix">$</span>
</header>`;
    }
}

class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
<footer>
    <small>
        <a href="https://github.com/HonsonCooky" target="_blank">github</a>
        <span>::</span>
        <a href="https://www.reddit.com/user/HonsonCooky" target="_blank">reddit</a>
        <span>::</span>
        <a href="https://github.com/HonsonCooky/honsoncooky.github.io" target="_blank">source</a>
    </small>
</footer>`;
    }
}

customElements.define("site-header", SiteHeader);
customElements.define("site-footer", SiteFooter);
