
export const S03 = () => (
    <section className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div style={{ maxWidth: "640px", marginBottom: "40px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Herkenbaar?"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Herken je dit?"}
          </h2>
          <p style={{ fontSize: "18px", color: "var(--neutral-600)", margin: "0px" }}>
            {"De meeste installatiebedrijven groeien sneller dan hun systemen."}
          </p>
        </div>
        <div className="mh-grid4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-inbox"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "16.5px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "8px" }}
              >
                {"Leads blijven in een mailbox hangen."}
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Zonder overzicht bel je te laat terug, en is de klant al bij de concurrent."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-file-spreadsheet"
              >
                <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                <path d="M8 13h2" />
                <path d="M14 13h2" />
                <path d="M8 17h2" />
                <path d="M14 17h2" />
              </svg>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "16.5px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "8px" }}
              >
                {"Elke offerte begint opnieuw in Excel."}
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Dubbele invoer, oude prijslijsten en een subsidieberekening die net weer anders is."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-clipboard-list"
              >
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
              </svg>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "16.5px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "8px" }}
              >
                {"Planning op een whiteboard, wijzigingen in WhatsApp."}
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"En de monteur hoort pas op locatie dat de klus is verzet."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-folder-open"
              >
                <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
              </svg>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "16.5px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "8px" }}
              >
                {"Subsidie- en opleverpapierwerk blijft liggen."}
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"En de klant belt jou om te vragen hoe het ervoor staat."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
);
