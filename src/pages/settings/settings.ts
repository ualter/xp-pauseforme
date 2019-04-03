import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DataService } from '../../app/services/DataService';
import { Nav, Platform } from 'ionic-angular';
import { AirplanesPage } from '../airplanes/airplanes';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  xplaneAddress: string = "localhost";
  xplanePort: string    = "9002";
  name: string          = "UALTER Desktop";

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public dataService: DataService) {

    this.dataService.currentDataSettings.subscribe(dataSettings => {
      this.xplaneAddress = dataSettings.xplaneAddress;
      this.xplanePort = dataSettings.xplanePort;
      this.name = dataSettings.name; 
    });
  }

  ionViewDidLoad() {
  }

  saveSettings() {
    var notify: boolean = false;

    if ( this.xplaneAddress != this.dataService.dataSettings.xplaneAddress ) {
      this.dataService.changeSettingsXplaneAddress(this.xplaneAddress);
      notify = true;
    }
    if ( this.xplanePort != this.dataService.dataSettings.xplanePort ) {
      this.dataService.changeSettingsXplanePort(this.xplanePort);
      notify = true;
    }
    if ( this.name != this.dataService.dataSettings.name ) {
      this.dataService.changeSettingsName(this.name);
      notify = true;
    }
    
    if (notify) {
      this.dataService.saveDataSettings();
      this.dataService.notifyDataSettingsSubscribers();
    }
  }

  openAirplanesPage() {
    this.navCtrl.push(AirplanesPage);
  }

}
