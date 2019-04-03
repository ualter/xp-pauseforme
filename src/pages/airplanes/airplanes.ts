import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DataService } from '../../app/services/DataService';

@Component({
  selector: 'page-airplanes',
  templateUrl: 'airplanes.html',
})
export class AirplanesPage {

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public dataService: DataService) {

  }

  ionViewDidLoad() {
  }

}
