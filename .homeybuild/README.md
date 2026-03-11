# Bestway / Lay-Z Spa Connect (AWS IoT) for Homey

Integrate your **Bestway / Lay-Z Spa (V02)** hot tub with Homey. This app is specifically designed for the newer generation of pumps that utilize the **AWS IoT cloud infrastructure**. 

Unlike legacy integrations, this app simplifies the connection process by using the **QR Share string** directly from the official Bestway app, bypassing complex credential sniffing.

---

## ✨ Key Features

* **Real-time Monitoring:** View current water temperature and system status.
* **Complete Control:**
    * Power Toggle (System On/Off)
    * Target Temperature Adjustment
    * Heating Toggle
    * Filtration System Control
    * Massage System (Bubbles/Jets) Toggle

---

## ⚙️ Installation

### 🚀 Easy Install (Recommended)
The simplest way to install the app is via the official Homey Store test channel:

👉 **[Install via Homey App Store](https://homey.app/nl-be/app/be.telenut.bestwayconnect/Bestway--Lay-Z-Spa/test/)**

---

### 🛠️ Developer Mode (Manual)
If you wish to contribute or run the latest source code manually:

1.  **Clone** this repository to your local machine.
2.  Open your terminal in the project directory.
3.  Ensure you are logged into the CLI: `homey login`.
4.  Run the installation command:
    ```bash
    homey app install
    ```

---

## 🔗 How to Pair

To connect your spa, you will need a sharing token from the official mobile app:

1.  **Open** the **Bestway Smart Hub** app on your smartphone.
2.  **Navigate** to your pump settings and select **Device Sharing**.
3.  **Copy** the generated text/link. 
    > **Note:** The required string starts with `RW_Share_`.
4.  **Start** the **Add Device** wizard in Homey and paste the code when prompted.

---

## ⚠️ Disclaimer

This app is developed through reverse engineering of the Bestway AWS IoT API. It is not an official product of Bestway or Lay-Z Spa. Use it at your own risk.

---

## 👨‍💻 Author

Developed with ❤️ by **Steven Algoet** 📧 [info@telenut.be](mailto:info@telenut.be)

---