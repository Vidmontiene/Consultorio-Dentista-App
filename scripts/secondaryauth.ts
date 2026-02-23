import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig } from "@/firebaseConfig";

const secondaryApp =
  getApps().find(app => app.name === "Secondary") ??
  initializeApp(firebaseConfig, "Secondary");

export const secondaryAuth = initializeAuth(secondaryApp, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
