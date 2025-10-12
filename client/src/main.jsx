import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/styles/globals.css';
import { useAuthStore } from "@/store/authStore.js";

  await useAuthStore.getState().hydrateFromServer();

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
