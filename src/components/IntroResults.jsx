import React from "react";

export const IntroResults = ({ data }) => {
  if (!data) return null;

  return (
    <div style={{ padding: "15px" }}>
      {/* 1. Valoración Disciplinar */}
      <div style={{ marginBottom: "20px" }}>
        <h5 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
          🎯 Valoración Pedagógica
        </h5>
        <p style={{ margin: 0, lineHeight: "1.6", color: "var(--text-main)" }}>
          {data.analisis_disciplinar}
        </p>
      </div>

      {/* 2. Frases para el Discurso (Storytelling) */}
      {data.frases_discurso && data.frases_discurso.length > 0 && (
        <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h5 style={{ margin: "0 0 10px 0", color: "var(--secondary)" }}>
            🗣️ Ideas Fuerza (Storytelling)
          </h5>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-muted)" }}>
            {data.frases_discurso.map((frase, i) => (
              <li key={i} style={{ marginBottom: "5px" }}>"{frase}"</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Recomendación (si existe) */}
      {data.recomendacion && (
        <div style={{ marginTop: "15px", padding: "10px", background: "#fffbeb", borderLeft: "4px solid var(--accent)", color: "#92400e" }}>
          <strong>💡 Recomendación:</strong> {data.recomendacion}
        </div>
      )}
    </div>
  );
};