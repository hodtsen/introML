import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router";
import Layout from "./components/Layout";
import Hjem from "./pages/Hjem";
import PensumSide from "./pages/PensumSide";
import PensumOversikt from "./pages/PensumOversikt";
import Trening from "./pages/Trening";
import IkkeFunnet from "./pages/IkkeFunnet";
import Laster from "./components/Laster";

const Formelark = lazy(() => import("./pages/Formelark"));
const Begrepsliste = lazy(() => import("./pages/Begrepsliste"));
const Okt = lazy(() => import("./pages/Okt"));
const EksamenOppsettSide = lazy(() => import("./pages/EksamenOppsett"));
const EksamenPagar = lazy(() => import("./pages/EksamenPagar"));
const EksamenResultatSide = lazy(() => import("./pages/EksamenResultat"));
const Fremgang = lazy(() => import("./pages/Fremgang"));

function TilToppen() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <TilToppen />
      <Suspense fallback={<Laster />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Hjem />} />
            <Route path="pensum" element={<PensumOversikt />} />
            <Route path="pensum/:id" element={<PensumSide />} />
            <Route path="formelark" element={<Formelark />} />
            <Route path="begreper" element={<Begrepsliste />} />
            <Route path="trening" element={<Trening />} />
            <Route path="trening/okt" element={<Okt />} />
            <Route path="eksamen" element={<EksamenOppsettSide />} />
            <Route path="eksamen/pagar" element={<EksamenPagar />} />
            <Route path="eksamen/resultat/:id" element={<EksamenResultatSide />} />
            <Route path="fremgang" element={<Fremgang />} />
            <Route path="*" element={<IkkeFunnet />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
