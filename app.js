// Boutique publique : carrousel, catalogue filtrable, devises, commande WhatsApp
import { db, CATS, CITIES, DEFAULTS, SEED } from "./firebase-config.js";
import { collection, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $ = s => document.querySelector(s), esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SL = ["p1", "p2", "p3", "p4"].map(n => `images/${n}.jpg`);
let P = SEED.map((p, i) => ({ id: "s" + i, ...p })), R = DEFAULTS.rates, cur = "USD", cat = "Tout", q = "";
const px = u => cur === "USD" ? "$" + u.toFixed(2) : cur === "CDF" ? Math.round(u * R.CDF).toLocaleString("fr-FR") + " FC" : "K" + (u * R.ZMW).toFixed(0);

/* Carrousel */
$("#slides").innerHTML = SL.map(s => `<div style="background-image:url(${s})"></div>`).join(""); $("#dots").innerHTML = SL.map(() => "<i></i>").join("");
let n = 0; const go = i => { n = (i + SL.length) % SL.length; [...$("#slides").children].forEach((e, k) => e.classList.toggle("on", k === n)); [...$("#dots").children].forEach((e, k) => e.classList.toggle("on", k === n)); };
[...$("#dots").children].forEach((e, k) => e.onclick = () => go(k)); go(0); setInterval(() => go(n + 1), 5500);

/* Catalogue */
const chips = ["Tout", ...CATS]; $("#chips").innerHTML = chips.map(c => `<button class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join("");
function draw() {
  document.querySelectorAll(".chip").forEach(b => b.classList.toggle("on", b.dataset.c === cat));
  const l = P.filter(p => (cat === "Tout" || p.cat === cat) && (p.name + p.cat).toLowerCase().includes(q));
  $("#grid").innerHTML = l.length ? l.map(p => `<article class="card" data-id="${esc(p.id)}">${p.badge ? `<span class="tag">${esc(p.badge)}</span>` : ""}<img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}"><div><small>${esc(p.cat)}</small><h3 style="margin:.1rem 0">${esc(p.name)}</h3><b>${px(p.usd)}</b></div></article>`).join("") : '<p style="color:#a79f92">Aucun article dans cette catégorie pour le moment.</p>';
}
$("#chips").onclick = e => { const b = e.target.closest("[data-c]"); if (b) { cat = b.dataset.c; draw(); } };
$("#q").oninput = e => { q = e.target.value.toLowerCase().trim(); draw(); };
$("#cur").onchange = e => { cur = e.target.value; draw(); };

/* Fiche produit + commande WhatsApp */
$("#grid").onclick = e => {
  const c = e.target.closest(".card"); if (!c) return; const p = P.find(x => x.id === c.dataset.id);
  $("#mc").innerHTML = `<div class="md"><img src="${esc(p.image)}" alt=""><div><small>${esc(p.cat)}</small><h2>${esc(p.name)}</h2><p>${esc(p.desc || "")}</p><p class="pr">${px(p.usd)}</p><label>Ville de livraison<select id="city">${CITIES.map(v => `<option>${v}</option>`).join("")}</select></label><button class="btn" id="ord">Commander sur WhatsApp</button></div></div>`;
  $("#ord").onclick = () => {
    const t = `Bonjour Glamour Production 👋\nJe souhaite commander :\n• Article : ${p.name}\n• Prix : ${px(p.usd)}\n• Ville de livraison : ${$("#city").value}`;
    open(`https://wa.me/${String(R.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(t)}`, "_blank");
  }; $("#m").showModal();
};
$("#x").onclick = () => $("#m").close(); $("#m").onclick = e => { if (e.target.id === "m") $("#m").close(); };

/* Données en temps réel (les valeurs par défaut s'affichent si Firestore est vide) */
onSnapshot(collection(db, "products"), s => { if (s.size) P = s.docs.map(d => ({ id: d.id, ...d.data() })); draw(); }, () => draw());
onSnapshot(doc(db, "settings", "rates"), s => { if (s.exists()) R = { ...R, ...s.data() }; draw(); }, () => {});
draw();
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: .15 }); document.querySelectorAll(".rv").forEach(e => io.observe(e));
