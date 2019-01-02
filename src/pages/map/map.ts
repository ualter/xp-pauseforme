import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation'
import { XpWebSocketService }  from '../../app/services/Xp.web.socket.service';
import * as Rx from 'rxjs/Rx';
import leaflet from 'leaflet';
import { Utils } from '../../app/services/Utils';
import { Aviation } from '../../app/services/Aviation';
import * as $ from "jquery";
import { last } from 'rxjs/operator/last';
import { DataService } from '../../app/services/DataService';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { AlertController } from 'ionic-angular';

const MAX_ZOOM                    = 15;
const ZOOM_PAN_OPTIONS            = {animate: true, duration: 0.25, easeLinearity: 1.0, noMoveStart: false}; /*{animate: true, duration: 3.5, easeLinearity: 1.0, noMoveStart: false}*/
const AIRPLANE_ICON_WIDTH         = 62;
const AIRPLANE_ICON_HEIGHT        = 59;
const AIRPLANE_ICON_ANCHOR_WIDTH  = AIRPLANE_ICON_WIDTH / 2;
const AIRPLANE_ICON_ANCHOR_HEIGHT = AIRPLANE_ICON_HEIGHT - (AIRPLANE_ICON_HEIGHT - ((AIRPLANE_ICON_HEIGHT*60)/100));

const WS_CONNECTING = 0;
const WS_OPEN       = 1;
const WS_CLOSING    = 2;
const WS_CLOSED     = 3;

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

//var wsURL = "ws://localhost:9002/";
var fadeInOut = 500;
var wsURL = "ws://localhost:9002/";
var map;            
var latitude;
var longitude;
var lastLat;
var lastLng;     
var lastBearing;
var avionMarker;
var avionPopup;    
var followAirplane;
var gamePaused;
var buttonPlayPause;
var buttonFollowAirplane;
var buttonGoToLocation;
var threadAttempConnection;
var identificationName;
var staticXPlaneWsServer;
var staticAlertController;
var attempingConnectTimes = 0;

const RETRIES_ATTEMPTING_CONNECT = 10;

enum State {
  DISCONNECTED = 0,
  CONNECTED = 1,
  PAUSED = 2,
}

var AIRPLANE_ICON = leaflet.icon({
  iconUrl:      'assets/imgs/airplane-a320.png',
  shadowUrl:    'assets/imgs/airplane-a320-shadow-0.png',
  iconSize:     [AIRPLANE_ICON_WIDTH, AIRPLANE_ICON_HEIGHT],
  shadowSize:   [AIRPLANE_ICON_WIDTH, AIRPLANE_ICON_HEIGHT],
  iconAnchor:   [AIRPLANE_ICON_ANCHOR_WIDTH, AIRPLANE_ICON_ANCHOR_HEIGHT],      // point of the icon which will correspond to marker's location
  shadowAnchor: [AIRPLANE_ICON_ANCHOR_WIDTH-5, AIRPLANE_ICON_ANCHOR_HEIGHT-4],  // the same for the shadow
  popupAnchor:  [0, (AIRPLANE_ICON_HEIGHT/2) * -1]                                                          // point from which the popup should open relative to the iconAnchor
});

@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
  animations: [
    trigger('visibilityMessageBar', [
      state('shown', style({ opacity: 0.9 })),
      state('hidden', style({ opacity: 0 })),
      transition('* => *', animate(fadeInOut))
    ]),
    trigger('colorChanged', [
      state('blue', style({ 'background-color': 'blue' })),
      state('red', style({ 'background-color': 'red' })),
      state('paused', style({ 'background-color': '#141c26' })),
      transition('* => *', animate('5ms'))
    ]),
    trigger('visibilityButtonConnectMe', [
      state('shown', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('* => *', animate(fadeInOut))
    ]),
    trigger('visibilityContacting', [
      state('shown', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('* => *', animate(fadeInOut))
    ]),
  ]
})
export class MapPage {

  @ViewChild('map') mapContainer: ElementRef;
  subscription = null;
  
  visibilityMessageBar:      string = '';
  visibilityButtonConnectMe: string = '';
  visibilityContacting:      string = 'hidden';

  messageBarIcon:       string = 'thunderstorm';
  messageBarText:       string = "Disconnected";
  messageBarColorIcon:  string = "";
  messageBarColor:      string = "red";

  private isConnectedWithXPlane:boolean = false;
  private connectionState:number = State.DISCONNECTED;

  private connectMeState:boolean = false;
  private xplaneAddress: string;
  private xplanePort: string;

  private static myself:MapPage;
  
  constructor(
    public dataService: DataService,
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public geolocation: Geolocation,
    public alertCtrl: AlertController,
    public xpWsSocket: XpWebSocketService, 
    public utils: Utils,
    public aviation: Aviation) {

    staticXPlaneWsServer  = xpWsSocket;
    staticAlertController = alertCtrl;
    MapPage.myself = this;

    this.dataService.currentDataSettings.subscribe(dataSettings => {
      this.xplaneAddress = dataSettings.xplaneAddress;
      this.xplanePort = dataSettings.xplanePort;
      identificationName = dataSettings.name; 

      wsURL = "ws://" + this.xplaneAddress + ":" + this.xplanePort + "/";
    });
  }

  ngOnInit() {
    
  }
  ngAfterViewInit(){
    $(document).ready(function(){
      //console.log('JQuery is working!!');
    });
  }

  onMessageReceived(payload) {
    var origin  = payload.origin;
    var message = payload.data;

    // Check Connection State
    // If before DISCONNECTED, then now should be CONNECTED
    if ( !this.isConnectedWithXPlane ) {
      this.changeStateToConnected();
    }

    if ( this.utils.isJsonMessage(message) ) {
      var json = JSON.parse(message);
      this.utils.trace("JSON received: ",json);

      // Check if it is a airplane update communication
      if ( message.indexOf('airplane') >= 0 ) {
        // Bearing the Airplane new given Lat/Lng according with the last Lat/Lng
        var bearing;
        if ( (lastLat != undefined && lastLng != undefined) &&
            (lastLat != json.lat || lastLng != json.lng) ) {

          bearing = this.aviation.bearing(json.airplane.lng,json.airplane.lat,lastLng,lastLat);

          lastLat     = json.airplane.lat;
          lastLng     = json.airplane.lng;
        } 
        // Reposition the Airplane new give Lat/Lng
        this.updateAirplanePosition(json.airplane.lat,json.airplane.lng, bearing);
      }
      else if ( message.indexOf('message') >= 0 ) {
        if ( json.message == "PAUSED" ) {
          var event = new Event('PAUSED');
          buttonPlayPause.dispatchEvent(event);
          this.changeStateToPaused();
        } else
        if ( json.message == "PLAY" ) {
          var event = new Event('PLAY');
          buttonPlayPause.dispatchEvent(event);
          this.changeStateToUnpaused();
        } else
        if ( json.message == "STOPPED" ) {
          var event = new Event('STOPPED');
          buttonPlayPause.dispatchEvent(event);
          this.changeStateToDisconnected();
        }
      } else {
        this.utils.trace("Message not processed: ",message);
      }
    } else {
      this.utils.warn("Received JSON message it is NOT OK..: \"" + message + "\" from " + origin);
    }
  }

  updateAirplanePosition(lat, lng, bearing?) {
    this.utils.trace("Airplane new position (Lat/Lng): " + lat + ":" + lng);

    var newLatLng = new leaflet.LatLng(lat,lng);
    if (avionMarker != null) {
      avionMarker.setLatLng(newLatLng);
    }

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

  static direction() {
    if ( lastBearing >  10 && lastBearing < 80 ) {
      return "NE";
    } else
    if ( lastBearing >= 80 && lastBearing <= 100 ) {
      return "E";
    } else
    if ( lastBearing >= 101 && lastBearing < 170 ) {
      return "SE";
    } else
    if ( lastBearing >= 170 && lastBearing <= 190 ) {
      return "S";
    } else
    if ( lastBearing >= 191 && lastBearing < 210 ) {
      return "SW";
    } else
    if ( lastBearing >= 210 && lastBearing <= 290 ) {
      return "W";
    } else
    if ( lastBearing >= 291 && lastBearing <= 310 ) {
      return "NW";
    }
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
      if (resp) {
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
          
          avionPopup = avionMarker.bindPopup("<b>Hello world!</b><br>I am a popup.");
          avionPopup.setLatLng([latitude, longitude]);

          leaflet.marker([latitude, longitude]).addTo(map);
        }
        map.flyTo(latLng, MAX_ZOOM - 4, ZOOM_PAN_OPTIONS);
      }      
    }).catch((error) => {
       this.utils.error('Error getting location: ' + error.message);
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
    map = leaflet.map("map", {
          layers: [standardTile], 
          minZoom: 3,
          zoomControl:false
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

    if ( avionMarker != null ) {
      avionMarker.setIcon(AIRPLANE_ICON);
      MapPage.rotateMarker(lastBearing);
    }
    if ( followAirplane ) {
      map.panTo(leaflet.latLng(latitude,longitude));
    }
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

            if ( isNaN(longitude) ) {
              MapPage.myself.utils.warn("Longitude were NaN, set to 41.5497");
              longitude = 41.5497;
            }
            if ( isNaN(latitude) ) {
              MapPage.myself.utils.warn("Latitude were NaN, set to 2.0989");
              latitude = 2.0989;
            }
            
            map.flyTo({lon: longitude, lat: latitude}, MAX_ZOOM /*- 4*/, ZOOM_PAN_OPTIONS);
            container.style.color = "rgba(47, 79, 79, 0.8)";
          }
          buttonGoToLocation = container;
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

              if ( isNaN(longitude) ) {
                MapPage.myself.utils.warn("Longitude were NaN, set to 41.5497");
                longitude = 41.5497;
              }
              if ( isNaN(latitude) ) {
                MapPage.myself.utils.warn("Latitude were NaN, set to 2.0989");
                latitude = 2.0989;
              }

              map.flyTo({lon: longitude, lat: latitude}, map.getZoom(), ZOOM_PAN_OPTIONS);
            } else {
              container.style.color = "rgba(47, 79, 79, 0.8)";
            }
          }
          buttonFollowAirplane = container;
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
            if ( MapPage.getWSState() == WS_OPEN ) {
              gamePaused = !gamePaused;
              if ( gamePaused ) {
                if (container.contains(iconPause)) container.removeChild(iconPause);
                container.appendChild(iconPlay);
                container.style.color = "rgba(0, 0, 0, 0.8)";
              } else {
                container.appendChild(iconPause);
                if (container.contains(iconPlay)) container.removeChild(iconPlay);
                container.style.color = "rgba(47, 79, 79, 0.8)";
              }
            }
            MapPage.sendMessageToXPlane("{PAUSE}", identificationName);
          }

          container.addEventListener("PAUSED", function(){
            if (container.contains(iconPause)) container.removeChild(iconPause);
            container.appendChild(iconPlay);
            container.style.color = "rgba(0, 0, 0, 0.8)";
            //this.utils.info("X-Plane was PAUSED!");
          });
          container.addEventListener("PLAY", function(){
             container.appendChild(iconPause);
             if (container.contains(iconPlay)) container.removeChild(iconPlay);
             container.style.color = "rgba(47, 79, 79, 0.8)";
             //this.utils.info("X-Plane is in PLAY mode now!");
          });

          buttonPlayPause = container;
          return container;
      }
    });
    return new playPauseButtonControl();
  }

  static sendMessageToXPlane(message, identity) {
    if ( !staticXPlaneWsServer                || 
         !staticXPlaneWsServer.getWebSocket() || 
          staticXPlaneWsServer.getWebSocket().readyState != WS_OPEN ) {
          let alert = staticAlertController.create({
          title: 'Warning',
          subTitle: 'Not connected, contact X-Plane right now?',
          buttons: [
            {
              text: 'Forget it',
              role: 'cancel',
              handler: () => {
              }
            },
            {
              text: 'Connect Me Now',
              handler: () => {
                MapPage.myself.changeConnectMeState();
              }
            }
          ]
        });
        alert.present();
    } else {
        let finalMessage = message + "," + identity;
        MapPage.myself.utils.info("Sent \"" + finalMessage + "\" message to X-Plane");
        staticXPlaneWsServer.getWebSocket().send(finalMessage);
    }
  }

  static getWSState() {
    if ( staticXPlaneWsServer && staticXPlaneWsServer.getWebSocket() ) {
      return staticXPlaneWsServer.getWebSocket().readyState;
    } else {
      return WS_CLOSED;
    }
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

  
  connect() {
    attempingConnectTimes++;
    this.utils.info("[" + attempingConnectTimes + "] Attempting connect to X-Plane at " + wsURL);
    this.connectXPlane();
    this.positionMapWithUserLocation();
  }

  connectXPlane() {
    this.subscription = this.xpWsSocket.connect(wsURL).subscribe(
        payload => {
          this.onMessageReceived(payload);
          this.hideContactingXPlaneImg();
          clearInterval(threadAttempConnection);
        },
        error => {
          this.utils.error('Oops', error)
        }
    );
  }

  hideContactingXPlaneImg() {
    this.visibilityContacting = "hidden"; 
  }

  changeStateToConnected() {
    this.utils.info("CONNECTED to X-Plane through " + wsURL);
    this.connectionState        = State.CONNECTED;
    this.isConnectedWithXPlane  = true;
    this.messageBarIcon         = "sunny";
    this.messageBarText         = "CONNECTED";
    this.messageBarColorIcon    = "secondary";
    this.messageBarColor        = "blue";
    setTimeout(() => {   
      this.visibilityMessageBar      = "hidden";
      this.visibilityButtonConnectMe = "hidden"; 
      this.visibilityContacting      = "hidden"; 
    },fadeInOut+500);
    
  }

  changeStateToDisconnected() {
    this.utils.info("DISCONNECTED from X-Plane");
    this.connectionState        = State.DISCONNECTED;
    this.connectMeState         = false;
    this.isConnectedWithXPlane  = false;
    this.messageBarIcon         = "thunderstorm";
    this.messageBarText         = "DISCONNECTED";
    this.messageBarColorIcon    = "";
    setTimeout(() => {  
      this.visibilityMessageBar      = "shown";
      this.visibilityButtonConnectMe = "shown";
      this.messageBarColor           = "red";
    },fadeInOut+500);
  }

  changeStateToPaused() {
    this.utils.info("PAUSED with X-Plane");
    this.connectionState        = State.PAUSED;
    this.messageBarIcon         = "pause";
    this.messageBarText         = "PAUSED";
    this.messageBarColorIcon    = "";
    this.messageBarColor        = "blue";
    setTimeout(() => {  
      this.visibilityMessageBar      = "shown";
      this.messageBarColor           = "paused";
    },fadeInOut+500);
  }

  changeStateToUnpaused() {
    this.utils.info("UNPAUSED with X-Plane through");
    this.connectionState        = State.CONNECTED;
    this.isConnectedWithXPlane  = true;
    this.messageBarIcon         = "play";
    this.messageBarText         = "UNPAUSED";
    this.messageBarColorIcon    = "secondary";
    this.messageBarColor        = "blue";
    setTimeout(() => {   
      this.visibilityMessageBar      = "hidden";
      this.visibilityButtonConnectMe = "hidden"; 
      this.visibilityContacting      = "hidden"; 
    },fadeInOut+500);
    
  }
  
  updateConnectMeState(event) {
    this.utils.trace("Connect Me State change to:" + event);
    if (event == true) {
      this.visibilityContacting = "shown"; 
      threadAttempConnection = setInterval(() => {
        this.attempToConnect();
      },fadeInOut);
    } else {
      if (threadAttempConnection) {
        this.stopAttemptingToConnect();
      }
    }
  }

  attempToConnect() {
    if ( attempingConnectTimes > (RETRIES_ATTEMPTING_CONNECT-1) ) {
      clearInterval(threadAttempConnection);
      let alert = staticAlertController.create({
      title: 'Warning',
      message: `
        <p > <b>` + attempingConnectTimes + `</b> attempts were made already to contact X-Plane. Did you check the address?</p>
        IP: <font color="blue"><b>` + this.xplaneAddress + `</b></font><br>
        Port: <font color="blue"><b>9002</b></font><br>
      `,
      buttons: [
        {
          text: 'Forget it',
          role: 'cancel',
          handler: () => {
            this.stopAttemptingToConnect();
          }
        },
        {
          text: 'Keep trying',
          handler: () => {
            attempingConnectTimes = 0;
            threadAttempConnection = setInterval(() => {
              this.attempToConnect();
            },fadeInOut);
          }
        }
      ]
      });
      alert.present();
    } else {
      this.connect();
    }
  }

  stopAttemptingToConnect() {
    this.changeConnectMeStateOFF();
    attempingConnectTimes = 0;
    this.utils.trace("Stop attemping to contact X-Plane");
    this.hideContactingXPlaneImg();
    clearInterval(threadAttempConnection);
  }

  changeConnectMeStateOFF() {
    this.connectMeState = false;
  }

  changeConnectMeState() {
    this.connectMeState = !this.connectMeState;
    this.updateConnectMeState(this.connectMeState);
  }

}

