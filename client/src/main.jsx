// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/styles/globals.css';
import { useAuthStore } from "@/store/authStore.js";

(async () => {
  // ถ้าต้อง hydrate token/user ก่อน จะทำให้เมนู/Sidebar ตรงตั้งแต่เฟรมแรก
  try {
    await useAuthStore.getState().hydrateFromServer();
  } catch (e) {
    // กันพังเงียบ ๆ ระหว่าง dev
    console.error("hydrateFromServer failed:", e);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();
