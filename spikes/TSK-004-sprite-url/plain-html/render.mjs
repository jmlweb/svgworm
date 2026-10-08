// Fills index.template.html from manifest.json: no bundler, no JS on the page. Spike code.
import { readFile, writeFile } from 'node:fs/promises';

const escapeAttr = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export const renderIcon = (manifest, name, size = 48) => {
  if (!Object.hasOwn(manifest.icons, name)) throw new Error(`unknown icon "${name}"`);
  const icon = manifest.icons[name];
  const group = manifest.sprites[icon.sprite];
  const file = icon.delivery === 'use' ? group.sprite : group.stack;
  const href = escapeAttr(`${file.url}#${icon.id}`);
  const data = `data-icon="${escapeAttr(name)}"`;
  if (icon.delivery === 'img') return `<img src="${href}" width="${size}" height="${size}" alt="" ${data}>`;
  if (icon.delivery === 'mask') {
    return `<span aria-hidden="true" ${data} style="display:inline-block;width:${size}px;height:${size}px;background-color:currentColor;mask:url(&quot;${href}&quot;) center / contain no-repeat"></span>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="${icon.viewBox}" focusable="false" aria-hidden="true" ${data}><use href="${href}"/></svg>`;
};

export const render = async ({ manifestPath, templatePath, outPath }) => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const template = await readFile(templatePath, 'utf8');
  await writeFile(outPath, template.replace(/\{\{icon:([^}]+)\}\}/g, (_, name) => renderIcon(manifest, name)));
};
