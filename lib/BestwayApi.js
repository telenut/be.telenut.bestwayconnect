const crypto = require('crypto');

class BestwayApi {
  constructor() {
    this.apiBase = 'https://smarthub-eu.bestwaycorp.com';
    this.appId = 'AhFLL54HnChhrxcl9ZUJL6QNfolTIB';
    this.appSecret = '4ECvVs13enL5AiYSmscNjvlaisklQDz7vWPCCWXcEFjhWfTmLT';
    this.token = null;
    this.visitorId = crypto.randomBytes(8).toString('hex');
  }

  _getHeaders(pushType = 'fcm') {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for(let i=0; i<32; i++) nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signData = `${this.appId}${this.appSecret}${nonce}${timestamp}`;
    const sign = crypto.createHash('md5').update(signData).digest('hex').toUpperCase();

    const headers = {
      "pushtype": pushType,
      "appid": this.appId,
      "nonce": nonce,
      "ts": timestamp,
      "accept-language": "en",
      "sign": sign,
      "Content-Type": "application/json; charset=UTF-8"
    };

    if (this.token) {
        headers["Authorization"] = `token ${this.token}`;
    } else {
        headers["Authorization"] = "token";
    }
    return headers;
  }

  async authenticate() {
    const payload = {
        app_id: this.appId,
        brand: "",
        lan_code: "en",
        location: "GB",
        marketing_notification: 0,
        push_type: "fcm",
        timezone: "GMT",
        visitor_id: this.visitorId,
        registration_id: "",
        client_id: crypto.randomBytes(8).toString('hex').toLowerCase()
    };

    const response = await fetch(`${this.apiBase}/api/enduser/visitor`, {
        method: 'POST',
        headers: this._getHeaders('fcm'),
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    
    if (data && data.data && data.data.token) {
        this.token = data.data.token;
        return this.token;
    }
    throw new Error("Authenticatie mislukt bij AWS IoT");
  }

  async bindQrCode(qrCode) {
    if (!qrCode.startsWith('RW_Share_')) {
        throw new Error("Ongeldige QR code. Deze moet beginnen met 'RW_Share_'");
    }
    const payload = { vercode: qrCode, push_type: "android" };
    const response = await fetch(`${this.apiBase}/api/enduser/grant_device`, {
        method: 'POST',
        headers: this._getHeaders('android'),
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.code !== 0) throw new Error(`Koppelen mislukt: ${data.message}`);
    return data.data;
  }

  async getDevices() {
    const homesRes = await (await fetch(`${this.apiBase}/api/enduser/homes`, { headers: this._getHeaders() })).json();
    const homes = (homesRes.data && homesRes.data.list) ? homesRes.data.list : [];
    
    let allDevices = [];
    for(let home of homes) {
        const roomsRes = await (await fetch(`${this.apiBase}/api/enduser/home/rooms?home_id=${home.id}`, { headers: this._getHeaders() })).json();
        const rooms = (roomsRes.data && roomsRes.data.list) ? roomsRes.data.list : [];
        for(let room of rooms) {
            const devsRes = await (await fetch(`${this.apiBase}/api/enduser/home/room/devices?room_id=${room.id}`, { headers: this._getHeaders() })).json();
            if (devsRes.data && devsRes.data.list) allDevices = allDevices.concat(devsRes.data.list);
        }
    }
    return allDevices;
  }

  // --- NIEUW: STATUS OPHALEN ---
  async getStatus(deviceId, productId) {
    const response = await fetch(`${this.apiBase}/api/device/thing_shadow/`, {
        method: 'POST',
        headers: this._getHeaders('fcm'),
        body: JSON.stringify({ device_id: deviceId, product_id: productId })
    });
    const data = await response.json();
    if (data.code === 0 && data.data) {
        return data.data.state?.reported || data.data.state?.desired || data.data.state || data.data;
    }
    return null;
  }

  // --- NIEUW: ENCRYPTIE ---
  encryptCommand(sign, plaintext) {
    const keyMaterial = `${sign},${this.appSecret}`;
    const keyHex = crypto.createHash('sha256').update(keyMaterial).digest('hex').substring(0, 32);
    const key = Buffer.from(keyHex, 'utf-8');
    const iv = Buffer.from([56, 110, 58, 168, 76, 255, 94, 159, 237, 215, 171, 181, 150, 40, 74, 166]);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return Buffer.concat([iv, encrypted]).toString('base64');
  }

  // --- NIEUW: COMMANDO STUREN (Temperatuur / Aan-Uit) ---
  async sendCommand(deviceId, productId, updates) {
    const headers = this._getHeaders('fcm');
    const sign = headers.sign;
    
    const commandPayload = {
        device_id: deviceId,
        product_id: productId,
        desired: JSON.stringify({ state: { desired: updates } })
    };
    
    const plaintext = JSON.stringify(commandPayload);
    const encryptedData = this.encryptCommand(sign, plaintext);

    const response = await fetch(`${this.apiBase}/api/v2/device/command`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ encrypted_data: encryptedData })
    });
    
    const data = await response.json();
    if (data.code !== 0) throw new Error(`Commando mislukt: ${data.message || data.code}`);
    return true;
  }
}

module.exports = BestwayApi;