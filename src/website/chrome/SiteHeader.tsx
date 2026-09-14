import { useState } from "react";
import { MegaPanel } from "./MegaPanel";
import { MobileMenu } from "./MobileMenu";

export const SiteHeader = () => {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      onMouseLeave={() => setMegaOpen(false)}
      style={{ position: "sticky", top: 0, zIndex: 50, isolation: "isolate", background: "#fff", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="mh-container" style={{ display: "flex", alignItems: "center", gap: "24px", padding: "14px 24px" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", flex: "0 0 auto" }}>
          <img src="/__l5e/assets-v1/ba7e4693-1309-4590-9020-c0cfb5ed54b3/img15.png" width="32" height="32" alt="mijnhuis.nu logo" style={{ display: "block" }} />
          <span
            style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "20px", letterSpacing: "-0.02em", color: "var(--night-indigo)" }}
          >
            {"mijnhuis"}
            <span style={{ color: "var(--color-primary)" }}>
              {".nu"}
            </span>
          </span>
        </a>
        <nav className="mh-navlinks" style={{ display: "flex", gap: "2px", marginLeft: "20px", alignItems: "center" }}>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={megaOpen}
            onClick={() => setMegaOpen((v) => !v)}
            onMouseEnter={() => setMegaOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "8px", fontSize: "15px", fontFamily: "var(--font-body)", fontWeight: "500", color: "var(--text-body)", background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {"Oplossingen"}
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
              style={{ width: "15px", height: "15px", transition: "transform var(--dur-base) var(--ease-standard)", transform: megaOpen ? "rotate(180deg)" : "none" }}
              className="lucide lucide-chevron-down"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <a
            href="/branches"
            style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "15px", fontWeight: "500", color: "var(--text-body)", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <span className="sc-interp">
              {"Branches"}
            </span>
          </a>
          <a
            href="/prijzen"
            style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "15px", fontWeight: "500", color: "var(--text-body)", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <span className="sc-interp">
              {"Prijzen"}
            </span>
          </a>
          <a
            href="/succesverhalen"
            style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "15px", fontWeight: "500", color: "var(--text-body)", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <span className="sc-interp">
              {"Succesverhalen"}
            </span>
          </a>
          <a
            href="/contact"
            style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "15px", fontWeight: "500", color: "var(--text-body)", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <span className="sc-interp">
              {"Contact"}
            </span>
          </a>
        </nav>
        <div className="mh-navcta" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <span aria-hidden="true" style={{ width: "1px", height: "26px", background: "var(--border-subtle)", marginRight: "2px" }}></span>
          <a
            href="/login"
            className="scp0"
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14.5px", fontWeight: "600", color: "var(--neutral-600)", padding: "8px 4px" }}
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
              style={{ width: "15px", height: "15px" }}
              className="lucide lucide-log-in"
            >
              <path d="m10 17 5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            </svg>
            {"Inloggen"}
          </a>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <a
              href="/demo"
              className="mh-btn"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-sm)", padding: "0px 16px", fontSize: "14px", background: "var(--color-primary)", color: "var(--white)" }}
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
                style={{ width: "15px", height: "15px" }}
                className="lucide lucide-calendar-check"
              >
                <path d="M8 2v3" />
                <path d="M16 2v3" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="m9 15 2 2 4-4" />
              </svg>
              {"Plan een demo"}
            </a>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <a
              href="/proefperiode"
              className="mh-btn"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-sm)", padding: "0px 16px", fontSize: "14px", background: "var(--color-accent)", color: "var(--white)" }}
            >
              <span className="sc-interp">
                {"Start gratis"}
              </span>
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="mh-hamb"
          aria-label="Menu openen"
          style={{ marginLeft: "auto", width: "44px", height: "44px", border: "1px solid var(--border-subtle)", borderRadius: "10px", background: "rgb(255, 255, 255)", cursor: "pointer" }}
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
            style={{ width: "20px", height: "20px" }}
            className="lucide lucide-menu"
          >
            <path d="M4 5h16" />
            <path d="M4 12h16" />
            <path d="M4 19h16" />
          </svg>
        </button>
      </div>
      {megaOpen ? <MegaPanel /> : null}
      {mobileOpen ? <MobileMenu /> : null}
    </header>
  );
};
