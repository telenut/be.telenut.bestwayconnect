Natuurlijk! Dat is een belangrijke toevoeging. Het maakt de installatie voor de meeste gebruikers veel eenvoudiger dan via de CLI. Ik heb de sectie "Installation" aangepast om onderscheid te maken tussen de makkelijke methode (via de Homey Store) en de methode voor ontwikkelaars.

Hier is de bijgewerkte versie van de README:

Bestway / Lay-Z Spa Connect (AWS IoT) for Homey
Integrate your Bestway / Lay-Z Spa (V02) hot tub with Homey. This app is specifically designed for the newer generation of pumps that utilize the AWS IoT cloud infrastructure.

Unlike legacy integrations, this app simplifies the connection process by using the QR Share string directly from the official Bestway app, bypassing complex credential sniffing.

✨ Key Features
Real-time Monitoring: View current water temperature and system status.

Complete Control: * Power Toggle (System On/Off)

Target Temperature Adjustment

Heating Toggle

Filtration System Control

Massage System (Bubbles/Jets) Toggle

⚙️ Installation
🚀 Easy Install (Recommended)
The simplest way to install the app is via the official Homey Store test channel:
Install via Homey App Store

🛠️ Developer Mode (Manual)
If you wish to contribute or run the latest source code manually:

Clone this repository to your local machine.

Open your terminal in the project directory.

Ensure you are logged into the CLI: homey login.

Run the installation command:

Bash
homey app install
🔗 How to Pair
To connect your spa, you will need a sharing token from the official mobile app:

Open the Bestway Smart Hub app on your smartphone.

Navigate to your pump settings and select Device Sharing.

Choose the option to share and copy the generated text/link.

Note: The required string starts with RW_Share_.

Start the Add Device wizard in Homey and paste the code when prompted.

⚠️ Disclaimer
This app is developed through reverse engineering of the Bestway AWS IoT API. It is not an official product of Bestway or Lay-Z Spa. Use it at your own risk.

👨‍💻 Author
Developed with ❤️ by Steven Algoet (info@telenut.be).
