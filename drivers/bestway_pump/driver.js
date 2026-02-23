const Homey = require('homey');
const BestwayApi = require('../../lib/BestwayApi');

module.exports = class BestwayDriver extends Homey.Driver {
  
  async onInit() {
    this.log('Bestway AWS Driver gestart');
  }

  async onPair(session) {
    const api = new BestwayApi();

    session.setHandler('link_qr', async (data) => {
      this.log('Nieuwe QR code ontvangen:', data.qrcode.substring(0, 15) + '...');
      
      try {
        // 1. Haal een gast-token op
        await api.authenticate();
        this.log('Token ontvangen!');

        // 2. Koppel de QR code aan dit gast-account
        await api.bindQrCode(data.qrcode);
        this.log('QR Code succesvol gekoppeld!');

        // 3. Haal de pomp op uit het zojuist aangemaakte Home/Room overzicht
        const awsDevices = await api.getDevices();
        this.log('Gevonden apparaten:', awsDevices.length);

        // 4. Stuur terug naar Homey
        const homeyDevices = awsDevices.map(device => {
            return {
                name: device.device_alias || device.device_name || "Mijn Lay-Z Spa",
                data: {
                    id: device.device_id,
                },
                store: {
                    productId: device.product_id,
                    visitorId: api.visitorId,
                    token: api.token
                }
            };
        });

        return homeyDevices;

      } catch (error) {
        this.error('Koppelfout:', error.message);
        throw new Error(error.message);
      }
    });
  }
};