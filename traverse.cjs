const fs = require("fs");
const path = require("path");

const outputFile = "output.txt"; // Archivo de salida
const scriptName = path.basename(__filename); // Nombre del script actual

// Arreglo de archivos y extensiones a excluir
const excludedExtensions = [".ico", ".d.ts"];
const excludedFiles = ["package.json", "package-lock.json"];

// Extensiones a incluir explícitamente
const includedExtensions = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".html",
  ".css",
];

// Directorios a excluir
const excludedDirectories = ["node_modules", ".next", "dist", "build"];

// Función recursiva para recorrer directorios
const traverseDirectory = (dir) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    // Omitir el script, archivo de salida y archivos específicos
    if (
      file === scriptName ||
      file === path.basename(outputFile) ||
      excludedFiles.includes(file)
    ) {
      return;
    }

    // Omitir directorios excluidos
    if (stats.isDirectory() && excludedDirectories.includes(file)) {
      return;
    }

    if (stats.isDirectory()) {
      traverseDirectory(filePath); // Recursión para directorios
    } else if (stats.isFile()) {
      // Verificar si la extensión está permitida
      const fileExtension = path.extname(file);
      if (excludedExtensions.includes(fileExtension)) {
        return; // Omitir archivos con extensiones excluidas
      }

      if (!includedExtensions.includes(fileExtension)) {
        return; // Omitir archivos con extensiones no listadas
      }

      try {
        // Escribir la ruta del archivo en el archivo de salida
        fs.appendFileSync(outputFile, `\nRuta: ${filePath}\n`, "utf8");

        // Leer y escribir el contenido del archivo
        const content = fs.readFileSync(filePath, "utf8");
        fs.appendFileSync(outputFile, `${content}\n`, "utf8");
      } catch (err) {
        console.error(`Error leyendo el archivo ${filePath}:`, err.message);
      }
    }
  });
};

// Limpiar o crear el archivo de salida
fs.writeFileSync(outputFile, "", "utf8");

// Llamar a la función con el directorio inicial
const directoryToScan = "./"; // Cambia esta ruta según sea necesario
traverseDirectory(directoryToScan);

console.log(`El contenido se ha guardado en ${outputFile}`);
