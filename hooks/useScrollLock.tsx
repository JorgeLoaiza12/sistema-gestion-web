"use client";

import { useEffect, useRef } from "react";

/**
 * Hook personalizado para bloquear el scroll del body
 * @param shouldLock - Determina si el scroll debe estar bloqueado
 */
export function useScrollLock(shouldLock: boolean) {
  // Referencia para almacenar el valor original del overflow
  const originalStyleRef = useRef<string | null>(null);

  useEffect(() => {
    // No hacer nada si no hay document (en SSR)
    if (typeof document === "undefined") return;

    // Función para bloquear el scroll
    const blockScroll = () => {
      // Guardar el estilo original solo una vez
      if (originalStyleRef.current === null) {
        originalStyleRef.current = document.body.style.overflow;
      }

      // Calcular el ancho de la scrollbar para evitar saltos
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // Aplicar estilos para bloquear
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    };

    // Función para restaurar el scroll
    const allowScroll = () => {
      if (originalStyleRef.current !== null) {
        document.body.style.overflow = originalStyleRef.current;
        document.body.style.paddingRight = "0px";
        originalStyleRef.current = null;
      }
    };

    // Aplicar o restaurar según el valor de shouldLock
    if (shouldLock) {
      blockScroll();
    } else {
      allowScroll();
    }

    // Asegurar la limpieza al desmontar
    return () => {
      allowScroll();
    };
  }, [shouldLock]);
}

// Ejemplo de uso:
// const MyComponent = ({ isOpen }) => {
//   useScrollLock(isOpen);
//   return <div>...</div>;
// };
