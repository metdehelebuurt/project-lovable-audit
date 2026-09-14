
export const MegaPanelP1P2 = () => (
    <div
      style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "28px", paddingTop: "22px", borderTop: "1px solid var(--border-subtle)" }}
    >
      <span
        style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--neutral-600)" }}
      >
        {"Per branche"}
      </span>
      <a
        href="/branches/zonnepanelen"
        className="scp2"
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "99px", border: "1px solid var(--border-subtle)", fontSize: "13.5px", fontWeight: "600", color: "var(--text-heading)", whiteSpace: "nowrap" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ width: "15px", height: "15px", color: "var(--color-primary)" }}
          className="lucide lucide-sun"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
        <span className="sc-interp">
          {"Zonnepanelen"}
        </span>
      </a>
      <a
        href="/branches/warmtepompen"
        className="scp2"
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "99px", border: "1px solid var(--border-subtle)", fontSize: "13.5px", fontWeight: "600", color: "var(--text-heading)", whiteSpace: "nowrap" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ width: "15px", height: "15px", color: "var(--color-primary)" }}
          className="lucide lucide-thermometer"
        >
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
        </svg>
        <span className="sc-interp">
          {"Warmtepompen"}
        </span>
      </a>
      <a
        href="/branches/thuisbatterijen"
        className="scp2"
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "99px", border: "1px solid var(--border-subtle)", fontSize: "13.5px", fontWeight: "600", color: "var(--text-heading)", whiteSpace: "nowrap" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ width: "15px", height: "15px", color: "var(--color-primary)" }}
          className="lucide lucide-battery-charging"
        >
          <path d="m11 7-3 5h4l-3 5" />
          <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" />
          <path d="M22 14v-4" />
          <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" />
        </svg>
        <span className="sc-interp">
          {"Thuisbatterijen"}
        </span>
      </a>
      <a
        href="/branches/laadpalen"
        className="scp2"
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "99px", border: "1px solid var(--border-subtle)", fontSize: "13.5px", fontWeight: "600", color: "var(--text-heading)", whiteSpace: "nowrap" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ width: "15px", height: "15px", color: "var(--color-primary)" }}
          className="lucide lucide-plug-zap"
        >
          <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
          <path d="m2 22 3-3" />
          <path d="M7.5 13.5 10 11" />
          <path d="M10.5 16.5 13 14" />
          <path d="m18 3-4 4h6l-4 4" />
        </svg>
        <span className="sc-interp">
          {"Laadpalen"}
        </span>
      </a>
      <a
        href="/branches/isolatie"
        className="scp2"
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "99px", border: "1px solid var(--border-subtle)", fontSize: "13.5px", fontWeight: "600", color: "var(--text-heading)", whiteSpace: "nowrap" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ width: "15px", height: "15px", color: "var(--color-primary)" }}
          className="lucide lucide-layers"
        >
          <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
          <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
          <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
        </svg>
        <span className="sc-interp">
          {"Isolatie"}
        </span>
      </a>
    </div>
);
