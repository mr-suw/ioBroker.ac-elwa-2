"use strict";

const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");
const { tests } = require("@iobroker/testing");

// Mock axios
const axiosMock = {
    get: sinon.stub(),
};

// Load the adapter class with the mocked axios
const Adapter = proxyquire("../main", {
    axios: axiosMock,
});

const MOCK_RESPONSE = {
    data: {
        "device": "AC ELWA 2",
        "fwversion": "e0001700",
        "psversion": "ep108",
        "coversion": "ec104",
        "power_elwa2": 1500,
        "power_solar": 2000,
        "power_max": 3500,
        "temp1": 550,
        "temp2": 600,
        "date": "06.09.25",
        "loctime": "10:00:00",
        "temp_ps": 400,
        "fan_speed": 1200,
        "ctrl_errors": 0,
        "warnings": 0,
    }
};

// Define the unit test suite
tests.unit(Adapter, {
    // Define the adapter config here
    adapterConfig: {
        native: { ipAddress: "1.2.3.4", pollingTime: 15 },
    },
    // Define the mocks here
    predefinedMocks: {
        axios: axiosMock,
    },
    // Define the tests here
    tests: {
        "onReady handles successful poll": {
            fn: async (adapter) => {
                axiosMock.get.resolves(MOCK_RESPONSE);
                await adapter.onReady();
                const setStateSpy = adapter.setState;
                expect(setStateSpy.calledWith("info.connection", true, true)).to.be.true;
                expect(setStateSpy.calledWith("device", "AC ELWA 2", true)).to.be.true;
                expect(setStateSpy.calledWith("temp1", 55.0, true)).to.be.true;
                expect(setStateSpy.calledWith("temp2", 60.0, true)).to.be.true;
                expect(setStateSpy.calledWith("temp_ps", 40.0, true)).to.be.true;
            },
        },
        "onReady handles failed poll": {
            fn: async (adapter) => {
                const testError = new Error("Network Error");
                axiosMock.get.rejects(testError);
                await adapter.onReady();
                expect(adapter.log.error.calledWith(`Error polling device: ${testError}`)).to.be.true;
                expect(adapter.setState.calledWith("info.connection", false, true)).to.be.true;
            },
        },
        "onReady handles missing IP": {
            fn: async (adapter) => {
                adapter.config.ipAddress = "";
                await adapter.onReady();
                expect(adapter.log.error.calledWith("IP address is not set in the adapter configuration!")).to.be.true;
            },
        },
        "onUnload clears the interval": {
            fn: async (adapter) => {
                const clearIntervalSpy = sinon.spy(global, "clearInterval");
                await adapter.onReady();
                const intervalId = adapter.pollingInterval;
                await adapter.onUnload(() => {});
                expect(clearIntervalSpy.calledWith(intervalId)).to.be.true;
                clearIntervalSpy.restore();
            },
        },
    },
});