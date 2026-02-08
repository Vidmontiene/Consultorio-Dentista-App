import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "@/firebaseConfig";

const secondaryApp =
  getApps().find(app => app.name === "Secondary") ||
  initializeApp(firebaseConfig, "Secondary");

export const secondaryAuth = getAuth(secondaryApp);
