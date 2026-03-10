'use client';
import { useState } from 'react';

export default function Home() {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">Bienvenido</h1>

        {!showMessage ? (
          <>
            <p className="text-gray-600 mb-8">
              ¿Estás listo para explorar algo increíble?
            </p>
            <button
              onClick={() => setShowMessage(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
            >
              Continuar
            </button>
          </>
        ) : (
          <div className="animate-bounce">
            <p className="text-2xl font-bold text-red-500 mb-4">¡Alto ahí!</p>
            <p className="text-gray-700 text-lg">Página en desarrollo</p>
            <p className="text-gray-700 text-lg font-bold mt-2">
              Paso Restringido
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
