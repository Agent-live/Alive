import fs from 'node:fs';
import path from 'node:path';

function readLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
}

function hasSkillMarkdown(dir) {
  return fs.existsSync(path.join(dir, 'SKILL.md')) || fs.existsSync(path.join(dir, 'skill.md'));
}

function listBundledSlugs(aliveAgentSkillsDir) {
  const out = new Set();
  for (const ent of fs.readdirSync(aliveAgentSkillsDir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    // Skip hidden/system dirs.
    if (ent.name.startsWith('.')) continue;

    const firstLevelDir = path.join(aliveAgentSkillsDir, ent.name);
    if (hasSkillMarkdown(firstLevelDir)) {
      out.add(ent.name);
      continue;
    }

    // Support owner/slug repo shape: skills/<owner>/<slug>/SKILL.md
    for (const nested of fs.readdirSync(firstLevelDir, { withFileTypes: true })) {
      if (!nested.isDirectory()) continue;
      if (nested.name.startsWith('.')) continue;
      const slugDir = path.join(firstLevelDir, nested.name);
      if (hasSkillMarkdown(slugDir)) {
        out.add(nested.name);
      }
    }
  }
  return out;
}

function parseCatalogFromReadme(lines, bundledSlugs) {
  const items = [];
  const seen = new Set();
  let currentCategory = null;

  const categoryRe = /<summary><h3[^>]*>([^<]+)<\/h3><\/summary>/;
  // Example:
  // - [github](https://github.com/alive-agent/skills/tree/main/skills/steipete/github/SKILL.md) - Interact with GitHub...
  // Some lines use an en dash (–) between the link and the description.
  const itemRe = /^- \[([^\]]+)\]\(([^)]+)\)\s*(?:-|–|—)\s*(.+)$/;

  for (const line of lines) {
    const cat = line.match(categoryRe);
    if (cat) {
      currentCategory = cat[1].trim();
      continue;
    }

    const m = line.match(itemRe);
    if (!m) continue;
    if (!currentCategory) continue;

    const slug = m[1].trim();
    const url = m[2].trim();
    const description = m[3].trim();

    const key = slug.toLowerCase();
    if (seen.has(key)) continue; // de-dupe by slug; first wins.
    seen.add(key);

    let repoPath = null;
    const urlTree = url.match(/^https?:\/\/github\.com\/alive-agent\/skills\/(?:tree|blob)\/main\/(.+)$/);
    if (urlTree) repoPath = urlTree[1].trim();

    items.push({
      slug,
      name: slug,
      description,
      category: currentCategory,
      url,
      repoPath,
      bundled: bundledSlugs.has(slug),
    });
  }

  // Compute category counts from the parsed items.
  const counts = new Map();
  for (const it of items) {
    counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
  }

  const categories = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count }));

  // Stable sort for browsing.
  items.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.slug.localeCompare(b.slug);
  });

  return { items, categories };
}

function main() {
  const repoRoot = process.cwd();
  const readmePath = path.join(repoRoot, 'alive-agent-skills-2', 'README.md');
  const aliveAgentSkillsDir = path.join(repoRoot, 'alive-agent-skills', 'skills');
  const outPath = path.join(repoRoot, 'backend', 'internal', 'skillshop', 'catalog.json');

  if (!fs.existsSync(readmePath)) {
    console.error(`Missing ${readmePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(aliveAgentSkillsDir)) {
    console.error(`Missing ${aliveAgentSkillsDir}`);
    process.exit(1);
  }

  const bundledSlugs = listBundledSlugs(aliveAgentSkillsDir);
  const lines = readLines(readmePath);

  const { items, categories } = parseCatalogFromReadme(lines, bundledSlugs);

  const out = {
    generatedAt: new Date().toISOString(),
    source: {
      readmePath: 'alive-agent-skills-2/README.md',
      aliveAgentSkillsDir: 'alive-agent-skills/skills',
    },
    totals: {
      skills: items.length,
      categories: categories.length,
      bundledSkills: items.filter((i) => i.bundled).length,
    },
    categories,
    items,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');

  console.log(`Wrote ${outPath}`);
  console.log(`Skills: ${out.totals.skills} | Categories: ${out.totals.categories} | Bundled: ${out.totals.bundledSkills}`);
}

main();
