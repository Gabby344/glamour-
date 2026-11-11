// Configuration Firebase + données par défaut de la boutique Glamour Production
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const ADMIN_EMAIL = "kabeluabigaelle@gmail.com"; // même adresse que dans firestore.rules
const firebaseConfig = {
  apiKey: "AIzaSyCmOpeuVKaK12vc1-RJxi7Tt9w1f5IY3lQ", authDomain: "glamour-771cc.firebaseapp.com",
  projectId: "glamour-771cc", storageBucket: "glamour-771cc.firebasestorage.app",
  messagingSenderId: "561249826869", appId: "1:561249826869:web:575fd51a8873b5fe75597c"
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

export const CATS = ["Coussins de voyage","Bouillottes","Porte-clés","Gants","Mini miroirs","Bando et filet","Parfums et brumes","Lunettes","Leopard Logo","Bracelets","Bijoux et chaînettes","Taille cheveux","Cardigans","Écharpes mixtes","SHEIN BY GLAMOUR"];
export const CITIES = ["Kolwezi","Kinshasa","Fungurume","Likasi","Lubumbashi"];
// Taux et numéro WhatsApp de départ (modifiables ensuite dans l'admin)
export const DEFAULTS = { rates: { USD: 1, CDF: 2800, ZMW: 25, whatsapp: "" } };
// Articles d'exemple créés automatiquement au premier lancement de l'admin
export const SEED = CATS.slice(0, 10).map((c, i) => ({ name: c.replace(/s$/, "") + " Glamour", cat: c, usd: [12, 10, 3, 6, 4, 5, 15, 9, 8, 4][i], desc: "Article d'exemple à modifier depuis l'administration.", image: "images/logo.jpg", badge: i < 3 ? "Nouveau" : "" }));
