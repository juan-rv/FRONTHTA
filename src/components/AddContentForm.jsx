import React, { useState } from "react";

export const AddContentForm = ({ onAdd, generarNombreActividad }) => {
  const tiposApartado = ["Introducción", "Objetivo", "Actividad"];
  
  const [nuevoApartado, setNuevoApartado] = useState({
    tipo: tiposApartado[0], Contenido: "",
  });

  const [nuevoActividad, setNuevoActividad] = useState({
    titulo: "", modalidad: "", duracion: "", materiales: "", pasos: "",
  });

  const handleTipoChange = (e) => {
    const tipo = e.target.value;
    setNuevoApartado({ ...nuevoApartado, tipo, Contenido: "" });
    if (tipo === "Actividad") {
      setNuevoActividad({ titulo: "", modalidad: "", duracion: "", materiales: "", pasos: "" });
    }
  };

  const handleAgregarSimple = () => {
    if (!nuevoApartado.Contenido.trim()) return alert("Ingresa contenido");
    onAdd({ 
      ...nuevoApartado, 
      Apartado: nuevoApartado.tipo 
    });
    setNuevoApartado({ ...nuevoApartado, Contenido: "" });
  };

  const handleAgregarActividad = () => {
    if (!nuevoActividad.titulo || !nuevoActividad.pasos) return alert("Llena los campos requeridos");
    
    const nuevaAct = {
      tipo: "Actividad",
      Apartado: generarNombreActividad(), 
      Contenido: [{
        Titulo: nuevoActividad.titulo, 
        Modalidad: nuevoActividad.modalidad,
        Duracion: nuevoActividad.duracion, 
        Materiales: nuevoActividad.materiales.split(","),
        Pasos: nuevoActividad.pasos.split(".").filter(Boolean)
      }]
    };

    onAdd(nuevaAct);
    setNuevoActividad({ titulo: "", modalidad: "", duracion: "", materiales: "", pasos: "" });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Agregar Contenido</h3>
      </div>
      
      <div className="form-group">
        <label>Tipo de Apartado</label>
        <select className="select-field" value={nuevoApartado.tipo} onChange={handleTipoChange}>
          {tiposApartado.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {nuevoApartado.tipo !== "Actividad" ? (
        <>
          <div className="form-group">
            <label>Contenido</label>
            <textarea 
              className="textarea-field"
              rows={6} 
              placeholder={`Escribe aquí el contenido...`}
              value={nuevoApartado.Contenido}
              onChange={e => setNuevoApartado({...nuevoApartado, Contenido: e.target.value})}
            />
          </div>
          <button onClick={handleAgregarSimple} className="btn btn-primary btn-block">
            Agregar {nuevoApartado.tipo}
          </button>
        </>
      ) : (
        <>
          <div className="form-group">
            <input className="input-field" placeholder="Título Actividad" value={nuevoActividad.titulo} onChange={e => setNuevoActividad({...nuevoActividad, titulo: e.target.value})} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input className="input-field" placeholder="Modalidad" value={nuevoActividad.modalidad} onChange={e => setNuevoActividad({...nuevoActividad, modalidad: e.target.value})} />
            <input className="input-field" placeholder="Duración" value={nuevoActividad.duracion} onChange={e => setNuevoActividad({...nuevoActividad, duracion: e.target.value})} />
          </div>
          <div className="form-group" style={{marginTop: 10}}>
             <input className="input-field" placeholder="Materiales (sep. por comas)" value={nuevoActividad.materiales} onChange={e => setNuevoActividad({...nuevoActividad, materiales: e.target.value})} />
          </div>
          <div className="form-group">
            <textarea className="textarea-field" placeholder="Pasos (punto seguido para separar)" value={nuevoActividad.pasos} onChange={e => setNuevoActividad({...nuevoActividad, pasos: e.target.value})} rows={4} />
          </div>
          <button onClick={handleAgregarActividad} className="btn btn-accent btn-block">
            Guardar Actividad
          </button>
        </>
      )}
    </div>
  );
};