
export const S04 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "680px", marginBottom: "38px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Vroeger en nu"}
          </div>
          <h2 style={{ margin: "0px 0px 12px" }}>
            {"Zes verschuivingen, naast elkaar"}
          </h2>
          <p style={{ fontSize: "17.5px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
            {"Links hoe het bij Smart Accu liep, rechts hoe het nu gaat. Samengevat uit het verhaal hierboven."}
          </p>
        </div>
        <div
          className="mh-reveal mh-hidden"
          style={{ border: "1px solid var(--border-subtle)", borderRadius: "20px", overflow: "hidden", boxShadow: "var(--shadow-md)", background: "var(--surface-page)" }}
        >
          <div className="mh-barow" style={{ display: "grid", gridTemplateColumns: "1fr 64px 1fr", alignItems: "stretch" }}>
            <div
              style={{ padding: "20px 26px", display: "flex", alignItems: "center", gap: "10px", background: "var(--neutral-50)" }}
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
                style={{ width: "18px", height: "18px", color: "rgb(180, 69, 63)", flex: "0 0 auto" }}
                className="lucide lucide-circle-x"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
              <span
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "16px", color: "var(--neutral-600)" }}
              >
                {"Zonder mijnhuis.nu"}
              </span>
            </div>
            <div style={{ background: "var(--neutral-50)" }}></div>
            <div
              style={{ padding: "20px 26px", display: "flex", alignItems: "center", gap: "10px", background: "var(--indigo-50)", borderLeft: "1px solid var(--indigo-200)" }}
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
                style={{ width: "18px", height: "18px", color: "var(--green-700)", flex: "0 0 auto" }}
                className="lucide lucide-circle-check-big"
              >
                <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                <path d="m9 11 3 3L22 4" />
              </svg>
              <span
                style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16px", color: "var(--indigo-700)" }}
              >
                {"Met mijnhuis.nu"}
              </span>
            </div>
          </div>
          <div
            className="mh-barow"
            style={{ display: "grid", gridTemplateColumns: "1fr 64px 1fr", alignItems: "stretch", borderTop: "1px solid var(--border-subtle)" }}
          >
            <div style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(200, 74, 74, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "rgb(180, 69, 63)" }}
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"Leads uit het contactformulier in een gedeelde mailbox"}
                </span>
              </span>
            </div>
            <div
              className="mh-baarrow"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-300)" }}
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
                style={{ width: "17px", height: "17px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
            <div
              style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start", background: "var(--indigo-50)", borderLeft: "1px solid var(--indigo-200)" }}
            >
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"Elke aanvraag direct in het CRM, automatisch toegewezen aan een adviseur"}
                </span>
              </span>
            </div>
          </div>
          <div
            className="mh-barow"
            style={{ display: "grid", gridTemplateColumns: "1fr 64px 1fr", alignItems: "stretch", borderTop: "1px solid var(--border-subtle)" }}
          >
            <div style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(200, 74, 74, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "rgb(180, 69, 63)" }}
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"Aanvragen die soms dagen bleven liggen"}
                </span>
              </span>
            </div>
            <div
              className="mh-baarrow"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-300)" }}
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
                style={{ width: "17px", height: "17px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
            <div
              style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start", background: "var(--indigo-50)", borderLeft: "1px solid var(--indigo-200)" }}
            >
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"Dezelfde dag opgevolgd, met een herinnering als het te lang duurt"}
                </span>
              </span>
            </div>
          </div>
          <div
            className="mh-barow"
            style={{ display: "grid", gridTemplateColumns: "1fr 64px 1fr", alignItems: "stretch", borderTop: "1px solid var(--border-subtle)" }}
          >
            <div style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(200, 74, 74, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "rgb(180, 69, 63)" }}
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"Elke offerte via de eigenaar, want hij kende de prijzen"}
                </span>
              </span>
            </div>
            <div
              className="mh-baarrow"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-300)" }}
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
                style={{ width: "17px", height: "17px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
            <div
              style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start", background: "var(--indigo-50)", borderLeft: "1px solid var(--indigo-200)" }}
            >
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"Het hele kantoor maakt offertes met vaste pakketten en actuele prijzen"}
                </span>
              </span>
            </div>
          </div>
          <div
            className="mh-barow"
            style={{ display: "grid", gridTemplateColumns: "1fr 64px 1fr", alignItems: "stretch", borderTop: "1px solid var(--border-subtle)" }}
          >
            <div style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(200, 74, 74, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "rgb(180, 69, 63)" }}
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"Assortiment op drie plekken: webshop, prijslijst en in iemands hoofd"}
                </span>
              </span>
            </div>
            <div
              className="mh-baarrow"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-300)" }}
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
                style={{ width: "17px", height: "17px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
            <div
              style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start", background: "var(--indigo-50)", borderLeft: "1px solid var(--indigo-200)" }}
            >
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"E\u00e9n plek bijhouden, de website haalt het op via de API"}
                </span>
              </span>
            </div>
          </div>
          <div
            className="mh-barow"
            style={{ display: "grid", gridTemplateColumns: "1fr 64px 1fr", alignItems: "stretch", borderTop: "1px solid var(--border-subtle)" }}
          >
            <div style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(200, 74, 74, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "rgb(180, 69, 63)" }}
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"Groeien betekende meer administratie"}
                </span>
              </span>
            </div>
            <div
              className="mh-baarrow"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-300)" }}
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
                style={{ width: "17px", height: "17px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
            <div
              style={{ padding: "20px 26px", display: "flex", gap: "12px", alignItems: "flex-start", background: "var(--indigo-50)", borderLeft: "1px solid var(--indigo-200)" }}
            >
              <span
                style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "99px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                  style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span style={{ fontSize: "15.5px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.5" }}>
                <span className="sc-interp">
                  {"Van vier naar veertien mensen zonder extra administratiedruk"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
);
