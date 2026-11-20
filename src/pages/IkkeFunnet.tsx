import { Link } from "react-router";

export default function IkkeFunnet() {
  return (
    <div className="side smal">
      <h1>Siden finnes ikke</h1>
      <p>Adressen peker ikke til noe delkapittel eller noen side i portalen. Kanskje lenken er skrevet feil.</p>
      <div className="handlinger">
        <Link to="/" className="knapp">Til startsiden</Link>
        <Link to="/pensum" className="knapp knapp-sekundaer">Til pensumoversikten</Link>
      </div>
    </div>
  );
}
