import React, { useRef } from "react";
import { cargarOpcionesRango, formatearRango } from "../utils/helpers";

export const TallerConfig = ({ servicio, setServicio, setAnalisisFinalIA, onExport, onImport }) => {
  const fileInputRef = useRef(null);

  const handlePoblacionChange = (e) => {
    setServicio({ ...servicio, poblacion: e.target.value, rangoEdad: "" });
    setAnalisisFinalIA(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await onImport(file);
      e.target.value = null; // Resetear input
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>⚙️ Configuración</h3>
        
        {/* AQUÍ ESTÁN LOS BOTONES DE EXCEL/JSON */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={onExport} 
            className="btn btn-sm btn-secondary"
            title="Guardar Taller"
          >
            💾 Guardar
          </button>
          <button 
            onClick={() => fileInputRef.current.click()} 
            className="btn btn-sm btn-secondary"
            title="Cargar Taller"
          >
            📂 Cargar
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            accept=".json, .xlsx, .xls" 
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Título del Taller</label>
        <input 
          className="input-field"
          value={servicio.titulo} 
          onChange={(e) => setServicio({ ...servicio, titulo: e.target.value })} 
          placeholder="Ej: Taller de Dinosaurios"
        />
      </div>
      
      <div className="form-group">
        <label>Población Objetivo</label>
        <select className="select-field" value={servicio.poblacion} onChange={handlePoblacionChange}>
          <option value="joven">Joven (Escolar)</option>
          <option value="adulta">Adulta</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Rango de Edad / Etapa</label>
        <select 
          className="select-field" 
          value={servicio.rangoEdad} 
          onChange={(e) => setServicio({ ...servicio, rangoEdad: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {cargarOpcionesRango(servicio.poblacion).map(r => (
            <option key={r} value={r}>{formatearRango(r)}</option>
          ))}
        </select>
      </div>
    </div>
  );
};