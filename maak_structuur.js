const fs = require('fs');
const path = require('path');

// 1. De mappen die we nodig hebben
const folders = [
  'drivers/bestway_pump/pair',
  'drivers/bestway_pump/assets/images',
  'lib'
];

folders.forEach(folder => {
  fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
  console.log('✅ Map aangemaakt:', folder);
});

// 2. De bestanden met hun basiscode
const files = {
  'drivers/bestway_pump/driver.js': `const Homey = require('homey');\n\nmodule.exports = class BestwayDriver extends Homey.Driver {\n  async onInit() {\n    this.log('Bestway Driver is gestart');\n  }\n\n  async onPair(session) {\n    session.setHandler('validate_device', async (data) => {\n      this.log('Poging tot verbinden met QR-code/ID:', data.deviceId);\n      // Hier komt straks de AWS API logica!\n      \n      return {\n        name: "Mijn Lay-Z Spa",\n        data: { id: data.deviceId }\n      };\n    });\n  }\n};`,
  
  'drivers/bestway_pump/device.js': `const Homey = require('homey');\n\nmodule.exports = class BestwayDevice extends Homey.Device {\n  async onInit() {\n    this.log('Apparaat geïnitialiseerd:', this.getName());\n  }\n};`,
  
  'drivers/bestway_pump/driver.compose.json': `{\n  "name": {\n    "en": "Lay-Z Spa Pump",\n    "nl": "Lay-Z Spa Pomp"\n  },\n  "class": "heater",\n  "capabilities": [\n    "onoff",\n    "target_temperature",\n    "measure_temperature"\n  ],\n  "pair": [\n    {\n      "id": "manual_input",\n      "template": "custom_pair_step",\n      "navigation": {\n        "next": "add_devices"\n      }\n    }\n  ]\n}`,
  
  'drivers/bestway_pump/pair/index.html': `<!DOCTYPE html>\n<html>\n<head>\n  <script type="text/javascript" src="/homey.js" data-origin="manager"></script>\n  <style>\n    body { font-family: sans-serif; padding: 20px; }\n    input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; }\n    button { padding: 12px; width: 100%; background: #0078FF; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }\n    button:disabled { background: #ccc; }\n  </style>\n</head>\n<body>\n  <h2>Verbind je Lay-Z Spa</h2>\n  <p>Vul de code in die bij je QR-code hoort.</p>\n  <label>Device ID / Code:</label>\n  <input type="text" id="deviceId" placeholder="bijv. bjX7..." />\n  <button id="connectBtn">Verbinden met Pomp</button>\n\n  <script>\n    Homey.setTitle('Lay-Z Spa Koppelen');\n    const btn = document.getElementById('connectBtn');\n    \n    btn.addEventListener('click', function() {\n      btn.disabled = true;\n      const id = document.getElementById('deviceId').value;\n      \n      Homey.emit('validate_device', { deviceId: id }, function(err, result) {\n        btn.disabled = false;\n        if(err) return Homey.alert("Fout: " + err.message);\n        \n        Homey.addDevice({ \n            name: result.name, \n            data: result.data \n        }, function(err) {\n          if(err) return Homey.alert(err.message);\n          Homey.done();\n        });\n      });\n    });\n  </script>\n</body>\n</html>`,
  
  'lib/BestwayApi.js': `// Hier gaan we de Python code van de Home Assistant integratie vertalen naar JavaScript\n\nclass BestwayApi {\n  constructor() {\n    // Straks zetten we hier de AWS endpoints in\n  }\n}\n\nmodule.exports = BestwayApi;`
};

// 3. Schrijf de bestanden naar de schijf
for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(__dirname, filePath), content);
  console.log('✅ Bestand aangemaakt:', filePath);
}

console.log('🎉 Succes! Je mappenstructuur staat klaar.');