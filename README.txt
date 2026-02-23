# Bestway / Lay-Z Spa Connect (AWS IoT) for Homey

Deze Homey app maakt het mogelijk om de nieuwe generatie **Bestway / Lay-Z Spa (V02)** pompen te bedienen die gebruikmaken van de AWS IoT cloud. In tegenstelling tot oudere apps, ondersteunt deze app de koppeling via de **QR-code deel-tekst**.

## Functies
- Aan/Uit schakelen van de pomp.
- Temperatuur uitlezen en instellen.
- Afzonderlijke knoppen voor:
  - **Verwarming**
  - **Filterpomp**
  - **Bubbels / Jets**

## Installatie (Ontwikkelaars)
Omdat deze app nog in actieve ontwikkeling is, moet deze momenteel via de Homey CLI worden geïnstalleerd:

1. Clone deze repository.
2. Open de terminal in de projectmap.
3. Voer `homey app install` uit.

## Koppelen
1. Open de **Bestway Smart Hub** app op je telefoon.
2. Ga naar je pomp instellingen en kies **Apparaat delen**.
3. Kopieer de tekst van de QR-code (deze begint met `RW_Share_`).
4. Plak deze code in de Homey koppelingswizard.

## Auteur
Ontwikkeld door **Steven Algoet** (info@telenut.be).
Gebaseerd op reverse engineering van de Bestway AWS IoT API.