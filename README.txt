# Bestway / Lay-Z Spa Connect (AWS IoT)

Take full control of your hot tub with Homey. This app supports the latest generation of **Bestway / Lay-Z Spa (V02)** pumps utilizing the AWS IoT cloud. 

By using the official "Device Sharing" feature, pairing is seamless and doesn't require complex technical workarounds.

---

## ✨ Features

* **Monitor & Control:** Real-time water temperature and system status.
* **Full Pump Control:**
    * Main Power (System On/Off)
    * Set Target Temperature
    * Heater Toggle
    * Filter Pump Toggle
    * Massage System (Bubbles/Jets) Toggle
* **Flow Support:** All functions are available as Flow cards to automate your spa experience based on energy prices, schedules, or weather.

---

## 🔗 How to Pair

1. Open the **Bestway Smart Hub** app on your smartphone.
2. Go to your pump settings and select **Device Sharing**.
3. A QR code will appear. You need the text hidden behind this code:
    * **Android:** Use 'Circle to Search' or Google Lens on the QR code to copy the text.
    * **iOS/Other:** Scan the QR code with a scanner app and copy the resulting text string.
    > **Note:** The required string starts with `RW_Share_`.
4. Start the 'Add Device' wizard in Homey and paste the code when prompted.

---

## 👨‍💻 Author & Support

Developed by **Steven Algoet** (info@telenut.be).

**Note:** This app is 100% "Vibe Coding." Support is provided on a best-effort basis and is very limited. Use at your own risk.

---
