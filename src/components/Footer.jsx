// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="text-center p-3 mt-auto"> {/* Clases de Bootstrap actualizadas */}
      <p className="mb-0">&copy; {new Date().getFullYear()} DevFlow. Todos los derechos reservados.</p>
    </footer>
  );
};

export default Footer;
