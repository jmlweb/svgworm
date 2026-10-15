// The candidate loader: fetch the sprite with CORS + SRI, parse it inertly, strip anything
// executable, inject it once. URL and integrity are baked in, as a hashed product file would.
// Spike code: evidence, not product.
export const makeLoader = (url, integrity) =>
  `(()=>{const u=${JSON.stringify(url)},i=${JSON.stringify(integrity)},k="svgworm-sprite";` +
  `if(document.querySelector('svg[data-svgworm="'+i+'"]'))return;` +
  `fetch(u,{mode:"cors",credentials:"omit",integrity:i}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.text()})` +
  `.then(t=>{if(document.querySelector('svg[data-svgworm="'+i+'"]'))return;` +
  `const d=new DOMParser().parseFromString(t,"image/svg+xml"),s=d.documentElement;` +
  `if(s.localName!=="svg"||d.getElementsByTagName("parsererror").length)throw Error("not an SVG");` +
  `for(const e of [...s.querySelectorAll("script,foreignObject")])e.remove();` +
  `for(const e of [s,...s.querySelectorAll("*")])for(const a of [...e.attributes])` +
  `if(/^on/i.test(a.name)||/^\\s*javascript:/i.test(a.value))e.removeAttribute(a.name);` +
  `s.setAttribute("data-svgworm",i);s.setAttribute("aria-hidden","true");` +
  `s.setAttribute("style","position:absolute;width:0;height:0;overflow:hidden");` +
  `const n=document.importNode(s,true),put=()=>{if(!n.isConnected)document.body.prepend(n)};put();` +
  // Routers that swap <body> (Astro ClientRouter) drop the sprite: put it back.
  `new MutationObserver(put).observe(document.documentElement,{childList:true})})` +
  `.catch(e=>console.error("svgworm: sprite not loaded from "+u+": "+e.message))})();\n`;
