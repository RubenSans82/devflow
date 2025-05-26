import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom'; // Importa BrowserRouter

// Importa Bootstrap CSS primero
import 'bootstrap/dist/css/bootstrap.min.css'; 
// Luego importa tus estilos personalizados para que puedan sobrescribir Bootstrap
import './index.css'; 
import './App.css'; // <--- Añadir esta línea

import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Importa Bootstrap JS Bundle
import 'bootstrap-icons/font/bootstrap-icons.css'; // Opcional: para iconos de Bootstrap

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Envuelve App con BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Iluminación del grid con el puntero del ratón
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    document.documentElement.style.setProperty('--mouse-x', x + 'px');
    document.documentElement.style.setProperty('--mouse-y', y + 'px');
  });
}
