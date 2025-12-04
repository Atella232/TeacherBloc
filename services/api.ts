import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, query, where, getDocs, 
  updateDoc, deleteDoc, doc, Timestamp, orderBy 
} from "firebase/firestore";
import { CURRENT_USER_ID, firebaseConfig as staticConfig } from "../config/userConfig";
import { Student, Intervention, Resource, QuickNote, CalendarEvent, ClassGroup, Grade, FollowUpNote } from "../types";

// --- MOCK DATA GENERATOR ---
const getMockId = () => Math.random().toString(36).substr(2, 9);
const MOCK_STORAGE_KEY = "teacher_mate_db";
const DYNAMIC_CONFIG_KEY = "teacher_mate_firebase_config";

const getLocalDB = () => {
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  
  const initial = {
    classes: [
      { id: "c1", ownerId: CURRENT_USER_ID, name: "3º ESO B", subject: "Tutoría", createdAt: Date.now() },
      { id: "c2", ownerId: CURRENT_USER_ID, name: "4º ESO A", subject: "Matemáticas", createdAt: Date.now() }
    ],
    students: [
      { id: "s1", ownerId: CURRENT_USER_ID, firstName: "Alex", lastName: "García", groups: ["c1"], specialNeeds: ["TDAH"], contactInfo: "madre@test.com", createdAt: Date.now() },
      { id: "s2", ownerId: CURRENT_USER_ID, firstName: "María", lastName: "Lopez", groups: ["c1", "c2"], specialNeeds: [], contactInfo: "600123456", createdAt: Date.now() }
    ],
    grades: [
      { id: "g1", ownerId: CURRENT_USER_ID, studentId: "s2", classGroupId: "c2", title: "Examen T1", grade: 8.5, type: 'exam', date: Date.now() }
    ],
    follow_up_notes: [
      { id: "f1", ownerId: CURRENT_USER_ID, studentId: "s1", title: "Reunión con padres", content: "Se ha acordado revisar la agenda diariamente. La madre comenta que en casa está más tranquilo.", date: Date.now() - 100000000 }
    ],
    interventions: [
      { id: "i1", ownerId: CURRENT_USER_ID, studentId: "s1", studentName: "Alex García", type: "Conducta", description: "Interrupción constante en clase de Mates.", date: Date.now(), status: "pendiente" },
      { id: "i2", ownerId: CURRENT_USER_ID, studentId: "s2", studentName: "María Lopez", type: "Positivo", description: "Gran mejora en el examen de Historia.", date: Date.now() - 86400000, status: "resuelto" }
    ],
    resources: [
      { id: "r1", ownerId: CURRENT_USER_ID, title: "Exámenes Past Years", url: "https://google.com", category: "Matemáticas", tags: ["PDF", "Examen"], isFavorite: true }
    ],
    quick_notes: [
      { id: "n1", ownerId: CURRENT_USER_ID, content: "Reunión evaluación martes 15:00", color: "#fef3c7", isArchived: false, createdAt: Date.now() }
    ],
    events: [
      { id: "e1", ownerId: CURRENT_USER_ID, title: "Claustro Profesores", date: Date.now(), type: 'meeting' }
    ]
  };
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initial));
  return initial;
};

const saveLocalDB = (db: any) => localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));

// --- INITIALIZATION LOGIC ---

// 1. Check for Dynamic Config (pasted by user in Settings)
const getDynamicConfig = () => {
  try {
    const stored = localStorage.getItem(DYNAMIC_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

// 2. Determine Active Config
const dynamicConfig = getDynamicConfig();
// We consider the static config valid if the user has replaced the placeholder
const isStaticConfigValid = staticConfig.apiKey !== "YOUR_API_KEY";

const activeConfig = dynamicConfig || (isStaticConfigValid ? staticConfig : null);

let db: any;
let isUsingFirebase = false;

if (activeConfig) {
  try {
    const app = initializeApp(activeConfig);
    db = getFirestore(app);
    isUsingFirebase = true;
    console.log("TeacherMate: Connected to Firebase");
  } catch (error) {
    console.error("TeacherMate: Firebase initialization error", error);
    // Fallback to mock not implemented strictly to avoid partial state, 
    // but db will be undefined so it flows to else block below usually
  }
}

export const getApiStatus = () => isUsingFirebase ? 'connected' : 'mock';

// Helper to simulate async delay for mock
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  // Generic GET
  async getItems<T>(collectionName: string): Promise<T[]> {
    if (isUsingFirebase && db) {
      try {
        const q = query(collection(db, collectionName), where("ownerId", "==", CURRENT_USER_ID));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      } catch (e) {
        console.error("Firestore Error", e);
        return [];
      }
    } else {
      await delay(300);
      const local = getLocalDB();
      return (local[collectionName] || []).filter((item: any) => item.ownerId === CURRENT_USER_ID);
    }
  },

  // Generic ADD
  async addItem<T>(collectionName: string, data: Omit<T, "id" | "ownerId">): Promise<T> {
    const itemToSave = { ...data, ownerId: CURRENT_USER_ID };
    
    if (isUsingFirebase && db) {
      const docRef = await addDoc(collection(db, collectionName), itemToSave);
      return { id: docRef.id, ...itemToSave } as T;
    } else {
      await delay(300);
      const local = getLocalDB();
      const newItem = { id: getMockId(), ...itemToSave };
      if (!local[collectionName]) local[collectionName] = [];
      local[collectionName].push(newItem);
      saveLocalDB(local);
      return newItem as T;
    }
  },

  // Generic UPDATE
  async updateItem<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    if (isUsingFirebase && db) {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data as any);
    } else {
      await delay(200);
      const local = getLocalDB();
      if (!local[collectionName]) return;
      const index = local[collectionName].findIndex((i: any) => i.id === id);
      if (index !== -1) {
        local[collectionName][index] = { ...local[collectionName][index], ...data };
        saveLocalDB(local);
      }
    }
  },

  // Generic DELETE
  async deleteItem(collectionName: string, id: string): Promise<void> {
    if (isUsingFirebase && db) {
      await deleteDoc(doc(db, collectionName, id));
    } else {
      await delay(200);
      const local = getLocalDB();
      if (!local[collectionName]) return;
      local[collectionName] = local[collectionName].filter((i: any) => i.id !== id);
      saveLocalDB(local);
    }
  }
};
