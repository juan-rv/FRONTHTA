import React from "react";

export const FinalReport = ({ analisis }) => {
  if (!analisis) return null;

  const { analisis_final, metricas_consolidadas } = analisis;

  // Estilos inline específicos para este reporte tipo Dashboard
  const styles = {
    container: {
      background: "#fff",
      border: "1px solid #2563eb",
      borderRadius: "12px",
      padding: "25px",
      marginBottom: "30px",
      boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.1)"
    },
    header: {
      marginBottom: "20px",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "15px"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginTop: "20px"
    },
    boxSuccess: {
      background: "#ecfdf5", // Verde claro
      border: "1px solid #10b981",
      borderRadius: "8px",
      padding: "15px"
    },
    boxWarning: {
      background: "#fff7ed", // Naranja claro
      border: "1px solid #f59e0b",
      borderRadius: "8px",
      padding: "15px"
    },
    boxInfo: {
      marginTop: "20px",
      background: "#f8fafc",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      padding: "15px"
    },
    titleSuccess: { color: "#065f46", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "5px" },
    titleWarning: { color: "#9a3412", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "5px" },
    list: { margin: 0, paddingLeft: "20px" }
  };

  return (
    <div style={styles.container}>
      {/* CABECERA */}
      <div style={styles.header}>
        <h2 style={{ color: "var(--primary)", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px" }}>
          Informe de Síntesis Pedagógica
        </h2>
        <p style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-main)" }}>
          {analisis_final.sintesis_general}
        </p>
        <div style={{ marginTop: "10px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Promedio Global: <strong>{metricas_consolidadas.promedio_general}/5</strong> • 
          Componentes Evaluados: <strong>{metricas_consolidadas.componentes_evaluados}</strong>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Fortalezas */}
        <div style={styles.boxSuccess}>
          <h4 style={styles.titleSuccess}> Fortalezas</h4>
          <ul style={styles.list}>
            {analisis_final.fortalezas_principales.map((f, i) => (
              <li key={i} style={{ marginBottom: "5px", color: "#064e3b" }}>{f}</li>
            ))}
          </ul>
        </div>

        {/* Oportunidades */}
        <div style={styles.boxWarning}>
          <h4 style={styles.titleWarning}>Áreas de Oportunidad</h4>
          <ul style={styles.list}>
            {analisis_final.areas_oportunidad.map((a, i) => (
              <li key={i} style={{ marginBottom: "5px", color: "#7c2d12" }}>{a}</li>
            ))}
          </ul>
        </div>
      </div> 


      <div style={styles.boxInfo}>
        <h4 style={{ margin: "0 0 10px 0", color: "var(--primary)", display: "flex", alignItems: "center", gap: "5px" }}>
          💡 Recomendaciones Prácticas
        </h4>
        <ul style={{ ...styles.list, color: "var(--text-main)" }}>
          {analisis_final.recomendaciones_practicas.map((rec, i) => (
            <li key={i} style={{ marginBottom: "5px" }}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};