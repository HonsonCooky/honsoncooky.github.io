package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

type post struct {
	slug    string
	title   string
	date    string
	summary string
	html    string
}

func main() {
	wd, _ := os.Getwd()
	root, _ := filepath.Abs(wd)
	contentDir := filepath.Join(root, "content", "blog")
	outputDir := filepath.Join(root, "blogs")

	entries, err := os.ReadDir(contentDir)
	if err != nil {
		fmt.Println("No content/blog/ directory found. Nothing to build.")
		return
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") && !strings.Contains(e.Name(), "draft") {
			files = append(files, e.Name())
		}
	}
	sort.Sort(sort.Reverse(sort.StringSlice(files)))

	if len(files) == 0 {
		fmt.Println("No markdown files in content/blog/. Nothing to build.")
		return
	}

	var posts []post
	for _, file := range files {
		raw, err := os.ReadFile(filepath.Join(contentDir, file))
		if err != nil {
			fmt.Fprintf(os.Stderr, "error reading %s: %v\n", file, err)
			os.Exit(1)
		}

		meta, body := parseFrontmatter(string(raw))
		slug := slugFromFilename(file)
		title := meta["title"]
		if title == "" {
			title = slug
		}

		html := markdownToHTML(body)
		p := post{
			slug:    slug,
			title:   title,
			date:    meta["date"],
			summary: meta["summary"],
			html:    html,
		}

		os.MkdirAll(outputDir, 0o755)
		err = os.WriteFile(filepath.Join(outputDir, slug+".html"), []byte(postTemplate(p)), 0o644)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error writing %s: %v\n", slug, err)
			os.Exit(1)
		}
		fmt.Printf("  built: blogs/%s.html\n", slug)
		posts = append(posts, p)
	}

	os.MkdirAll(outputDir, 0o755)
	err = os.WriteFile(filepath.Join(outputDir, "index.html"), []byte(listingTemplate(posts)), 0o644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error writing listing: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("  built: blogs/index.html (%d post%s)\n", len(posts), plural(len(posts)))
}

func parseFrontmatter(raw string) (map[string]string, string) {
	meta := make(map[string]string)
	if !strings.HasPrefix(raw, "---\n") {
		return meta, raw
	}
	end := strings.Index(raw[4:], "\n---\n")
	if end == -1 {
		return meta, raw
	}
	for _, line := range strings.Split(raw[4:4+end], "\n") {
		i := strings.Index(line, ":")
		if i == -1 {
			continue
		}
		meta[strings.TrimSpace(line[:i])] = strings.TrimSpace(line[i+1:])
	}
	return meta, raw[4+end+5:]
}

func slugFromFilename(name string) string {
	name = strings.TrimSuffix(name, ".md")
	re := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}-`)
	return re.ReplaceAllString(name, "")
}

// markdownToHTML converts a subset of markdown to HTML. Handles paragraphs, headings, code blocks, inline code,
// bold, italic, links, unordered lists, and horizontal rules. No external dependencies.
func markdownToHTML(md string) string {
	lines := strings.Split(md, "\n")
	var out strings.Builder
	i := 0

	for i < len(lines) {
		line := lines[i]

		// Blank line
		if strings.TrimSpace(line) == "" {
			i++
			continue
		}

		// Fenced code block
		if strings.HasPrefix(line, "```") {
			lang := strings.TrimPrefix(line, "```")
			i++
			var block []string
			for i < len(lines) && !strings.HasPrefix(lines[i], "```") {
				block = append(block, escapeHTML(lines[i]))
				i++
			}
			if i < len(lines) {
				i++ // skip closing ```
			}
			if lang != "" {
				out.WriteString(fmt.Sprintf("<pre><code class=\"language-%s\">%s</code></pre>\n", lang, strings.Join(block, "\n")))
			} else {
				out.WriteString(fmt.Sprintf("<pre><code>%s</code></pre>\n", strings.Join(block, "\n")))
			}
			continue
		}

		// Heading
		if strings.HasPrefix(line, "#") {
			level := 0
			for level < len(line) && line[level] == '#' {
				level++
			}
			if level <= 6 && level < len(line) && line[level] == ' ' {
				text := inlineFormat(strings.TrimSpace(line[level+1:]))
				out.WriteString(fmt.Sprintf("<h%d>%s</h%d>\n", level, text, level))
				i++
				continue
			}
		}

		// Horizontal rule
		trimmed := strings.TrimSpace(line)
		if trimmed == "---" || trimmed == "***" || trimmed == "___" {
			out.WriteString("<hr />\n")
			i++
			continue
		}

		// Unordered list
		if strings.HasPrefix(trimmed, "- ") || strings.HasPrefix(trimmed, "* ") {
			out.WriteString("<ul>\n")
			for i < len(lines) {
				t := strings.TrimSpace(lines[i])
				if strings.HasPrefix(t, "- ") || strings.HasPrefix(t, "* ") {
					out.WriteString(fmt.Sprintf("<li>%s</li>\n", inlineFormat(t[2:])))
					i++
				} else {
					break
				}
			}
			out.WriteString("</ul>\n")
			continue
		}

		// Paragraph: collect consecutive non-blank, non-special lines
		var para []string
		for i < len(lines) {
			l := lines[i]
			t := strings.TrimSpace(l)
			if t == "" || strings.HasPrefix(t, "#") || strings.HasPrefix(t, "```") ||
				t == "---" || t == "***" || t == "___" ||
				strings.HasPrefix(t, "- ") || strings.HasPrefix(t, "* ") {
				break
			}
			para = append(para, t)
			i++
		}
		out.WriteString(fmt.Sprintf("<p>%s</p>\n", inlineFormat(strings.Join(para, "\n"))))
	}

	return out.String()
}

// inlineFormat handles inline markdown: bold, italic, inline code, and links.
func inlineFormat(s string) string {
	// Inline code (backticks) - process first to avoid formatting inside code spans
	re := regexp.MustCompile("`([^`]+)`")
	s = re.ReplaceAllString(s, "<code>$1</code>")

	// Bold
	re = regexp.MustCompile(`\*\*([^*]+)\*\*`)
	s = re.ReplaceAllString(s, "<strong>$1</strong>")

	// Italic
	re = regexp.MustCompile(`\*([^*]+)\*`)
	s = re.ReplaceAllString(s, "<em>$1</em>")

	// Links
	re = regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
	s = re.ReplaceAllString(s, `<a href="$2">$1</a>`)

	return s
}

func escapeHTML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	return s
}

func postTemplate(p post) string {
	return fmt.Sprintf(`<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>%s - Harrison Cook</title>
        <link rel="icon" type="image/png" href="/public/images/favicon.png" />
        <link rel="stylesheet" href="/public/style.css" />
    </head>
    <body>
        <nav>
            <a href="/">home</a>
            <a href="/history.html">history</a>
            <a href="/blogs/" aria-current="page">blogs</a>
            <a href="/cv.html">cv</a>
        </nav>

        <h1>%s</h1>
        <p class="post-meta">%s</p>
        %s

        <p><a href="/blogs/">back</a></p>
    </body>
</html>
`, p.title, p.title, p.date, p.html)
}

func listingTemplate(posts []post) string {
	var items strings.Builder
	for _, p := range posts {
		items.WriteString(fmt.Sprintf(`            <li>
                <a href="/blogs/%s.html">%s</a>
                <small>%s - %s</small>
            </li>
`, p.slug, p.title, p.date, p.summary))
	}

	return fmt.Sprintf(`<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Blogs - Harrison Cook</title>
        <link rel="icon" type="image/png" href="/public/images/favicon.png" />
        <link rel="stylesheet" href="/public/style.css" />
    </head>
    <body>
        <nav>
            <a href="/">home</a>
            <a href="/history.html">history</a>
            <a href="/blogs/" aria-current="page">blogs</a>
            <a href="/cv.html">cv</a>
        </nav>

        <h1>Blogs</h1>
        <ul class="post-list">
%s        </ul>
    </body>
</html>
`, items.String())
}

func plural(n int) string {
	if n == 1 {
		return ""
	}
	return "s"
}
