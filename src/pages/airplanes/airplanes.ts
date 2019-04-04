import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DataService } from '../../app/services/DataService';

@Component({
  selector: 'page-airplanes',
  templateUrl: 'airplanes.html',
})
export class AirplanesPage {

  company: string;
  model: string;


  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public dataService: DataService) {

      let saveChanges: boolean;
      if ( !this.dataService.dataSettings.airplaneCompany ) {
        this.dataService.changeSettingsAirplaneCompany("airbus");
        saveChanges = true;
      }
      this.company = this.dataService.dataSettings.airplaneCompany;

      if ( !this.dataService.dataSettings.airplaneModel ) {
        this.dataService.changeSettingsAirplaneModel("a320");
        saveChanges = true;
      }
      this.model = dataService.dataSettings.airplaneModel;

      if ( saveChanges ) {
        this.dataService.saveDataSettings();
      }
  }

  ionViewDidLoad() {
  }

  ionViewWillLeave() {
  }

  onChangeHandler(event: string) {
    this.dataService.changeSettingsAirplaneCompany(this.company);
    this.dataService.changeSettingsAirplaneModel(event);
  }

}
