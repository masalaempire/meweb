import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

function render(projects) {
 const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const featured=projects.filter(p=>p.featured);
 const socials=[["GitHub","https://github.com/masalaempire","@masalaempire"],["YouTube","https://www.youtube.com/@SimonLMLD","@SimonLMLD"],["Instagram","https://www.instagram.com/simonlm0608","@simonlm0608"],["X / Twitter","https://x.com/laomengsi","@laomengsi"],["Reddit","https://www.reddit.com/user/SimonLMLD/","u/SimonLMLD"],["Inara","https://simonlm.space","CMDR SimonLM"]];
 const arrow='<span aria-hidden="true">↗</span>';
 const shell=(title,description,body,{prefix="",active="work",type=""}={})=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)} — Simon Qian</title>
<meta name="description" content="${e(description)}">
<meta name="theme-color" content="#fafafa">
<link rel="icon" href="${prefix}favicon.ico">
<link rel="stylesheet" href="${prefix}styles.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="layout">
<header class="sidebar">
<a class="name" href="${prefix}index.html">Simon Qian<span>SimonLM</span></a>
<p class="sidebar-note">Student.<br>Apps, websites &amp; games.</p>
<nav aria-label="Main navigation">
<a href="${prefix}index.html"${active==="work"?' aria-current="page"':""}>Projects</a>
<a href="${prefix}about.html"${active==="about"?' aria-current="page"':""}>About</a>
<a href="${prefix}contact.html"${active==="contact"?' aria-current="page"':""}>Contact</a>
</nav>
<a class="sidebar-email" href="mailto:simonlm@simonlm.one">Email ${arrow}</a>
</header>
<main id="main" class="${type}" tabindex="-1">${body}</main>
<footer class="footer"><span>© 2026 Simon Qian</span><a href="https://github.com/masalaempire">GitHub ${arrow}</a><a href="mailto:simonlm@simonlm.one">Email ${arrow}</a></footer>
</div>
</body>
</html>
`;
 const photo=(p,prefix="",priority=false)=>`<img src="${prefix}${e(p.image)}" alt="${e(p.alt)}" width="${p.width}" height="${p.height}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
 const entry=p=>p.featured?`projects/${p.slug}.html`:p.url;
 const row=p=>`<li class="index-row">${p.status==="in-progress"&&!p.url&&!p.featured?`<div class="index-link">`:`<a class="index-link" href="${e(entry(p))}">`}<span class="index-name">${e(p.name)}<span class="index-description">${e(p.description)}</span></span><span class="index-category">${e(p.category)}${p.status==="in-progress"?' <span class="status">In progress</span>':""}</span><span class="index-arrow" aria-hidden="true">${p.status==="in-progress"&&!p.url&&!p.featured?"—":p.featured?"→":"↗"}</span>${p.status==="in-progress"&&!p.url&&!p.featured?"</div>":"</a>"}</li>`;
 const bio=`<section class="small-about" aria-labelledby="about-heading"><h2 id="about-heading">A little about me</h2><div><p>I’m Simon, a student interested in computer science and design. I also play piano and spend time in space games.</p><a href="about.html">More about me →</a></div></section>`;
 const work=featured.map((p,i)=>`<article class="work work-${e(p.slug)}" id="${e(p.slug)}">
<a class="project-image ${e(p.slug)}" href="projects/${e(p.slug)}.html" aria-label="View ${e(p.name)}">${photo(p,"",i===0)}</a>
<div class="project-caption"><h2><a href="projects/${e(p.slug)}.html">${e(p.name)} <span aria-hidden="true">↗</span></a></h2><span>${e(p.category)}</span></div>
<p class="project-summary">${e(p.description)}</p>${p.status==="in-progress"?'<p class="status">In progress</p>':""}
</article>`).join("\n");
 const files={};
 files["index.html"]=shell("Projects","Apps, websites, and games by Simon Qian.",`<header class="work-heading"><div><h1>Projects</h1><p>Things I’ve been making.</p></div><a class="view-index" href="projects.html">View index <span aria-hidden="true">↗</span></a></header>
<div class="selected-work">${work}</div>
<section class="other-work" aria-labelledby="other-heading"><div class="section-heading"><h2 id="other-heading">Other work</h2><a href="https://github.com/masalaempire">Ongoing projects on GitHub ${arrow}</a></div><ul class="project-index">${projects.filter(p=>!p.featured).map(row).join("\n")}</ul></section>
${bio}`);
 files["projects.html"]=shell("Project index","All projects by Simon Qian.",`<header class="work-heading"><div><h1>Project index</h1><p>Apps, websites &amp; games.</p></div><a class="view-index" href="index.html">View gallery ↗</a></header><ul class="project-index full-index">${projects.map(row).join("\n")}</ul><p class="index-note">New work and updates on <a href="https://github.com/masalaempire">GitHub ${arrow}</a>.</p>`,{type:"index-page"});
 files["about.html"]=shell("About","A little about Simon Qian.",`<header class="simple-heading"><h1>About</h1></header><div class="short-copy"><p class="lead">I’m Simon Qian, also known as SimonLM. I’m a student interested in computer science and design.</p><p>I make apps, websites, and games. I write C++ for competitive programming and Swift for Mac apps.</p><p>Outside that, I play piano, listen to records, and play Elite Dangerous. I like spare, industrial design.</p><p class="pronouns">He / they.</p><a class="text-link" href="index.html">See my projects →</a></div>`,{active:"about",type:"secondary-page"});
 files["contact.html"]=shell("Contact","Email and social links for Simon Qian.",`<header class="simple-heading"><h1>Contact</h1></header><a class="contact-email" href="mailto:simonlm@simonlm.one">simonlm@simonlm.one ${arrow}</a><ul class="social-links">${socials.map(([name,url,handle])=>`<li><a href="${url}"><span>${name}</span><span class="handle">${handle}</span>${arrow}</a></li>`).join("\n")}</ul>`,{active:"contact",type:"secondary-page"});
 featured.forEach((p,i)=>{
 const next=featured[(i+1)%featured.length];
 files[`projects/${p.slug}.html`]=shell(p.name,p.description,`<header class="project-heading"><p>${e(p.category)}${p.status==="in-progress"?" · In progress":""}</p><h1>${e(p.name)}</h1><div class="project-introduction"><p>${e(p.description)}</p><div class="project-links">${p.url?`<a href="${e(p.url)}">${e(p.action||"Visit project")} ${arrow}</a>`:""}${p.source?`<a href="${e(p.source)}">Source ${arrow}</a>`:""}</div></div></header>
<figure class="detail-figure"><div class="project-image ${e(p.slug)}">${photo(p,"../",true)}</div><figcaption>${e(p.caption)}</figcaption></figure>
<section class="project-notes" aria-label="About this project"><h2>${e(p.intro)}</h2><div>${(p.paragraphs||[]).map(t=>`<p>${e(t)}</p>`).join("")}</div></section>
${p.secondImage?`<figure class="detail-figure secondary-figure"><div class="project-image ${e(p.slug)}"><img src="../${e(p.secondImage)}" alt="${e(p.secondAlt)}" loading="lazy" decoding="async"></div><figcaption>${e(p.secondCaption)}</figcaption></figure>`:""}
<nav class="project-bottom" aria-label="More projects"><a href="../index.html">All projects</a><a href="${e(next.slug)}.html">Next: ${e(next.name)} →</a></nav>`,{prefix:"../",active:"",type:"detail-page"});
 });
 return files;
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projects = JSON.parse(await readFile(resolve(root, 'projects.json'), 'utf8'));
const slugs = new Set();
for (const project of projects) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) || slugs.has(project.slug)) throw new Error('Invalid or duplicate project slug: ' + project.slug);
  slugs.add(project.slug);
  if (!project.name || !project.category || !project.description) throw new Error('Missing project content: ' + project.slug);
  if (!['published', 'in-progress'].includes(project.status)) throw new Error('Invalid status: ' + project.slug);
  if (project.status === 'published' && !project.url) throw new Error('Published project needs a URL: ' + project.slug);
  for (const key of ['url', 'source']) if (project[key] && !/^https:\/\//.test(project[key])) throw new Error('Use HTTPS URLs: ' + project.slug);
  if (project.featured && (!project.image || !project.alt || !project.width || !project.height)) throw new Error('Featured project needs an image, alt text, and dimensions: ' + project.slug);
}
const files = render(projects);
for (const [path, content] of Object.entries(files)) {
  await mkdir(dirname(resolve(root, path)), { recursive: true });
  await writeFile(resolve(root, path), content);
}
console.log('Generated ' + Object.keys(files).length + ' pages.');
