import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation'
import leaflet from 'leaflet';

const MAX_ZOOM         = 15;
var   LATITUDE         = 0;
var   LONGITUDE        = 0;
var   ZOOM_PAN_OPTIONS = {animate: true, duration: 0.25, easeLinearity: 1.0, noMoveStart: false}; /*{animate: true, duration: 3.5, easeLinearity: 1.0, noMoveStart: false}*/

@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
})
export class MapPage {

  @ViewChild('map') mapContainer: ElementRef;
  map: any;
  
  constructor(public navCtrl: NavController, public navParams: NavParams, private geolocation: Geolocation) {
  }

  ionViewDidLoad() {
    this.loadMap();
    this.positionMapWithUserLocation();
  }

  ionViewDidEnter() {
    this.positionMapWithUserLocation();
  }

  positionMapWithUserLocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      console.log("LatLng: " + resp.coords.latitude + ":" + resp.coords.longitude);
      LATITUDE  = resp.coords.latitude;
      LONGITUDE = resp.coords.longitude;
      var latLng = leaflet.latLng(resp.coords.latitude, resp.coords.longitude);
      this.map.flyTo(latLng, MAX_ZOOM - 4, ZOOM_PAN_OPTIONS);
    }).catch((error) => {
       console.log('Error getting location', error.message);
    });

    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      // data can be a set of coordinates, or an error (if an error occurred).
      // data.coords.latitude
      // data.coords.longitude
    });

    
  }

  loadMap() {
    var mbAttr         = '&copy;<a href="https://www.openstreetmap.org/">OpenStreetMap</a>';
    var mbUrl          = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

    var grayscaleTile  = leaflet.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr});
    var streetsTile    = leaflet.tileLayer(mbUrl, {id: 'mapbox.streets', attribution: mbAttr});
    var standardTile   = leaflet.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attributions: mbAttr, maxZoom: MAX_ZOOM});    
    var terrainTile    = leaflet.tileLayer('http://c.tile.stamen.com/terrain/{z}/{x}/{y}.jpg', {attributions: mbAttr, maxZoom: MAX_ZOOM});    
    var darkMatterTile = leaflet.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {attributions: mbAttr, maxZoom: MAX_ZOOM});
    var imaginaryTile  = leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {attributions: mbAttr, maxZoom: MAX_ZOOM});    

    var baseLayers = {
      "Grayscale": grayscaleTile,
      "Streets":   streetsTile,
      "Terrain":   terrainTile,
      "Dark":      darkMatterTile,
      "Imaginary": imaginaryTile,
      "Default":   standardTile
    };

    this.map = leaflet.map("map", {layers: [standardTile]}).fitWorld();
    this.map.addControl(this.createGoToLocationButton());
    leaflet.control.layers(baseLayers).addTo(this.map);
  }

  // Localization Button Control Creation for Leaflet maps
  createGoToLocationButton() {
    var locationButtonControl = leaflet.Control.extend({
      options: {
        position: 'topleft' 
        //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
      },
     
      onAdd: function (map) {
          var container = leaflet.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
          container.style.backgroundColor = 'white';
          container.style.width           = '33px';
          container.style.height          = '33px';
          container.style.paddingTop      = "6px";
          container.style.paddingLeft     = "8px";

          var icon = leaflet.DomUtil.create('i', 'fas fa-location-arrow');
          icon.style.width  = '30px';
          icon.style.height = '30px';
          container.appendChild(icon);
          
          container.onclick = function() {
            console.log("button Clicked");
            map.flyTo({lon: LONGITUDE, lat: LATITUDE}, MAX_ZOOM - 4, ZOOM_PAN_OPTIONS);
          }
          return container;
      }
    });
    return new locationButtonControl();
  }

}
