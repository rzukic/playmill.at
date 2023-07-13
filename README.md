# mill-daemon admin documentation
---
## Benutzung
### Vorbedingungen
* Docker
* Docker Compose
* Git
* Server (wir empfehlen ubuntu)
### Schritte zur Instandnahme
1. Repository auf dem Server clonen
`git clone git@github.com:rzukic/playmill.at.git`
2. Gewünschten Port in `docker-compose.yml` einstellen
In unterpunken `next` und `web2` Ports eintragen. Defaults sind 8080 für API und 3000 für Webserver
3. Mögliche alte versionen herunterfahren.
`docker compose down --volumes`
4. Compose cluster builden
`docker compose build`
5. Compose cluster hochfahren
`docker compose up -d`

Der Server ist nun bereit.
