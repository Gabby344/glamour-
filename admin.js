// Administration V2 : initialisation automatique, articles, taux, témoignages vidéo, lookbook
import { auth, db, ADMIN_EMAIL, CATS, DEFAULTS, SEED, upload } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $ = s => document.querySelector(s), esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const say = (t, ms = 3500) => { const m = $("#msg"); m.textContent = t; m.hidden = false; setTimeout(() => m.hidden = true, ms); };
$("#p-c").innerHTML = CATS.map(c => `<option>${c}</option>`).join(""); let P = [], busy = false;

onAuthStateChanged(auth, async u => {
  const ok = u && u.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (u && !ok) { say("Ce compte n’est pas administrateur."); return signOut(auth); }
  $("#login").hidden = !!ok; $("#app").hidden = !ok; $("#out").hidden = !ok; if (!ok) return;
  try { // Initialisation automatique au premier lancement
    if (!(await getDoc(doc(db, "settings", "rates"))).exists()) { const b = writeBatch(db); b.set(doc(db, "settings", "rates"), DEFAULTS.rates); SEED.forEach(p => b.set(doc(collection(db, "products")), p)); await b.commit(); say("✓ Base initialisée : taux et articles d’exemple créés.", 6000); }
  } catch (e) { say("Initialisation impossible : " + (e.code || e.message), 8000); }
  onSnapshot(doc(db, "settings", "rates"), s => { const r = s.data() || DEFAULTS.rates; $("#r-cdf").value = r.CDF; $("#r-zmw").value = r.ZMW; $("#r-wa").value = r.whatsapp || ""; });
  onSnapshot(collection(db, "products"), s => { P = s.docs.map(d => ({ id: d.id, ...d.data() })); $("#list").innerHTML = P.map(p => `<div class="row"><img src="${esc(p.image)}" alt=""><span>${esc(p.name)}<br><small>${esc(p.cat)} · $${p.usd}</small></span><button class="btn sm" data-e="${p.id}">Modifier</button><button class="btn sm" style="background:var(--r);color:#fff" data-d="${p.id}">Supprimer</button></div>`).join(""); });
  onSnapshot(collection(db, "testimonials"), s => $("#tl").innerHTML = s.docs.map(d => `<div class="row"><span>${esc(d.data().name)}<br><small>${esc(d.data().role || "")}</small></span><button class="btn sm" data-dt="${d.id}">Supprimer</button></div>`).join(""));
  onSnapshot(collection(db, "looks"), s => $("#ll").innerHTML = s.docs.map(d => `<div class="row"><img src="${esc(d.data().image)}" alt=""><span>${esc(d.data().caption || "")}</span><button class="btn sm" data-dl="${d.id}">Supprimer</button></div>`).join(""));
});
$("#lf").onsubmit = async e => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, $("#em").value.trim(), $("#pw").value); } catch { say("E-mail ou mot de passe incorrect."); } };
$("#out").onclick = () => signOut(auth);
document.querySelector(".tabs").onclick = e => { const t = e.target.dataset.t; if (!t) return; document.querySelectorAll(".tabs .chip").forEach(b => b.classList.toggle("on", b.dataset.t === t)); document.querySelectorAll("[data-p]").forEach(s => s.hidden = s.dataset.p !== t); };
const save = (fn, ok) => async e => { e.preventDefault(); if (busy) return; busy = true; say("Enregistrement… (les vidéos peuvent prendre un moment)", 60000); try { await fn(); say(ok); e.target.reset(); } catch (x) { say("Échec : " + (x.code || x.message), 9000); } busy = false; };

$("#rf").onsubmit = save(() => setDoc(doc(db, "settings", "rates"), { USD: 1, CDF: +$("#r-cdf").value, ZMW: +$("#r-zmw").value, whatsapp: $("#r-wa").value.replace(/\D/g, "") }), "✓ Taux enregistrés.");
const reset = () => { $("#p-id").value = ""; $("#pt").textContent = "Ajouter un article"; $("#pc").hidden = true; }; $("#pc").onclick = () => { $("#pf").reset(); reset(); };
$("#pf").onsubmit = save(async () => { const id = $("#p-id").value, old = P.find(p => p.id === id), f = $("#p-f").files[0];
  const d = { name: $("#p-n").value.trim(), cat: $("#p-c").value, genre: $("#p-g").value, usd: +$("#p-u").value, desc: $("#p-d").value.trim(), badge: $("#p-b").value.trim(), image: f ? await upload(f, "produits") : old?.image || "images/logo.jpg" };
  id ? await updateDoc(doc(db, "products", id), d) : await addDoc(collection(db, "products"), d); reset(); }, "✓ Article enregistré.");
$("#tf").onsubmit = save(async () => { const f = $("#t-f").files[0], video = f ? await upload(f, "temoignages") : $("#t-u").value.trim(); if (!video) throw { message: "Ajoutez une vidéo ou un lien." };
  await addDoc(collection(db, "testimonials"), { name: $("#t-n").value.trim(), role: $("#t-r").value.trim(), quote: $("#t-q").value.trim(), video }); }, "✓ Témoignage ajouté.");
$("#lf2").onsubmit = save(async () => addDoc(collection(db, "looks"), { image: await upload($("#l-f").files[0], "lookbook"), caption: $("#l-c").value.trim(), items: $("#l-i").value.trim() }), "✓ Photo ajoutée au lookbook.");
document.addEventListener("click", async e => { const d = e.target.dataset;
  if (d.e) { const p = P.find(x => x.id === d.e); $("#p-id").value = p.id; $("#p-n").value = p.name; $("#p-c").value = p.cat; $("#p-g").value = p.genre || ""; $("#p-u").value = p.usd; $("#p-d").value = p.desc || ""; $("#p-b").value = p.badge || ""; $("#pt").textContent = "Modifier : " + p.name; $("#pc").hidden = false; scrollTo({ top: 0, behavior: "smooth" }); }
  const del = d.d ? ["products", d.d] : d.dt ? ["testimonials", d.dt] : d.dl ? ["looks", d.dl] : null; if (del && confirm("Supprimer ?")) { await deleteDoc(doc(db, ...del)); say("Supprimé."); } });
