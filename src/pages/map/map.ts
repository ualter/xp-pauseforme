import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation'
import { XpWebSocketService }  from '../../app/services/xp.web.socket.service';
import * as Rx from 'rxjs/Rx';
import leaflet from 'leaflet';
import { Utils } from '../../app/services/utils';
import { Aviation } from '../../app/services/aviation';
import * as $ from "jquery";

const MAX_ZOOM         = 15;
var   LATITUDE         = 0;
var   LONGITUDE        = 0;
var   ZOOM_PAN_OPTIONS = {animate: true, duration: 0.25, easeLinearity: 1.0, noMoveStart: false}; /*{animate: true, duration: 3.5, easeLinearity: 1.0, noMoveStart: false}*/

var AIRPLANE_ICON = leaflet.icon({
  iconUrl:      'assets/imgs/airplane-a320.png',
  shadowUrl:    'assets/imgs/airplane-a320-shadow-0.png',
  iconSize:     [72, 69],
  shadowSize:   [72, 69],
  //iconSize:     [268, 257],
  //shadowSize:   [268, 257],
  iconAnchor:   [0, 0],  // point of the icon which will correspond to marker's location
  shadowAnchor: [-5, -4],  // the same for the shadow
  popupAnchor:  [-3, -76]  // point from which the popup should open relative to the iconAnchor
});

@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
})
export class MapPage {

  @ViewChild('map') mapContainer: ElementRef;
  map: any;
  subscription = null;
  avionMarker: any;
  lastLat: any;
  lastLng: any;
  avionMarkerTranslate3d: any;

  
  constructor(public navCtrl: NavController, 
    public navParams: NavParams, 
    public geolocation: Geolocation, 
    public xpWsSocket: XpWebSocketService, 
    public utils: Utils,
    public aviation: Aviation) {

    this.subscription = this.xpWsSocket.connect("ws://localhost:8080/websocket/xplane/").subscribe(
      payload => this.onMessageReceived(payload),
      error => {
        this.utils.error('Oops', error)
      }
    );

  }

  ngAfterViewInit(){
    $(document).ready(function(){
      console.log('JQuery is working!!');
    });
  }

  onMessageReceived(payload) {
    var origin  = payload.origin;
    var message = payload.data;

    if (/^[\],:{}\s]*$/.test(message.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
      var json = JSON.parse(message);
      this.utils.trace("JSON received: ",json);

      // Bearing the Airplane new given Lat/Lng according with the last Lat/Lng
      var bearing;
      if ( (this.lastLat != undefined && this.lastLng != undefined) &&
           (this.lastLat != json.lat || this.lastLng != json.lng) ) {

        bearing = this.aviation.bearing(json.lng,json.lat,this.lastLng,this.lastLat);

        console.log("Actual: " + json.lat + "," + json.lng + "\nLast:" + this.lastLat + "," + this.lastLng +  "\nBearing:" + bearing);    

        this.lastLat = json.lat;
        this.lastLng = json.lng;
        this.utils.trace("New Bearing..: " + bearing);
      } 

      // Reposition the Airplane new give Lat/Lng
      this.updateAirplanePosition(json.lat,json.lng, bearing);

    } else {
      this.utils.warn("Received JSON message it is NOT OK..: \"" + message + "\" from " + origin);
    }
  }

  updateAirplanePosition(lat, lng, bearing?) {
    this.utils.trace("Airplane new position (Lat/Lng): " + lat + ":" + lng);

    var newLatLng = new leaflet.LatLng(lat,lng);
    this.avionMarker.setLatLng(newLatLng);

    if ( bearing != undefined ) {
        // Adaptation for the current used icon
        if ( bearing >= 0 && bearing <= 180 ) {
          bearing += 180;
        } else {
          bearing -= 180;
        }

        var newBearingForTransformCss = this.avionMarker._icon.style.transform + ' rotate(' + bearing +  'deg)';
        this.avionMarker._icon.style.transform = newBearingForTransformCss;
        this.avionMarker._icon.style.transformOrigin = "center center 0px";

        this.avionMarker._shadow.style.transform = newBearingForTransformCss;
        this.avionMarker._shadow.style.transformOrigin = "center center 0px";
    }
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
      this.utils.trace("LatLng: " + resp.coords.latitude + ":" + resp.coords.longitude);
      LATITUDE  = resp.coords.latitude;
      LONGITUDE = resp.coords.longitude;
      var latLng = leaflet.latLng(resp.coords.latitude, resp.coords.longitude);
      if ( this.avionMarker == undefined ) {
        this.utils.trace("Airplaned added to " + LATITUDE + ":" + LONGITUDE);
        this.avionMarker = leaflet.marker([LATITUDE, LONGITUDE], {icon: AIRPLANE_ICON}).addTo(this.map);
        leaflet.DomUtil.addClass(this.avionMarker._icon,'aviationClass');
        this.lastLat = resp.coords.latitude;
        this.lastLng = resp.coords.longitude;
        this.avionMarkerTranslate3d = this.avionMarker._icon.style.transform;
      }
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
