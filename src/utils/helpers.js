// src/utils/helpers.js

export const formatearTexto = (texto) => {
  if (!texto) return "";
  return texto.replace(/_/g, " ");
};

export const formatearRango = (rango) => {
  const formatos = {
    '2-7': '2-7 años (Preoperacional)',
    '7-11': '7-11 años (Operaciones concretas)',
    '11-12_en_adelante': '11-12 años en adelante (Operaciones formales)',
    '19-29': '19-29 años (Objetiva)',
    '30-40': '30-40 años (Ejecutiva)',
    '39-61': '39-61 años (Responsabilidad)',
    '61_en_adelante': '61 años en adelante (Reorganizadora)'
  };
  return formatos[rango] || rango;
};

export const cargarOpcionesRango = (poblacion) => {
  if (poblacion === "joven") return ['2-7', '7-11', '11-12_en_adelante'];
  if (poblacion === "adulta") return ['19-29', '30-40', '39-61', '61_en_adelante'];
  return [];
};