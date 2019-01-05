import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';
import { AlertController, NavController, NavParams } from 'ionic-angular';
import * as $ from "jquery";
import leaflet from 'leaflet';
import { Aviation } from '../../app/services/Aviation';
import { DataService } from '../../app/services/DataService';
import { Utils } from '../../app/services/Utils';
import { XpWebSocketService } from '../../app/services/Xp.web.socket.service';

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

const DEFAULT_LONGITUDE = 41.5497;
const DEFAULT_LATITUDE  = 2.0989;

//var wsURL = "ws://localhost:9002/";
var fadeInOut = 500;
var wsURL = "ws://localhost:9002/";
var map;            
var latitude;
var longitude;
var userLatitude;
var userLongitude;
var userMarker;
var lastLat;
var lastLng;     
var lastBearing;
var airplaneMarker;
var airplanePopup;    
var followAirplane;
var gamePaused;
var buttonPlayPause;
var buttonFollowAirplane;
var buttonGoToLocation;
var buttonDisconnect;
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

      if ( this.xplanePort ) {
        wsURL = "ws://" + this.xplaneAddress + ":" + this.xplanePort + "/";
      } else {
        wsURL = "ws://" + this.xplaneAddress + "/";
      }
      
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
        let bearing;
        if ( (lastLat && lastLng) && 
             (lastLat != json.airplane.lat || lastLng != json.airplane.lng) ) {

          bearing = this.aviation.bearing(json.airplane.lng,json.airplane.lat,lastLng,lastLat);
        } 
        // Reposition the Airplane new give Lat/Lng
        this.updateAirplanePosition(json.airplane.lat, json.airplane.lng, bearing);
        lastLat = json.airplane.lat;
        lastLng = json.airplane.lng;
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
          this.disconnect();
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
    if (!airplaneMarker) {
      this.createAirplaneMarker(lat,lng);
    }
    airplaneMarker.setLatLng(newLatLng);

    if ( bearing ) {
        // Adapt the rotation directo for the current icon used
        if ( bearing >= 0 && bearing <= 180 ) {
          bearing += 180;
        } else {
          bearing -= 180;
        }
        // Save last calculated bearing
        lastBearing = bearing;
        // Rotate the Icon according with the bearing
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


  static rotateMarker(_bearing) {
    if ( airplaneMarker ) {
      _bearing = parseInt(_bearing);
      // New bearing Popup info
      airplaneMarker.setPopupContent("<h3>Bearing</h3>" + _bearing);
      // Remove the last rotate info
      var oldBearingCss = (airplaneMarker._icon.style.transform).replace( new RegExp("rotate\\(.*deg\\)","gm"), "");
      // Add the new rotate info
      var newBearingCss = oldBearingCss + ' rotate(' + _bearing +  'deg)';                
      // Icon Airplane
      airplaneMarker._icon.style.transform         = newBearingCss;
      airplaneMarker._icon.style.transformOrigin   = "center center 0px";
      // Icon Shadown Airplane
      airplaneMarker._shadow.style.transform       = newBearingCss;
      airplaneMarker._shadow.style.transformOrigin = "center center 0px";
    }
  }

  ionViewDidLoad() {
    this.loadMap();
    this.positionMapWithUserLocation();
  }

  ionViewDidEnter() {
    //this.positionMapWithUserLocation();
  }

  createAirplaneMarker(_latitude, _longitude) {
    this.utils.trace("Adding airplaned to " + _latitude + ":" + _longitude);
    airplaneMarker = leaflet.marker([_latitude, _latitude], {icon: AIRPLANE_ICON}).addTo(map);
    leaflet.DomUtil.addClass(airplaneMarker._icon,'aviationClass');
    airplanePopup = airplaneMarker.bindPopup("<b>Hello world!</b><br>I am an airplane.");
    airplanePopup.setLatLng([_latitude, _longitude]);

    // Observer for the subscription (see right below)
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutationRecord) {
          var oldValue = airplaneMarker._icon.style.transform
          var newValue = oldValue.replace( new RegExp("rotate\\(.*deg\\)","gm"), "");
          airplaneMarker._icon.style.transform   = newValue + " rotate(" + lastBearing + "deg)";
          airplaneMarker._shadow.style.transform = newValue + " rotate(" + lastBearing + "deg)";
      });    
    });
    // Subscription to observe the eventual style modification of the AirplaneMarker (by something other than me)
    airplaneMarker._icon.id = "airplaneMarker";
    var airplaneMarkerTarget = document.getElementById(airplaneMarker._icon.id);
    observer.observe(airplaneMarkerTarget, { attributes : true, attributeFilter : ['style'] });
  }

  positionMapWithUserLocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      if (resp) {
        userLatitude  = resp.coords.latitude;
        userLongitude = resp.coords.longitude;
        this.utils.info("LatLng User Location: " + userLatitude + ":" + userLongitude);
        var latLng = leaflet.latLng(userLatitude, userLongitude);
        userMarker = leaflet.marker([userLatitude, userLongitude]).addTo(map);
        map.flyTo(latLng, MAX_ZOOM - 4, ZOOM_PAN_OPTIONS);
      }      
    }).catch((error) => {
       this.utils.error('Error getting location: ' + error.message);
    });

    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {

      if ( data 
           && data.coords 
           && data.coords.latitude
           && data.coords.longitude
           && (data.coords.latitude != userLatitude || data.coords.longitude != userLongitude) ) {

        userLatitude  = data.coords.latitude;
        userLongitude = data.coords.longitude;

        if ( userMarker ) {
          var newLatLng = new leaflet.LatLng(userLatitude,userLongitude);
          userMarker.setLatLng(newLatLng);
        }
      }      
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
    map.addControl(this.createDisconnectButton());
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

    if ( airplaneMarker ) {
      airplaneMarker.setIcon(AIRPLANE_ICON);
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

            if ( isNaN(userLongitude) ) {
              MapPage.myself.utils.warn("User Longitude were NaN, set to " + DEFAULT_LONGITUDE);
              userLongitude = DEFAULT_LONGITUDE;
            }
            if ( isNaN(userLatitude) ) {
              MapPage.myself.utils.warn("Latitude were NaN, set to " + DEFAULT_LATITUDE);
              userLatitude = DEFAULT_LATITUDE;
            }
            
            map.flyTo({lon: userLongitude, lat: userLatitude}, MAX_ZOOM - 3, ZOOM_PAN_OPTIONS);
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

  createDisconnectButton() {
    var playPauseButtonControl = leaflet.Control.extend({
      options: {
        position: 'topleft' 
        //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
      },
     
      onAdd: function (map) {
          var container = MapPage.createContainerButton();

          var iconDisconnect = leaflet.DomUtil.create('i', 'fas fa-sign-out-alt fa-3x');
          iconDisconnect.style.width     = '40px';
          iconDisconnect.style.height    = '40px';
          iconDisconnect.style.margin    = "0px 0px 0px 2px";
          container.appendChild(iconDisconnect);

          container.onclick = function() {
            let alert = staticAlertController.create({
            title: 'Warning',
            message: `
              Are you sure want disconnect from X-Plane?
            `,
            buttons: [
              {
                text: 'Forget it',
                role: 'cancel',
                handler: () => {
                }
              },
              {
                text: 'Yes, go ahed!',
                handler: () => {
                  MapPage.myself.disconnect();
                }
              }
            ]
            });
            alert.present();
          }
          
          buttonDisconnect = container;
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
    airplaneMarker = null;
    lastLat        = null;
    lastLng        = null;
    latitude       = null;
    longitude      = null;
    lastBearing    = null;

    attempingConnectTimes++;
    this.utils.info("[" + attempingConnectTimes + "] Attempting connect to X-Plane at " + wsURL);
    this.connectXPlane();
  }

  disconnect() {
    clearInterval(threadAttempConnection);
    this.subscription.complete();
    this.subscription.unsubscribe();
    this.changeConnectMeStateOFF();
    this.changeStateToDisconnected();
    this.xpWsSocket.disconnect();

    if (airplaneMarker) {
      this.utils.trace("Removed the AirplaneMarker");
      map.removeLayer(airplaneMarker);
    }
    airplaneMarker = null;
  }

  connectXPlane() {
    this.subscription = this.xpWsSocket.connect(wsURL).subscribe(
        payload => {
          clearInterval(threadAttempConnection);
          this.onMessageReceived(payload);
          this.hideContactingXPlaneImg();
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
        Port: <font color="blue"><b>` + this.xplanePort + `</b></font><br>
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

