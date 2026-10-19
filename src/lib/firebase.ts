import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache } from 'firebase/firestore'

const env = import.meta.env

// Firebase web config is public by design (access is enforced by firestore.rules); env vars can override it.
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBGcYEsqZrEFoaquuUUdUCmJI6Q1rsTOaI',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'streakboard-de8fa.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'streakboard-de8fa',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'streakboard-de8fa.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '212838972432',
  appId: env.VITE_FIREBASE_APP_ID || '1:212838972432:web:0ef81d122063dc19fc5e95',
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId)

const app = initializeApp(config)

export const auth = getAuth(app)
// Offline cache so the app opens instantly on the phone and syncs when back online.
export const db = initializeFirestore(app, { localCache: persistentLocalCache() })

if (env.VITE_USE_EMULATORS === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
