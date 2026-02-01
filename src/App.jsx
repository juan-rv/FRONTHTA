import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { api } from "./api/client";
import "./App.css";
import { procesarExcel, descargarPlantilla } from "./utils/excelHelpers";


const formatearTexto = (texto) => {
  if (!texto) return "";
  return texto.replace(/_/g, " ");
};

const cargarOpcionesRango = (poblacion) => {
  if (poblacion === "joven") return ['2-7', '7-11', '11-12_en_adelante'];
  if (poblacion === "adulta") return ['19-29', '30-40', '39-61', '61_en_adelante'];
  return [];
};

const formatearRango = (rango) => {
  const formatos = {
    '2-7': '2-7 años (Preoperacional)', '7-11': '7-11 años (Operaciones concretas)',
    '11-12_en_adelante': '11-12 años en adelante (Operaciones formales)', '19-29': '19-29 años (Objetiva)',
    '30-40': '30-40 años (Ejecutiva)', '39-61': '39-61 años (Responsabilidad)',
    '61_en_adelante': '61 años en adelante (Reorganizadora)'
  };
  return formatos[rango] || rango;
};

const exportarTallerAJSON = (servicio, evaluaciones) => {
  const data = { servicio, evaluaciones, fecha: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href; link.download = `taller_respaldo.json`;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const importarTallerDesdeJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target.result)); } catch (err) { reject("JSON inválido"); }
    };
    reader.readAsText(file);
  });
};

// ==========================================
// 2. SUB-COMPONENTES
// ==========================================

const IntroResults = ({ data }) => {
  if (!data) return null;

  // Buscamos en todas las llaves posibles según el modo (Coordinador o Auditor)
  const contenidoAnalisis = 
    data.analisis_final?.sintesis_ejecutiva || // Ruta del Auditor (Informe Final)
    data.sintesis_ejecutiva ||                 // Ruta directa del Auditor
    data.analisis_disciplinar ||              // Ruta del Coordinador (Individual)
    data.comentario_general ||                // Ruta de emergencia
    data.valoracion;                          // Ruta base

  return (
    <div style={{ padding: "15px", backgroundColor: "#fcfcfc8b", borderRadius: "8px", border: "1px solid #eee" }}>
      <div style={{ marginBottom: "20px" }}>
        <h5 style={{ margin: "0 0 10px 0", color: "#000000", fontSize: "1.1rem" }}>
          Análisis de la Introducción
        </h5>
        <p style={{ 
          margin: 0, 
          lineHeight: "1.6", 
          textAlign: "justify", 
          color: "#333",
          whiteSpace: "pre-wrap" // Mantiene párrafos si el texto es largo
        }}>
          {contenidoAnalisis ? contenidoAnalisis.replace(/_/g, " ") : "Generando respuesta detallada..."}
        </p>
      </div>

      {/* Frases clave - También con búsqueda flexible */}
      {(data.frases_discurso || data.analisis_final?.frases_discurso)?.length > 0 && (
        <div style={{ background: "#f0f7ff5f", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #000c92" }}>
          <h5 style={{ margin: "0 0 10px 0", fontSize: "1rem", color: "#030516" }}>
            Ideas Clave para el Discurso
          </h5>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#000000" }}>
            {(data.frases_discurso || data.analisis_final?.frases_discurso).map((frase, i) => (
              <li key={i} style={{ marginBottom: "5px" }}>{frase}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


const FinalReport = ({ analisis, titulo }) => {
  // 1. Verificación ultra-segura
  if (!analisis || typeof analisis !== 'object') return null;


  const final = analisis.analisis_final || {};
  const metricas = analisis.metricas_consolidadas || {};

  return (
    <div className="card fade-in" style={{ border: "2px solid #0056b3", marginBottom: "30px", backgroundColor: "#fff" }}>
      <div style={{ borderBottom: "2px solid #eee", paddingBottom: 20, marginBottom: 20 }}>
        <h2 style={{ color: "#000000", margin: "0 0 10px 0" }}>
           Informe: {titulo || "Servicio Educativo"}
        </h2>
        
        <div style={{ backgroundColor: "#f0f7ff", padding: "15px", borderRadius: "8px" }}>
          <strong>Resumen Ejecutivo:</strong>
          <p>{final.sintesis_ejecutiva || final.sintesis_general || "Procesando síntesis..."}</p>
        </div>
      </div>


      {final.ruta_de_accion?.length > 0 && (
        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
          <h4 style={{ color: "#1e293b", marginTop: 0 }}>🚀 Ruta de Mejora Recomendada</h4>
          {final.ruta_de_accion.map((step, i) => (
            <div key={i} style={{ marginBottom: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>
              <strong>{i + 1}. {step.estrategia}</strong>: {step.implementacion}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: "0.9rem", color: "#666" }}>{metricas.estado || ""}</div>

      <div style={{ marginTop: 25, textAlign: "right", borderTop: "1px solid #eee", paddingTop: 10 }}>
        <span style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#020406" }}>
          Nota Final: {metricas.promedio || "N/A"}/5.0
        </span>
        
      </div>
    </div>
  );
};


const TallerConfig = ({ servicio, setServicio, setAnalisisFinalIA, onDescargarInforme, analisisFinalIA }) => {
  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>EVALUACIÓN</h3>
        

        <button 
          onClick={onDescargarInforme} 
          disabled={!analisisFinalIA}
          className="btn btn-sm btn-primary"
          title={!analisisFinalIA ? "Debes generar la Síntesis Final primero" : "Descargar Informe PDF"}
        >
          {!analisisFinalIA ? "🔒 Termina el análisis para descargar" : "📄 Descargar Evaluación"}
        </button>
      </div>

      <div className="form-group">
        <label>Título del taller</label>
        <input className="input-field" value={servicio.titulo} onChange={e => setServicio({ ...servicio, titulo: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Población Objetivo</label>
        <select className="select-field" value={servicio.poblacion} onChange={e => { setServicio({ ...servicio, poblacion: e.target.value, rangoEdad: "" }); setAnalisisFinalIA(null); }}>
          <option value="joven">Joven</option>
          <option value="adulta">Adulta</option>
        </select>
      </div>
      <div className="form-group">
        <label>Rango de edades</label>
        <select className="select-field" value={servicio.rangoEdad} onChange={e => setServicio({ ...servicio, rangoEdad: e.target.value })}>
          <option value="">Seleccionar...</option>
          {cargarOpcionesRango(servicio.poblacion).map(r => <option key={r} value={r}>{formatearRango(r)}</option>)}
        </select>
      </div>
    </div>
  );
};


const AddContentForm = ({ onAdd, apartadosExistentes, rangoEdad }) => {
  const todasLasOpciones = ["Introducción", "Objetivo", "Actividad"];

  const opcionesDisponibles = todasLasOpciones.filter(op => {
    if (op === "Actividad") return true;
    return !apartadosExistentes.some(ap => ap.tipo === op);
  });

  const [tipo, setTipo] = useState(opcionesDisponibles[0] || "");
  const [contenido, setContenido] = useState("");
  
  const [act, setAct] = useState({ 
    titulo: "", mod: "Presencial", dur: "", mat: "", pasos: "" 
  });

  React.useEffect(() => {
    if (!opcionesDisponibles.includes(tipo)) {
      setTipo(opcionesDisponibles[0] || "");
    }
  }, [apartadosExistentes, tipo, opcionesDisponibles]);

  const agregar = () => {
    if (!rangoEdad) {
      alert("⚠️ ¡Falta un paso!\n\nPor favor selecciona el 'Rango de edades' en el panel de Configuración (arriba) antes de agregar contenido.");
      return; 
    }

    if (!tipo) return; 

    if (tipo !== "Actividad") {
      if (!contenido) return alert("Por favor escribe el contenido.");
      onAdd({ tipo, Apartado: tipo, Contenido: contenido });
      setContenido("");
    } else {
      if (!act.titulo || !act.pasos) return alert("El título y los pasos son obligatorios.");
      onAdd({
        tipo: "Actividad", 
        Apartado: act.titulo, 
        Contenido: [{
          Titulo: act.titulo, 
          Modalidad: act.mod, 
          Duracion: act.dur || "N/A",
          Materiales: act.mat ? act.mat.split(",") : [], 
          Pasos: act.pasos.split(".")
        }]
      });
      setAct({ titulo: "", mod: "Presencial", dur: "", mat: "", pasos: "" });
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Apartados del taller</h3>
      </div>
      
      <div className="form-body">
        <div className="form-group">
          <label>Escoja un apartado a evaluar</label>
          <select className="select-field" value={tipo} onChange={e => setTipo(e.target.value)}>
            {opcionesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {tipo !== "Actividad" ? (
          <div className="form-group fade-in">
            <label>Contenido del apartado</label>
            <textarea 
              className="textarea-field" 
              rows={4} 
              value={contenido} 
              onChange={e => setContenido(e.target.value)} 
              placeholder={`Escribe el ${tipo ? tipo.toLowerCase() : 'contenido'} aquí...`} 
            />
          </div>
        ) : (
          <div className="activity-fields fade-in">
            <div className="form-group">
              <label>Título de la Actividad</label>
              <input className="input-field" placeholder="Ej: Lluvia de Ideas" value={act.titulo} onChange={e => setAct({...act, titulo: e.target.value})} />
            </div>
            <div className="form-row"> 
               <div className="form-group"><label>Modalidad</label><select className="select-field" value={act.mod} onChange={e => setAct({...act, mod: e.target.value})}><option value="Presencial">Presencial</option><option value="Virtual">Virtual</option><option value="Híbrida">Híbrida</option></select></div>
              <div className="form-group">
  <label>Duración (minutos)</label>
  <input 
    type="text" // Usamos text para tener control total de la validación
    inputMode="numeric" // Sugiere teclado numérico en móviles
    className="input-field" 
    placeholder="Ej: 30" 
    value={act.dur} 
    onKeyDown={(e) => {
      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab') {
        e.preventDefault();
      }
    }}

    onChange={e => {
      const val = e.target.value.replace(/\D/g, ""); 
      setAct({...act, dur: val});
    }} 
  />
</div>
            </div>
            <div className="form-group"><label>Materiales</label><input className="input-field" value={act.mat} onChange={e => setAct({...act, mat: e.target.value})} /></div>
            <div className="form-group"><label>Pasos</label><textarea className="textarea-field" rows={3} value={act.pasos} onChange={e => setAct({...act, pasos: e.target.value})} /></div>
          </div>
        )}

        <button onClick={agregar} className="btn btn-primary btn-block">
          ➕ Agregar al Listado
        </button>
      </div>
    </div>
  );
};

const IndicadorItem = ({ ev }) => {
  const [abierto, setAbierto] = useState(false);
  
  const getScoreClass = (c) => c >= 4 ? "score-high" : c >= 3 ? "score-mid" : "score-low";

  // --- FUNCIÓN PARA RENDERIZAR EL CONTENIDO DINÁMICAMENTE ---
  const renderContenido = () => {
    if (!ev.analisis) return "Sin análisis detallado.";

    // CASO A: Es texto simple (String)
    if (typeof ev.analisis === 'string') {
      return <p style={{ margin: 0 }}>{formatearTexto(ev.analisis)}</p>;
    }

    // CASO B: Es un OBJETO (El caso que te está dando problemas)
    if (typeof ev.analisis === 'object') {
      // Si solo tiene "razonamiento", lo mostramos simple
      if (ev.analisis.razonamiento && Object.keys(ev.analisis).length === 1) {
         return <p style={{ margin: 0 }}>{formatearTexto(ev.analisis.razonamiento)}</p>;
      }

      return Object.entries(ev.analisis).map(([clave, valor], i) => (
        <div key={i} style={{ marginBottom: "12px" }}>
          {/* Título del campo (ej: Evidencia Pedagogica) */}
          <strong style={{ 
            display: "block", 
            textTransform: "capitalize", 
            color: "#0056b3", 
            marginBottom: "4px" 
          }}>
            {formatearTexto(clave)}:
          </strong>
          <div style={{ 
            paddingLeft: "10px", 
            borderLeft: "3px solid #eee", 
            color: "#333" 
          }}>
            {valor}
          </div>
        </div>
      ));
    }
    
    return <p>Formato de análisis no reconocido.</p>;
  };

  return (
    <div style={{ 
      border: "1px solid #e0e0e0", 
      borderRadius: "8px", 
      marginBottom: "8px", 
      backgroundColor: "#fff", 
      overflow: "hidden" 
    }}>

      <div 
        onClick={() => setAbierto(!abierto)} 
        style={{ 
          padding: "12px 15px", 
          cursor: "pointer", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          background: abierto ? "#f8f9fa" : "#ffffff",
          transition: "background 0.2s"
        }}
      >
        <span style={{ fontWeight: "600", color: "#333", fontSize: "0.95rem" }}>
          {formatearTexto(ev.indicador || "Indicador")}
        </span>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={getScoreClass(ev.calificacion)} style={{ fontWeight: "bold", minWidth: "30px", textAlign: "center" }}>
            {ev.calificacion}/5
          </span>
          <span style={{ color: "#020101", fontSize: "0.8rem" }}>
            {abierto ? "▼" : "▶"}
          </span>
        </div>
      </div>


      {abierto && (
        <div style={{ 
          padding: "15px", 
          borderTop: "1px solid #eee", 
          backgroundColor: "#fcfcfc",
          color: "#000000",
          fontSize: "0.9rem", 
          lineHeight: "1.5",
          textAlign: "justify"
        }}>
           {renderContenido()}
        </div>
      )}
    </div>
  );
};

const ApartadoItem = ({ apartado, index, evaluacion, onEvaluar, onBorrar, onDetener, cargando, seleccionado }) => {
  const [verContenidoCompleto, setVerContenidoCompleto] = useState(false); 
  const getScoreClass = (c) => c >= 4 ? "score-high" : c >= 3 ? "score-mid" : "score-low";

  // --- 1. DICCIONARIO DE NOMBRES 
  const mapModelos = {
    "Ensenanza_para_la_comprension": "Enseñanza para la Comprensión",
    "Indagacion_cientifica": "Indagación Científica",
    "Didactica_del_patrimonio": "Didáctica del Patrimonio",
    "Pedagogia_Critica": "Pedagogía Crítica",
    "Aprendizaje_Significativo": "Aprendizaje Significativo"
  };

  // --- 2. FUNCIÓN PARA AGRUPAR INDICADORES ---
  const agruparPorModelo = (listaEvaluaciones) => {
    if (!listaEvaluaciones || !Array.isArray(listaEvaluaciones)) return {};
    
    return listaEvaluaciones.reduce((acc, item) => {
      const keyRaw = item.modelo || "General";
      const nombreModelo = mapModelos[keyRaw] || formatearTexto(keyRaw);
      
      if (!acc[nombreModelo]) acc[nombreModelo] = [];
      acc[nombreModelo].push(item);
      return acc;
    }, {});
  };

  return (
    <div className={`card apartado-item apartado-tipo-${apartado.tipo}`}>
      
      {/* HEADER */}
      <div className="apartado-header">
        <h4 style={{ color: '#000000', fontSize: '1.4em', fontWeight: 'bold', margin: 0 }}>
          {apartado.Apartado} 
          {apartado.Apartado !== apartado.tipo && <small style={{ fontWeight: 'normal', color: '#100e0e', fontSize: '0.7em' }}> ({apartado.tipo})</small>}
        </h4>
        <div>
          {!evaluacion && (
            <button onClick={() => onEvaluar(apartado)} disabled={cargando && seleccionado} className="btn btn-sm btn-primary">
              {cargando && seleccionado ? "Evaluando..." : "Evaluar"}
            </button>
          )}
          <button onClick={() => onBorrar(index)} className="btn btn-sm btn-danger"> Eliminar </button>
        </div>
      </div>

      {/* LOADER */}
      {cargando && seleccionado && (
        <div className="loader-container">
          <div className="loader"></div>
          <span className="loader-text">Realizando Análisis Pedagógico</span>
          <div style={{ marginTop: '10px' }}>
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Evita que se disparen otros eventos de la tarjeta
          onDetener(); 
        }} 
        className="btn btn-sm btn-outline-danger"
        style={{ fontSize: '0.8rem', border: '1px solid #dc3545', color: '#dc3545' }}
      >
        Detener Evaluación
      </button>
    </div>
        </div>
      )}

      {/* CONTENIDO (Texto del usuario) */}
      <div className="apartado-content" style={{ marginBottom: "20px", color: "#555" }}>
        {typeof apartado.Contenido === "string" ? (
          <div style={{ marginTop: "15px", color: "#080505" }}>
            {verContenidoCompleto 
              ? apartado.Contenido 
              : apartado.Contenido.substring(0, 130) + (apartado.Contenido.length > 130 ? "..." : "")
            }
            {apartado.Contenido.length > 130 && (
              <span 
                onClick={() => setVerContenidoCompleto(!verContenidoCompleto)}
                style={{ color: "#000000", cursor: "pointer", fontWeight: "bold", marginLeft: "8px", fontSize: "0.9em", textDecoration: "underline"}}
              >
                {verContenidoCompleto ? " (ocultar)" : " (ver más)"}
              </span>
            )}
          </div>
        ) : (
         <div style={{ fontStyle: 'italic' }}>
            <strong>Actividad:</strong> {apartado.Contenido[0]?.Titulo || "Detalles de la actividad..."}
         </div>
        )}
      </div>

      {/* RESULTADOS DE LA EVALUACIÓN */}
      {evaluacion && (
      <div className="result-area" style={{ borderTop: "1px solid #000000", paddingTop: "20px" }}>
        {apartado.tipo === "Introducción" ? (
          <IntroResults data={evaluacion} />
        ) : (
             /* CASO 2: OBJETIVO / ACTIVIDAD (Indicadores numéricos) */
             <>
               <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: "bold", marginRight: "10px", color: "#000c92" }}>
            Nota Promedio:
          </span>
          <span 
            className={getScoreClass(evaluacion.estadisticas?.promedio)} 
            style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#000000" }}
          >
            {Number(evaluacion.estadisticas?.promedio || 0).toFixed(1)}/5
          </span>
        </div>

                {evaluacion.feedback_global && (
                  <div className="feedback-alert" style={{ 
                    marginBottom: "20px", 
                    lineHeight: "1.6", 
                    backgroundColor: '#f9f9f943', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    border: '1px solid #ddd', 
                    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)' 
                  }}>
                    {evaluacion.feedback_global.comentario_general
                      .split(/(FORTALEZAS:|OPORTUNIDAD:|OPORTUNIDADES:)/g)
                      .map((parte, i) => {
                        if (parte.includes("FORTALEZAS")) return <strong key={i} style={{ color: '#0a885e', display: 'block', marginTop: i > 0 ? 10 : 0 }}> FORTALEZAS:</strong>;
                        if (parte.includes("OPORTUNIDAD")) return <strong key={i} style={{ color: '#825300', display: 'block', marginTop: 10 }}> OPORTUNIDADES:</strong>;
                        if (parte.trim().length === 0) return null;
                        
                        return <span key={i}>{parte.replace(/_/g, " ")}</span>;
                      })
                    }
                  </div>
                )}

               <div>
                 <h5 style={{ margin: "0 0 15px 0", color: "#050303", fontSize: "1.2rem", borderBottom: "2px solid #ddd", paddingBottom: "5px" }}>
                   Desglose por Modelo Pedagógico:
                 </h5>
                 
                 {Object.entries(agruparPorModelo(evaluacion.evaluaciones)).length > 0 ? (
                   Object.entries(agruparPorModelo(evaluacion.evaluaciones)).map(([nombreModelo, listaIndicadores], idx) => (
                     <div key={idx} style={{ marginBottom: "20px" }}>
                       {/* Título del Modelo */}
                       <h6 style={{ 
                         color: "#555", 
                         fontWeight: "bold", 
                         fontSize: "1rem", 
                         margin: "0 0 10px 0",
                         textTransform: "uppercase",
                         letterSpacing: "0.5px"
                       }}>
                          {nombreModelo}
                       </h6>
                       
                       {listaIndicadores.map((ev, i) => (
                         <IndicadorItem key={i} ev={ev} />
                       ))}
                     </div>
                   ))
                 ) : (
                   <p>No se encontraron indicadores detallados.</p>
                 )}
               </div>
             </>
           )}
        </div>
      )}
    </div>
  );
};

const Footer = () => {
  return (
    <div className="footer-basic">
      <footer>
    
        <p className="copyright">
          <label htmlFor=""></label> Esta herramienta fue creada en el marco de la Maestría en Enseñanza de las Ciencias
          Exactas y Naturales y el Museo de Historia Natural - UNAL © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};



// ==========================================
// 3. COMPONENTE PRINCIPAL (APP)
// ==========================================
export default function EvaluadorPasoAPaso() {
  // Estados de Control de Modo: 'inicio' | 'excel' | 'manual'
  const [modo, setModo] = useState("inicio");

  const [servicio, setServicio] = useState({ titulo: "", poblacion: "joven", rangoEdad: "", apartados: [] });
  const [evaluaciones, setEvaluaciones] = useState({});
  const [analisisFinalIA, setAnalisisFinalIA] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [apartadoSeleccionado, setApartadoSeleccionado] = useState(null);
  const abortControllerRef = useRef(null);

  // AQUI VA TU FUNCIÓN (Paso B)
  const detenerEvaluacion = async () => {
  if (abortControllerRef.current) {
    // 1. Cortamos la espera en el navegador (Frontend)
    abortControllerRef.current.abort(); 

    try {
      // 2. Avisamos al Backend que active el freno de mano
      // Usamos un fetch simple a la ruta /cancelar
      await fetch('http://localhost:5000/cancelar', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log("📡 Señal de cancelación enviada al servidor.");
    } catch (err) {
      console.warn("No se pudo notificar al backend, pero la conexión local fue cerrada.");
    }

    // 3. Limpiamos la interfaz
    setCargando(false);
    setApartadoSeleccionado(null);
    console.log("🛑 Proceso detenido manualmente.");
  }
};
  
  const modalFileRef = useRef(null);
  const manejarBorrado = (indexABorrar) => {
  // 1. Validamos que el índice existe
  if (servicio.apartados[indexABorrar]) {
    const nombreApartado = servicio.apartados[indexABorrar].Apartado;

    // 2. Filtramos apartados
    const nuevosApartados = servicio.apartados.filter((_, idx) => idx !== indexABorrar);

    // 3. Actualizamos servicio
    setServicio(prev => ({
      ...prev,
      apartados: nuevosApartados
    }));

    // 4. Limpiamos evaluación
    setEvaluaciones(prev => {
      const nuevasEv = { ...prev };
      delete nuevasEv[nombreApartado];
      return nuevasEv;
    });

    // 5. Resetear informe final (usando el nombre correcto de tu estado)
    setAnalisisFinalIA(null);
  }
};

  // --- FUNCIÓN DE REINICIO TOTAL ---
 const reiniciarAplicacion = async () => {
    if(window.confirm("¿Seguro que quieres evaluar un nuevo servicio?")) {
      try {
        if (cargando) {
            await detenerEvaluacion(); 
            // Esperamos 500ms para que el backend procese la parada
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await fetch('http://localhost:5000/reset', { method: 'POST' }).catch(() => {});    
        // 3. Limpiamos todos los estados del Frontend
        setServicio({ titulo: "", poblacion: "joven", rangoEdad: "", apartados: [] });
        setEvaluaciones({});
        setAnalisisFinalIA(null);
        setError("");
        setModo("inicio"); 
        
        console.log("🚀 Sistema reseteado por completo");
      } catch (e) {
        console.error("Error durante el reinicio:", e);
      }
    }
};

  const handleImportar = async (file) => {
    if (!file) return;
    try {
      if (file.name.endsWith(".xlsx")) {
        const { config, apartados } = await procesarExcel(file);
        setServicio(prev => ({
          ...prev, 
          titulo: config?.titulo || prev.titulo, 
          poblacion: config?.poblacion || prev.poblacion, 
          rangoEdad: config?.rangoEdad || prev.rangoEdad, 
          apartados: [...prev.apartados, ...apartados]
        }));
        
        // CAMBIAR A MODO EXCEL (Oculta formulario manual)
        setModo("excel");
        
      } else if (file.name.endsWith(".json")) {
        const data = await importarTallerDesdeJSON(file);
        setServicio(data.servicio);
        setEvaluaciones(data.evaluaciones || {});
        setModo("manual"); // JSON se considera como estado editable/manual
      }
    } catch (e) { alert(e); }
  };

const descargarPDF = () => {
    if (!analisisFinalIA || !evaluaciones) {
      return alert("Primero debes generar el Informe General para habilitar la descarga.");
    }
    
    const doc = new jsPDF();
    const margenIzq = 20;
    const anchoLinea = 170; 
    let y = 20; 

    const mapModelos = {
      "Ensenanza_para_la_comprension": "Enseñanza para la Comprensión",
      "Indagacion_cientifica": "Indagación Científica",
      "Didactica_del_patrimonio": "Didáctica del Patrimonio",
      "Pedagogia_Critica": "Pedagogía Crítica",
      "Aprendizaje_Significativo": "Aprendizaje Significativo"
    };

    const checkPageBreak = (espacioNecesario = 10) => {
      if (y + espacioNecesario > 275) {
        doc.addPage();
        y = 20;
        return true;
      }
      return false;
    };

    const imprimirParrafo = (contenido, size = 10, estilo = "normal", color = [0, 0, 0], align = "justify") => {
      if (!contenido) return;
      
      let textoFinal = "";
      if (typeof contenido === 'object') {
        textoFinal = Object.entries(contenido)
          .map(([clave, valor]) => `${clave.replace(/_/g, " ").toUpperCase()}: ${valor}`)
          .join(" | ");
      } else {
        textoFinal = contenido.toString();
      }

      doc.setFontSize(size);
      doc.setFont("helvetica", estilo); 
      doc.setTextColor(...color);
      
      const lineas = doc.splitTextToSize(formatearTexto(textoFinal), anchoLinea);
      lineas.forEach((linea, index) => {
        checkPageBreak(7);
        const esUltimaLinea = index === lineas.length - 1;
        doc.text(linea, margenIzq, y, { 
            align: (align === "justify" && !esUltimaLinea) ? "justify" : "left", 
            maxWidth: anchoLinea 
        });
        y += 6;
      });
      y += 2;
    };
    const modelosSet = new Set();
    Object.values(evaluaciones).forEach(ev => {
      if (ev.evaluaciones) {
        ev.evaluaciones.forEach(item => {
          if (item.modelo) modelosSet.add(mapModelos[item.modelo] || item.modelo.replace(/_/g, " "));
        });
      }
    });
    const hibridacionTexto = Array.from(modelosSet).join("/") || "General";

    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 51, 102); 
    doc.text("INFORME TÉCNICO DE EVALUACIÓN PEDAGÓGICA", 105, y, { align: "center" }); y += 12;
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text(`Hibridación pedagógica: ${hibridacionTexto}`, margenIzq, y); y += 7;
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Servicio: ${servicio.titulo}`, margenIzq, y); y += 7;
    doc.text(`Población: ${servicio.poblacion} | Edad: ${formatearRango(servicio.rangoEdad)}`, margenIzq, y); y += 7;
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margenIzq, y); y += 8;
    doc.setDrawColor(0, 51, 102); doc.setLineWidth(0.5);
    doc.line(margenIzq, y, margenIzq + anchoLinea, y); y += 10;

    // 2. SÍNTESIS EJECUTIVA (JUSTIFICADA)
    const final = analisisFinalIA.analisis_final || {};
    const metricas = analisisFinalIA.metricas_consolidadas || {};
    
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 100, 0); 
    doc.text("ANÁLISIS SISTÉMICO Y SÍNTESIS", margenIzq, y); y += 8;
    imprimirParrafo(final.sintesis_ejecutiva || final.sintesis_general, 10, "normal", [0, 0, 0], "justify");

    // 3. RUTA DE MEJORA
  if (final.ruta_de_accion?.length > 0) {
    y += 5;
    checkPageBreak(15);
    
    // TÍTULO DE SECCIÓN: Único en Negrita (Bold)
    doc.setFontSize(12); 
    doc.setFont("helvetica", "bold"); 
    doc.setTextColor(0, 0, 0);
    doc.text("RUTA DE MEJORA RECOMENDADA", margenIzq, y); 
    y += 8;
    
    final.ruta_de_accion.forEach((step, i) => {
      checkPageBreak(25);

      imprimirParrafo(
        `${i + 1}. ESTRATEGIA: ${step.estrategia}`, 
        10, 
        "normal", 
        [0, 0, 0], 
        "justify"
      );
      
      // IMPLEMENTACIÓN: También en Normal y Justificado
      if (step.implementacion) {
        imprimirParrafo(
          step.implementacion, 
          10, 
          "normal", 
          [0, 0, 0], 
          "justify"
        );
      }
      
      y += 4; // Espacio entre ítems
    });
  }

    // 4. DETALLE TÉCNICO POR APARTADOS
    checkPageBreak(20);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 51, 102);
    doc.text("DETALLE DE EVALUACIÓN POR APARTADOS", margenIzq, y); y += 10;

    servicio.apartados.forEach((ap) => {
      const ev = evaluaciones[ap.Apartado];
      if (!ev) return;

      checkPageBreak(20);
      doc.setDrawColor(200); doc.setLineWidth(0.2);
      doc.line(margenIzq, y, margenIzq + anchoLinea, y); y += 8;
      
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
      doc.text(`${ap.Apartado.toUpperCase()} (${ap.tipo})`, margenIzq, y);
      
      const nota = ev.estadisticas?.promedio || ev.metricas_consolidadas?.promedio;
      if (nota) doc.text(`Nota: ${Number(nota).toFixed(1)}/5.0`, 190, y, { align: "right" });
      y += 8;

      const feedback = ev.analisis_disciplinar || ev.feedback_global?.comentario_general;
      imprimirParrafo(feedback, 10, "normal", [0, 0, 0], "justify");

      // --- INDICADORES AGRUPADOS POR MODELO (TAMAÑO 10, NEGRO, JUSTIFICADO) ---
      if (ev.evaluaciones && Array.isArray(ev.evaluaciones)) {
  y += 4;
  
  // Agrupamos por modelo pedagógico
  const grupos = ev.evaluaciones.reduce((acc, item) => {
    const m = mapModelos[item.modelo] || item.modelo?.replace(/_/g, " ") || "General";
    if (!acc[m]) acc[m] = [];
    acc[m].push(item);
    return acc;
  }, {});

  Object.entries(grupos).forEach(([nombreModelo, indicadores]) => {
    checkPageBreak(20);
    // Título del Modelo (Gris oscuro)
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
    doc.text(`MODELO: ${nombreModelo.toUpperCase()}`, margenIzq, y); y += 8;

    indicadores.forEach(ind => {
      checkPageBreak(30);
      // Nombre del Indicador y Puntaje (Negro)
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
      doc.text(`${ind.indicador.replace(/_/g, " ")}`, margenIzq, y);
      doc.text(`${ind.calificacion}/5`, 190, y, { align: "right" });
      y += 8;

      // Si el análisis es un objeto (Evidencia, Justificación, Razonamiento)
      if (typeof ind.analisis === 'object') {
        const azulTitulos = [0, 86, 179]; // El azul de tu captura

        Object.entries(ind.analisis).forEach(([llave, valor]) => {
          checkPageBreak(15);
          // Título del Campo (Ej: Evidencia Pedagogica:) en Azul y Negrita
          const tituloCampo = `${llave.replace(/_/g, " ")}:`;
          imprimirParrafo(tituloCampo, 10, "bold", azulTitulos, "left");
          
          // Contenido del Campo en Negro y Justificado
          imprimirParrafo(valor, 10, "normal", [0, 0, 0], "justify");
          y += 2; // Espacio entre secciones del indicador
        });
      } else {
        // Fallback si es texto simple
        imprimirParrafo(ind.analisis, 10, "normal", [0, 0, 0], "justify");
      }
      y += 5; // Espacio antes del siguiente indicador
    });
  });
}
      y += 5;
    });

    // 5. CIERRE Y PUNTAJE FINAL
    checkPageBreak(30);
    y += 10;
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5);
    doc.line(margenIzq, y, margenIzq + anchoLinea, y); y += 10;
    
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text(`PUNTAJE GLOBAL: ${metricas.promedio || "N/A"}/5.0`, 190, y, { align: "right" });

    // NUMERACIÓN
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} - Informe de Evaluación_${servicio.titulo}`, 105, 290, { align: "center" });
    }

    doc.save(`Informe_Evaluación_${servicio.titulo}.pdf`);
};
  // Reemplaza tu función evaluarApartado antigua por esta nueva:
// Reemplaza tu función evaluarApartado antigua por esta nueva:
 // Reemplaza tu función evaluarApartado por esta versión DEFINITIVA:
 const evaluarApartado = async (ap) => {
  setError(""); 
  setCargando(true); 
  setApartadoSeleccionado(ap.Apartado);

  // Creamos el controlador y lo guardamos en la referencia
  abortControllerRef.current = new AbortController();

  try {
    // IMPORTANTE: Pasamos el 'signal' al cliente de la API
    const data = await api.evaluarApartado({ 
      apartado: ap, 
      poblacion: servicio.poblacion, 
      rango_edad: servicio.rangoEdad 
    }, { signal: abortControllerRef.current.signal }); // <--- Agregamos esto

    if (data) {
      setEvaluaciones(prev => ({ ...prev, [ap.Apartado]: data }));
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log("La petición fue cancelada con éxito");
    } else {
      // Otros errores...
    }
  } finally {
    setCargando(false);
    setApartadoSeleccionado(null);
    abortControllerRef.current = null; // Limpiamos al terminar
  }
};

const generarSintesis = async () => {
  setError("");
  setAnalisisFinalIA(null);
  
  // 1. Verificación de seguridad: ¿Qué hay realmente en el estado?
  console.log("🔍 CONTENIDO DE EVALUACIONES ANTES DE ENVIAR:", evaluaciones);

  if (Object.keys(evaluaciones).length === 0) {
    alert("⚠️ No hay evaluaciones en el estado. ¿Ya presionaste el botón 'Evaluar'?");
    return;
  }

  setCargando(true);
  setApartadoSeleccionado(null);

  try {
    // 2. BUSCADOR DINÁMICO: Encuentra los datos sin importar el nombre exacto de la llave
    const getVal = (keyPart) => {
      const foundKey = Object.keys(evaluaciones).find(k => 
        k.toLowerCase().includes(keyPart.toLowerCase())
      );
      return foundKey ? evaluaciones[foundKey] : null;
    };

    // Construimos el payload extrayendo los datos REALES del estado
    const payload = {
      evaluaciones: {
        introduccion: getVal("introduccion"),
        objetivo: getVal("objetivo"),
        actividades: Object.entries(evaluaciones)
          .filter(([key]) => key.toLowerCase().includes("actividad"))
          .map(([key, value]) => ({ ...value, nombre_apartado: key }))
      },
      rango_edad: formatearRango(servicio.rangoEdad)
    };

    // 3. LOG CRÍTICO: Aquí DEBES ver los datos, no 'null'
    console.log("📤 PAQUETE REAL QUE SALE AL BACKEND:", payload);

    if (!payload.evaluaciones.objetivo) {
      throw new Error("El resultado del Objetivo no se encontró. Asegúrate de haberlo evaluado.");
    }

   const data = await api.analizarTallerCompleto(payload);

    if (data && !data.error) {
      // 🚩 IMPORTANTE: Verifica que 'data' contenga 'analisis_final'
      console.log("💎 INFORME RECIBIDO:", data);
      setAnalisisFinalIA(data); 
      
      // Forzamos el scroll al inicio para ver el reporte
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      throw new Error(data.error || "Error en el análisis de la IA");
    }
  } catch (e) {
    console.error("❌ Error en Síntesis:", e);
    setError(e.message);
    alert("Error: " + e.message);
  } finally {
    setCargando(false);
  }
};

  const handleAddApartado = (item) => {
    let nombre = item.Apartado;
    if(item.tipo === "Actividad") {
       const num = servicio.apartados.filter(a => a.tipo === "Actividad").length + 1;
       nombre = `Actividad ${num}`;
    }
    setServicio(prev => ({ ...prev, apartados: [...prev.apartados, { ...item, Apartado: nombre }] }));
  };

  const tieneIntro = servicio.apartados.some(ap => ap.tipo === "Introducción" && evaluaciones[ap.Apartado]);
  const tieneObj   = servicio.apartados.some(ap => ap.tipo === "Objetivo" && evaluaciones[ap.Apartado]);
  const tieneAct   = servicio.apartados.some(ap => ap.tipo === "Actividad" && evaluaciones[ap.Apartado]);

  // 2. Solo habilitamos si tiene las 3 cosas
  const listoParaSintesis = tieneIntro && tieneObj && tieneAct;

  return (

    <>
      {/* 1. BARRA DE NAVEGACIÓN (Toda la pantalla) */}
      {/* Esta parte va FUERA del contenedor para ocupar el 100% */}
      <nav className="navbar-full">
        <div className="navbar-content">
          <h1>Evaluador de Servicios educativos del MHN-UNAL </h1>
          
          {/* Tu lógica del botón (se mantiene igual) */}
          {modo !== "inicio" && (
            <button onClick={reiniciarAplicacion}  className="btn-restart">
            Realizar Nueva evaluación
            </button>
          )}
        </div>
      </nav>

    <div className="app-container">
      
      
      {/* --- VENTANA EMERGENTE (Solo visible en MODO INICIO) --- */}
     {modo === "inicio" && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2 className="modal-title">¡Bienvenido!</h2>
      <h3 className="modal-text">Selecciona cómo quieres iniciar la evaluación del servicio educativo tipo taller del HHN-UNAL:</h3>
      
      <div className="modal-actions">
        {/* OPCIÓN 1: SUBIR ARCHIVO */}
        <button 
          className="btn btn-outline btn-large"
          onClick={() => modalFileRef.current.click()}
        >
        Cargar desde Excel
        </button>
        <input 
          type="file" 
          ref={modalFileRef} 
          style={{ display: "none" }} 
          accept=".xlsx,.xls,.json" 
          onChange={e => handleImportar(e.target.files[0])}
        />

        {/* OPCIÓN 2: MANUAL */}
        <button 
          className="btn btn-outline btn-large"
          onClick={() => setModo("manual")}
        >
          Ingreso Manual
        </button>
      </div>

      {/* --- CAMBIO REALIZADO AQUÍ --- */}
      <a 
        href="/Formato_ingreso_taller.xlsx" 
        download="Formato_ingreso_taller.xlsx"
        className="btn btn-outline btn-large"
        style={{ textDecoration: "none", display: "block", marginTop: 20 }}
      >
        Descargar formato de Excel para carga
      </a>
      {/* ----------------------------- */}

    </div>
  </div>
)}

      {/* CONTENIDO PRINCIPAL (Oculto si estamos en inicio) */}
      {modo !== "inicio" && (
        <div className="dashboard-grid">
          <div className="left-panel">
            
            {/* CONFIGURACIÓN: Botón Guardar ahora descarga PDF */}
            <TallerConfig 
              servicio={servicio} 
              setServicio={setServicio} 
              setAnalisisFinalIA={setAnalisisFinalIA}
              onDescargarInforme={descargarPDF}
              
              analisisFinalIA={analisisFinalIA}  /* <--- ESTA ES LA LÍNEA QUE FALTABA */
            />
            
            {/* FORMULARIO: Solo visible en MODO MANUAL */}
            {modo === "manual" && (
              <AddContentForm 
              onAdd={handleAddApartado} 
              apartadosExistentes={servicio.apartados} /* <--- AGREGAR ESTA LÍNEA */
              rangoEdad={servicio.rangoEdad}
            />
)}

            {/* BOTÓN GENERAR SÍNTESIS (CON REGLA ESTRICTA) */}
            <div style={{ marginTop: 20 }}>
              
              {/* Si falta algo, mostramos qué falta */}
              {!listoParaSintesis && servicio.apartados.length > 0 && (
                <div style={{ fontSize: '1.1rem', color: '#231513', marginBottom: '5px', background:'#fffbeba4', padding:'20px', borderRadius:'8px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.65)' 
                  
                }}>
                  Para generar el informe final debes evaluar obligatoriamente:
                  <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                    <li style={{ color: tieneIntro ? 'green' : 'orange' }}>
                      {tieneIntro ? '✅' : 'CheckBox'} Introducción
                    </li>
                    <li style={{ color: tieneObj ? 'green' : 'orange' }}>
                      {tieneObj ? '✅' : 'CheckBox'} Objetivo
                    </li>
                    <li style={{ color: tieneAct ? 'green' : 'orange' }}>
                      {tieneAct ? '✅' : 'CheckBox'} Actividad
                    </li>
                  </ul>
                </div>
              )}

              {/* El botón solo aparece si cumplimos todo */}
              <button 
                onClick={generarSintesis} 
                disabled={!listoParaSintesis || cargando} 
                className="btn btn-primary btn-block"
                style={{ opacity: listoParaSintesis ? 1 : 0.5, cursor: listoParaSintesis ? 'pointer' : 'not-allowed' }}
              >
                {cargando ? "Analizando..." : "Generar Informe General"}
              </button>
            </div>
          </div>

          <div className="right-panel">
  {/* ESTADO 1: CARGANDO INFORME GENERAL */}
  {cargando && !apartadoSeleccionado && (
    <div className="card loader-card fade-in">
      <div className="loader"></div>
      <h3>Redactando Informe Ejecutivo...</h3>
      <p>Espera un momento por favor.</p>
    </div>
  )}

  {/* ESTADO 2: MOSTRAR RESULTADO (Solo si no está cargando) */}
  {!cargando && analisisFinalIA && (
    <FinalReport 
      analisis={analisisFinalIA} 
      titulo={servicio.titulo} 
    />
  )}

  {/* ESTADO 3: LISTADO DE APARTADOS (Siempre presente) */}
  <div className="apartados-section">
    <h3>Apartados evaluados ({servicio.apartados.length})</h3>
    {servicio.apartados.map((ap, idx) => (
      <ApartadoItem 
        key={idx} 
        apartado={ap}
        index={idx} 
        evaluacion={evaluaciones[ap.Apartado]}
        onEvaluar={evaluarApartado} 
        onBorrar={manejarBorrado}
        onDetener={detenerEvaluacion}
        cargando={cargando} 
        seleccionado={apartadoSeleccionado === ap.Apartado}
      />
    ))}
  </div>
</div>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}
    </div>
    <Footer />
    </>
  );
}