import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { DataSettings } from './DataSettings'
import { Storage } from '@ionic/storage';
import { Utils } from "./Utils";

@Injectable()
export class DataService {

    private dataSettingsSource: BehaviorSubject<DataSettings>;
    dataSettings: DataSettings;
    currentDataSettings: Observable<DataSettings>

    constructor(private storage: Storage, private utils: Utils) {

        this.dataSettings = new DataSettings();
        this.dataSettings.xplaneAddress = "127.0.0.1";
        this.dataSettings.xplanePort = "9002";
        this.dataSettings.name = "UALTER Desktop";

        this.dataSettingsSource = new BehaviorSubject<DataSettings>(this.dataSettings);
        this.currentDataSettings = this.dataSettingsSource.asObservable();

        // Asynchronously check database if there is already an object saved before, if found... notify the subscribers again with the new value
        this.storage.get('dataSettings').then((vlr) => {
            if (vlr) {
                this.utils.trace("Load data from LocalStorage:" + vlr);                
                this.dataSettings = JSON.parse(vlr);
                this.dataSettingsSource.next(this.dataSettings);
            }
        });
    }

    changeSettingsXplaneAddress(xplaneAddress:string) {
        this.dataSettings.xplaneAddress = xplaneAddress;
    }

    changeSettingsXplanePort(xplanePort:string) {
        this.dataSettings.xplanePort = xplanePort;
    }

    changeSettingsName(name:string) {
        this.dataSettings.name = name;
    }

    notifyDataSettingsSubscribers() {
        this.dataSettingsSource.next(this.dataSettings);
    }

    saveDataSettings() {
        this.storage.set('dataSettings',JSON.stringify(this.dataSettings));
    }
}

