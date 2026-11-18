// Boutique publique V2 : carrousel, filtres structurés, devises, gros, témoignages, lookbook, commande WhatsApp
import { db, GROUPS, GROUP_OF, CITIES, DEFAULTS, SEED, BULK_MIN } from "./firebase-config.js";
import { collection, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $ = s => document.querySelector(s), esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SL = ["p1", "p2", "p3", "p4"].map(n => `images/${n}.jpg`);
let P = SEED.map((p, i) => ({ id: "s" + i, ...p })), R = { ...DEFAULTS.rates }, cur = "USD", grp = "Tout", cat = "Toutes", gen = "Tous", q = "";
const px = u => cur === "USD" ? "$" + u.toFixed(2) : cur === "CDF" ? Math.round(u * R.CDF).toLocaleString("fr-FR") + " FC" : "K" + (u * R.ZMW).toFixed(0);
const wa = t => `https://wa.me/${String(R.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(t)}`;
const GROS = `Bonjour Glamour Production 👋\nJe souhaite des précisions sur la vente en gros (à partir de ${BULK_MIN} pièces).`;

/* Carrousel */
$("#slides").innerHTML = SL.map(s => `<div style="background-image:url(${s})"></div>`).join(""); $("#dots").innerHTML = SL.map(() => "<i></i>").join("");
let n = 0; const go = i => { n = (i + SL.length) % SL.length; [...$("#slides").children].forEach((e, k) => e.classList.toggle("on", k === n)); [...$("#dots").children].forEach((e, k) => e.classList.toggle("on", k === n)); };
[...$("#dots").children].forEach((e, k) => e.onclick = () => go(k)); go(0); setInterval(() => go(n + 1), 5500);

/* Catalogue : groupe > catégorie > genre (vêtements) */
const chip = (v, on, k) => `<button class="chip ${on ? "on" : ""}" data-${k}="${esc(v)}">${esc(v)}</button>`;
function draw() {
  $("#gchips").innerHTML = ["Tout", ...Object.keys(GROUPS)].map(g => chip(g, g === grp, "g")).join("");
  const cs = grp === "Tout" || GROUPS[grp].length < 2 ? [] : ["Toutes", ...GROUPS[grp]]; $("#cchips").innerHTML = cs.map(c => chip(c, c === cat, "c")).join("");
  $("#gen").innerHTML = grp === "Vêtements Homme & Femme" ? ["Tous", "Femme", "Homme"].map(g => chip(g, g === gen, "n")).join("") : "";
  const l = P.filter(p => (grp === "Tout" || GROUP_OF[p.cat] === grp) && (cat === "Toutes" || p.cat === cat) && (gen === "Tous" || !p.genre || p.genre === gen || p.genre === "Mixte") && (p.name + p.cat).toLowerCase().includes(q));
  $("#grid").innerHTML = l.length ? l.map(p => `<article class="card" data-id="${esc(p.id)}">${p.badge ? `<span class="tag">${esc(p.badge)}</span>` : ""}<img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}"><div><small>${esc(p.cat)}</small><h3 style="margin:.1rem 0">${esc(p.name)}</h3><b>${px(p.usd)}</b></div></article>`).join("") : '<p style="color:#a79f92">Aucun article dans cette catégorie pour le moment.</p>';
  $("#grosbtn").href = wa(GROS);
}
document.addEventListener("click", e => { const d = e.target.dataset; if (d.g) { grp = d.g; cat = "Toutes"; gen = "Tous"; draw(); } else if (d.c) { cat = d.c; draw(); } else if (d.n) { gen = d.n; draw(); } if ("x" in d) e.target.closest("dialog").close(); });
$("#q").oninput = e => { q = e.target.value.toLowerCase().trim(); draw(); }; $("#cur").onchange = e => { cur = e.target.value; draw(); };

/* Fiche produit : quantité, gros dès 3 pièces, commande WhatsApp */
$("#grid").onclick = e => {
  const c = e.target.closest(".card"); if (!c) return; const p = P.find(x => x.id === c.dataset.id); let qty = 1;
  $("#mc").innerHTML = `<div class="md"><img src="${esc(p.image)}" alt=""><div><small>${esc(p.cat)}</small><h2>${esc(p.name)}</h2><p>${esc(p.desc || "")}</p><p class="pr">${px(p.usd)}</p>
  <div class="qty"><button id="mn">−</button><b id="qn">1</b><button id="pl">+</button><span id="tt"></span></div><div class="bulk" id="bk" hidden>🛍️ Vente en gros dès ${BULK_MIN} pièces : l’équipe vous précise le prix de gros sur WhatsApp.</div>
  <label>Ville de livraison<select id="city">${CITIES.map(v => `<option>${v}</option>`).join("")}</select></label><button class="btn" id="ord">Commander sur WhatsApp</button></div></div>`;
  const upd = () => { $("#qn").textContent = qty; $("#tt").textContent = "Total : " + px(p.usd * qty); $("#bk").hidden = qty < BULK_MIN; };
  $("#mn").onclick = () => { qty = Math.max(1, qty - 1); upd(); }; $("#pl").onclick = () => { qty++; upd(); }; upd();
  $("#ord").onclick = () => open(wa(`Bonjour Glamour Production 👋\nJe souhaite commander :\n• Article : ${p.name}\n• Quantité : ${qty}\n• Prix unitaire : ${px(p.usd)}\n• Total : ${px(p.usd * qty)}\n• Ville de livraison : ${$("#city").value}` + (qty >= BULK_MIN ? `\n• 🛍️ Vente en gros (à partir de ${BULK_MIN} pièces) : merci de préciser le prix de gros` : "")), "_blank");
  $("#m").showModal();
};

/* Témoignages vidéo et lookbook (gérés dans l'admin) */
const vid = u => /youtu/.test(u) ? `<iframe loading="lazy" allowfullscreen src="https://www.youtube.com/embed/${(u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/) || [])[1]}"></iframe>` : `<video controls preload="metadata" playsinline src="${esc(u)}"></video>`;
onSnapshot(collection(db, "testimonials"), s => { $("#tem").innerHTML = s.size ? s.docs.map(d => d.data()).map(t => `<article>${vid(t.video)}<div><b>${esc(t.name)}</b><br><small>${esc(t.role || "")}</small><p>${esc(t.quote || "")}</p></div></article>`).join("") : '<div class="empty">Les témoignages vidéo arrivent bientôt.</div>'; }, () => {});
let LK = []; onSnapshot(collection(db, "looks"), s => { LK = s.docs.map(d => d.data()); $("#lk").innerHTML = LK.length ? LK.map((l, i) => `<figure data-l="${i}"><img loading="lazy" src="${esc(l.image)}" alt="${esc(l.caption || "Lookbook")}"><figcaption>${esc(l.caption || "")}</figcaption></figure>`).join("") : '<div class="empty">Le lookbook de Didi arrive très bientôt ✨</div>'; }, () => {});
$("#lk").onclick = e => { const f = e.target.closest("[data-l]"); if (!f) return; const l = LK[+f.dataset.l]; $("#lc").innerHTML = `<img src="${esc(l.image)}" alt=""><div><b>${esc(l.caption || "")}</b>${l.items ? `<p>Articles portés : ${esc(l.items)}</p>` : ""}<a class="btn" href="#boutique" onclick="document.getElementById('lb').close()">Voir la boutique</a></div>`; $("#lb").showModal(); };

/* Données en temps réel (valeurs par défaut affichées si Firestore est vide) */
onSnapshot(collection(db, "products"), s => { if (s.size) P = s.docs.map(d => ({ id: d.id, ...d.data() })); draw(); }, () => draw());
onSnapshot(doc(db, "settings", "rates"), s => { if (s.exists()) R = { ...R, ...s.data() }; draw(); }, () => {});
draw();
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: .15 }); document.querySelectorAll(".rv").forEach(e => io.observe(e));
