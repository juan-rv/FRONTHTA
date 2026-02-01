import React, { useState } from "react";
import { IntroResults } from "./IntroResults";
import { formatearTexto } from "../utils/helpers";

export const ApartadoItem = ({ 
  apartado, 
  index, 
  evaluacion, 
  onEvaluar, 
  onBorrar, 
  cargando, 
  esSeleccionado 
}) => {
  const [expandido, setExpandido] = useState(false);

  const getScoreClass = (cal) => {
    if (cal >= 4) return "score-high";
    if (cal >= 3) return "score-mid";
    return "score-low";
  };

  return (
    <div className={`card apartado-item apartado-tipo-${apartado.tipo}`}>
      <div className="apartado-header">
        <h4>{apartado.Apartado} <small style={{ color: "var(--text-muted)", fontWeight: "normal" }}>({apartado.tipo})</small></h4>
        <div style={{ display: "flex", gap: "5px" }}>
          <button 
            onClick={() => onEvaluar(apartado)}
            disabled={cargando && esSeleccionado}
            className="btn btn-sm btn-primary"
          >
            {cargando && esSeleccionado ? <span className="loader"></span> : "Evaluar"}
          </button>
          <button onClick={() => onBorrar(index)} className="btn btn-sm btn-danger">X</button>
        </div>
      </div>

      {cargando && esSeleccionado && (
        <div style={{ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: 10, textAlign: "center" }}>
           ⏳ Conectando con IA...
        </div>
      )}

      {/* Contenido */}
      <div className="apartado-content">
        {typeof apartado.Contenido === "string" ? apartado.Contenido : (
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {apartado.Contenido.map((act, i) => (
              <li key={i}><strong>{act.Titulo}</strong>: {act.Pasos.join(". ")}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Resultados */}
      {evaluacion && (
        <div className="result-box">
          {apartado.tipo === "Introducción" ? (
            <IntroResults data={evaluacion} />
          ) : (
            <div>
              <div className="result-header" onClick={() => setExpandido(!expandido)}>
                <span>
                  Resultados (Nota: <span className={getScoreClass(evaluacion.estadisticas?.promedio)}>
                    {evaluacion.estadisticas?.promedio}/5
                  </span>)
                </span>
                <span>{expandido ? "▼" : "▶"}</span>
              </div>

              {expandido && (
                <div className="result-body">
                  {evaluacion.feedback_global && (
                    <div className="feedback-alert">
                      <strong>Consultor Pedagógico: </strong> 
                      {evaluacion.feedback_global.comentario_general}
                    </div>
                  )}

                  {evaluacion.evaluaciones?.map((ev, i) => (
                    <div key={i} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 10 }}>
                      <div className="indicador-row">
                        <span>{formatearTexto(ev.indicador)}</span>
                        <span className={getScoreClass(ev.calificacion)}>{ev.calificacion}/5</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.9em", color: "#475569" }}>{ev.analisis.razonamiento}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};