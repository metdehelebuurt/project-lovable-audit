import type { CSSProperties } from "react";

export const cardStyle: CSSProperties = {
  background: "rgb(255, 255, 255)",
  borderRadius: "18px",
  boxShadow: "var(--shadow-lg)",
  border: "1px solid var(--border-subtle)",
  padding: "28px",
};

export const labelStyle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "14px",
  fontWeight: "var(--fw-medium)",
  color: "var(--text-heading)",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  height: "var(--control-h)",
  padding: "0px 14px",
  fontFamily: "var(--font-body)",
  fontSize: "16px",
  color: "var(--text-body)",
  background: "var(--white)",
  border: "1px solid var(--border-strong)",
  borderRadius: "var(--radius-md)",
  outline: "none",
};

export const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontFamily: "var(--font-body)",
  fontWeight: "var(--fw-semibold)",
  lineHeight: "1",
  border: "1px solid transparent",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  height: "var(--control-h-hero)",
  padding: "0px 28px",
  fontSize: "17px",
  background: "var(--color-accent)",
  color: "var(--white)",
  width: "100%",
};

export const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "var(--white)",
  color: "var(--text-body)",
  border: "1px solid var(--border-strong)",
  height: "var(--control-h)",
  fontSize: "15px",
  width: "auto",
  padding: "0px 18px",
};

export function chipStyle(actief: boolean): CSSProperties {
  return {
    padding: "9px 15px",
    borderRadius: "999px",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    fontSize: "13.5px",
    fontWeight: 600,
    background: actief ? "var(--color-primary)" : "rgb(255, 255, 255)",
    color: actief ? "rgb(255, 255, 255)" : "var(--text-body)",
    border: `1px solid ${actief ? "var(--color-primary)" : "var(--border-subtle)"}`,
  };
}

export function slotStyle(actief: boolean): CSSProperties {
  return {
    padding: "11px 8px",
    borderRadius: "10px",
    border: `1px solid ${actief ? "var(--color-primary)" : "var(--border-strong)"}`,
    background: actief ? "var(--color-primary)" : "rgb(255, 255, 255)",
    color: actief ? "var(--white)" : "var(--text-body)",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    width: "100%",
  };
}

export const stapBadgeStyle: CSSProperties = {
  fontSize: "12px",
  color: "var(--text-muted)",
  background: "var(--neutral-100)",
  padding: "5px 10px",
  borderRadius: "99px",
  whiteSpace: "nowrap",
};

export const meldingStyle: CSSProperties = {
  margin: "12px 0px 0px",
  fontSize: "14px",
  color: "var(--color-primary)",
};

export const foutStyle: CSSProperties = {
  margin: "12px 0px 0px",
  fontSize: "14px",
  color: "#b42318",
};
