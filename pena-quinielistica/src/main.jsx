import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Trophy, CalendarDays, BarChart3, Settings, Upload, RefreshCw } from "lucide-react";
import "./styles.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const tabs = [
  ["ranking", "Ranking", Trophy],
  ["jornada", "Jornada", CalendarDays],
  ["stats", "Estadísticas", BarChart3],
  ["admin", "Admin", Settings]
];

function App() {
  const [tab, setTab] = useState("ranking");
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadParticipants() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("participants")
      .select("id,name,quiniela,column_number")
      .order("quiniela")
      .order("column_number");

    if (error) {
      console.error(error);
      setError("No se han podido cargar los participantes desde Supabase.");
    } else {
      setParticipants((data || []).map(p => ({ ...p, hits: 0 })));
    }
    setLoading(false);
  }

  useEffect(() => { loadParticipants(); }, []);

  return (
    <>
      <header>
        <div className="logo"><Trophy /></div>
        <div><b>Peña Quinielística</b><small>Temporada 2026/27 · Ranking oficial</small></div>
        <span>Jornada 1</span>
      </header>
      <main>
        <section className="hero">
          <div><em>EMPEZAMOS DE 0</em><h1>¿Quién será el campeón?</h1><p>16 participantes · 2 quinielas · clasificación jornada a jornada</p></div>
          <Trophy size={50} />
        </section>
        <nav>{tabs.map(([id,name,Icon]) =>
          <button key={id} className={tab===id ? "on" : ""} onClick={()=>setTab(id)}><Icon size={17}/>{name}</button>
        )}</nav>
        {tab==="ranking" && <Ranking participants={participants} loading={loading} error={error} reload={loadParticipants}/>}
        {tab==="jornada" && <Jornada/>}
        {tab==="stats" && <Simple title="Estadísticas" icon={BarChart3} text="Aquí veremos medias, mejores jornadas y evolución cuando empecemos a registrar resultados."/>}
        {tab==="admin" && <Simple title="Panel administrador" icon={Settings} text="Aquí añadiremos la gestión de jornadas, resultados y fotografías."/>}
      </main>
      <footer>Peña Quinielística · Ranking desde 0</footer>
    </>
  );
}

function Ranking({participants,loading,error,reload}) {
  const ranking=[...participants].sort((a,b)=>b.hits-a.hits || a.column_number-b.column_number);
  return <section>
    <div className="sectionTitle"><div><h2>Clasificación</h2><p className="muted">Jornada 1 · todos parten de 0</p></div><button className="refresh" onClick={reload}><RefreshCw size={16}/></button></div>
    {loading && <div className="box"><p>Cargando participantes desde Supabase...</p></div>}
    {error && <div className="box"><p>{error}</p></div>}
    {!loading && !error && <div className="table"><table><thead><tr><th>Pos.</th><th>Participante</th><th>Quiniela</th><th>Col.</th><th>J1</th><th>Total</th></tr></thead><tbody>
      {ranking.map((p,i)=><tr key={p.id}><td>{i+1}</td><td><b>{p.name}</b></td><td>{p.quiniela}</td><td>{p.column_number}</td><td>{p.hits}</td><td><b>{p.hits}</b></td></tr>)}
    </tbody></table></div>}
  </section>;
}

function Jornada() {
  return <section><h2>Jornada 1</h2><p className="muted">Resultados y aciertos aparecerán aquí.</p><div className="box"><Upload/><div><b>Actualización por fotos</b><p>El administrador podrá cargar las dos imágenes de la quiniela y registrar los resultados.</p></div></div></section>;
}

function Simple({title,icon:Icon,text}) {
  return <section><h2>{title}</h2><div className="box"><Icon/><div><b>{title}</b><p>{text}</p></div></div></section>;
}

createRoot(document.getElementById("root")).render(<App />);
