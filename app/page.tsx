// app/page.tsx
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold text-content-emphasis">Bienvenido</h1>
      <p className="text-content-subtle mt-4">
        Esta es la página de inicio de tu aplicación.
      </p>
    </div>
  );
}
