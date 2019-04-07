import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DataService } from '../../app/services/DataService';
import { AirplaneServices } from '../../app/services/AirplaneServices';
import { Airplane } from '../../app/services/Airplane';

@Component({
  selector: 'page-airplanes',
  templateUrl: 'airplanes.html',
})
export class AirplanesPage {

  airplane: Airplane;
  model: string         = "";
  airliner: string      = "";
  previousModel: string = "";

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public dataService: DataService,
    public airplaneServices: AirplaneServices) {

      /*for (let key in this.airplaneServices.airplanes) {
        let airplane = this.airplaneServices.airplanes[key];
      }*/

      let saveChanges: boolean;
      if ( !this.dataService.settings.airplaneId ) {
        this.dataService.changeSettingsAirplane("a320");
        saveChanges = true;
      }
      this.airplane   = this.airplaneServices.getAirplane(this.dataService.settings.airplaneId);
      this.airliner   = this.airplane.airliner 
      this.model      = this.airplane.id;
      
      if ( saveChanges ) {
        this.dataService.saveSettings();
      }
      
  }

  listAirliners() {
    return this.airplaneServices.listAirliners();
  }

  listAirplanes(filterAirliner) {
    return this.airplaneServices.listAirplanes(filterAirliner);
  }

  ionViewDidLoad() {
  }

  ionViewWillLeave() {
  }

  onChangeHandler(event: string) {
    if ( event != this.previousModel) {
      this.dataService.changeSettingsAirplane(event);
      this.previousModel = event;
    }
  }

}
