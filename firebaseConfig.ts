import { getApp, getApps, initializeApp } from "firebase/app"; 
import { initializeAuth, Auth, getReactNativePersistence } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; 
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

declare global { var _firebaseAuth: Auth | undefined; } 

// Cria o app uma vez 
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : 
getApp(); 

let autenticacao: Auth; 

if (!globalThis._firebaseAuth) { 
  globalThis._firebaseAuth = initializeAuth(app, { persistence: getReactNativePersistence(ReactNativeAsyncStorage), }); 
} autenticacao = globalThis._firebaseAuth; 

export { autenticacao }; 
export const db = getFirestore(app); 
export default app;