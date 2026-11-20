import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import Sok from "./Sok";
import { useFremgang } from "../store/fremgang";
import Nedtelling from "./Nedtelling";

export default function Layout() {
  const [sokApen, setSokApen] = useState(false);
  const [menyApen, setMenyApen] = useState(false);
  const { pathname } = useLocation();
  const { aktivEksamen } = useFremgang();

  useEffect(() => setMenyApen(false), [pathname]);

  useEffect(() => {
    const tast = (e: KeyboardEvent) => {
      const mål = e.target as HTMLElement;
      const skriver = mål.tagName === "INPUT" || mål.tagName === "TEXTAREA" || mål.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !skriver)) {
        e.preventDefault();
        setSokApen(true);
      }
    };
    window.addEventListener("keydown", tast);
    return () => window.removeEventListener("keydown", tast);
  }, []);

  const iEksamen = pathname.startsWith("/eksamen/pagar");

  return (
    <div className="app">
      <a className="hopp-til-innhold" href="#hovedinnhold" onClick={(e) => { e.preventDefault(); document.getElementById("hovedinnhold")?.focus(); }}>
        Hopp til innholdet
      </a>
      <header className="toppfelt">
        <div className="toppfelt-indre">
          <Link to="/" className="merke" aria-label="TDT4172 Eksamensportal, til startsiden">
            <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="var(--accent)" />
              <rect x="6" y="18" width="5" height="8" rx="1" fill="#26828e" />
              <rect x="13.5" y="12" width="5" height="14" rx="1" fill="#35b779" />
              <rect x="21" y="6" width="5" height="20" rx="1" fill="#fde725" />
            </svg>
            <span className="merke-tekst">
              <strong>TDT4172</strong>
              <span>Introduksjon til maskinlæring</span>
            </span>
          </Link>
          <nav className={`hovedmeny ${menyApen ? "apen" : ""}`} aria-label="Hovedmeny">
            <NavLink to="/pensum">Pensum</NavLink>
            <NavLink to="/trening" className={({ isActive }) => (isActive || pathname.startsWith("/trening") || pathname.startsWith("/eksamen") ? "active" : "")}>
              Eksamenstrening
            </NavLink>
            <NavLink to="/formelark">Formelark</NavLink>
            <NavLink to="/begreper">Begreper</NavLink>
            <NavLink to="/fremgang">Fremgang</NavLink>
          </nav>
          <div className="toppfelt-handlinger">
            <button type="button" className="sokeknapp" onClick={() => setSokApen(true)} aria-label="Søk i pensum (Ctrl+K)">
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="sokeknapp-tekst">Søk</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              type="button"
              className="menyknapp"
              aria-expanded={menyApen}
              aria-label={menyApen ? "Lukk menyen" : "Åpne menyen"}
              onClick={() => setMenyApen((v) => !v)}
            >
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                {menyApen ? (
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {aktivEksamen && !iEksamen && (
          <div className="eksamensbanner" role="status">
            <span>
              Du har en eksamen i gang
              {aktivEksamen.frist && (
                <>
                  {" "}
                  med <Nedtelling frist={aktivEksamen.frist} /> igjen
                </>
              )}
              .
            </span>
            <Link to="/eksamen/pagar" className="knapp knapp-liten">
              Fortsett eksamen
            </Link>
          </div>
        )}
      </header>
      <main id="hovedinnhold" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="bunnfelt">
        <p>
          Laget for eksamensforberedelse i TDT4172 ved NTNU. Bygger på forelesningsnotatene, slidene F2–F13, eksamen 2024 og 2025,
          øvingene og kunngjøringene. Fremgangen din lagres bare i denne nettleseren.
        </p>
      </footer>
      {sokApen && <Sok onLukk={() => setSokApen(false)} />}
    </div>
  );
}
