// Administration : connexion, INITIALISATION AUTOMATIQUE de la base, articles et taux
import { auth, db, ADMIN_EMAIL, CATS, DEFAULTS, SEED } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $ = s => document.querySelector(s), esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const say = (t, ms = 3500) => { const m = $("#msg"); m.textContent = t; m.hidden = false; setTimeout(() => m.hidden = true, ms); };
$("#p-c").innerHTML = CATS.map(c => `<option>${c}</option>`).join(""); let P = [], img = "";

onAuthStateChanged(auth, async u => {
  const ok = u && u.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (u && !ok) { say("Ce compte n’est pas administrateur."); return signOut(auth); }
  $("#login").hidden = !!ok; $("#app").hidden = !ok; $("#out").hidden = !ok; if (!ok) return;
  try { // Initialisation automatique au premier lancement
    if (!(await getDoc(doc(db, "settings", "rates"))).exists()) {
      const b = writeBatch(db); b.set(doc(db, "settings", "rates"), DEFAULTS.rates);
      SEED.forEach(p => b.set(doc(collection(db, "products")), p)); await b.commit(); say("✓ Base initialisée : taux et articles d’exemple créés.", 6000);
    }
  } catch (e) { say("Initialisation impossible : " + (e.code || e.message), 8000); }
  onSnapshot(doc(db, "settings", "rates"), s => { const r = s.data() || DEFAULTS.rates; $("#r-cdf").value = r.CDF; $("#r-zmw").value = r.ZMW; $("#r-wa").value = r.whatsapp || ""; });
  onSnapshot(collection(db, "products"), s => { P = s.docs.map(d => ({ id: d.id, ...d.data() })); $("#list").innerHTML = P.map(p => `<div class="row"><img src="${esc(p.image)}" alt=""><span>${esc(p.name)}<br><small>${esc(p.cat)} · $${p.usd}</small></span><button class="btn sm" data-e="${p.id}">Modifier</button><button class="btn sm" style="background:var(--r);color:#fff" data-d="${p.id}">Supprimer</button></div>`).join(""); });
});
$("#lf").onsubmit = async e => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, $("#em").value.trim(), $("#pw").value); } catch { say("E-mail ou mot de passe incorrect."); } };
$("#out").onclick = () => signOut(auth);
$("#rf").onsubmit = async e => { e.preventDefault(); try { await setDoc(doc(db, "settings", "rates"), { USD: 1, CDF: +$("#r-cdf").value, ZMW: +$("#r-zmw").value, whatsapp: $("#r-wa").value.replace(/\D/g, "") }); say("✓ Taux enregistrés."); } catch (x) { say("Échec : " + x.code); } };
// Photo réduite sur le téléphone puis stockée dans Firestore (pas besoin de Storage)
$("#p-f").onchange = e => { const f = e.target.files[0]; if (!f) return; const i = new Image(); i.onload = () => { const k = Math.min(1, 800 / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); img = c.toDataURL("image/jpeg", .72); say("Photo prête ✓"); }; i.src = URL.createObjectURL(f); };
const reset = () => { $("#pf").reset(); $("#p-id").value = img = ""; $("#pt").textContent = "Ajouter un article"; $("#pc").hidden = true; };
$("#pc").onclick = reset;
$("#pf").onsubmit = async e => { e.preventDefault(); const id = $("#p-id").value, old = P.find(p => p.id === id);
  const d = { name: $("#p-n").value.trim(), cat: $("#p-c").value, usd: +$("#p-u").value, desc: $("#p-d").value.trim(), badge: $("#p-b").value.trim(), image: img || old?.image || "images/logo.jpg" };
  try { id ? await updateDoc(doc(db, "products", id), d) : await addDoc(collection(db, "products"), d); say("✓ Article enregistré."); reset(); } catch (x) { say("Échec : " + (x.code || x.message), 7000); } };
$("#list").onclick = async e => { const ed = e.target.dataset.e, de = e.target.dataset.d;
  if (ed) { const p = P.find(x => x.id === ed); $("#p-id").value = ed; $("#p-n").value = p.name; $("#p-c").value = p.cat; $("#p-u").value = p.usd; $("#p-d").value = p.desc || ""; $("#p-b").value = p.badge || ""; $("#pt").textContent = "Modifier : " + p.name; $("#pc").hidden = false; scrollTo({ top: $("#pf").offsetTop - 80, behavior: "smooth" }); }
  if (de && confirm("Supprimer cet article ?")) { await deleteDoc(doc(db, "products", de)); say("Article supprimé."); } };
