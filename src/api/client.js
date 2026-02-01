const API_URL = "https://backend-1-f6e3.onrender.com";

export const api = {
  // 1. Agregamos 'options' como segundo parámetro
  evaluarApartado: async ({ apartado, poblacion, rango_edad }, options = {}) => {
    let contenidoParaEnviar = apartado.Contenido;

    if (apartado.tipo === "Actividad" && Array.isArray(apartado.Contenido)) {
      const act = apartado.Contenido[0]; 

      contenidoParaEnviar = `
        TÍTULO: ${act.Titulo}
        MODALIDAD: ${act.Modalidad}
        DURACIÓN: ${act.Duracion}
        MATERIALES: ${Array.isArray(act.Materiales) ? act.Materiales.join(", ") : act.Materiales}
        
        DESCRIPCIÓN Y PASOS:
        ${Array.isArray(act.Pasos) ? act.Pasos.join(". ") : act.Pasos}
      `.trim();
    }

    const payload = {
      poblacion: poblacion,
      rango_edad: rango_edad,
      apartado: {
        tipo: apartado.tipo,
        Apartado: apartado.Apartado, 
        Contenido: contenidoParaEnviar
      }
    };

    console.log("📤 Enviando al backend:", payload);

    // 2. Pasamos la señal (signal) al fetch
    const response = await fetch(`${API_URL}/evaluar_apartado`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: options.signal, // <--- ESTA LÍNEA ES LA MAGIA
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al evaluar el apartado");
    }

    return await response.json();
  },

  // También lo agregamos aquí por si quieres detener la síntesis final
  analizarTallerCompleto: async (payload, options = {}) => {
    console.log("🚀 Enviando paquete final al servidor:", payload);

    const response = await fetch(`${API_URL}/analizar_taller_completo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: options.signal, // <--- Agregado también aquí
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detalle || "Error generando la síntesis final");
    }

    return await response.json();
  }
};