import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DataService } from '../../app/services/DataService';
import { AirplanesPage } from '../airplanes/airplanes';
import { Utils } from '../../app/services/Utils';
import { AirplaneServices } from '../../app/services/AirplaneServices';
import { Airplane } from '../../app/services/Airplane';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  xplaneAddress: string   = "localhost";
  xplanePort: string      = "9002";
  name: string            = "UALTER Desktop";
  airplane: Airplane;
  airplaneId: string;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public dataService: DataService, 
    public airplaneService: AirplaneServices,
    public utils: Utils) {

    this.dataService.currentSettings.subscribe(settings => {
      this.xplaneAddress   = settings.xplaneAddress;
      this.xplanePort      = settings.xplanePort;
      this.name            = settings.name; 
      this.airplane        = this.airplaneService.getAirplane(settings.airplaneId);
      this.airplaneId      = this.airplane.id;
    });

    if ( !this.airplane ) {
      this.airplane = this.airplaneService.getAirplane("a320");
    }
  }

  ionViewDidLoad() {
  }

  ionViewWillEnter() {
    this.airplane = this.airplaneService.getAirplane(this.dataService.settings.airplaneId);
  }

  saveSettings() {
    var notify: boolean = false;

    if ( this.xplaneAddress != this.dataService.settings.xplaneAddress ) {
      this.dataService.changeSettingsXplaneAddress(this.xplaneAddress);
      notify = true;
    }
    if ( this.xplanePort != this.dataService.settings.xplanePort ) {
      this.dataService.changeSettingsXplanePort(this.xplanePort);
      notify = true;
    }
    if ( this.name != this.dataService.settings.name ) {
      this.dataService.changeSettingsName(this.name);
      notify = true;
    }

    if ( this.airplaneId != this.dataService.settings.airplaneId ) {
      notify = true;
    }
    
    if (notify) {
      this.dataService.saveSettings();
      this.dataService.notifyChangeSettingsToSubscribers();
    }
  }

  openAirplanesPage() {
    this.navCtrl.push(AirplanesPage);
  }

}
