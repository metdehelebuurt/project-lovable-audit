
export const S02 = () => (
    <section className="mh-secpad" style={{ padding: "72px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div style={{ maxWidth: "620px", marginBottom: "36px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Onboarding"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Je staat er niet alleen voor"}
          </h2>
          <p style={{ fontSize: "17px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
            {"Software invoeren strandt zelden op de software. Daarom zit begeleiding er standaard bij, ook in je proefperiode."}
          </p>
        </div>
        <div className="mh-grid3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", boxShadow: "var(--shadow-md)", border: "1px solid transparent" }}
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
                className="lucide lucide-user-round-check"
              >
                <path d="M2 21a8 8 0 0 1 13.292-6" />
                <circle cx="10" cy="8" r="5" />
                <path d="m16 19 2 2 4-4" />
              </svg>
              <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>
                {"Vaste accountmanager"}
              </h3>
              <p style={{ margin: "0px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"E\u00e9n bekend gezicht dat je bedrijf kent, meedenkt en je wensen omzet in nieuwe functies."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", boxShadow: "var(--shadow-md)", border: "1px solid transparent" }}
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
                className="lucide lucide-import"
              >
                <path d="M12 3v12" />
                <path d="m8 11 4 4 4-4" />
                <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
              </svg>
              <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>
                {"Wij zetten je data klaar"}
              </h3>
              <p style={{ margin: "0px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Klanten, prijslijsten en lopende projecten importeren we met je mee, geen weekend overtypen."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", boxShadow: "var(--shadow-md)", border: "1px solid transparent" }}
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
                className="lucide lucide-graduation-cap"
              >
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                <path d="M22 10v6" />
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
              </svg>
              <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>
                {"Training voor je team"}
              </h3>
              <p style={{ margin: "0px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Kantoor in een uur op weg, monteurs in tien minuten. In gewone taal, op de werkvloer."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
);
