# 🎣 Fischtrainer Baden-Württemberg
Ein browserbasierter Multiple-Choice-Fragentrainer zur Vorbereitung auf die staatliche Fischerprüfung in Baden-Württemberg verfügbar über GitHub Pages unter https://rolfbischoff.github.io/fischtrainer_bawue/.
Ziel des Projekts ist es, die Vorbereitung auf die Fischerprüfung durch eine übersichtliche, benutzerfreundliche und individuell an den Lernfortschritt angepasste Fragenauswahl zu unterstützen.
Die Anwendung läuft als **Progressive Web App (PWA)** direkt im Browser und kann insbesondere auf Android-Geräten auf dem Startbildschirm installiert werden.

## Funktionen
- 🎯 Zufällige, gewichtete Auswahl von Fragen aus dem Fragenkatalog
- 🧠 Lernabhängige Anpassung der Auswahlwahrscheinlichkeiten
- 📝 Multiple-Choice-Fragen mit einer oder mehreren richtigen Antworten
- ☑️ Gleichzeitige Auswahl mehrerer Antwortmöglichkeiten
- ✅ Automatische Überprüfung der Antworten
- ❌ Anzeige der richtigen Lösung bei einer falschen Antwort
- 📊 Speicherung des individuellen Lernerfolgs auf dem verwendeten Gerät
- 📲 Export und Import des individuellen Lernerfolgs als Datei zum Übertragen auf andere Geräte
- 📈 Auswertung der Ergebnisse insgesamt und nach Rubrik
- 📋 Detaillierte Statistik für einzelne Fragen
- 📉 Anzeige der Auswahlgewichte und Auswahlwahrscheinlichkeiten
- 🔄 Fragen können beliebig oft wiederholt werden
- 📱 Optimierte Bedienung auf Smartphones
- 🖥️ Nutzung auf Desktop-Computern
- 📲 Installation als App auf dem Homescreen
- 📴 Offline-Nutzung nach dem ersten Laden der Anwendung

## Multiple-Choice-System
Bei Fragen mit mehreren richtigen Antworten müssen **alle richtigen Antworten und ausschließlich diese** ausgewählt werden.

Beispiel:

> Welche Fischarten gehören zu den Schmelzschuppern?

- ☐ Flussbarsch
- ☑ Sterlet
- ☐ Hecht
- ☑ Stör

Erst wenn alle gewünschten Antworten ausgewählt wurden, wird die Lösung abgeschickt.
Die Anwendung erkennt dabei auch Fragen mit nur einer richtigen Antwort.
Eine Antwort gilt erst dann als richtig, wenn die vollständige richtige Antwortkombination ausgewählt wurde.
Die Anwendung erkennt automatisch, ob eine Frage eine oder mehrere richtige Antworten besitzt.

## Lernabhängige Fragenauswahl

Eine Besonderheit des Fischtrainers ist die gewichtete Auswahl der Fragen.

Die Fragen werden nicht mit gleicher Wahrscheinlichkeit ausgewählt. Stattdessen wird die Auswahlwahrscheinlichkeit für jede Frage anhand des bisherigen individuellen Lernerfolgs berechnet.

Dabei werden zwei Faktoren berücksichtigt:

- **Richtige Antworten:** Fragen, die bereits häufig richtig beantwortet wurden, erhalten tendenziell ein geringeres Auswahlgewicht.
- **Falsche Antworten:** Fragen, die häufiger falsch beantwortet wurden, erhalten ein höheres Auswahlgewicht.

Dadurch werden insbesondere Fragen bevorzugt, bei denen noch Lernbedarf besteht. Gleichzeitig werden Fragen, die bisher nur selten oder noch gar nicht abgefragt wurden, ebenfalls angemessen berücksichtigt.

### Berechnungsgrundlage

Für jede Frage wird zunächst ein Gewicht berechnet:

```
const anzahlVersuche =
    5 * anzahlRichtig + anzahlFalsch;

const gewicht =
    3 / Math.sqrt(1 + anzahlVersuche)
    +
    Math.pow(1 + anzahlFalsch, 2)
    / (1 + anzahlRichtig);
```

Die Auswahlwahrscheinlichkeit ergibt sich anschließend aus dem Verhältnis des individuellen Gewichts zur Summe aller Gewichte der aktuell noch verfügbaren Fragen:

```
wahrscheinlichkeit =
    gewicht / gesamtGewicht;
```

Für die Anzeige in Prozent wird dieser Wert mit 100 multipliziert.

Die gewichtete Zufallsauswahl erfolgt bei jeder neuen Frage erneut. Bereits ausgewählte Fragen werden innerhalb eines Durchgangs aus dem Fragenpool entfernt und können erst im nächsten Durchgang wieder erscheinen.

Damit verändert sich die Auswahlwahrscheinlichkeit während eines Durchgangs entsprechend den noch verfügbaren Fragen.

## Kontrolle der Auswahlwahrscheinlichkeiten

Mit der zusätzlichen Datei wahrscheinlichkeiten.html können die berechneten Auswahlgewichte und Wahrscheinlichkeiten unabhängig vom eigentlichen Quizbetrieb eingesehen werden.

Die Seite verwendet dieselbe Gewichtungsberechnung und dieselben lokal gespeicherten Lernerfolgsdaten wie der Trainer.

Damit lässt sich nachvollziehen:

- welches Gewicht eine einzelne Frage besitzt;
- wie hoch ihre aktuelle Auswahlwahrscheinlichkeit ist;
- wie sich richtige und falsche Antworten auf das Gewicht auswirken;
- wie sich die Wahrscheinlichkeiten zwischen den einzelnen Rubriken verteilen.

Die Wahrscheinlichkeiten beziehen sich auf die jeweils verfügbaren Fragen eines Auswahlvorgangs. Die Summe der Wahrscheinlichkeiten beträgt dabei 100 %.

## Fragenkatalog

Der Fragenkatalog wird in der Datei **fragenkatalog.xml** gespeichert.

## Herkunft der Fragen

Grundlage des verwendeten Fragenkatalogs ist der **amtliche Fragenkatalog zur staatlichen Fischerprüfung in Baden-Württemberg.**

Der Fragenkatalog wird vom Landesfischereiverband Baden-Württemberg e. V. als Herausgeber auf dessen Webseite bereitgestellt.

Originalquelle: 

- Fragenkatalog zur staatlichen Fischerprüfung – Landesfischereiverband Baden-Württemberg (URL https://lfvbw.de/angelfischerei-fragenkatalog-zur-fischerpruefung/)
- Direkter Download des vollständigen Fragenkatalogs als PDF (URL https://lfvbw.de/wp-content/uploads/2024/07/Fragenkatalog-fuer-HP-Stand-01.04.2025.pdf)

Der vollständige Originalkatalog umfasst fünf Themengebiete und enthält auch Fragen, deren Beantwortung die Betrachtung von Abbildungen oder Grafiken voraussetzt.

Für diesen Fischtrainer wurde der Fragenkatalog aufbereitet und um diejenigen Fragen reduziert, die eine grafische Darstellung zur Beantwortung benötigen.

Die verbleibenden Fragen wurden mithilfe von KI aus dem PDF extrahiert und in das XML-Format übertragen.

Die Extraktion und Aufbereitung erfolgten sorgfältig. Dennoch kann keine Gewähr für die vollständige Richtigkeit, Vollständigkeit oder Fehlerfreiheit der übertragenen Fragen, Antworten und Lösungen übernommen werden.

Für die Vorbereitung auf die Fischerprüfung ist deshalb im Zweifelsfall immer der Originalfragenkatalog maßgeblich.

## Aufbau der XML-Datei

Die XML-Datei enthält für jede Frage:

- eine eindeutige ID
- eine Rubrik
- den Fragentext
- die möglichen Antworten
- die richtige bzw. die richtigen Antworten

Beispiel:

```
xml
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

## Lernerfolg und Datenschutz

Der Fragenkatalog wird als Teil der Webanwendung bereitgestellt.

Der persönliche Lernerfolg wird lokal auf dem verwendeten Gerät gespeichert. Es ist keine Benutzerregistrierung und kein zentraler Server für die Speicherung des Lernfortschritts erforderlich. Der individuelle Lernerfolg wird lokal im localStorage des Browsers gespeichert. 

Für jede Frage werden die Anzahl der richtigen und falschen Antworten erfasst.

Die gespeicherten Daten bilden die Grundlage für die lernabhängige Gewichtung der Fragenauswahl.

Die Auswertung ermöglicht unter anderem:

- Anzahl richtiger Antworten
- Anzahl falscher Antworten
- Persönliche Erfolgsquote
- Auswertung nach Rubrik
- Statistik für einzelne Fragen
- Berechnung der Auswahlwahrscheinlichkeiten

Es ist keine Benutzerregistrierung und kein zentraler Server für die Speicherung des Lernfortschritts erforderlich.

Die Lernerfolgsdaten sind an den verwendeten Browser und dessen lokalen Speicher gebunden.

## Progressive Web App

Der Fischtrainer ist als **Progressive Web App (PWA)** aufgebaut.

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
├── wahrscheinlichkeiten.html
└── diagnose.html
```

## Dateien und ihre Aufgaben

## index.html

Die eigentliche Benutzeroberfläche des Trainers.

## app.js

Enthält die Programmsteuerung des Trainers:

- Laden des Fragenkatalogs
- gewichtete Fragenauswahl
- Berechnung der Auswahlgewichte
- Verarbeitung der Antworten
- Auswertung
- Speicherung des Lernerfolgs

## style.css

Enthält das Layout und die Darstellung der Anwendung für Smartphone und Desktop.

## fragenkatalog.xml

Enthält den aufbereiteten Fragenkatalog.

## manifest.json

Beschreibt die Anwendung für den Browser und ermöglicht die Installation als PWA.

## service-worker.js

Verantwortlich für das Caching und den Offline-Betrieb.

## wahrscheinlichkeiten.html

Eine zusätzliche Auswertungsseite zur Anzeige der Auswahlgewichte und Auswahlwahrscheinlichkeiten aller Fragen.

Sie greift auf die Daten und die Berechnungslogik der app.js sowie auf den lokal gespeicherten Lernerfolg zu.

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

## Entwicklung und Veröffentlichung

Für die Entwicklung kann die Anwendung beispielsweise über einen lokalen Webserver gestartet werden.

Ein direkter Aufruf der HTML-Datei über file:// ist für die vollständige PWA-Funktionalität nicht geeignet, da Service Worker einen sicheren Kontext benötigen.

Für die Veröffentlichung kann beispielsweise GitHub Pages verwendet werden.

## KI-Unterstützung

Bei der Erstellung und Weiterentwicklung dieses Projekts wurde künstliche Intelligenz (KI) unterstützend eingesetzt.

Dies betrifft insbesondere:

- die Erstellung und Weiterentwicklung des HTML-, CSS- und JavaScript-Codes;
- die Entwicklung der lernabhängigen Gewichtungs- und Auswahlberechnung;
- die Extraktion und Übertragung der Fragen, Antworten und Lösungen aus dem Original-PDF in den XML-Fragenkatalog;
- die Erstellung und Überarbeitung der Projektdokumentation.

Die mithilfe von KI erstellten bzw. übertragenen Inhalte wurden sorgfältig geprüft und aufbereitet. Eine Garantie für Fehlerfreiheit, fachliche Richtigkeit oder Vollständigkeit kann dennoch nicht übernommen werden.

## Lizenz und Urheberrechte

## 1. Programmcode

Der im Rahmen dieses Projekts selbst erstellte Programmcode wurde unter wesentlicher Mithilfe künstlicher Intelligenz entwickelt.

Der eigene Programmcode darf frei verwendet, kopiert, verändert und weiterverbreitet werden.

Als Lizenz für die eigenen Programmdateien ist die **MIT License** vorgesehen.

Die MIT-Lizenz bezieht sich ausschließlich auf die eigenen Programmteile dieses Projekts. Sie erstreckt sich ausdrücklich nicht auf fremde Inhalte, insbesondere nicht auf den nachfolgend beschriebenen Fragenkatalog.

## 2. Fragenkatalog und fremde Inhalte

Die im Projekt verwendeten Prüfungsfragen stammen aus dem amtlichen Fragenkatalog zur staatlichen Fischerprüfung in Baden-Württemberg.

Urheber-, Nutzungs- und sonstige Rechte des Herausgebers bzw. der jeweiligen Rechteinhaber am Originalfragenkatalog und dessen Inhalten bleiben unberührt.

Die Übertragung in das XML-Format sowie die Verwendung der Fragen in dieser Anwendung begründen keine Übertragung oder Aufgabe dieser Rechte.

Die freie Weiterverwendbarkeit des eigenen Programmcodes bedeutet daher ausdrücklich keine freie Lizenzierung der übernommenen Prüfungsfragen.

Eine eigenständige Weiterverwendung, Veröffentlichung oder Verbreitung des Fragenkatalogs muss die Rechte der jeweiligen Rechteinhaber beachten und gegebenenfalls deren Zustimmung voraussetzen.

## 3. Haftung und Gewährleistung

Der Fischtrainer ist ein privates Lern- und Übungsprojekt und dient ausschließlich der Prüfungsvorbereitung.

Er erhebt keinen Anspruch auf Vollständigkeit oder Fehlerfreiheit und ersetzt nicht den offiziellen Fragenkatalog.

Für die Richtigkeit der aus dem PDF extrahierten und übertragenen Fragen, Antworten und Lösungen wird keine Gewähr übernommen.

Maßgeblich bleibt stets die vom Herausgeber veröffentlichte Originalfassung.

## 4. Hinweis zur Herkunft

Dieses Projekt steht in keiner offiziellen Verbindung zum Landesfischereiverband Baden-Württemberg e. V. oder zum Ministerium für Ernährung, Ländlichen Raum und Verbraucherschutz Baden-Württemberg.

Der Originalfragenkatalog kann direkt beim Herausgeber eingesehen und heruntergeladen werden:

Landesfischereiverband Baden-Württemberg – Fragenkatalog zur staatlichen Fischerprüfung (URL https://lfvbw.de/angelfischerei-fragenkatalog-zur-fischerpruefung/)

## Wichtiger Hinweis zur Lizenzierung:

Der Programmcode dieses Projekts steht unter der MIT License. Diese Lizenz gilt ausschließlich für die selbst erstellten Programmteile.

Der enthaltene Fragenkatalog (fragenkatalog.xml) basiert auf dem offiziellen Fragenkatalog des Landesfischereiverbands Baden-Württemberg e. V. und ist ausdrücklich von der MIT-Lizenz ausgenommen.

Die Übertragung der Prüfungsfragen in das XML-Format stellt keine eigene Lizenzierung der übernommenen Inhalte dar.

Für Prüfungsfragen, Antwortmöglichkeiten, Lösungen und gegebenenfalls bestehende Datenbankrechte gelten die Rechte der jeweiligen Rechteinhaber.

Eine Weiterverwendung des Fragenkatalogs durch Dritte wird durch dieses Projekt nicht freigegeben.

Gleiches gilt für gegebenenfalls enthaltene fremde Bilder, Illustrationen und sonstige Medien.

Weitere Informationen enthält die Datei CONTENT-RIGHTS.md.

Die MIT-Lizenz für den eigenen Programmcode befindet sich in LICENSE-CODE.
## Viel Erfolg bei der Vorbereitung auf die Fischerprüfung! 🎣
