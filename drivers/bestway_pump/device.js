const Homey = require('homey');
const BestwayApi = require('../../lib/BestwayApi');

module.exports = class BestwayDevice extends Homey.Device {
  
  async onInit() {
    this.log('Lay-Z Spa Pomp geïnitialiseerd:', this.getName());

    this.deviceId = this.getData().id;
    this.productId = this.getStoreValue('productId');
    
    this.api = new BestwayApi();
    this.api.token = this.getStoreValue('token');
    this.api.visitorId = this.getStoreValue('visitorId');

    // 1. Hoofdschakelaar (Aan/Uit)
    this.registerCapabilityListener('onoff', async (value) => {
      this.log('Aan/Uit:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { power_state: value ? 1 : 0 });
    });

    // 2. Temperatuur instellen
    this.registerCapabilityListener('target_temperature', async (value) => {
      this.log('Nieuwe temperatuur:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { temperature_setting: value });
    });

    // 3. Verwarming schakelen
    this.registerCapabilityListener('bestway_heat', async (value) => {
      this.log('Verwarming:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { heater_state: value ? 1 : 0 });
    });

    // 4. Bubbels / Jets schakelen
    this.registerCapabilityListener('bestway_wave', async (value) => {
      this.log('Bubbels:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { wave_state: value ? 100 : 0 });
    });

    // 5. Filter schakelen
    this.registerCapabilityListener('bestway_filter', async (value) => {
      this.log('Filter:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { filter_state: value ? 1 : 0 });
    });

    // 6. Polling: Haal elke 1 minuut status op
    this.pollInterval = this.homey.setInterval(() => {
        this.updateData();
    }, 1000 * 60 * 1);

    this.updateData();
  }

  async updateData() {
    try {
      this.log('Huidige status ophalen...');
      const status = await this.api.getStatus(this.deviceId, this.productId);
      
      if (status) {
        if (status.water_temperature !== undefined) {
            this.setCapabilityValue('measure_temperature', status.water_temperature).catch(this.error);
        }
        if (status.temperature_setting !== undefined) {
            this.setCapabilityValue('target_temperature', status.temperature_setting).catch(this.error);
        }
        if (status.power_state !== undefined) {
            this.setCapabilityValue('onoff', status.power_state === 1).catch(this.error);
        }

        // Status van custom knoppen updaten
        if (status.heater_state !== undefined) {
            this.setCapabilityValue('bestway_heat', status.heater_state > 0).catch(this.error);
        }
        
        if (status.wave_state !== undefined) {
            this.setCapabilityValue('bestway_wave', status.wave_state > 0).catch(this.error);
        }

        if (status.filter_state !== undefined) {
            this.setCapabilityValue('bestway_filter', status.filter_state === 1).catch(this.error);
        }
      }
    } catch (error) {
      this.error('Fout bij updaten status:', error.message);
    }
  }

  onDeleted() {
    if(this.pollInterval) {
        this.homey.clearInterval(this.pollInterval);
    }
    this.log('Apparaat verwijderd');
  }
};