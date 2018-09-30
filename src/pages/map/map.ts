import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation'
import { XpWebSocketService }  from '../../app/services/xp.web.socket.service';
import * as Rx from 'rxjs/Rx';
import leaflet from 'leaflet';
import { Utils } from '../../app/services/utils';
import { Aviation } from '../../app/services/aviation';
import * as $ from "jquery";
import { last } from 'rxjs/operator/last';

const MAX_ZOOM                    = 15;
const ZOOM_PAN_OPTIONS            = {animate: true, duration: 0.25, easeLinearity: 1.0, noMoveStart: false}; /*{animate: true, duration: 3.5, easeLinearity: 1.0, noMoveStart: false}*/
const AIRPLANE_ICON_WIDTH         = 62;
const AIRPLANE_ICON_HEIGHT        = 59;
const AIRPLANE_ICON_ANCHOR_WIDTH  = AIRPLANE_ICON_WIDTH / 2;
const AIRPLANE_ICON_ANCHOR_HEIGHT = AIRPLANE_ICON_HEIGHT - (AIRPLANE_ICON_HEIGHT - ((AIRPLANE_ICON_HEIGHT*60)/100));

var   map;            
var   latitude;
var   longitude;
var   lastLat;
var   lastLng;     
var   lastBearing;
var   avionMarker;    
var   followAirplane;
var   gamePaused;
var   xPlaneWsServer;

var AIRPLANE_ICON = leaflet.icon({
  iconUrl:      'assets/imgs/airplane-a320.png',
  shadowUrl:    'assets/imgs/airplane-a320-shadow-0.png',
  iconSize:     [AIRPLANE_ICON_WIDTH, AIRPLANE_ICON_HEIGHT],
  shadowSize:   [AIRPLANE_ICON_WIDTH, AIRPLANE_ICON_HEIGHT],
  iconAnchor:   [AIRPLANE_ICON_ANCHOR_WIDTH, AIRPLANE_ICON_ANCHOR_HEIGHT],      // point of the icon which will correspond to marker's location
  shadowAnchor: [AIRPLANE_ICON_ANCHOR_WIDTH-5, AIRPLANE_ICON_ANCHOR_HEIGHT-4],  // the same for the shadow
  popupAnchor:  [AIRPLANE_ICON_WIDTH, AIRPLANE_ICON_HEIGHT]                     // point from which the popup should open relative to the iconAnchor
});

@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
})
export class MapPage {

  @ViewChild('map') mapContainer: ElementRef;
  subscription = null;
  
  constructor(public navCtrl: NavController, 
    public navParams: NavParams, 
    public geolocation: Geolocation, 
    public xpWsSocket: XpWebSocketService, 
    public utils: Utils,
    public aviation: Aviation) {

    //this.subscription = this.xpWsSocket.connect("ws://10.253.163.97:9090/websocket/xplane/").subscribe(
    this.subscription = this.xpWsSocket.connect("ws://localhost:9090/websocket/xplane/").subscribe(  
      payload => this.onMessageReceived(payload),
      error => {
        this.utils.error('Oops', error)
      }
    );
    xPlaneWsServer = xpWsSocket;
  }

  ngAfterViewInit(){
    $(document).ready(function(){
      //console.log('JQuery is working!!');
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
      if ( (lastLat != undefined && lastLng != undefined) &&
           (lastLat != json.lat || lastLng != json.lng) ) {

        bearing = this.aviation.bearing(json.lng,json.lat,lastLng,lastLat);

        lastLat     = json.lat;
        lastLng     = json.lng;
        this.utils.trace("Bearing..: " + bearing);
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
    avionMarker.setLatLng(newLatLng);

    if ( bearing != undefined ) {
        // Adaptation for the current used icon
        if ( bearing >= 0 && bearing <= 180 ) {
          bearing += 180;
        } else {
          bearing -= 180;
        }

        lastBearing = bearing;
        MapPage.rotateMarker(bearing);
    }

    if ( followAirplane ) {
      map.panTo(newLatLng);
    }

    latitude  = lat;
    longitude = lng;
  }

  static rotateMarker(bearing) {
    var newBearingForTransformCss = avionMarker._icon.style.transform + ' rotate(' + bearing +  'deg)';
    avionMarker._icon.style.transform = newBearingForTransformCss;
    avionMarker._icon.style.transformOrigin = "center center 0px";

    avionMarker._shadow.style.transform = newBearingForTransformCss;
    avionMarker._shadow.style.transformOrigin = "center center 0px";
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
      latitude  = resp.coords.latitude;
      longitude = resp.coords.longitude;
      var latLng = leaflet.latLng(resp.coords.latitude, resp.coords.longitude);
      if ( avionMarker == undefined ) {
        this.utils.trace("Airplaned added to " + latitude + ":" + longitude);
        avionMarker = leaflet.marker([latitude, longitude], {icon: AIRPLANE_ICON}).addTo(map);
        leaflet.DomUtil.addClass(avionMarker._icon,'aviationClass');
        lastLat = resp.coords.latitude;
        lastLng = resp.coords.longitude;

        leaflet.marker([latitude, longitude]).addTo(map);
      }

      map.flyTo(latLng, MAX_ZOOM - 4, ZOOM_PAN_OPTIONS);      
    }).catch((error) => {
       this.utils.error('Error getting location: ' + error.message);
       console.log('Error getting location', error.message);
    });

    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      //console.log(data);
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

    map = leaflet.map("map", {
          layers: [standardTile], 
          minZoom: 3
        }
    ).setView([41.5497, 2.0989], MAX_ZOOM);
    map.addControl(this.createGoToLocationButton());
    map.addControl(this.createFollowAirplaneButton());
    map.addControl(this.createPlayPauseButton());
    leaflet.control.layers(baseLayers).addTo(map);

    map.on('zoomend', this.zoomListener);
  }

  zoomListener() {
    var size = [0, 0];
    var zoom = map.getZoom();
    if ( zoom == 18 ) {
    } else
    if ( zoom == 17 ) {
    } else
    if ( zoom == 16 ) {
    } else
    if ( zoom == 15 ) {
    } else
    if ( zoom == 14 ) {
    } else
    if ( zoom == 13 ) {
    } else
    if ( zoom == 12 ) {
    } else
    if ( zoom == 11 ) {
    } else
    if ( zoom == 10 ) {
      size[0] = 0.5;
      size[1] = 0.5;
    } else
    if ( zoom == 9 ) {
      size[0] = 3;
      size[1] = 3;
    } else
    if ( zoom == 8 ) {
      size[0] = 4;
      size[1] = 4;
    } else
    if ( zoom == 7 ) {
      size[0] = 6;
      size[1] = 6;
    } else
    if ( zoom == 6 ) {
      size[0] = 10;
      size[1] = 10;
    } else
    if ( zoom == 5 ) {
      size[0] = 12;
      size[1] = 12;
    } else
    if ( zoom == 4 ) {
      size[0] = 14;
      size[1] = 14;
    } else
    if ( zoom == 3 ) {
      size[0] = 16;
      size[1] = 16;
    }

    AIRPLANE_ICON.options.iconSize[0]   = (AIRPLANE_ICON_WIDTH   - size[0]);
    AIRPLANE_ICON.options.iconSize[1]   = (AIRPLANE_ICON_HEIGHT  - size[1]);
    AIRPLANE_ICON.options.shadowSize[0] = (AIRPLANE_ICON_WIDTH   - size[0]);
    AIRPLANE_ICON.options.shadowSize[1] = (AIRPLANE_ICON_HEIGHT  - size[1]);

    var widthAnchor  = (AIRPLANE_ICON.options.iconSize[0] / 2);
    var heightAnchor = (AIRPLANE_ICON.options.iconSize[1] - ((AIRPLANE_ICON.options.iconSize[1] * 50)/100));
    AIRPLANE_ICON.options.iconAnchor[0]   = widthAnchor;
    AIRPLANE_ICON.options.iconAnchor[1]   = heightAnchor;
    AIRPLANE_ICON.options.shadowAnchor[0] = widthAnchor  - 5;
    AIRPLANE_ICON.options.shadowAnchor[1] = heightAnchor - 4;

    avionMarker.setIcon(AIRPLANE_ICON);
    MapPage.rotateMarker(lastBearing);

    if ( followAirplane ) {
      map.panTo(leaflet.latLng(latitude,longitude));
    }
    console.log(zoom);
  }

  // Localization Button Control Creation for Leaflet maps
  createGoToLocationButton() {
    var locationButtonControl = leaflet.Control.extend({
      options: {
        position: 'topleft' 
        //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
      },
     
      onAdd: function (map) {
          var container = MapPage.createContainerButton();

          var icon = leaflet.DomUtil.create('i', 'fas fa-location-arrow fa-3x');
          icon.style.width  = '30px';
          icon.style.height = '30px';
          container.appendChild(icon);
          
          container.onclick = function() {
            container.style.color = "rgba(0, 0, 0, 0.8)";
            map.flyTo({lon: longitude, lat: latitude}, MAX_ZOOM /*- 4*/, ZOOM_PAN_OPTIONS);
            container.style.color = "rgba(47, 79, 79, 0.8)";
          }
          return container;
      }
    });
    return new locationButtonControl();
  }

  createFollowAirplaneButton() {
    var followAirplaneButtonControl = leaflet.Control.extend({
      options: {
        position: 'topleft' 
        //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
      },
     
      onAdd: function (map) {
          var container = MapPage.createContainerButton();

          var icon = leaflet.DomUtil.create('i', 'fas fa-plane fa-3x');
          icon.style.width     = '40px';
          icon.style.height    = '40px';
          icon.style.margin    = "-8px 0px 0px 5px";
          icon.style.transform = 'rotate(315deg)';
          container.appendChild(icon);
          
          container.onclick = function() {
            followAirplane = !followAirplane;
            if ( followAirplane ) {
              container.style.color = "rgba(0, 0, 0, 0.8)";
              //map.panTo([latitude,longitude]);
              map.flyTo({lon: longitude, lat: latitude}, map.getZoom(), ZOOM_PAN_OPTIONS);
            } else {
              container.style.color = "rgba(47, 79, 79, 0.8)";
            }
          }
          return container;
      }
    });
    return new followAirplaneButtonControl();
  }

  createPlayPauseButton() {
    var playPauseButtonControl = leaflet.Control.extend({
      options: {
        position: 'topleft' 
        //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
      },
     
      onAdd: function (map) {
          var container = MapPage.createContainerButton();

          var iconPause = leaflet.DomUtil.create('i', 'fas fa-pause fa-3x');
          iconPause.style.width     = '40px';
          iconPause.style.height    = '40px';
          iconPause.style.margin    = "0px 0px 0px 3px";
          container.appendChild(iconPause);

          var iconPlay = leaflet.DomUtil.create('i', 'fas fa-play fa-3x');
          iconPlay.style.width     = '40px';
          iconPlay.style.height    = '40px';
          iconPlay.style.margin    = "0px 0px 0px 4px";
          
          container.onclick = function() {
            gamePaused = !gamePaused;
            if ( gamePaused ) {
              container.removeChild(iconPause);
              container.appendChild(iconPlay);
              container.style.color = "rgba(0, 0, 0, 0.8)";
            } else {
              container.appendChild(iconPause);
              container.removeChild(iconPlay);
              container.style.color = "rgba(47, 79, 79, 0.8)";
            }
            //MapPage.sendMessageToXPlane("{PAUSE}");
          }
          return container;
      }
    });
    return new playPauseButtonControl();
  }

  static sendMessageToXPlane(message) {
    xPlaneWsServer.getWebSocket().send(message);
  }

  static createContainerButton() {
    var container = leaflet.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
    container.style.backgroundColor = 'white';
    container.style.width           = '33px';
    container.style.height          = '33px';
    container.style.paddingTop      = "3px";
    container.style.paddingLeft     = "1px";
    container.style.fontSize        = "8px";
    container.style.margin          = "5px 0px 0px 5px";
    container.style.color           = "rgba(47, 79, 79, 0.8)";
    container.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
    return container;
  }

}

