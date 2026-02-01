import * as XLSX from "xlsx";

export const procesarExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          reject("El archivo Excel está vacío.");
          return;
        }

        const primerFila = jsonData[0];
        let configTaller = null;

        const limpiarEdad = (texto) => {
          if (!texto) return "";
          return String(texto).replace(" años", "").replace(" en adelante", "").trim();
        };

        if (primerFila["TituloTaller"]) {
           configTaller = {
             titulo: primerFila["TituloTaller"],
             poblacion: primerFila["Poblacion"] ? primerFila["Poblacion"].toLowerCase() : "joven",
             rangoEdad: limpiarEdad(primerFila["RangoEdad"])
           };
        }

        let contadorActividades = 0;

        const apartadosFormateados = jsonData
          .filter(row => row["Tipo"]) 
          .map((row) => {
            const tipoRaw = row["Tipo"] || "Objetivo";
            const esActividad = tipoRaw.toLowerCase().includes("actividad");
            const contenidoTexto = row["Contenido"];
            const modalidad = row["Modalidad (Solo para talleres)"];
            const duracion = row["Duración (Solo para talleres)"];
            const materiales = row["Materiales (Solo para talleres)"];

            if (esActividad) {
              contadorActividades++;
              const nombreAuto = `Actividad ${contadorActividades}`;
              
              return {
                tipo: "Actividad",
                Apartado: nombreAuto,
                Contenido: [{
                  Titulo: nombreAuto,
                  Modalidad: modalidad || "Presencial",
                  Duracion: duracion || "30 min",
                  Materiales: materiales ? materiales.split(",").map(s => s.trim()) : [],
                  Pasos: contenidoTexto ? contenidoTexto.split(".").filter(Boolean) : []
                }]
              };
            } else {
              return {
                tipo: tipoRaw.charAt(0).toUpperCase() + tipoRaw.slice(1),
                Apartado: tipoRaw,
                Contenido: contenidoTexto || ""
              };
            }
          });

        resolve({ config: configTaller, apartados: apartadosFormateados });

      } catch (error) {
        console.error(error);
        reject("Error al procesar el archivo Excel. Verifica el formato.");
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

// --- NUEVA FUNCIÓN: DESCARGAR PLANTILLA ---
export const descargarPlantilla = () => {
  // 1. Definimos los encabezados y una fila de ejemplo
  const datos = [
    {
      "TituloTaller": "Ej: Taller de Ciencias",
      "Poblacion": "joven",
      "RangoEdad": "7-11",
      "Tipo": "Objetivo",
      "Contenido": "Comprender el ciclo del agua...",
      "Modalidad (Solo para talleres)": "",
      "Duración (Solo para talleres)": "",
      "Materiales (Solo para talleres)": ""
    },
    {
      "TituloTaller": "", "Poblacion": "", "RangoEdad": "", // Solo necesarios en la primera fila
      "Tipo": "Actividad",
      "Contenido": "Paso 1. Explicar. Paso 2. Dibujar.",
      "Modalidad (Solo para talleres)": "Presencial",
      "Duración (Solo para talleres)": "20 min",
      "Materiales (Solo para talleres)": "Papel, Lápiz"
    }
  ];

  // 2. Crear hoja y libro
  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla Taller");

  // 3. Descargar archivo
  XLSX.writeFile(wb, "Formato_Carga_Taller.xlsx");
};