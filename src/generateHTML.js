const fs = require('fs');
const path = require('path');

const BASE_URL =
  'https://mragg.github.io/bbb-ics-generator/';

const REPORT_WORKER_URL =
  'https://bbb-ics-report.raggelija.workers.dev';

function makeWebcalLink(filename) {
  return BASE_URL + filename;
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const raw =
      fs.readFileSync(
        filePath,
        'utf8'
      );

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
  if (
    value === undefined ||
    value === null
  ) {
    return '';
  }

  return String(value).trim();
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function genHTML() {
  const metaPath =
    path.resolve(
      __dirname,
      '../generated/metadata.json'
    );

  const teamsPath =
    path.resolve(
      __dirname,
      '../generated/teams.json'
    );

  const rawMeta =
    safeReadJson(metaPath) || [];

  const rawTeams =
    safeReadJson(teamsPath) || [];

  const metadataArray =
    Array.isArray(rawMeta)
      ? rawMeta
      : (
          rawMeta.teams ||
          rawMeta.data ||
          []
        );

  const teamsArray =
    Array.isArray(rawTeams)
      ? rawTeams
      : (
          rawTeams.teams ||
          rawTeams.data ||
          []
        );

  void teamsArray;

  const teams =
    metadataArray.map(
      (m) => {

        const id =
          normalizeId(
            m.teamId ??
            m.id ??
            m.idStr ??
            m.identifier ??
            ''
          );

        return {
          teamId: id,

          name:
            m.teamName ??
            m.name ??
            m.title ??
            'Unbenannt',

          ageGroup:
            m.ageGroup ?? '',

          matchCount:
            m.matchCount ??
            m.matches ??
            0,

          homeMatchCount:
            m.homeMatchCount ??
            m.homeMatches ??
            0,

          awayMatchCount:
            m.awayMatchCount ??
            m.awayMatches ??
            0
        };

      }
    );


  const teamCards =
    teams.map(
      (team, index) => {

        const name =
          htmlEscape(
            team.name
          );

        const ageGroup =
          htmlEscape(
            team.ageGroup
          );

        const allFile =
          team.teamId
            ? team.teamId + '_all.ics'
            : (
                encodeURIComponent(
                  team.name
                ) +
                '_all.ics'
              );

        const homeFile =
          team.teamId
            ? team.teamId + '_home.ics'
            : (
                encodeURIComponent(
                  team.name
                ) +
                '_home.ics'
              );

        const awayFile =
          team.teamId
            ? team.teamId + '_away.ics'
            : (
                encodeURIComponent(
                  team.name
                ) +
                '_away.ics'
              );

        return `
          <div class="team-card">

            <div
              class="team-header"
              data-index="${index}"
            >
              ${name}${
                team.ageGroup
                  ? ` (<strong>${ageGroup}</strong>)`
                  : ''
              }
            </div>

            <div
              class="team-content"
              aria-hidden="true"
            >

              <button
                type="button"
                class="overlay-close"
                aria-label="Schließen"
              >
                &times;
              </button>

              <div class="team-content-preview">

                <strong>
                  ${name}
                </strong>

                ${
                  team.ageGroup
                    ? ` (<strong>${ageGroup}</strong>)`
                    : ''
                }

                <p>
                  ${team.matchCount} Spiele,
                  Heim: ${team.homeMatchCount},
                  Auswärts: ${team.awayMatchCount}
                </p>

              </div>

              <div class="buttons">

                <a
                  href="${makeWebcalLink(allFile)}"
                >
                  Alle Spiele abonnieren
                </a>

                <a
                  href="${makeWebcalLink(homeFile)}"
                >
                  Nur Heimspiele abonnieren
                </a>

                <a
                  href="${makeWebcalLink(awayFile)}"
                >
                  Nur Auswärtsspiele abonnieren
                </a>

              </div>

            </div>

          </div>
        `;
      }
    ).join('');


  const teamOptions =
    teams.map(
      (team) => {

        const label =
          htmlEscape(
            team.name +
            (
              team.ageGroup
                ? ` (${team.ageGroup})`
                : ''
            )
          );

        const value =
          htmlEscape(
            team.teamId
          );

        return `
          <option value="${value}">
            ${label}
          </option>
        `;
      }
    ).join('');


  const currentDate =
    new Date().toLocaleString(
      'de-DE',
      {
        timeZone:
          'Europe/Berlin'
      }
    );


  const content =
`<!DOCTYPE html>
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

/* =========================================================
   GLOBAL
   ========================================================= */

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


/* =========================================================
   HEADER
   ========================================================= */

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
    0 10px 30px
    rgba(255,122,24,.25);
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

  opacity:.95;

  font-size:.95rem;
}


/* =========================================================
   CONTAINER
   ========================================================= */

.container{
  max-width:960px;

  margin:28px auto;

  padding:0 16px;
}


/* =========================================================
   TEAMS
   ========================================================= */

.teams-container{
  display:flex;

  flex-wrap:wrap;

  gap:12px;

  margin-top:14px;

  align-items:flex-start;
}

.team-card{
  background:var(--tvn-surface);

  border-radius:14px;

  border:1px solid var(--tvn-border);

  box-shadow:
    0 4px 12px
    rgba(0,0,0,.08);

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

  color:#fff;

  border-radius:
    14px 14px 0 0;

  cursor:pointer;
}

.team-content-preview{
  padding:12px 14px;
}

.team-content-preview p{
  margin:10px 0 0;

  color:var(--tvn-muted);
}

.team-content{
  position:fixed;

  display:none;

  background:#fff;

  padding:18px;

  border-radius:10px;

  box-shadow:
    0 18px 40px
    rgba(0,0,0,.25);

  z-index:12000;

  max-height:80vh;

  overflow:auto;

  box-sizing:border-box;
}

.team-content .buttons{
  display:flex;

  flex-wrap:wrap;

  gap:10px;

  margin-top:12px;
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

  color:#fff;

  text-decoration:none;

  border-radius:6px;

  font-weight:600;

  font-size:.9rem;

  transition:
    transform .12s,
    filter .12s;
}

.team-content .buttons a:hover{
  filter:brightness(1.03);

  transform:translateY(-2px);
}


/* =========================================================
   ANLEITUNG
   ========================================================= */

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

  color:#fff;

  border-radius:10px;

  border:none;

  margin-bottom:12px;
}

.step-box{
  background:var(--tvn-surface);

  margin-bottom:12px;

  border-radius:8px;

  overflow:hidden;

  box-shadow:
    0 3px 8px
    rgba(0,0,0,.06);

  border:
    1px solid
    var(--tvn-border);
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

  color:#fff;

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
    translateY(-50%);

  transition:
    transform .18s ease;

  font-size:1.05rem;
}

.step-header.open::after{
  transform:
    translateY(-50%)
    rotate(180deg);
}

.step-content{
  padding:12px 14px;

  display:none;

  font-size:.95rem;

  line-height:1.45;

  background:#fffaf5;
}

#steps-backdrop{
  display:none;

  position:fixed;

  inset:0;

  background:
    rgba(0,0,0,.45);

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
    0 25px 60px
    rgba(0,0,0,.35);

  z-index:15000;
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


/* =========================================================
   POPUP CLOSE
   ========================================================= */

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


/* =========================================================
   BOTTOM
   ========================================================= */

.page-bottom{
  max-width:960px;

  margin:28px auto 0;

  padding:
    0 16px
    18px;
}

.bottom-card{
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.92),
      rgba(255,248,241,.98)
    );

  border:
    1px solid
    var(--tvn-border);

  border-radius:16px;

  box-shadow:
    0 4px 12px
    rgba(0,0,0,.08);

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
    0 8px 18px
    rgba(255,122,24,.18);
}


/* =========================================================
   REPORT BEREICH
   ========================================================= */

.report-section{
  max-width:960px;

  margin:12px auto 0;

  padding:
    0 16px
    18px;
}

.report-card{
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.96),
      rgba(255,248,241,.98)
    );

  border:
    1px solid
    var(--tvn-border);

  border-radius:16px;

  box-shadow:
    0 4px 12px
    rgba(0,0,0,.08);

  padding:20px;

  text-align:center;
}

.report-card h2{
  margin:
    0 0 8px;

  font-family:'Oswald',sans-serif;

  font-size:1.35rem;
}

.report-card p{
  margin:
    0 auto
    14px;

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
    0 8px 18px
    rgba(255,122,24,.18);
}


/* =========================================================
   REPORT MODAL
   ========================================================= */

#report-backdrop{
  display:none;

  position:fixed;

  inset:0;

  background:
    rgba(0,0,0,.5);

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

  max-height:90vh;

  overflow-y:auto;

  background:#fff;

  padding:22px;

  border-radius:14px;

  box-shadow:
    0 25px 70px
    rgba(0,0,0,.4);

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
  border-color:
    var(--tvn-orange);

  box-shadow:
    0 0 0 3px
    rgba(255,122,24,.12);
}

.report-form-group textarea{
  min-height:150px;

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

.report-submit-btn{
  background:
    linear-gradient(
      135deg,
      var(--tvn-orange-dark),
      var(--tvn-orange)
    );

  color:#fff;
}

.report-submit-btn:disabled{
  opacity:.65;

  cursor:wait;
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

#report-game-wrapper{
  display:none;
}

#report-game-loading{
  display:none;

  margin-top:6px;

  font-size:.86rem;

  color:var(--tvn-muted);
}

#report-game-empty{
  display:none;

  margin-top:6px;

  font-size:.86rem;

  color:var(--tvn-muted);
}


/* =========================================================
   FOOTER
   ========================================================= */

footer{
  padding:
    18px 16px
    28px;

  text-align:center;

  color:var(--tvn-muted);

  font-size:.95rem;
}


/* =========================================================
   MOBILE
   ========================================================= */

@media(max-width:600px){

  .teams-container{
    display:grid;

    grid-template-columns:
      1fr 1fr;

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
      18px;
  }

  .back-link{
    width:100%;

    text-align:center;
  }

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
        Kalender Übersicht –
        automatisch aktualisiert<br>

        Stand:
        ${currentDate}

      </p>

    </div>

  </div>

</header>


<!-- =====================================================
     HAUPTBEREICH
     ===================================================== -->

<div class="container">


  <!-- ===================================================
       ANLEITUNG BUTTON
       =================================================== -->

  <button
    id="show-steps-btn"
    class="guide-btn"
    type="button"
    aria-expanded="false"
  >
    Anleitung anzeigen
  </button>


  <div
    id="steps-backdrop"
    aria-hidden="true"
  ></div>


  <div
    id="steps-template"
    style="display:none;"
  >


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
  ></div>


  <!-- ===================================================
       TEAMS
       =================================================== -->

  <div class="teams-container">

    ${teamCards}

  </div>

</div>


<!-- =====================================================
     ZURÜCK
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
      Fehler melden
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

        Betroffenes Team

        <span
          style="
            font-weight:400;
            color:var(--tvn-muted);
          "
        >
          (optional)
        </span>

      </label>


      <select
        id="report-team"
        name="team"
      >

        <option
          value=""
          selected
        >
          Kein bestimmtes Team
        </option>

        ${teamOptions}

      </select>

    </div>


    <!-- =================================================
         KALENDER
         ================================================= -->

    <div class="report-form-group">

      <label for="report-calendar">

        Betroffener Kalender

        <span
          style="
            font-weight:400;
            color:var(--tvn-muted);
          "
        >
          (optional)
        </span>

      </label>


      <select
        id="report-calendar"
        name="calendar"
      >

        <option
          value=""
          selected
        >
          Kein bestimmter Kalender
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
         SPIEL
         ================================================= -->

    <div
      id="report-game-wrapper"
      class="report-form-group"
    >

      <label for="report-game">

        Betroffenes Spiel

        <span
          style="
            font-weight:400;
            color:var(--tvn-muted);
          "
        >
          (optional)
        </span>

      </label>


      <select
        id="report-game"
        name="game"
      >

        <option value="">
          Kein bestimmtes Spiel
        </option>

      </select>


      <div
        id="report-game-loading"
      >
        Spiele werden geladen...
      </div>


      <div
        id="report-game-empty"
      >
        Keine Spiele gefunden.
      </div>

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


    <div
      id="report-error"
      class="report-error"
    ></div>


    <div
      id="report-success"
      class="report-success"
    ></div>


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

(function () {

  'use strict';


  /* =======================================================
     ELEMENTE
     ======================================================= */

  var template =
    document.getElementById(
      'steps-template'
    );

  var stepsWrapper =
    document.getElementById(
      'steps-wrapper'
    );

  var stepsBackdrop =
    document.getElementById(
      'steps-backdrop'
    );

  var guideBtn =
    document.getElementById(
      'show-steps-btn'
    );


  var reportBtn =
    document.getElementById(
      'open-report-btn'
    );

  var reportModal =
    document.getElementById(
      'report-modal'
    );

  var reportBackdrop =
    document.getElementById(
      'report-backdrop'
    );

  var closeReportBtn =
    document.getElementById(
      'close-report-btn'
    );

  var cancelReportBtn =
    document.getElementById(
      'cancel-report-btn'
    );

  var reportForm =
    document.getElementById(
      'report-form'
    );

  var reportTeam =
    document.getElementById(
      'report-team'
    );

  var reportCalendar =
    document.getElementById(
      'report-calendar'
    );

  var reportGameWrapper =
    document.getElementById(
      'report-game-wrapper'
    );

  var reportGame =
    document.getElementById(
      'report-game'
    );

  var reportGameLoading =
    document.getElementById(
      'report-game-loading'
    );

  var reportGameEmpty =
    document.getElementById(
      'report-game-empty'
    );

  var reportTitle =
    document.getElementById(
      'report-title'
    );

  var reportDescription =
    document.getElementById(
      'report-description'
    );

  var reportWebsite =
    document.getElementById(
      'report-website'
    );

  var reportError =
    document.getElementById(
      'report-error'
    );

  var reportSuccess =
    document.getElementById(
      'report-success'
    );

  var reportSubmitButton =
    reportForm
      ? reportForm.querySelector(
          '.report-submit-btn'
        )
      : null;


  /*
   * Zeitpunkt, an dem das Formular geöffnet wurde.
   */
  var reportOpenedAt =
    0;


  /*
   * Verhindert parallele oder doppelte
   * Submit-Anfragen.
   */
  var reportSubmitting =
    false;


  /*
   * Clientseitiger Cooldown nach Erfolg.
   *
   * Dieser Schutz ist nur für normale Benutzer.
   * Der eigentliche Anti-Spam-Schutz befindet sich
   * im Worker.
   */
  var reportCooldownUntil =
    0;


  var activeContent =
    null;


  /* =======================================================
     ANLEITUNG ERZEUGEN
     ======================================================= */

  if (
    template &&
    stepsWrapper
  ) {

    stepsWrapper.innerHTML =
      template.innerHTML;


    stepsWrapper.insertAdjacentHTML(
      'afterbegin',
      '<button id="close-steps-btn" class="steps-close" type="button" aria-label="Schließen">&times;</button>'
    );


    stepsWrapper
      .querySelectorAll(
        '.step-header'
      )
      .forEach(
        function (header) {

          header.addEventListener(
            'click',
            function (event) {

              event.stopPropagation();


              var content =
                header.nextElementSibling;


              if (!content) {
                return;
              }


              var open =
                window.getComputedStyle(
                  content
                ).display ===
                'block';


              stepsWrapper
                .querySelectorAll(
                  '.step-content'
                )
                .forEach(
                  function (item) {

                    item.style.display =
                      'none';

                    var h =
                      item.previousElementSibling;

                    if (h) {

                      h.classList.remove(
                        'open'
                      );

                      h.setAttribute(
                        'aria-expanded',
                        'false'
                      );

                    }

                  }
                );


              if (open) {

                content.style.display =
                  'none';

                header.classList.remove(
                  'open'
                );

                header.setAttribute(
                  'aria-expanded',
                  'false'
                );

              } else {

                content.style.display =
                  'block';

                header.classList.add(
                  'open'
                );

                header.setAttribute(
                  'aria-expanded',
                  'true'
                );

              }

            }
          );


          header.addEventListener(
            'keydown',
            function (event) {

              if (
                event.key === 'Enter' ||
                event.key === ' '
              ) {

                event.preventDefault();

                header.click();

              }

            }
          );

        }
      );

  }


  /* =======================================================
     OVERLAYS
     ======================================================= */

  function closeAllOverlays() {

    document
      .querySelectorAll(
        '.team-content'
      )
      .forEach(
        function (content) {

          content.style.display =
            'none';

          content.setAttribute(
            'aria-hidden',
            'true'
          );

        }
      );


    activeContent =
      null;

  }


  /* =======================================================
     STEPS
     ======================================================= */

  function openStepsModal() {

    closeAllOverlays();


    if (
      reportModal.style.display ===
      'block'
    ) {

      closeReportModal();

    }


    stepsWrapper.style.display =
      'block';

    stepsWrapper.setAttribute(
      'aria-hidden',
      'false'
    );

    stepsBackdrop.style.display =
      'block';

    stepsBackdrop.setAttribute(
      'aria-hidden',
      'false'
    );


    guideBtn.setAttribute(
      'aria-expanded',
      'true'
    );


    document.body.style.overflow =
      'hidden';

  }


  function closeStepsModal() {

    stepsWrapper.style.display =
      'none';

    stepsWrapper.setAttribute(
      'aria-hidden',
      'true'
    );

    stepsBackdrop.style.display =
      'none';

    stepsBackdrop.setAttribute(
      'aria-hidden',
      'true'
    );

    guideBtn.setAttribute(
      'aria-expanded',
      'false'
    );


    if (
      reportModal.style.display !==
      'block'
    ) {

      document.body.style.overflow =
        '';

    }

  }


  var closeStepsBtn =
    document.getElementById(
      'close-steps-btn'
    );


  if (closeStepsBtn) {

    closeStepsBtn.addEventListener(
      'click',
      function (event) {

        event.stopPropagation();

        closeStepsModal();

      }
    );

  }


  guideBtn.addEventListener(
    'click',
    function (event) {

      event.stopPropagation();


      if (
        stepsWrapper.style.display ===
        'block'
      ) {

        closeStepsModal();

      } else {

        openStepsModal();

      }

    }
  );


  stepsBackdrop.addEventListener(
    'click',
    closeStepsModal
  );


  /* =======================================================
     TEAM POPUPS
     ======================================================= */

  document
    .querySelectorAll(
      '.team-header'
    )
    .forEach(
      function (header) {

        var card =
          header.closest(
            '.team-card'
          );


        if (!card) {
          return;
        }


        var content =
          card.querySelector(
            '.team-content'
          );


        if (!content) {
          return;
        }


        content.addEventListener(
          'click',
          function (event) {

            event.stopPropagation();

          }
        );


        var closeButton =
          content.querySelector(
            '.overlay-close'
          );


        if (closeButton) {

          closeButton.addEventListener(
            'click',
            function (event) {

              event.stopPropagation();


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


        header.addEventListener(
          'click',
          function (event) {

            event.stopPropagation();


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


            var isMobile =
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
                '12000';

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


            var rect =
              header.getBoundingClientRect();


            var desiredWidth =
              Math.max(
                rect.width * 2.2,
                360
              );


            var maxWidth =
              window.innerWidth *
              0.95;


            if (
              desiredWidth >
              maxWidth
            ) {

              desiredWidth =
                maxWidth;

            }


            var margin =
              28;


            var leftPos =
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
              '12000';

            content.style.width =
              desiredWidth +
              'px';

            content.style.maxHeight =
              '80vh';

            content.setAttribute(
              'aria-hidden',
              'false'
            );


            var topPos =
              rect.bottom;


            var contentHeight =
              content.offsetHeight;


            var viewportHeight =
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
              topPos +
              'px';

            content.style.left =
              leftPos +
              'px';


            activeContent =
              content;

          }
        );

      }
    );


  /* =======================================================
     ICS HILFSFUNKTIONEN
     ======================================================= */

  function unfoldICS(
    text
  ) {

    return String(
      text || ''
    ).replace(
      /\r?\n[ \t]/g,
      ''
    );

  }


  function getICSProperty(
    block,
    property
  ) {

    var regex =
      new RegExp(
        '(?:^|\\n)' +
        property +
        '(?:;[^:]*)?:(.*)',
        'i'
      );


    var match =
      block.match(
        regex
      );


    return match
      ? match[1].trim()
      : '';

  }


  function icsUnescape(
    value
  ) {

    return String(
      value || ''
    )
      .replace(
        /\\\\/g,
        '\\'
      )
      .replace(
        /\\,/g,
        ','
      )
      .replace(
        /\\;/g,
        ';'
      )
      .replace(
        /\\n/g,
        ' '
      );

  }


  function formatICSDate(
    value
  ) {

    var clean =
      String(
        value || ''
      )
        .replace(
          /^TZID=[^:;]+:/i,
          ''
        )
        .replace(
          /Z$/i,
          ''
        );


    if (
      clean.length <
      8
    ) {

      return clean;

    }


    var year =
      clean.slice(
        0,
        4
      );

    var month =
      clean.slice(
        4,
        6
      );

    var day =
      clean.slice(
        6,
        8
      );


    var result =
      day +
      '.' +
      month +
      '.' +
      year;


    if (
      clean.length >=
      12
    ) {

      result +=
        ' ' +
        clean.slice(
          8,
          10
        ) +
        ':' +
        clean.slice(
          10,
          12
        );

    }


    return result;

  }


  function parseGames(
    icsText
  ) {

    var games =
      [];


    var unfolded =
      unfoldICS(
        icsText
      );


    var blocks =
      unfolded.split(
        'BEGIN:VEVENT'
      );


    blocks.shift();


    blocks.forEach(
      function (block) {

        var endIndex =
          block.indexOf(
            'END:VEVENT'
          );


        var eventBlock =
          endIndex >= 0
            ? block.slice(
                0,
                endIndex
              )
            : block;


        var summary =
          icsUnescape(
            getICSProperty(
              eventBlock,
              'SUMMARY'
            )
          );


        var start =
          getICSProperty(
            eventBlock,
            'DTSTART'
          );


        if (
          !summary ||
          !start
        ) {

          return;

        }


        games.push({

          label:
            formatICSDate(
              start
            ) +
            ' – ' +
            summary,

          value:
            summary +
            ' | ' +
            formatICSDate(
              start
            )

        });

      }
    );


    games.sort(
      function (a, b) {

        return a.label.localeCompare(
          b.label,
          'de'
        );

      }
    );


    return games;

  }


  /* =======================================================
     SPIELE LADEN
     ======================================================= */

  async function loadGamesForTeam(
    teamId
  ) {

    reportGame.innerHTML =
      '<option value="">Kein bestimmtes Spiel</option>';


    reportGameLoading.style.display =
      'none';


    reportGameEmpty.style.display =
      'none';


    if (!teamId) {

      reportGameWrapper.style.display =
        'none';

      return;

    }


    reportGameWrapper.style.display =
      'block';


    reportGameLoading.style.display =
      'block';


    try {

      var url =
        '${BASE_URL}' +
        encodeURIComponent(
          teamId
        ) +
        '_all.ics';


      var response =
        await fetch(
          url,
          {
            cache:
              'no-store'
          }
        );


      if (!response.ok) {

        throw new Error(
          'ICS konnte nicht geladen werden.'
        );

      }


      var icsText =
        await response.text();


      var games =
        parseGames(
          icsText
        );


      if (!games.length) {

        reportGameEmpty.style.display =
          'block';

        return;

      }


      games.forEach(
        function (game) {

          var option =
            document.createElement(
              'option'
            );


          option.value =
            game.value;


          option.textContent =
            game.label;


          reportGame.appendChild(
            option
          );

        }
      );

    } catch (error) {

      console.error(
        'Fehler beim Laden der Spiele:',
        error
      );


      reportGameEmpty.textContent =
        'Die Spiele konnten nicht geladen werden.';


      reportGameEmpty.style.display =
        'block';

    } finally {

      reportGameLoading.style.display =
        'none';

    }

  }


  reportTeam.addEventListener(
    'change',
    function () {

      loadGamesForTeam(
        reportTeam.value
      );

    }
  );


  /* =======================================================
     REPORT ÖFFNEN
     ======================================================= */

  function openReportModal() {

    /*
     * Öffnen während eines clientseitigen
     * Cooldowns wird verhindert.
     */

    if (
      Date.now() <
      reportCooldownUntil
    ) {

      return;

    }


    closeAllOverlays();


    if (
      stepsWrapper.style.display ===
      'block'
    ) {

      closeStepsModal();

    }


    reportError.style.display =
      'none';

    reportError.textContent =
      '';


    reportSuccess.style.display =
      'none';

    reportSuccess.textContent =
      '';


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
     * Zeitpunkt des Öffnens speichern.
     *
     * Der Worker prüft serverseitig,
     * ob mindestens 3 Sekunden vergangen sind.
     */

    reportOpenedAt =
      Date.now();


    /*
     * Neuer Submit-Zyklus.
     */

    reportSubmitting =
      false;


    if (
      reportSubmitButton
    ) {

      reportSubmitButton.disabled =
        false;

      reportSubmitButton.textContent =
        'Meldung erstellen';

    }


    /*
     * Honeypot immer leer starten.
     */

    if (
      reportWebsite
    ) {

      reportWebsite.value =
        '';

    }


    document.body.style.overflow =
      'hidden';


    setTimeout(
      function () {

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
     REPORT SCHLIESSEN
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


    reportOpenedAt =
      0;


    reportSubmitting =
      false;

  }


  reportBtn.addEventListener(
    'click',
    function (event) {

      event.stopPropagation();

      openReportModal();

    }
  );


  closeReportBtn.addEventListener(
    'click',
    function (event) {

      event.stopPropagation();

      closeReportModal();

    }
  );


  cancelReportBtn.addEventListener(
    'click',
    function (event) {

      event.stopPropagation();

      closeReportModal();

    }
  );


  reportBackdrop.addEventListener(
    'click',
    closeReportModal
  );


  /*
   * Klick INNERHALB des Formulars
   * darf es nicht schließen.
   */

  reportModal.addEventListener(
    'click',
    function (event) {

      event.stopPropagation();

    }
  );


  /* =======================================================
     REPORT SENDEN
     ======================================================= */

  reportForm.addEventListener(
    'submit',
    async function (event) {

      event.preventDefault();

      event.stopPropagation();


      /*
       * Mehrfach-Submit verhindern.
       *
       * Sehr wichtig gegen Doppelklicks,
       * Enter-Spam und parallele Requests.
       */

      if (
        reportSubmitting
      ) {

        return;

      }


      /*
       * Clientseitigen Cooldown beachten.
       */

      if (
        Date.now() <
        reportCooldownUntil
      ) {

        var remaining =
          Math.ceil(
            (
              reportCooldownUntil -
              Date.now()
            ) / 1000
          );

        reportError.textContent =
          'Bitte warte noch ' +
          remaining +
          ' Sekunden, bevor du eine weitere Meldung sendest.';

        reportError.style.display =
          'block';

        return;

      }


      var teamId =
        reportTeam.value.trim();


      var team =
        reportTeam
          .options[
            reportTeam.selectedIndex
          ]
          ? reportTeam
              .options[
                reportTeam.selectedIndex
              ]
              .textContent
              .trim()
          : '';


      /*
       * Wenn kein Team ausgewählt wurde,
       * leer senden.
       */

      if (!teamId) {

        team = '';

      }


      var calendar =
        reportCalendar.value.trim();


      var game =
        reportGame.value.trim();


      var title =
        reportTitle.value.trim();


      var description =
        reportDescription.value.trim();


      var website =
        reportWebsite
          ? reportWebsite.value.trim()
          : '';


      /*
       * Pflichtfelder.
       */

      if (
        !title ||
        !description
      ) {

        reportError.textContent =
          'Bitte fülle Titel und Beschreibung aus.';


        reportError.style.display =
          'block';


        return;

      }


      /*
       * Mindestzeit lokal prüfen.
       *
       * Der Worker prüft das zusätzlich
       * serverseitig.
       */

      if (
        !reportOpenedAt ||
        Date.now() -
          reportOpenedAt <
          3000
      ) {

        reportError.textContent =
          'Bitte fülle das Formular vollständig aus und versuche es erneut.';


        reportError.style.display =
          'block';


        return;

      }


      /*
       * Submit-Lock AKTIVIEREN,
       * bevor fetch() ausgeführt wird.
       */

      reportSubmitting =
        true;


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

        var response =
          await fetch(
            REPORT_WORKER_URL,
            {
              method:'POST',

              headers:{
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  team:
                    team,

                  teamId:
                    teamId,

                  calendar:
                    calendar,

                  game:
                    game,

                  title:
                    title,

                  description:
                    description,

                  website:
                    website,

                  /*
                   * Worker benötigt diesen
                   * Timestamp für den 3-Sekunden-Schutz.
                   */

                  formOpenedAt:
                    reportOpenedAt

                })

            }
          );


        var result =
          null;


        try {

          result =
            await response.json();

        } catch (error) {

          result =
            null;

        }


        /*
         * =================================================
         * RATE LIMIT
         * =================================================
         */

        if (
          response.status ===
          429
        ) {

          var retryAfter =
            result &&
            Number(
              result.retryAfter
            );

          if (
            !Number.isFinite(
              retryAfter
            ) ||
            retryAfter <
            1
          ) {

            retryAfter =
              3600;

          }


          reportError.textContent =
            'Zu viele Fehlermeldungen. Bitte versuche es später erneut.';


          reportError.style.display =
            'block';


          /*
           * Nach einem serverseitigen Rate-Limit
           * nicht sofort erneut versuchen.
           */

          reportCooldownUntil =
            Date.now() +
            retryAfter *
            1000;


          return;

        }


        /*
         * =================================================
         * DUPLIKAT
         * =================================================
         */

        if (
          response.status ===
          409
        ) {

          reportError.textContent =
            (
              result &&
              result.error
            ) ||
            'Diese Fehlermeldung wurde bereits vor kurzem gemeldet.';


          reportError.style.display =
            'block';


          var duplicateRetry =
            result &&
            Number(
              result.retryAfter
            );


          if (
            Number.isFinite(
              duplicateRetry
            ) &&
            duplicateRetry >
            0
          ) {

            reportCooldownUntil =
              Date.now() +
              duplicateRetry *
              1000;

          }


          return;

        }


        /*
         * =================================================
         * ALLE ANDEREN FEHLER
         * =================================================
         */

        if (
          !response.ok ||
          !result ||
          !result.success
        ) {

          throw new Error(
            result &&
            result.error
              ? result.error
              : 'Die Fehlermeldung konnte nicht gesendet werden.'
          );

        }


        /*
         * =================================================
         * ERFOLG
         * =================================================
         */

        reportForm.reset();


        reportGameWrapper.style.display =
          'none';


        reportGame.innerHTML =
          '<option value="">Kein bestimmtes Spiel</option>';


        reportError.style.display =
          'none';


        reportSuccess.textContent =
          'Vielen Dank! Deine Fehlermeldung wurde erfolgreich übermittelt.';


        reportSuccess.style.display =
          'block';


        /*
         * Clientseitiger Cooldown nach Erfolg.
         *
         * Der Worker schützt zusätzlich serverseitig.
         */

        reportCooldownUntil =
          Date.now() +
          30000;


        /*
         * Erfolgszustand anzeigen
         * und Modal danach schließen.
         */

        setTimeout(
          function () {

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
          (
            error &&
            error.message &&
            error.message !==
              'Failed to fetch'
          )
            ? error.message
            : 'Die Fehlermeldung konnte leider nicht gesendet werden. Bitte versuche es später erneut.';


        reportError.style.display =
          'block';


      } finally {

        /*
         * Bei einem echten Sendefehler
         * wieder freigeben.
         *
         * Bei Erfolg ist das Modal ohnehin
         * zum Schließen vorgesehen.
         */

        reportSubmitting =
          false;


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


  /* =======================================================
     GLOBAL CLICK
     ======================================================= */

  document.addEventListener(
    'click',
    function (event) {

      var target =
        event.target;


      if (!target) {
        return;
      }


      /*
       * Wenn das Report-Modal offen ist,
       * nichts anderes schließen.
       */

      if (
        reportModal.style.display ===
        'block'
      ) {

        return;

      }


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

    }
  );


  /* =======================================================
     ESCAPE
     ======================================================= */

  document.addEventListener(
    'keydown',
    function (event) {

      if (
        event.key !==
        'Escape'
      ) {

        return;

      }


      if (
        reportModal.style.display ===
        'block'
      ) {

        closeReportModal();

        return;

      }


      if (
        stepsWrapper.style.display ===
        'block'
      ) {

        closeStepsModal();

        return;

      }


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
    function () {

      /*
       * Report bleibt offen.
       */

      if (
        reportModal.style.display ===
        'block'
      ) {

        return;

      }


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
    function () {

      /*
       * Ganz wichtig:
       *
       * Auf Smartphones kann resize z. B.
       * beim Öffnen der Tastatur ausgelöst werden.
       *
       * Das Report-Modal darf dabei
       * NICHT geschlossen werden.
       */

      if (
        reportModal.style.display ===
        'block'
      ) {

        return;

      }


      closeAllOverlays();


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

})();

</script>

</body>

</html>`;


  fs.writeFileSync(
    path.resolve(
      __dirname,
      '../generated/index.html'
    ),
    content,
    'utf8'
  );
}

genHTML();
