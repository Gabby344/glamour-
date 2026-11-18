// Configuration Firebase + données par défaut de Glamour Production (V2)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

export const ADMIN_EMAIL = "kabeluabigaelle@gmail.com"; // même adresse que dans firestore.rules et storage.rules
const firebaseConfig = {
  apiKey: "AIzaSyCmOpeuVKaK12vc1-RJxi7Tt9w1f5IY3lQ", authDomain: "glamour-771cc.firebaseapp.com",
  projectId: "glamour-771cc", storageBucket: "glamour-771cc.firebasestorage.app",
  messagingSenderId: "561249826869", appId: "1:561249826869:web:575fd51a8873b5fe75597c"
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const storage = getStorage(app);

// Catégories structurées : groupe -> collections
export const GROUPS = {
  "Vêtements Homme & Femme": ["Cardigans", "Écharpes mixtes"],
  "Accessoires": ["Coussins de voyage", "Bouillottes", "Porte-clés", "Gants", "Mini miroirs", "Bando et filet", "Parfums et brumes", "Lunettes", "Leopard Logo", "Bracelets", "Bijoux et chaînettes", "Taille cheveux"],
  "SHEIN BY GLAMOUR": ["SHEIN BY GLAMOUR"]
};
export const GROUP_OF = Object.fromEntries(Object.entries(GROUPS).flatMap(([g, l]) => l.map(c => [c, g])));
export const CATS = Object.values(GROUPS).flat();
export const CITIES = ["Kolwezi", "Kinshasa", "Fungurume", "Likasi", "Lubumbashi"];
export const BULK_MIN = 3; // vente en gros à partir de 3 pièces
export const DEFAULTS = { rates: { USD: 1, CDF: 2800, ZMW: 25, whatsapp: "" } }; // à modifier dans l'admin
// Articles d'exemple créés automatiquement au premier lancement de l'admin
export const SEED = [["Cardigans", 18, "Femme"], ["Cardigans", 18, "Homme"], ["Écharpes mixtes", 7, "Mixte"], ["Coussins de voyage", 12], ["Bouillottes", 10], ["Porte-clés", 3], ["Parfums et brumes", 15], ["Bracelets", 5], ["Bijoux et chaînettes", 8], ["SHEIN BY GLAMOUR", 20, "Mixte"]]
  .map(([cat, usd, genre = ""], i) => ({ name: cat.replace(/s$/, "") + " Glamour " + (i + 1), cat, genre, usd, desc: "Article d'exemple à modifier depuis l'administration.", image: "images/logo.jpg", badge: i < 3 ? "Nouveau" : "" }));

/** Envoie un fichier sur Firebase Storage. Pour une image, repli en base64 si Storage n'est pas disponible. */
export async function upload(file, folder) {
  try { const r = ref(storage, `${folder}/${Date.now()}_${file.name.replace(/[^\w.]/g, "_")}`); await uploadBytes(r, file); return await getDownloadURL(r); }
  catch (e) {
    if (!file.type.startsWith("image/")) throw e;
    return new Promise(res => { const i = new Image(); i.onload = () => { const k = Math.min(1, 800 / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .72)); }; i.src = URL.createObjectURL(file); });
  }
}
