# 🎣 Fischtrainer Baden-Württemberg
Ein browserbasierter Multiple-Choice-Fragentrainer zur Vorbereitung auf die Fischereiprüfung in Baden-Württemberg.

Die Anwendung läuft als **Progressive Web App (PWA)** direkt im Browser und kann auf Android-Geräten auf dem Startbildschirm installiert werden.

## Funktionen
- 🎯 Zufällige Auswahl von Fragen aus dem Fragenkatalog
- 📝 Multiple-Choice-Fragen mit einer oder mehreren richtigen Antworten
- ☑️ Mehrere Antwortmöglichkeiten können gleichzeitig ausgewählt werden
- ✅ Automatische Überprüfung der Antwort
- ❌ Anzeige der richtigen Lösung bei einer falschen Antwort
- 📊 Speicherung des individuellen Lernerfolgs
- 📈 Auswertung der Ergebnisse insgesamt und nach Rubrik
- 🔄 Fragen können beliebig oft wiederholt werden
- 📱 Optimierte Bedienung auf Smartphones
- 🖥️ Nutzung auch auf Desktop-Computern möglich
- 📲 Installation als App auf dem Homescreen möglich
- 📴 Offline-Nutzung nach dem ersten Laden der Anwendung

## Multiple-Choice-System
Bei Fragen mit mehreren richtigen Antworten müssen **alle richtigen Antworten und nur diese** ausgewählt werden.

Beispiel:

> Welche Fischarten gehören zu den Schmelzschuppern?

- ☐ Flussbarsch
- ☑ Sterlet
- ☐ Hecht
- ☑ Stör

Erst wenn alle gewünschten Antworten ausgewählt wurden, wird die Lösung abgeschickt.

Die Anwendung erkennt dabei auch Fragen mit nur einer richtigen Antwort.

## Fragenkatalog
Der Fragenkatalog wird in der Datei
```
 fragenkatalog.xml
```
gespeichert.

Die XML-Datei enthält für jede Frage:

- eine eindeutige ID
- eine Rubrik
- den Fragentext
- die möglichen Antworten
- die richtige bzw. richtigen Antworten

Beispiel:

```
<frage id="4" rubrik="1. Allgemeine Fischkunde">
    <text>Welche Fischarten gehören zu den Schmelzschuppern?</text>

    <antworten>
        <antwort id="a">Sterlet</antwort>
        <antwort id="b">Flussbarsch</antwort>
        <antwort id="c">Stör</antwort>
    </antworten>

    <loesung>a,c</loesung>
</frage>
```

Mehrere richtige Antworten werden durch Kommas getrennt angegeben.

## Lernerfolg
Der bisherige Lernerfolg wird lokal auf dem Gerät gespeichert.

Für jede Frage werden die Anzahl der richtigen und falschen Antworten erfasst.

Die Auswertung ermöglicht unter anderem:

- Anzahl richtiger Antworten
- Anzahl falscher Antworten
- Erfolgsquote
- Auswertung nach Rubrik
- Statistik für einzelne Fragen

Dadurch kann der persönliche Lernfortschritt verfolgt werden.

## Progressive Web App
Der Fischtrainer ist als **Progressive Web App (PWA)** aufgebaut.

Dazu gehören:

```
index.html
manifest.json
service-worker.js
app.js
style.css
fragenkatalog.xml
icon-192.png
icon-512.png
```

Das Web App Manifest stellt unter anderem Name, Icons und das Verhalten der Anwendung beim Start bereit.

Der Service Worker ermöglicht das Zwischenspeichern der benötigten Dateien. Dadurch kann die Anwendung nach dem ersten erfolgreichen Laden auch ohne Internetverbindung verwendet werden.

## Installation auf Android
Die Anwendung wird über die GitHub-Pages-Webseite aufgerufen.

Nach dem Öffnen in einem geeigneten Browser kann die Anwendung – sofern der Browser die PWA-Installation anbietet – zum Startbildschirm hinzugefügt bzw. als App installiert werden.

Nach der Installation erscheint der Fischtrainer mit dem hinterlegten App-Icon auf dem Homescreen.

## Offline-Betrieb
Beim ersten Aufruf werden die für die Anwendung benötigten Dateien geladen.

Der Service Worker speichert diese Dateien lokal im Browser.

Der Fragenkatalog wird beim Laden der Anwendung ebenfalls zwischengespeichert.

Damit kann der Trainer anschließend auch ohne aktive Internetverbindung verwendet werden.

## Projektstruktur

```
fischtrainer_bawue/
│
├── index.html
├── app.js
├── style.css
├── manifest.json
├── service-worker.js
├── fragenkatalog.xml
│
├── icon-192.png
├── icon-512.png
│
└── diagnose.html
```

## index.html
Die eigentliche Benutzeroberfläche des Trainers.

## app.js
Enthält die Programmsteuerung des Trainers:

- Laden des Fragenkatalogs
- zufällige Fragenauswahl
- Verarbeitung der Antworten
- Auswertung
- Speicherung des Lernerfolgs

## style.css
Enthält das Layout und die Darstellung der Anwendung für Smartphone und Desktop.

## fragenkatalog.xml
Enthält den vollständigen Fragenkatalog.

## manifest.json
Beschreibt die Anwendung für den Browser und ermöglicht die Installation als PWA.

## service-worker.js
Verantwortlich für das Caching und den Offline-Betrieb.

## diagnose.html
Eine technische Diagnose-Seite zur Überprüfung der PWA-Funktion.

Sie kann insbesondere prüfen:

- HTTPS
- Manifest
- Manifest-JSON
- Icons
- Erreichbarkeit des Service Workers
- Registrierung des Service Workers
- Installation und Aktivierung des Service Workers
- Service-Worker-Scope

Die Diagnose-Seite ist hauptsächlich für die Entwicklung und Fehlersuche gedacht.

## Technologie
Das Projekt verwendet ausschließlich Webtechnologien:

- HTML5
- CSS3
- JavaScript
- XML
- Service Worker
- Web App Manifest

Es ist keine native Android-App erforderlich.

## Daten und Datenschutz
Der Fragenkatalog wird als Teil der Webanwendung bereitgestellt.

Der persönliche Lernerfolg wird lokal auf dem verwendeten Gerät gespeichert. Es ist keine Benutzerregistrierung und kein zentraler Server für die Speicherung des Lernfortschritts erforderlich.

## Entwicklung
Für die Entwicklung kann die Anwendung beispielsweise über einen lokalen Webserver gestartet werden.

Ein direkter Aufruf der HTML-Datei über file:// ist für die vollständige PWA-Funktionalität nicht geeignet, da Service Worker einen sicheren Kontext benötigen.

Für die Veröffentlichung kann beispielsweise GitHub Pages verwendet werden.

## Lizenz
Eine konkrete Open-Source-Lizenz ist derzeit nicht festgelegt.

Falls das Projekt öffentlich weitergegeben werden soll, sollte hier eine geeignete Lizenz ergänzt werden, beispielsweise MIT, Apache-2.0 oder GPL-3.0.

**Hinweis:** Für den Fragenkatalog können unabhängig davon andere Rechte gelten. Vor einer öffentlichen Weitergabe sollte deshalb geprüft werden, ob der verwendete Fragenkatalog entsprechend veröffentlicht werden darf.
