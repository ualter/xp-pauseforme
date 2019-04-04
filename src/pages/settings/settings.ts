import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DataService } from '../../app/services/DataService';
import { Nav, Platform } from 'ionic-angular';
import { AirplanesPage } from '../airplanes/airplanes';
import { Utils } from '../../app/services/Utils';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  xplaneAddress: string   = "localhost";
  xplanePort: string      = "9002";
  name: string            = "UALTER Desktop";
  airplaneCompany: string = ""; 
  airplaneModel: string   = "";
  airPlaneIcon: string    = "";
  airPlaneName: string    = "";

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public dataService: DataService, 
    public utils: Utils) {

    this.dataService.currentDataSettings.subscribe(dataSettings => {
      this.xplaneAddress = dataSettings.xplaneAddress;
      this.xplanePort = dataSettings.xplanePort;
      this.name = dataSettings.name; 
      this.airplaneCompany = dataSettings.airplaneCompany;
      this.airplaneModel = dataSettings.airplaneModel;
    });

    //this.airPlaneIcon = this.utils.PATH_IMG_AIRPLANES + this.airplaneCompany + "/airplane-" + this.airplaneModel + ".png";
  }

  ionViewDidLoad() {
  }

  ionViewWillEnter() {
    this.airPlaneIcon = this.utils.PATH_IMG_AIRPLANES + this.dataService.dataSettings.airplaneCompany + "/airplane-" + this.dataService.dataSettings.airplaneModel + ".png";
    let comp = this.dataService.dataSettings.airplaneCompany;
    if ( comp == "generics" ) {
      comp = "";
    }
    this.airPlaneName = comp + " " + this.dataService.dataSettings.airplaneModel;
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
    if ( this.airplaneCompany != this.dataService.dataSettings.airplaneCompany || this.airplaneModel != this.dataService.dataSettings.airplaneModel ) {
      notify = true;
    }
    
    if (notify) {
      this.dataService.saveDataSettings();
      this.dataService.notifyDataSettingsSubscribers();
    }
  }

  openAirplanesPage() {
    this.navCtrl.push(AirplanesPage, {
      firstPassed: "value 1",
      secondPassed: "value 2"
    });
  }

}
