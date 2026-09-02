# ALTEZ Info – Trimble Connect projectextensie

Deze extensie voegt in Trimble Connect een menu **Info** toe met twee pagina's:

- **Projectinformatie**: projectnaam, omschrijving, adres, projectnummer, bouwheer en Google Maps.
- **Links**: beheerbare snelkoppelingen naar externe websites.

## Publiceren via GitHub Pages

1. Maak op GitHub een repository `Altez_Info`.
2. Upload alle bestanden uit deze map in de hoofdmap van de repository.
3. Activeer bij **Settings → Pages** publicatie vanaf de `main` branch en de rootmap.
4. Voeg in Trimble Connect bij **Project Settings → Apps & Capabilities → Add Custom** deze URL toe:

   `https://jonasvanhecke-98.github.io/Altez_Info/manifest.json`

Als de repository een andere naam krijgt, pas dan de drie GitHub Pages-URL's in `manifest.json` aan.

## Belangrijk over opslag

De invoer wordt per Trimble Connect-project in de browser bewaard. Daardoor blijven verschillende projecten gescheiden, maar wijzigingen worden in deze versie niet automatisch met andere gebruikers of browsers gedeeld. Daarvoor is later een centrale databank of configuratiebestand nodig.
