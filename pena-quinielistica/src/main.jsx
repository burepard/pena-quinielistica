import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  Trophy, CalendarDays, BarChart3, Settings, RefreshCw,
  ChevronRight, Medal
} from "lucide-react";
import "./styles.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const tabs = [
  ["ranking", "Clasificación", Trophy],
  ["jornadas", "Jornadas", CalendarDays],
  ["stats", "Estadísticas", BarChart3],
  ["admin", "Admin", Settings]
];

function App() {
  const [tab, setTab] = useState("ranking");
  const [participants, setParticipants] = useState([]);
  const [jornadasJugadas, setJornadasJugadas] = useState(0);
  const [aciertosTotales, setAciertosTotales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadParticipants() {
    setLoading(true);
    setError("");

    // 1. Cargar participantes
    const { data: participantsData, error: participantsError } =
      await supabase
        .from("participants")
        .select("id,name,quiniela,column_number")
        .order("column_number");

    if (participantsError) {
      console.error("ERROR PARTICIPANTES:", participantsError);
      setError("No se han podido cargar los participantes.");
      setLoading(false);
      return;
    }

    // 2. Cargar todas las puntuaciones
    const { data: scoresData, error: scoresError } =
      await supabase
        .from("scores")
        .select("participant_id,hits,jornada_id");

    if (scoresError) {
      console.error("ERROR SCORES:", scoresError);
      setError("No se han podido cargar los resultados.");
      setLoading(false);
      return;
    }

    console.log("PARTICIPANTES:", participantsData);
    console.log("SCORES:", scoresData);

    // 3. Calcular jornadas jugadas
    const jornadas = new Set(
      (scoresData || []).map(s => s.jornada_id)
    );

    setJornadasJugadas(jornadas.size);

    // 4. Calcular total de aciertos de toda la peña
    const total = (scoresData || []).reduce(
      (sum, s) => sum + Number(s.hits || 0),
      0
    );

    setAciertosTotales(total);

    // 5. Acumular los puntos de cada participante
    const participantsWithScores = (participantsData || []).map(p => {
      const participantScores = (scoresData || []).filter(
        s => Number(s.participant_id) === Number(p.id)
      );

      const totalHits = participantScores.reduce(
        (sum, s) => sum + Number(s.hits || 0),
        0
      );

      return {
        ...p,
        hits: totalHits
      };
    });

    setParticipants(participantsWithScores);
    setLoading(false);
  }

  useEffect(() => {
    loadParticipants();
  }, []);

  const ranking = useMemo(
    () =>
      [...participants].sort(
        (a, b) =>
          b.hits - a.hits ||
          a.column_number - b.column_number
      ),
    [participants]
  );

  return (
    <div className="app-shell">

      <header className="topbar">
        <div className="topbar-inner">

          <div className="brand">
            <div className="brand-shield">
              <Trophy size={22}/>
            </div>

            <div>
              <div className="brand-title">
                PEÑA QUINIELÍSTICA
              </div>

              <div className="brand-subtitle">
                Temporada 2026/27
              </div>
            </div>
          </div>

          <div className="matchday">
            <span>JORNADA</span>
            <strong>{jornadasJugadas || 1}</strong>
          </div>

        </div>
      </header>

      <main className="page">

        {tab === "ranking" && (
          <Ranking
            ranking={ranking}
            jornadasJugadas={jornadasJugadas}
            aciertosTotales={aciertosTotales}
            loading={loading}
            error={error}
            reload={loadParticipants}
          />
        )}

        {tab === "jornadas" && (
          <Jornadas
            jornadasJugadas={jornadasJugadas}
          />
        )}

        {tab === "stats" && (
          <Stats
            ranking={ranking}
            jornadasJugadas={jornadasJugadas}
          />
        )}

        {tab === "admin" && <Admin/>}

      </main>

      <nav className="bottom-nav">

        {tabs.map(([id, name, Icon]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon size={19}/>
            <span>{name}</span>
          </button>
        ))}

      </nav>

    </div>
  );
}

function Ranking({
  ranking,
  jornadasJugadas,
  aciertosTotales,
  loading,
  error,
  reload
}) {

  const podium = ranking.slice(0, 3);

  return (
    <>

      <section className="hero-dashboard">

        <div className="hero-logo-wrap">
          <img
            src="/pena-logo.png"
            alt="Peña Quinielística"
            className="hero-logo"
          />
        </div>

        <div className="hero-copy">

          <div className="kicker">
            CLASIFICACIÓN GENERAL
          </div>

          <h1>
            Clasificación general
          </h1>

          <p>
            Todos parten de cero. Cada acierto cuenta.
          </p>

          <div className="hero-actions">

            <span>
              <b>{ranking.length}</b> participantes
            </span>

            <span>
              <b>{jornadasJugadas}</b> jornadas jugadas
            </span>

            <span>
              <b>{aciertosTotales}</b> aciertos totales
            </span>

          </div>

        </div>

        <button
          className="icon-button hero-refresh"
          onClick={reload}
          title="Actualizar"
        >
          <RefreshCw size={18}/>
        </button>

      </section>


      <section className="podium">

        {podium.map((p, i) => (

          <div
            className={`podium-card rank-${i + 1}`}
            key={p.id}
          >

            <div className="medal">
              <Medal size={18}/>
              <span>{i + 1}</span>
            </div>

            <div className="podium-name">
              {p.name}
            </div>

            <div className="podium-score">
              {p.hits}
              <small> aciertos</small>
            </div>

          </div>

        ))}

      </section>


      <section className="ranking-card">

        <div className="card-header">

          <div>
            <h2>Clasificación</h2>

            <p>
              {jornadasJugadas > 0
                ? `Jornada ${jornadasJugadas} · acumulado`
                : "Todavía no hay jornadas jugadas"
              }
            </p>
          </div>

          <span className="season-badge">
            2026/27
          </span>

        </div>


        {loading && (
          <div className="state">
            Cargando clasificación...
          </div>
        )}

        {error && (
          <div className="state error">
            {error}
          </div>
        )}


        {!loading && !error && (

          <div className="ranking-list">

            {ranking.map((p, i) => (

              <div
                className="ranking-row"
                key={p.id}
              >

                <div
                  className={`position ${
                    i < 3 ? "top" : ""
                  }`}
                >
                  {i + 1}
                </div>

                <div className="avatar">
                  {initials(p.name)}
                </div>

                <div className="player-name">
                  {p.name}
                </div>

                <div className="trend">
                  —
                </div>

                <div className="points">
                  <strong>{p.hits}</strong>
                  <small> aciertos</small>
                </div>

                <ChevronRight
                  size={17}
                  className="row-arrow"
                />

              </div>

            ))}

          </div>

        )}

      </section>

    </>
  );
}


function Jornadas({ jornadasJugadas }) {

  return (

    <section className="page-section">

      <div className="section-title">

        <div className="kicker">
          HISTÓRICO
        </div>

        <h1>
          Jornadas
        </h1>

        <p>
          Consulta los resultados de cada jornada.
        </p>

      </div>


      <div className="empty-state">

        <CalendarDays size={42}/>

        <h2>
          {jornadasJugadas > 0
            ? `${jornadasJugadas} jornada${
                jornadasJugadas > 1 ? "s" : ""
              } completada${
                jornadasJugadas > 1 ? "s" : ""
              }`
            : "La temporada aún no ha comenzado"
          }
        </h2>

        <p>
          Aquí mostraremos los resultados,
          aciertos y clasificación de cada jornada.
        </p>

      </div>

    </section>

  );
}


function Stats({ ranking, jornadasJugadas }) {

  const mejorMarca =
    ranking.length > 0
      ? Math.max(...ranking.map(p => p.hits))
      : 0;

  return (

    <section className="page-section">

      <div className="section-title">

        <div className="kicker">
          TEMPORADA
        </div>

        <h1>
          Estadísticas
        </h1>

        <p>
          Todo lo que pasa en la peña.
        </p>

      </div>


      <div className="stat-grid">

        <div className="big-stat">
          <span>Participantes</span>
          <strong>{ranking.length}</strong>
          <small>en competición</small>
        </div>

        <div className="big-stat">
          <span>Jornadas</span>
          <strong>{jornadasJugadas}</strong>
          <small>completadas</small>
        </div>

        <div className="big-stat">
          <span>Mejor marca</span>
          <strong>{mejorMarca}</strong>
          <small>aciertos</small>
        </div>

      </div>


      <div className="empty-state compact">

        <BarChart3 size={34}/>

        <h2>
          Estadísticas de la temporada
        </h2>

        <p>
          Aquí iremos añadiendo medias,
          evolución y mejores jornadas.
        </p>

      </div>

    </section>

  );
}


function Admin() {

  return (

    <section className="page-section">

      <div className="section-title">

        <div className="kicker">
          PRIVADO
        </div>

        <h1>
          Administración
        </h1>

        <p>
          Gestión de la peña.
        </p>

      </div>


      <div className="admin-card">

        <Settings size={30}/>

        <div>

          <h2>
            Panel de administrador
          </h2>

          <p>
            Aquí prepararemos la creación de jornadas,
            resultados y carga de las dos quinielas.
          </p>

          <button className="primary">
            Próximamente
          </button>

        </div>

      </div>

    </section>

  );
}


function initials(name) {

  return name
    .split(" ")
    .map(x => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

}


createRoot(
  document.getElementById("root")
).render(<App/>);
