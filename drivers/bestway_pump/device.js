const Homey = require('homey');
const BestwayApi = require('../../lib/BestwayApi');

module.exports = class BestwayDevice extends Homey.Device {
  
  async onInit() {
    this.log('Lay-Z Spa Pomp geïnitialiseerd (onoff geoptimaliseerd):', this.getName());

    this.deviceId = this.getData().id;
    this.productId = this.getStoreValue('productId');
    
    this.api = new BestwayApi();
    this.api.token = this.getStoreValue('token');
    this.api.visitorId = this.getStoreValue('visitorId');

    // --- CAPABILITY LISTENERS ---

    // 1. Universele Homey Aan/Uit knop (Stuurt power_state aan)
    this.registerCapabilityListener('onoff', async (value) => {
      this.log('Algemene Homey onoff geschakeld:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { power_state: value ? 1 : 0 });
    });

    // 2. Temperatuur instellen
    this.registerCapabilityListener('target_temperature', async (value) => {
      this.log('Nieuwe temperatuur:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { temperature_setting: value });
    });

    // 3. Verwarming schakelen
    this.registerCapabilityListener('bestway_heat', async (value) => {
      this.log('Knop Verwarming ingedrukt, nieuwe status:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { heater_state: value ? 1 : 0 });
      this.homey.flow.getDeviceTriggerCard('heat_changed').trigger(this, { value: value }).catch(this.error);
    });

    // 4. Bubbels / Jets schakelen
    this.registerCapabilityListener('bestway_wave', async (value) => {
      this.log('Knop Bubbels ingedrukt, nieuwe status:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { wave_state: value ? 100 : 0 });
      this.homey.flow.getDeviceTriggerCard('wave_changed').trigger(this, { value: value }).catch(this.error);
    });

    // 5. Hydrojet Massage schakelen
    this.registerCapabilityListener('bestway_jet', async (value) => {
      this.log('Knop Hydrojets ingedrukt, nieuwe status:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { jet_state: value ? 1 : 0 });
      this.homey.flow.getDeviceTriggerCard('jet_changed').trigger(this, { value: value }).catch(this.error);
    });

    // 6. Filter schakelen
    this.registerCapabilityListener('bestway_filter', async (value) => {
      this.log('Knop Filter ingedrukt, nieuwe status:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { filter_state: value ? 1 : 0 });
      this.homey.flow.getDeviceTriggerCard('filter_changed').trigger(this, { value: value }).catch(this.error);
    });

    // --- FLOW ACTION LISTENERS ("DAN"-KAARTEN) ---

    this.homey.flow.getActionCard('set_bestway_heat')
      .registerRunListener(async (args) => {
        return await this.triggerCapabilityListener('bestway_heat', args.value);
      });

    this.homey.flow.getActionCard('set_bestway_wave')
      .registerRunListener(async (args) => {
        return await this.triggerCapabilityListener('bestway_wave', args.value);
      });

    this.homey.flow.getActionCard('set_bestway_jet')
      .registerRunListener(async (args) => {
        return await this.triggerCapabilityListener('bestway_jet', args.value);
      });

    this.homey.flow.getActionCard('set_bestway_filter')
      .registerRunListener(async (args) => {
        return await this.triggerCapabilityListener('bestway_filter', args.value);
      });

    // Polling: Haal elke 1 minuut status op
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
            const powerBool = status.power_state === 1;
            if (this.getCapabilityValue('onoff') !== powerBool) {
                this.setCapabilityValue('onoff', powerBool).catch(this.error);
            }
        }

        if (status.heater_state !== undefined) {
            const heatBool = status.heater_state > 0;
            if (this.getCapabilityValue('bestway_heat') !== heatBool) {
                this.setCapabilityValue('bestway_heat', heatBool).catch(this.error);
                this.homey.flow.getDeviceTriggerCard('heat_changed').trigger(this, { value: heatBool }).catch(this.error);
            }
        }
        
        if (status.wave_state !== undefined) {
            const waveBool = status.wave_state > 0;
            if (this.getCapabilityValue('bestway_wave') !== waveBool) {
                this.setCapabilityValue('bestway_wave', waveBool).catch(this.error);
                this.homey.flow.getDeviceTriggerCard('wave_changed').trigger(this, { value: waveBool }).catch(this.error);
            }
        }

        if (status.jet_state !== undefined) {
            const jetBool = status.jet_state > 0;
            if (this.getCapabilityValue('bestway_jet') !== jetBool) {
                this.setCapabilityValue('bestway_jet', jetBool).catch(this.error);
                this.homey.flow.getDeviceTriggerCard('jet_changed').trigger(this, { value: jetBool }).catch(this.error);
            }
        }

        if (status.filter_state !== undefined) {
            const filterBool = status.filter_state === 1;
            if (this.getCapabilityValue('bestway_filter') !== filterBool) {
                this.setCapabilityValue('bestway_filter', filterBool).catch(this.error);
                this.homey.flow.getDeviceTriggerCard('filter_changed').trigger(this, { value: filterBool }).catch(this.error);
            }
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