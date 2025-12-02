"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationService = exports.getDataStore = exports.initSDK = void 0;
__exportStar(require("./encryption"), exports);
__exportStar(require("./supabase"), exports);
__exportStar(require("./storage-adapter"), exports);
__exportStar(require("./data-store"), exports);
__exportStar(require("./organization-service"), exports);
const supabase_1 = require("./supabase");
const data_store_1 = require("./data-store");
const organization_service_1 = require("./organization-service");
let dataStoreInstance = null;
let organizationServiceInstance = null;
const initSDK = (storage) => {
    const supabase = (0, supabase_1.initSupabase)(storage);
    dataStoreInstance = new data_store_1.DataStore(storage);
    organizationServiceInstance = new organization_service_1.OrganizationService(supabase, dataStoreInstance);
    return {
        dataStore: dataStoreInstance,
        organizationService: organizationServiceInstance
    };
};
exports.initSDK = initSDK;
const getDataStore = () => {
    if (!dataStoreInstance) {
        throw new Error('SDK not initialized. Call initSDK first.');
    }
    return dataStoreInstance;
};
exports.getDataStore = getDataStore;
const getOrganizationService = () => {
    if (!organizationServiceInstance) {
        throw new Error('SDK not initialized. Call initSDK first.');
    }
    return organizationServiceInstance;
};
exports.getOrganizationService = getOrganizationService;
