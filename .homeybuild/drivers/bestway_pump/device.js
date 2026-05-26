const Homey = require('homey');
const BestwayApi = require('../../lib/BestwayApi');

module.exports = class BestwayDevice extends Homey.Device {
  
  async onInit() {
    this.log('Lay-Z Spa Pomp geïnitialiseerd V1.0.29 (kWh Meter Integration):', this.getName());

    this.deviceId = this.getData().id;
    this.productId = this.getStoreValue('productId');
    
    this.api = new BestwayApi();
    this.api.token = this.getStoreValue('token');
    this.api.visitorId = this.getStoreValue('visitorId');

    this.currentWaveState = 0;

    // Tijdstip van de laatste berekening onthouden voor de kWh meter
    this.lastPowerTime = Date.now();

    // Haal de opgeslagen kWh stand op uit de store, of start op 0
    this.accumulatedKWh = this.getStoreValue('accumulatedKWh') || 0;
    if (this.hasCapability('meter_power')) {
        this.setCapabilityValue('meter_power', this.accumulatedKWh).catch(this.error);
    }

    // --- CAPABILITY LISTENERS ---

    this.registerCapabilityListener('onoff', async (value) => {
      this.log('Algemene Homey onoff geschakeld:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { power_state: value ? 1 : 0 });
    });

    this.registerCapabilityListener('target_temperature', async (value) => {
      this.log('Nieuwe temperatuur:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { temperature_setting: value });
    });

    this.registerCapabilityListener('thermostat_mode', async (value) => {
      this.log('Thermostaat modus gewijzigd via Homey:', value);
      const isHeating = value === 'heat';
      await this.api.sendCommand(this.deviceId, this.productId, { heater_state: isHeating ? 1 : 0, filter_state: isHeating ? 1 : undefined });
      
      this.setCapabilityValue('bestway_heat', isHeating).catch(this.error);
      if (isHeating) {
         this.setCapabilityValue('bestway_filter', true).catch(this.error);
      }
      this.calculatePowerConsumption();
    });

    this.registerCapabilityListener('bestway_heat', async (value) => {
      this.log('Knop Verwarming ingedrukt, nieuwe status:', value);
      
      if (value) {
        this.log('Verwarming aan -> Filter direct mee aan');
        await this.api.sendCommand(this.deviceId, this.productId, { heater_state: 1, filter_state: 1 });
        
        await this.setCapabilityValue('bestway_filter', true).catch(this.error);
        await this.setCapabilityValue('thermostat_mode', 'heat').catch(this.error);
        this.homey.flow.getDeviceTriggerCard('filter_changed').trigger(this, { value: true }).catch(this.error);
      } else {
        await this.api.sendCommand(this.deviceId, this.productId, { heater_state: 0 });
        await this.setCapabilityValue('thermostat_mode', 'off').catch(this.error);
      }
      
      this.homey.flow.getDeviceTriggerCard('heat_changed').trigger(this, { value: value }).catch(this.error);
    });

    this.registerCapabilityListener('bestway_wave', async (value) => {
      this.log('Bubbels ingedrukt. Huidige AWS status:', this.currentWaveState);
      
      let nextAwsState = 0;
      let uiState = false;

      if (this.currentWaveState === 0) {
        nextAwsState = 100;
        uiState = true;
      } else if (this.currentWaveState === 100) {
        nextAwsState = 44;
        uiState = true;
      } else {
        nextAwsState = 0;
        uiState = false;
      }

      this.currentWaveState = nextAwsState;
      await this.api.sendCommand(this.deviceId, this.productId, { wave_state: nextAwsState });

      this.homey.flow.getDeviceTriggerCard('wave_changed').trigger(this, { value: uiState }).catch(this.error);
      return uiState;
    });

    this.registerCapabilityListener('bestway_jet', async (value) => {
      this.log('Knop Hydrojets ingedrukt, nieuwe status:', value);
      await this.api.sendCommand(this.deviceId, this.productId, { jet_state: value ? 1 : 0 });
      this.homey.flow.getDeviceTriggerCard('jet_changed').trigger(this, { value: value }).catch(this.error);
    });

    this.registerCapabilityListener('bestway_filter', async (value) => {
      this.log('Knop Filter ingedrukt, nieuwe status:', value);
      
      if (!value) {
        this.log('Filter uit -> Verwarming direct uitvallen');
        await this.api.sendCommand(this.deviceId, this.productId, { filter_state: 0, heater_state: 0 });
        
        await this.setCapabilityValue('bestway_heat', false).catch(this.error);
        await this.setCapabilityValue('thermostat_mode', 'off').catch(this.error);
        this.homey.flow.getDeviceTriggerCard('heat_changed').trigger(this, { value: false }).catch(this.error);
      } else {
        await this.api.sendCommand(this.deviceId, this.productId, { filter_state: 1 });
      }
      
      this.homey.flow.getDeviceTriggerCard('filter_changed').trigger(this, { value: value }).catch(this.error);
    });

    // --- FLOW ACTION LISTENERS ---

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

    // Polling: elke 1 minuut status ophalen
    this.pollInterval = this.homey.setInterval(() => {
        this.updateData();
    }, 1000 * 60 * 1);

    this.updateData();
  }

  calculatePowerConsumption() {
    if (!this.hasCapability('measure_power')) return;

    let totalSettingsWatt = 0;

    if (this.getCapabilityValue('onoff') === true) {
      if (this.getCapabilityValue('bestway_heat') === true) {
        totalSettingsWatt += this.getSetting('wattage_heating') || 2000;
      }
      if (this.getCapabilityValue('bestway_filter') === true) {
        totalSettingsWatt += this.getSetting('wattage_filter') || 50;
      }
      if (this.getCapabilityValue('bestway_jet') === true) {
        totalSettingsWatt += this.getSetting('wattage_jet') || 1200;
      }
      
      if (this.currentWaveState === 44) {
        totalSettingsWatt += this.getSetting('wattage_wave_half') || 400;
      } else if (this.currentWaveState === 100) {
        totalSettingsWatt += this.getSetting('wattage_wave_full') || 800;
      }
    }

    // Oude Wattage ophalen om het cumulatieve verbruik te berekenen vóór we updaten
    const previousWatt = this.getCapabilityValue('measure_power') || 0;

    this.setCapabilityValue('measure_power', totalSettingsWatt).catch(this.error);
    this.log(`Stroomverbruik gesynchroniseerd op: ${totalSettingsWatt}W`);

    // --- VIRTUELE kWh METER REKENSOM ---
    if (this.hasCapability('meter_power')) {
      const now = Date.now();
      const timePassedHours = (now - this.lastPowerTime) / (1000 * 60 * 60); // omrekenen naar uren
      this.lastPowerTime = now;

      if (previousWatt > 0 && timePassedHours > 0) {
        // kWh = (Watt * uren) / 1000
        const addedKWh = (previousWatt * timePassedHours) / 1000;
        this.accumulatedKWh += addedKWh;
        
        // Afronden op 3 decimalen en opslaan
        this.accumulatedKWh = Math.round(this.accumulatedKWh * 1000) / 1000;
        this.setStoreValue('accumulatedKWh', this.accumulatedKWh).catch(this.error);
        this.setCapabilityValue('meter_power', this.accumulatedKWh).catch(this.error);
        this.log(`Totale virtuele meterstand verhoogd met ${addedKWh.toFixed(4)} kWh naar: ${this.accumulatedKWh} kWh`);
      }
    }
  }

  async updateData() {
    try {
      this.log('Huidige status ophalen uit AWS...');
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

        let cloudHeater = status.heater_state > 0;
        let cloudFilter = status.filter_state === 1;

        if (cloudHeater) {
          cloudFilter = true;
        }

        if (this.getCapabilityValue('bestway_heat') !== cloudHeater) {
            this.setCapabilityValue('bestway_heat', cloudHeater).catch(this.error);
        }

        if (this.getCapabilityValue('bestway_filter') !== cloudFilter) {
            this.setCapabilityValue('bestway_filter', cloudFilter).catch(this.error);
        }
        
        if (this.hasCapability('thermostat_mode')) {
            const currentMode = cloudHeater ? "heat" : "off";
            if (this.getCapabilityValue('thermostat_mode') !== currentMode) {
                this.setCapabilityValue('thermostat_mode', currentMode).catch(this.error);
            }
        }
        
        if (status.wave_state !== undefined) {
            this.currentWaveState = status.wave_state;
            const waveBool = status.wave_state > 0;
            if (this.getCapabilityValue('bestway_wave') !== waveBool) {
                this.setCapabilityValue('bestway_wave', waveBool).catch(this.error);
            }
        }

        if (status.jet_state !== undefined) {
            const jetBool = status.jet_state > 0;
            if (this.getCapabilityValue('bestway_jet') !== jetBool) {
                this.setCapabilityValue('bestway_jet', jetBool).catch(this.error);
            }
        }

        this.calculatePowerConsumption();
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