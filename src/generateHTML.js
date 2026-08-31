// complete generator script
const fs = require('fs');
const path = require('path');

function makeWebcalLink(filename) {
  const baseUrl = 'https://mragg.github.io/bbb-ics-generator/';
  return baseUrl + filename;
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(
      `Fehler beim Einlesen/Parsen von ${filePath}:`,
      err.message
    );
    return null;
  }
}

function normalizeId(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function genHTML() {
  const metaPath = path.resolve(
    __dirname,
    '../generated/metadata.json'
  );

  const teamsPath = path.resolve(
    __dirname,
    '../generated/teams.json'
  );

  const rawMeta = safeReadJson(metaPath) || [];
  const rawTeams = safeReadJson(teamsPath) || [];

  const metadataArray = Array.isArray(rawMeta)
    ? rawMeta
    : (rawMeta.teams || rawMeta.data || []);

  const teamsArray = Array.isArray(rawTeams)
    ? rawTeams
    : (rawTeams.teams || rawTeams.data || []);

  const teams = metadataArray.map(m => {
    const id = normalizeId(
      m.teamId ??
      m.id ??
      m.idStr ??
      m.identifier ??
      ''
    );

    return {
      teamId: id,
      name: m.teamName ?? m.name ?? m.title ?? 'Unbenannt',
      ageGroup: m.ageGroup ?? '',
      matchCount: m.matchCount ?? m.matches ?? 0,
      homeMatchCount: m.homeMatchCount ?? m.homeMatches ?? 0,
      awayMatchCount: m.awayMatchCount ?? m.awayMatches ?? 0,
    };
  });

  const content = `<!DOCTYPE html>
<html lang="de">
<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
  TV Neunkirchen Baskets – Kalender Übersicht
</title>

<link
  href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&family=Inter:wght@300;400;600&display=swap"
  rel="stylesheet"
>

<style>

:root{
  --tvn-orange:#ff7a18;
  --tvn-orange-dark:#e86400;
  --tvn-orange-light:#ff9a3d;
  --tvn-white:#ffffff;
  --tvn-bg:#fff7f0;
  --tvn-surface:#ffffff;
  --tvn-text:#24160f;
  --tvn-muted:#6d5a50;
  --tvn-border:rgba(255,122,24,.18);
}

/* =========================
   RESET / GLOBAL
   ========================= */

*{
  box-sizing:border-box;
}

html,
body{
  height:100%;
}

html{
  scroll-behavior:smooth;
}

body{
  margin:0;

  font-family:'Inter',sans-serif;

  background:
    radial-gradient(
      circle at top left,
      rgba(255,154,61,.18),
      transparent 28%
    ),
    radial-gradient(
      circle at top right,
      rgba(255,122,24,.14),
      transparent 24%
    ),
    linear-gradient(
      180deg,
      #fffaf6 0%,
      var(--tvn-bg) 100%
    );

  color:var(--tvn-text);

  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

/* =========================
   HEADER
   ========================= */

header{
  background:
    linear-gradient(
      135deg,
      var(--tvn-orange-dark),
      var(--tvn-orange),
      var(--tvn-orange-light)
    );

  color:var(--tvn-white);

  padding:18px 20px;

  box-shadow:
    0 10px 30px rgba(255,122,24,.25);
}

.header-inner{
  display:flex;
  gap:16px;
  align-items:flex-start;
  flex-wrap:wrap;
  max-width:960px;
  margin:0 auto;
}

.logo{
  height:120px;
  flex-shrink:0;
}

.header-text{
  display:flex;
  flex-direction:column;
  justify-content:center;
  flex:1;
}

.header-text h1{
  font-family:'Oswald',sans-serif;
  font-size:1.9rem;
  margin:0;
  text-transform:uppercase;
}

.header-text p{
  margin-top:6px;
  font-weight:300;
  opacity:0.95;
  font-size:0.95rem;
}

/* =========================
   LAYOUT
   ========================= */

.container{
  max-width:960px;
  margin:28px auto;
  padding:0 16px;
}

.teams-container{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  margin-top:14px;
  align-items:flex-start;
}

/* =========================
   TEAM CARD
   ========================= */

.team-card{
  background:var(--tvn-surface);

  border-radius:14px;

  border:1px solid var(--tvn-border);

  box-shadow:
    0 4px 12px rgba(0,0,0,0.08);

  flex:1 1 220px;
  min-width:220px;

  display:flex;
  flex-direction:column;

  position:relative;
}

.team-header{
  padding:12px 14px;

  font-weight:600;

  font-family:'Oswald',sans-serif;

  background:
    linear-gradient(
      135deg,
      var(--tvn-orange-dark),
      var(--tvn-orange)
    );

  color:var(--tvn-white);

  border-radius:14px 14px 0 0;

  cursor:pointer;
}

.team-card .team-content-preview{
  padding:12px 14px;
}

.team-content-preview p{
  margin:10px 0 0;
  color:var(--tvn-muted);
}

/* =========================
   TEAM POPUP
   ========================= */

.team-content{
  position:fixed;
  display:none;

  background:#fff;

  padding:18px;

  border-radius:10px;

  box-shadow:
    0 18px 40px rgba(0,0,0,0.25);

  z-index:12000;

  max-height:80vh;

  overflow:auto;

  box-sizing:border-box;
}

/* =========================
   TEAM BUTTONS
   ========================= */

.team-content .buttons{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:12px;
  align-items:flex-start;
}

.team-content .buttons a{
  display:inline-block;

  padding:10px 16px;

  background:
    linear-gradient(
      135deg,
      var(--tvn-orange-dark),
      var(--tvn-orange)
    );

  color:var(--tvn-white);

  text-decoration:none;

  border-radius:6px;

  font-weight:600;
  font-size:0.9rem;

  transition:
    transform 0.12s,
    filter 0.12s;
}

.team-content .buttons a:hover{
  filter:brightness(1.03);
  transform:translateY(-2px);
}

/* =========================
   STEPS
   ========================= */

.step-box{
  background:var(--tvn-surface);

  margin-bottom:12px;

  border-radius:8px;

  overflow:hidden;

  box-shadow:
    0 3px 8px rgba(0,0,0,0.06);

  border:1px solid var(--tvn-border);
}

.step-header{
  padding:12px 14px;

  cursor:pointer;

  font-weight:600;

  background:
    linear-gradient(
      135deg,
      var(--tvn-orange-dark),
      var(--tvn-orange)
    );

  color:var(--tvn-white);

  font-family:'Oswald',sans-serif;

  position:relative;

  padding-right:40px;

  user-select:none;
}

.step-header::after{
  content:'▾';

  position:absolute;

  right:12px;

  top:50%;

  transform:
    translateY(-50%)
    rotate(0deg);

  transition:
    transform 0.18s ease,
    opacity 0.12s;

  opacity:0.95;

  font-size:1.05rem;

  line-height:1;
}

.step-header.open::after{
  transform:
    translateY(-50%)
    rotate(180deg);
}

.step-content{
  padding:12px 14px;

  display:none;

  font-size:0.95rem;

  line-height:1.45;

  background:#fffaf5;
}

/* =========================
   GUIDE BUTTON
   ========================= */

.guide-btn{
  display:inline-block;

  padding:12px 14px;

  cursor:pointer;

  font-weight:600;

  font-family:'Oswald',sans-serif;

  background:
    linear-gradient(
      135deg,
      var(--tvn-orange-dark),
      var(--tvn-orange)
    );

  color:var(--tvn-white);

  border-radius:10px;

  border:none;

  margin-bottom:12px;
}

/* =========================
   STEPS MODAL
   ========================= */

#steps-backdrop{
  display:none;

  position:fixed;

  inset:0;

  background:rgba(0,0,0,0.45);

  z-index:14000;
}

#steps-wrapper{
  display:none;

  position:fixed;

  top:50%;

  left:50%;

  transform:
    translate(-50%,-50%);

  width:90%;

  max-width:720px;

  max-height:80vh;

  overflow-y:auto;

  background:#fff;

  padding:20px;

  border-radius:12px;

  box-shadow:
    0 25px 60px rgba(0,0,0,0.35);

  z-index:15000;

  box-sizing:border-box;
}

.steps-close{
  position:absolute;

  top:12px;

  right:12px;

  background:transparent;

  border:none;

  font-size:1.6rem;

  line-height:1;

  cursor:pointer;

  color:#222;

  padding:6px;
}

/* =========================
   TEAM POPUP CLOSE
   ========================= */

.overlay-close{
  display:none;

  position:absolute;

  right:12px;

  top:10px;

  background:transparent;

  border:none;

  font-size:1.6rem;

  cursor:pointer;

  color:#222;
}

/* =========================
   BOTTOM LINK
   ========================= */

.page-bottom{
  max-width:960px;

  margin:28px auto 0;

  padding:0 16px 18px;
}

.bottom-card{
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.92),
      rgba(255,248,241,.98)
    );

  border:1px solid var(--tvn-border);

  border-radius:16px;

  box-shadow:
    0 4px 12px rgba(0,0,0,0.08);

  padding:18px;

  display:flex;

  justify-content:center;

  align-items:center;
}

.back-link{
  display:inline-block;

  padding:12px 18px;

  background:
    linear-gradient(
      135deg,
      var(--tvn-orange-dark),
      var(--tvn-orange)
    );

  color:#fff;

  text-decoration:none;

  border-radius:8px;

  font-weight:700;

  box-shadow:
    0 8px 18px rgba(255,122,24,.18);
}

/* =========================
   REPORT
   ========================= */

.report-section{
  max-width:960px;

  margin:12px auto 0;

  padding:0 16px 18px;
}

.report-card{
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.96),
      rgba(255,248,241,.98)
    );

  border:1px solid var(--tvn-border);

  border-radius:16px;

  box-shadow:
    0 4px 12px rgba(0,0,0,0.08);

  padding:20px;

  text-align:center;
}

.report-card h2{
  margin:0 0 8px;

  font-family:'Oswald',sans-serif;

  font-size:1.35rem;
}

.report-card p{
  margin:0 auto 14px;

  color:var(--tvn-muted);

  line-height:1.45;

  max-width:650px;
}

.report-btn{
  display:inline-block;

  padding:12px 20px;

  border:none;

  border-radius:9px;

  cursor:pointer;

  font-family:'Oswald',sans-serif;

  font-weight:600;

  font-size:1rem;

  background:
    linear-gradient(
      135deg,
      var(--tvn-orange-dark),
      var(--tvn-orange)
    );

  color:#fff;

  box-shadow:
    0 8px 18px rgba(255,122,24,.18);

  transition:
    transform .12s,
    filter .12s;
}

.report-btn:hover{
  filter:brightness(1.04);
  transform:translateY(-2px);
}

/* =========================
   REPORT MODAL
   ========================= */

#report-backdrop{
  display:none;

  position:fixed;

  inset:0;

  background:rgba(0,0,0,.5);

  z-index:16000;
}

#report-modal{
  display:none;

  position:fixed;

  top:50%;

  left:50%;

  transform:
    translate(-50%,-50%);

  width:92%;

  max-width:680px;

  max-height:88vh;

  overflow-y:auto;

  background:#fff;

  padding:22px;

  border-radius:14px;

  box-shadow:
    0 25px 70px rgba(0,0,0,.4);

  z-index:17000;
}

.report-modal-header{
  display:flex;

  align-items:center;

  justify-content:space-between;

  gap:16px;

  margin-bottom:16px;
}

.report-modal-header h2{
  margin:0;

  font-family:'Oswald',sans-serif;

  font-size:1.5rem;
}

.report-close{
  background:transparent;

  border:none;

  font-size:1.8rem;

  line-height:1;

  cursor:pointer;

  color:#222;

  padding:4px 6px;
}

.report-form-group{
  margin-bottom:15px;

  text-align:left;
}

.report-form-group label{
  display:block;

  margin-bottom:6px;

  font-weight:600;
}

.report-form-group input,
.report-form-group select,
.report-form-group textarea{
  width:100%;

  border:
    1px solid
    rgba(36,22,15,.18);

  border-radius:8px;

  padding:11px 12px;

  font:inherit;

  color:var(--tvn-text);

  background:#fff;

  outline:none;
}

.report-form-group input:focus,
.report-form-group select:focus,
.report-form-group textarea:focus{
  border-color:var(--tvn-orange);

  box-shadow:
    0 0 0 3px
    rgba(255,122,24,.12);
}

.report-form-group textarea{
  min-height:160px;

  resize:vertical;
}

.report-help{
  font-size:.88rem;

  color:var(--tvn-muted);

  margin-top:6px;
}

.report-actions{
  display:flex;

  justify-content:flex-end;

  gap:10px;

  margin-top:18px;

  flex-wrap:wrap;
}

.report-cancel-btn,
.report-submit-btn{
  border:none;

  border-radius:8px;

  padding:11px 16px;

  font:inherit;

  font-weight:600;

  cursor:pointer;
}

.report-cancel-btn{
  background:#eee;

  color:#222;
}

.report-cancel-btn:hover{
  background:#e2e2e2;
}

.report-submit-btn{
  background:
    linear-gradient(
      135deg,
      var(--tvn-orange-dark),
      var(--tvn-orange)
    );

  color:#fff;
}

.report-submit-btn:hover{
  filter:brightness(1.04);
}

.report-submit-btn:disabled{
  opacity:.65;

  cursor:wait;

  transform:none;
}

.report-error{
  display:none;

  margin-top:12px;

  padding:10px 12px;

  border-radius:8px;

  background:#fff0f0;

  color:#a00000;

  font-size:.9rem;

  text-align:left;
}

.report-success{
  display:none;

  padding:12px 14px;

  margin-top:14px;

  border-radius:8px;

  background:#eef9ee;

  color:#216621;

  font-size:.92rem;

  line-height:1.4;
}

/* =========================
   FOOTER
   ========================= */

footer{
  padding:18px 16px 28px;

  text-align:center;

  color:var(--tvn-muted);

  font-size:0.95rem;
}

/* =========================
   MOBILE
   ========================= */

@media (max-width:600px){

  .teams-container{
    display:grid;

    grid-template-columns:1fr 1fr;

    gap:12px;

    padding-bottom:24px;
  }

  .team-card{
    min-width:0;
  }

  .team-content{
    left:0 !important;

    top:0 !important;

    width:100vw !important;

    height:100vh !important;

    max-height:none !important;

    border-radius:0 !important;

    padding:18px;

    overflow-y:auto;

    box-shadow:
      0 30px 60px
      rgba(0,0,0,0.35);
  }

  .overlay-close{
    display:block;
  }

  .team-content .buttons{
    flex-direction:column;

    align-items:stretch;
  }

  .team-content .buttons a{
    width:100%;

    margin:8px 0;

    text-align:center;
  }

  .guide-btn{
    width:100%;
  }

  #steps-wrapper{
    top:0;

    left:0;

    transform:none;

    width:100vw;

    height:100vh;

    max-height:none;

    border-radius:0;

    padding:
      48px
      18px
      18px
      18px;
  }

  .steps-close{
    top:12px;
    right:12px;
  }

  .back-link{
    width:100%;
    text-align:center;
  }

  .report-section{
    margin-top:10px;
  }

  .report-card{
    padding:18px;
  }

  /*
   * Report Modal:
   * echtes Vollbild auf Mobilgeräten.
   *
   * Dadurch bleibt das Formular auch beim
   * Öffnen der Tastatur geöffnet.
   */

  #report-modal{
    top:0;

    left:0;

    transform:none;

    width:100vw;

    height:100vh;

    max-height:none;

    border-radius:0;

    padding:18px;

    overflow-y:auto;

    -webkit-overflow-scrolling:touch;
  }

  .report-modal-header{
    padding-top:4px;
  }

  .report-actions{
    flex-direction:column;
  }

  .report-cancel-btn,
  .report-submit-btn{
    width:100%;
  }
}

</style>

</head>

<body>

<!-- =====================================================
     HEADER
     ===================================================== -->

<header>

  <div class="header-inner">

    <img
      src="Logo.png"
      class="logo"
      alt="TVN Logo"
    >

    <div class="header-text">

      <h1>
        TV Neunkirchen Baskets
      </h1>

      <p>
        Kalender Übersicht – automatisch aktualisiert<br>
        Stand:
        ${new Date().toLocaleString(
          'de-DE',
          {
            timeZone:
              'Europe/Berlin'
          }
        )}
      </p>

    </div>

  </div>

</header>

<!-- =====================================================
     TEAMS
     ===================================================== -->

<div class="container">

  <!-- Anleitung -->

  <button
    id="show-steps-btn"
    class="guide-btn"
    aria-expanded="false"
    aria-controls="steps-wrapper"
  >
    Anleitung anzeigen
  </button>

  <div
    id="steps-backdrop"
    tabindex="-1"
    aria-hidden="true"
  ></div>


  <div
    id="steps-template"
    style="display:none;"
  >

    <!-- Schritt 1 -->

    <div class="step-box">

      <div
        class="step-header"
        role="button"
        tabindex="0"
        aria-expanded="false"
      >
        Schritt 1 – URL kopieren
      </div>

      <div class="step-content">

        <p>
          Kopieren Sie die URL der gewünschten
          Kalenderdatei (Endung „.ics“).
        </p>

        <p>
          Auf Smartphones oder Tablets geschieht
          dies durch langes Drücken auf den Link
          und Auswahl von
          <strong>„Link kopieren“</strong>.
        </p>

        <p>
          Am Computer klicken Sie mit der rechten
          Maustaste auf den Link und wählen ebenfalls
          <strong>„Link kopieren“</strong>.
        </p>

      </div>

    </div>


    <!-- Schritt 2 -->

    <div class="step-box">

      <div
        class="step-header"
        role="button"
        tabindex="0"
        aria-expanded="false"
      >
        Schritt 2 – Kalender hinzufügen
      </div>

      <div class="step-content">

        <p>
          Öffnen Sie anschließend Ihre
          <strong>Kalender-Anwendung</strong>.
        </p>

        <p>
          Wählen Sie die Option
          <strong>„Kalender hinzufügen“</strong>
          und dann
          <strong>„Aus dem Internet“</strong>
          bzw. <strong>„Per URL“</strong>.
        </p>

      </div>

    </div>


    <!-- Schritt 3 -->

    <div class="step-box">

      <div
        class="step-header"
        role="button"
        tabindex="0"
        aria-expanded="false"
      >
        Schritt 3 – Link einfügen
      </div>

      <div class="step-content">

        <p>
          Fügen Sie den kopierten Link in
          das vorgesehene Feld ein.
        </p>

        <p>
          Bestätigen Sie anschließend das
          Abonnement.
        </p>

        <p>
          Der Kalender wird danach automatisch
          synchronisiert.
        </p>

        <p>
          Änderungen werden selbstständig
          übernommen, sobald sie auftreten.
        </p>

      </div>

    </div>

  </div>


  <div
    id="steps-wrapper"
    role="dialog"
    aria-modal="true"
    aria-hidden="true"
    style="display:none;"
  ></div>


  <!-- ===================================================
       TEAM LISTE
       =================================================== -->

  <div class="teams-container">

    ${teams.map((t, index) => `

      <div class="team-card">

        <div
          class="team-header"
          data-index="${index}"
        >

          ${t.name}

          ${
            t.ageGroup
              ? ` (<strong>${t.ageGroup}</strong>)`
              : ''
          }

        </div>


        <div
          class="team-content"
          aria-hidden="true"
        >

          <button
            class="overlay-close"
            aria-label="Schließen"
          >
            &times;
          </button>


          <div class="team-content-preview">

            ${t.name}

            ${
              t.ageGroup
                ? ` (<strong>${t.ageGroup}</strong>)`
                : ''
            }

            <p>
              ${t.matchCount} Spiele,
              Heim: ${t.homeMatchCount},
              Auswärts: ${t.awayMatchCount}
            </p>

          </div>


          <div class="buttons">

            <a
              href="${makeWebcalLink(
                t.teamId
                  ? t.teamId + '_all.ics'
                  : encodeURIComponent(t.name) + '_all.ics'
              )}"
            >
              Alle Spiele abonnieren
            </a>


            <a
              href="${makeWebcalLink(
                t.teamId
                  ? t.teamId + '_home.ics'
                  : encodeURIComponent(t.name) + '_home.ics'
              )}"
            >
              Nur Heimspiele abonnieren
            </a>


            <a
              href="${makeWebcalLink(
                t.teamId
                  ? t.teamId + '_away.ics'
                  : encodeURIComponent(t.name) + '_away.ics'
              )}"
            >
              Nur Auswärtsspiele abonnieren
            </a>

          </div>

        </div>

      </div>

    `).join('')}

  </div>

</div>


<!-- =====================================================
     ZURÜCK ZU DEN TEAMS
     ===================================================== -->

<div class="page-bottom">

  <div class="bottom-card">

    <a
      class="back-link"
      href="https://www.tvn-baskets.de/teams/"
    >
      Zurück zu den Teams
    </a>

  </div>

</div>


<!-- =====================================================
     FEHLER MELDEN
     ===================================================== -->

<div class="report-section">

  <div class="report-card">

    <h2>
      Fehler gefunden?
    </h2>

    <p>
      Falls etwas mit dem Kalender nicht stimmt,
      kannst du hier einen Fehler melden.
    </p>

    <button
      id="open-report-btn"
      class="report-btn"
      type="button"
    >
      🐞 Fehler melden
    </button>

  </div>

</div>


<!-- =====================================================
     REPORT BACKDROP
     ===================================================== -->

<div
  id="report-backdrop"
  aria-hidden="true"
></div>


<!-- =====================================================
     REPORT MODAL
     ===================================================== -->

<div
  id="report-modal"
  role="dialog"
  aria-modal="true"
  aria-hidden="true"
  aria-labelledby="report-modal-title"
>

  <div class="report-modal-header">

    <h2 id="report-modal-title">
      Fehler melden
    </h2>

    <button
      id="close-report-btn"
      class="report-close"
      type="button"
      aria-label="Schließen"
    >
      &times;
    </button>

  </div>


  <form id="report-form">

    <!-- =================================================
         HONEYPOT
         ================================================= -->

    <input
      type="text"
      id="report-website"
      name="website"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      style="
        position:absolute;
        left:-10000px;
        top:auto;
        width:1px;
        height:1px;
        overflow:hidden;
      "
    >


    <!-- =================================================
         TEAM
         ================================================= -->

    <div class="report-form-group">

      <label for="report-team">
        Betroffenes Team / Kalender
      </label>

      <select
        id="report-team"
        name="team"
        required
      >

        <option
          value=""
          selected
          disabled
        >
          Bitte Team auswählen
        </option>

        ${teams.map(t => `

          <option
            value="${t.teamId}"
          >
            ${t.name}${
              t.ageGroup
                ? ` (${t.ageGroup})`
                : ''
            }
          </option>

        `).join('')}

      </select>

    </div>


    <!-- =================================================
         KALENDER
         ================================================= -->

    <div class="report-form-group">

      <label for="report-calendar">
        Betroffener Kalender
      </label>

      <select
        id="report-calendar"
        name="calendar"
        required
      >

        <option
          value=""
          selected
          disabled
        >
          Bitte Kalender auswählen
        </option>

        <option value="Alle Spiele">
          Alle Spiele
        </option>

        <option value="Nur Heimspiele">
          Nur Heimspiele
        </option>

        <option value="Nur Auswärtsspiele">
          Nur Auswärtsspiele
        </option>

      </select>

    </div>


    <!-- =================================================
         TITEL
         ================================================= -->

    <div class="report-form-group">

      <label for="report-title">
        Titel
      </label>

      <input
        id="report-title"
        name="title"
        type="text"
        maxlength="120"
        placeholder="z. B. Spiel wird falsch angezeigt"
        required
      >

    </div>


    <!-- =================================================
         BESCHREIBUNG
         ================================================= -->

    <div class="report-form-group">

      <label for="report-description">
        Beschreibung
      </label>

      <textarea
        id="report-description"
        name="description"
        maxlength="5000"
        placeholder="Beschreibe möglichst genau, was falsch ist und was eigentlich passieren sollte."
        required
      ></textarea>

      <div class="report-help">
        Je genauer die Beschreibung ist,
        desto leichter kann der Fehler gefunden werden.
      </div>

    </div>


    <!-- =================================================
         FEHLER
         ================================================= -->

    <div
      id="report-error"
      class="report-error"
    ></div>


    <!-- =================================================
         ERFOLG
         ================================================= -->

    <div
      id="report-success"
      class="report-success"
    >
      Deine Fehlermeldung wurde erfolgreich
      übermittelt.
    </div>


    <!-- =================================================
         BUTTONS
         ================================================= -->

    <div class="report-actions">

      <button
        type="button"
        id="cancel-report-btn"
        class="report-cancel-btn"
      >
        Abbrechen
      </button>

      <button
        type="submit"
        class="report-submit-btn"
      >
        Meldung erstellen
      </button>

    </div>

  </form>

</div>


<!-- =====================================================
     FOOTER
     ===================================================== -->

<footer>
  TVN Baskets – Offizielle Kalenderübersicht
</footer>


<script>

/* =========================================================
   ANLEITUNG
   ========================================================= */

function bindStepHeadersInContainer(container) {

  if (!container) return;


  container
    .querySelectorAll('.step-header')
    .forEach(h => {

      const newH =
        h.cloneNode(true);


      if (
        !newH.hasAttribute('role')
      ) {

        newH.setAttribute(
          'role',
          'button'
        );

      }


      if (
        !newH.hasAttribute('tabindex')
      ) {

        newH.setAttribute(
          'tabindex',
          '0'
        );

      }


      newH.setAttribute(
        'aria-expanded',
        'false'
      );


      h.parentNode.replaceChild(
        newH,
        h
      );

    });


  container
    .querySelectorAll('.step-header')
    .forEach(h => {

      h.addEventListener(
        'click',
        (e) => {

          e.stopPropagation();


          const c =
            h.nextElementSibling;


          if (!c) return;


          const isOpen =
            window.getComputedStyle(c)
              .display ===
            'block';


          container
            .querySelectorAll('.step-content')
            .forEach(cc => {

              if (
                cc !== c
              ) {

                cc.style.display =
                  'none';


                const hh =
                  cc.previousElementSibling;


                if (
                  hh &&
                  hh.classList
                ) {

                  hh.classList.remove(
                    'open'
                  );

                }


                if (
                  hh &&
                  hh.setAttribute
                ) {

                  hh.setAttribute(
                    'aria-expanded',
                    'false'
                  );

                }

              }

            });


          if (isOpen) {

            c.style.display =
              'none';

            h.classList.remove(
              'open'
            );

            h.setAttribute(
              'aria-expanded',
              'false'
            );

          } else {

            c.style.display =
              'block';

            h.classList.add(
              'open'
            );

            h.setAttribute(
              'aria-expanded',
              'true'
            );

          }

        }
      );


      h.addEventListener(
        'keydown',
        (e) => {

          if (
            e.key === 'Enter' ||
            e.key === ' '
          ) {

            e.preventDefault();

            h.click();

          }

        }
      );

    });

}


/* =========================================================
   DOM INITIALISIERUNG
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    const template =
      document.getElementById(
        'steps-template'
      );

    const stepsWrapper =
      document.getElementById(
        'steps-wrapper'
      );

    const backdrop =
      document.getElementById(
        'steps-backdrop'
      );

    const guideBtn =
      document.getElementById(
        'show-steps-btn'
      );


    /* =======================================================
       REPORT ELEMENTE
       ======================================================= */

    const reportBtn =
      document.getElementById(
        'open-report-btn'
      );

    const reportModal =
      document.getElementById(
        'report-modal'
      );

    const reportBackdrop =
      document.getElementById(
        'report-backdrop'
      );

    const closeReportBtn =
      document.getElementById(
        'close-report-btn'
      );

    const cancelReportBtn =
      document.getElementById(
        'cancel-report-btn'
      );

    const reportForm =
      document.getElementById(
        'report-form'
      );

    const reportTitle =
      document.getElementById(
        'report-title'
      );

    const reportDescription =
      document.getElementById(
        'report-description'
      );

    const reportTeam =
      document.getElementById(
        'report-team'
      );

    const reportCalendar =
      document.getElementById(
        'report-calendar'
      );

    const reportError =
      document.getElementById(
        'report-error'
      );

    const reportSuccess =
      document.getElementById(
        'report-success'
      );

    const reportWebsite =
      document.getElementById(
        'report-website'
      );

    const reportSubmitButton =
      reportForm
        ? reportForm.querySelector(
            '.report-submit-btn'
          )
        : null;


    /*
     * Zeitpunkt des Öffnens.
     *
     * Wird für den 3-Sekunden-Schutz benötigt.
     */
    let reportOpenedAt = 0;


    /* =======================================================
       ANLEITUNG AUFBAUEN
       ======================================================= */

    if (
      template &&
      stepsWrapper
    ) {

      stepsWrapper.innerHTML =
        template.innerHTML;


      stepsWrapper.insertAdjacentHTML(
        'afterbegin',
        '<button id="close-steps-btn" class="steps-close" aria-label="Schließen">&times;</button>'
      );


      bindStepHeadersInContainer(
        stepsWrapper
      );

    }


    let activeContent =
      null;


    /* =======================================================
       TEAM OVERLAYS SCHLIESSEN
       ======================================================= */

    function closeAllOverlays() {

      document
        .querySelectorAll(
          '.team-content'
        )
        .forEach(c => {

          c.style.display =
            'none';

          c.setAttribute(
            'aria-hidden',
            'true'
          );

        });


      activeContent =
        null;

    }


    /* =======================================================
       ANLEITUNG ÖFFNEN
       ======================================================= */

    function openStepsModal() {

      /*
       * Report nicht öffnen lassen,
       * wenn die Anleitung aktiv ist.
       */

      closeAllOverlays();


      stepsWrapper.style.display =
        'block';


      stepsWrapper.setAttribute(
        'aria-hidden',
        'false'
      );


      backdrop.style.display =
        'block';


      backdrop.setAttribute(
        'aria-hidden',
        'false'
      );


      guideBtn.setAttribute(
        'aria-expanded',
        'true'
      );


      document.body.style.overflow =
        'hidden';


      const closeBtn =
        stepsWrapper.querySelector(
          '#close-steps-btn'
        );


      if (
        closeBtn &&
        typeof closeBtn.focus ===
          'function'
      ) {

        closeBtn.focus();

      }

    }


    /* =======================================================
       ANLEITUNG SCHLIESSEN
       ======================================================= */

    function closeStepsModal() {

      if (!stepsWrapper) return;


      stepsWrapper
        .querySelectorAll(
          '.step-content'
        )
        .forEach(c => {

          c.style.display =
            'none';


          const hh =
            c.previousElementSibling;


          if (
            hh &&
            hh.classList
          ) {

            hh.classList.remove(
              'open'
            );

          }


          if (
            hh &&
            hh.setAttribute
          ) {

            hh.setAttribute(
              'aria-expanded',
              'false'
            );

          }

        });


      stepsWrapper.style.display =
        'none';


      stepsWrapper.setAttribute(
        'aria-hidden',
        'true'
      );


      backdrop.style.display =
        'none';


      backdrop.setAttribute(
        'aria-hidden',
        'true'
      );


      guideBtn.setAttribute(
        'aria-expanded',
        'false'
      );


      /*
       * Wenn das Report-Modal offen ist,
       * darf Scrollen nicht wieder aktiviert werden.
       */

      if (
        reportModal.style.display !==
        'block'
      ) {

        document.body.style.overflow =
          '';

      }

    }


    /* =======================================================
       ANLEITUNG CLOSE BUTTON
       ======================================================= */

    const modalCloseBtn =
      document.getElementById(
        'close-steps-btn'
      );


    if (
      modalCloseBtn
    ) {

      modalCloseBtn.addEventListener(
        'click',
        (e) => {

          e.stopPropagation();

          closeStepsModal();

        }
      );

    }


    guideBtn.addEventListener(
      'click',
      (e) => {

        e.stopPropagation();


        const isOpen =
          stepsWrapper.style.display ===
          'block';


        if (isOpen) {

          closeStepsModal();

        } else {

          openStepsModal();

        }

      }
    );


    backdrop.addEventListener(
      'click',
      () => {

        closeStepsModal();

      }
    );


    /* =======================================================
       TEAM POPUPS
       ======================================================= */

    const teamHeaders =
      document.querySelectorAll(
        '.team-header'
      );


    teamHeaders.forEach(
      (header) => {

        const card =
          header.closest(
            '.team-card'
          );


        const content =
          card.querySelector(
            '.team-content'
          );


        if (content) {

          content.addEventListener(
            'click',
            e =>
              e.stopPropagation()
          );

        }


        if (content) {

          const closeBtn =
            content.querySelector(
              '.overlay-close'
            );


          if (closeBtn) {

            closeBtn.addEventListener(
              'click',
              e => {

                e.stopPropagation();


                content.style.display =
                  'none';


                content.setAttribute(
                  'aria-hidden',
                  'true'
                );


                activeContent =
                  null;

              }
            );

          }

        }


        header.addEventListener(
          'click',
          e => {

            e.stopPropagation();


            if (!content) return;


            if (
              stepsWrapper.style.display ===
              'block'
            ) {

              closeStepsModal();

            }


            if (
              activeContent ===
              content
            ) {

              content.style.display =
                'none';


              content.setAttribute(
                'aria-hidden',
                'true'
              );


              activeContent =
                null;


              return;

            }


            closeAllOverlays();


            if (
              !document.body.contains(
                content
              )
            ) {

              document.body.appendChild(
                content
              );

            }


            const isMobile =
              window.innerWidth <=
              600;


            if (isMobile) {

              content.style.position =
                'fixed';

              content.style.left =
                '0px';

              content.style.top =
                '0px';

              content.style.width =
                '100vw';

              content.style.height =
                '100vh';

              content.style.maxHeight =
                'none';

              content.style.display =
                'block';

              content.style.zIndex =
                12000;

              content.setAttribute(
                'aria-hidden',
                'false'
              );

              content.scrollTop =
                0;

              activeContent =
                content;


              return;

            }


            const rect =
              header.getBoundingClientRect();


            let desiredWidth =
              Math.max(
                rect.width * 2.2,
                360
              );


            const maxWidth =
              window.innerWidth *
              0.95;


            if (
              desiredWidth >
              maxWidth
            ) {

              desiredWidth =
                maxWidth;

            }


            const margin =
              28;


            let leftPos =
              rect.left;


            if (
              leftPos +
              desiredWidth >
              window.innerWidth -
              margin
            ) {

              leftPos =
                window.innerWidth -
                desiredWidth -
                margin;

            }


            if (
              leftPos <
              margin
            ) {

              leftPos =
                margin;

            }


            content.style.position =
              'fixed';


            content.style.display =
              'block';


            content.style.zIndex =
              12000;


            content.style.width =
              desiredWidth + 'px';


            content.style.maxHeight =
              '80vh';


            content.setAttribute(
              'aria-hidden',
              'false'
            );


            let topPos =
              rect.bottom;


            const contentHeight =
              content.offsetHeight;


            const viewportHeight =
              window.innerHeight;


            if (
              topPos +
              contentHeight >
              viewportHeight -
              20
            ) {

              topPos =
                rect.top -
                contentHeight;

            }


            if (
              topPos <
              20
            ) {

              topPos =
                20;

            }


            content.style.top =
              topPos + 'px';


            content.style.left =
              leftPos + 'px';


            activeContent =
              content;

          }

        );

      });


    /* =======================================================
       REPORT MODAL ÖFFNEN
       ======================================================= */

    function openReportModal() {

      /*
       * Team-Popup schließen.
       */

      closeAllOverlays();


      /*
       * Anleitung schließen.
       */

      if (
        stepsWrapper.style.display ===
        'block'
      ) {

        closeStepsModal();

      }


      /*
       * Alte Meldungen löschen.
       */

      reportError.style.display =
        'none';

      reportError.textContent =
        '';


      reportSuccess.style.display =
        'none';


      /*
       * Report öffnen.
       */

      reportModal.style.display =
        'block';


      reportBackdrop.style.display =
        'block';


      reportModal.setAttribute(
        'aria-hidden',
        'false'
      );


      reportBackdrop.setAttribute(
        'aria-hidden',
        'false'
      );


      /*
       * Zeitpunkt speichern.
       *
       * Wichtig für den Bot-Schutz.
       */

      reportOpenedAt =
        Date.now();


      /*
       * Hintergrundseite sperren.
       */

      document.body.style.overflow =
        'hidden';


      /*
       * Fokus auf Team-Auswahl.
       */

      setTimeout(
        () => {

          if (
            reportTeam &&
            typeof reportTeam.focus ===
              'function'
          ) {

            reportTeam.focus();

          }

        },
        50
      );

    }


    /* =======================================================
       REPORT MODAL SCHLIESSEN
       ======================================================= */

    function closeReportModal() {

      reportModal.style.display =
        'none';


      reportBackdrop.style.display =
        'none';


      reportModal.setAttribute(
        'aria-hidden',
        'true'
      );


      reportBackdrop.setAttribute(
        'aria-hidden',
        'true'
      );


      document.body.style.overflow =
        '';


      /*
       * Zeitpunkt zurücksetzen.
       */

      reportOpenedAt =
        0;

    }


    /* =======================================================
       REPORT BUTTON
       ======================================================= */

    if (reportBtn) {

      reportBtn.addEventListener(
        'click',
        (e) => {

          e.stopPropagation();

          openReportModal();

        }
      );

    }


    /* =======================================================
       REPORT SCHLIESSEN
       ======================================================= */

    if (closeReportBtn) {

      closeReportBtn.addEventListener(
        'click',
        (e) => {

          e.stopPropagation();

          closeReportModal();

        }
      );

    }


    if (cancelReportBtn) {

      cancelReportBtn.addEventListener(
        'click',
        (e) => {

          e.stopPropagation();

          closeReportModal();

        }
      );

    }


    if (reportBackdrop) {

      reportBackdrop.addEventListener(
        'click',
        () => {

          closeReportModal();

        }
      );

    }


    /*
     * Klicks IM Report-Modal dürfen
     * das Modal nicht schließen.
     */

    if (reportModal) {

      reportModal.addEventListener(
        'click',
        e => {

          e.stopPropagation();

        }
      );

    }


    /* =======================================================
       REPORT ABSENDEN
       ======================================================= */

    if (reportForm) {

      reportForm.addEventListener(
        'submit',
        async (e) => {

          e.preventDefault();

          e.stopPropagation();


          const team =
            reportTeam
              .options[
                reportTeam.selectedIndex
              ]
              ?.textContent
              .trim() ||
            '';


          const calendar =
            reportCalendar.value.trim();


          const title =
            reportTitle.value.trim();


          const description =
            reportDescription.value.trim();


          const honeypot =
            reportWebsite
              ? reportWebsite.value.trim()
              : '';


          /* ===============================================
             Pflichtfelder
             =============================================== */

          if (
            !team ||
            !calendar ||
            !title ||
            !description
          ) {

            reportError.textContent =
              'Bitte fülle alle Felder aus.';

            reportError.style.display =
              'block';

            return;

          }


          /* ===============================================
             Mindestzeit
             =============================================== */

          const elapsed =
            Date.now() -
            reportOpenedAt;


          if (
            !reportOpenedAt ||
            elapsed < 3000
          ) {

            reportError.textContent =
              'Bitte fülle das Formular vollständig aus und versuche es erneut.';

            reportError.style.display =
              'block';

            return;

          }


          /* ===============================================
             Button deaktivieren
             =============================================== */

          if (
            reportSubmitButton
          ) {

            reportSubmitButton.disabled =
              true;

            reportSubmitButton.textContent =
              'Wird gesendet...';

          }


          reportError.style.display =
            'none';

          reportSuccess.style.display =
            'none';


          try {

            const response =
              await fetch(
                'https://bbb-ics-report.raggelija.workers.dev',
                {
                  method:'POST',

                  headers:{
                    'Content-Type':
                      'application/json'
                  },

                  body:
                    JSON.stringify({
                      team,
                      calendar,
                      title,
                      description,

                      /*
                       * Honeypot
                       */
                      website:
                        honeypot,

                      /*
                       * Zeitpunkt des Öffnens
                       */
                      formOpenedAt:
                        reportOpenedAt
                    })
                }
              );


            let result =
              null;


            try {

              result =
                await response.json();

            } catch (error) {

              result =
                null;

            }


            if (
              !response.ok ||
              !result?.success
            ) {

              throw new Error(
                result?.error ||
                'Die Fehlermeldung konnte nicht gesendet werden.'
              );

            }


            /* =========================================
               ERFOLG
               ========================================= */

            reportForm.reset();


            reportError.style.display =
              'none';


            reportSuccess.textContent =
              'Vielen Dank! Deine Fehlermeldung wurde erfolgreich übermittelt.';


            reportSuccess.style.display =
              'block';


            /*
             * Kurz die Erfolgsmeldung anzeigen,
             * dann das Modal schließen.
             */

            setTimeout(
              () => {

                closeReportModal();

              },
              1800
            );


          } catch (error) {

            console.error(
              'Fehler beim Senden des Reports:',
              error
            );


            reportError.textContent =
              'Die Fehlermeldung konnte leider nicht gesendet werden. Bitte versuche es später erneut.';


            reportError.style.display =
              'block';


          } finally {

            if (
              reportSubmitButton
            ) {

              reportSubmitButton.disabled =
                false;

              reportSubmitButton.textContent =
                'Meldung erstellen';

            }

          }

        }
      );

    }


    /* =======================================================
       DOCUMENT CLICK
       ======================================================= */

    document.addEventListener(
      'click',
      (e) => {

        const target =
          e.target;


        if (!target) return;


        /*
         * Report offen:
         * nichts automatisch schließen.
         */

        if (
          reportModal.style.display ===
          'block'
        ) {

          return;

        }


        /*
         * Anleitung offen.
         */

        if (
          target.closest(
            '#steps-wrapper'
          ) ||
          target.closest(
            '#steps-backdrop'
          )
        ) {

          return;

        }


        closeAllOverlays();


        if (
          window.innerWidth <=
          600
        ) {

          document.body.style.overflow =
            '';

        }

      }
    );


    /* =======================================================
       ESCAPE
       ======================================================= */

    document.addEventListener(
      'keydown',
      (e) => {

        if (
          e.key !==
          'Escape'
        ) {

          return;

        }


        /*
         * Report zuerst schließen.
         */

        if (
          reportModal.style.display ===
          'block'
        ) {

          closeReportModal();

          return;

        }


        /*
         * Danach Anleitung schließen.
         */

        if (
          stepsWrapper.style.display ===
          'block'
        ) {

          closeStepsModal();

          return;

        }


        /*
         * Sonst Team-Popup schließen.
         */

        closeAllOverlays();

        document.body.style.overflow =
          '';

      }
    );


    /* =======================================================
       SCROLL
       ======================================================= */

    window.addEventListener(
      'scroll',
      () => {

        /*
         * Das Report-Modal darf durch Scrollen
         * NICHT geschlossen werden.
         */

        if (
          reportModal.style.display ===
          'block'
        ) {

          return;

        }


        /*
         * Team-Popups wie bisher schließen.
         */

        closeAllOverlays();

      },
      {
        passive:true
      }
    );


    /* =======================================================
       RESIZE
       ======================================================= */

    window.addEventListener(
      'resize',
      () => {

        /*
         * Sehr wichtig:
         *
         * Auf Smartphones kann resize ausgelöst werden,
         * wenn die Tastatur geöffnet/geschlossen wird.
         *
         * Das Report-Modal darf deshalb NICHT
         * automatisch geschlossen werden.
         */

        if (
          reportModal.style.display ===
          'block'
        ) {

          return;

        }


        closeAllOverlays();


        /*
         * Anleitung schließen bei echtem
         * Fenstergrößenwechsel.
         */

        if (
          stepsWrapper.style.display ===
          'block'
        ) {

          closeStepsModal();

        }


        document.body.style.overflow =
          '';

      },
      {
        passive:true
      }
    );

  }
}

genHTML();
