import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2deqyC03yg8TcTvoyQhyiZfgqZiUCf_4",
  authDomain: "robotrack-65443.firebaseapp.com",
  projectId: "robotrack-65443",
  storageBucket: "robotrack-65443.firebasestorage.app",
  messagingSenderId: "833699374480",
  appId: "1:833699374480:web:6d3282bca6e0e596ba7f15",
  measurementId: "G-04BN0E04FD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);