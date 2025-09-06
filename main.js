"use strict";

/*
 * Created with @iobroker/create-adapter v2.6.5
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const axios = require("axios");

// Load your modules here, e.g.:
// const fs = require("fs");

class AcElwa2 extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "ac-elwa-2",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));

        this.pollingInterval = null;
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Reset the connection indicator during startup
        this.setState("info.connection", false, true);

        if (!this.config.ipAddress) {
            this.log.error("IP address is not set in the adapter configuration!");
            return;
        }

        if (!this.config.pollingTime || this.config.pollingTime < 10) {
            this.log.warn("Polling time is set to less than 10 seconds. Setting to 10 seconds.");
            this.config.pollingTime = 10;
        }

        await this.createStates();

        this.pollDevice();
        this.pollingInterval = setInterval(() => this.pollDevice(), this.config.pollingTime * 1000);
    }

    async pollDevice() {
        const url = `http://${this.config.ipAddress}/data.jsn`;
        try {
            const response = await axios.get(url);
            const data = response.data;

            await this.setState("info.connection", true, true);

            await this.setState("device", data.device, true);
            await this.setState("fwversion", data.fwversion, true);
            await this.setState("psversion", data.psversion, true);
            await this.setState("coversion", data.coversion, true);
            await this.setState("power_elwa2", data.power_elwa2, true);
            await this.setState("power_solar", data.power_solar, true);
            await this.setState("power_max", data.power_max, true);
            await this.setState("temp1", data.temp1 / 10, true);
            await this.setState("temp2", data.temp2 / 10, true);
            await this.setState("date", data.date, true);
            await this.setState("loctime", data.loctime, true);
            await this.setState("temp_ps", data.temp_ps / 10, true);
            await this.setState("fan_speed", data.fan_speed, true);
            await this.setState("ctrl_errors", data.ctrl_errors, true);
            await this.setState("warnings", data.warnings, true);
        } catch (error) {
            this.log.error(`Error polling device: ${error}`);
            this.setState("info.connection", false, true);
        }
    }

    async createStates() {
        await this.setObjectNotExistsAsync("info", {
            type: "channel",
            common: {
                name: "Information",
            },
            native: {},
        });

        await this.setObjectNotExistsAsync("info.connection", {
            type: "state",
            common: {
                name: "Connection",
                type: "boolean",
                role: "indicator.connected",
                read: true,
                write: false,
            },
            native: {},
        });

        const states = {
            device: { name: "Device Name", type: "string", role: "info.name" },
            fwversion: { name: "Firmware Version", type: "string", role: "info.firmware" },
            psversion: { name: "Power-Supply Version", type: "string", role: "info.firmware" },
            coversion: { name: "Controller Version", type: "string", role: "info.firmware" },
            power_elwa2: { name: "Power ELWA2", type: "number", role: "value.power", unit: "W" },
            power_solar: { name: "Power Solar", type: "number", role: "value.power", unit: "W" },
            power_max: { name: "Power Max", type: "number", role: "value.power", unit: "W" },
            temp1: { name: "Temperature 1", type: "number", role: "value.temperature", unit: "°C" },
            temp2: { name: "Temperature 2", type: "number", role: "value.temperature", unit: "°C" },
            date: { name: "Date", type: "string", role: "date" },
            loctime: { name: "Local Time", type: "string", role: "text" },
            temp_ps: { name: "Temperature Power-Supply", type: "number", role: "value.temperature", unit: "°C" },
            fan_speed: { name: "Fan Speed", type: "number", role: "value", unit: "rpm" },
            ctrl_errors: { name: "Control Errors", type: "number", role: "indicator.error" },
            warnings: { name: "Warnings", type: "number", role: "indicator.warning" },
        };

        for (const [id, stateDef] of Object.entries(states)) {
            await this.setObjectNotExistsAsync(id, {
                type: "state",
                common: {
                    name: stateDef.name,
                    type: stateDef.type,
                    role: stateDef.role,
                    unit: stateDef.unit,
                    read: true,
                    write: false,
                },
                native: {},
            });
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
            }
            callback();
        } catch (_e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new AcElwa2(options);
} else {
    // otherwise start the instance directly
    new AcElwa2();
}
