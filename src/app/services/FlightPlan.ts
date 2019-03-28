import { Injectable } from "@angular/core";
import { Utils } from "./Utils";
import { Aviation } from './Aviation';
import leaflet from 'leaflet';
import { isRightSide } from "ionic-angular/umd/util/util";
import { MapOperator } from "rxjs/operators/map";
import { connectableObservableDescriptor } from "rxjs/observable/ConnectableObservable";

var map;
var flightPlanPaths = [];
var flightPlanMarkersAirportGroup1;
var flightPlanMarkersAirportGroup2;
var flightPlanMarkersSize1Group;
var flightPlanMarkersSize2Group;
var flightPlanMarkersSize3Group;
var flightPlanMarkersSize4Group;

class IconSize1 {
  ICON_WIDTH         = 100;
  ICON_HEIGHT        = 50;
  ICON_ANCHOR_WIDTH  = this.ICON_WIDTH / 4;
  ICON_ANCHOR_HEIGHT = this.ICON_WIDTH / 2;

  NDB_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s1/icon_ndb.png',
    shadowUrl:    'assets/imgs/s1/icon_ndb_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],  // point of the icon which will correspond to marker's location
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],  // the same for the shadow
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]  // point from which the popup should open relative to the iconAnchor
  });
  VOR_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s1/icon_vor.png',
    shadowUrl:    'assets/imgs/s1/icon_vor_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  FIX_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s1/icon_fix.png',
    shadowUrl:    'assets/imgs/s1/icon_fix_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  LATLNG_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s1/icon_latlng.png',
    shadowUrl:    'assets/imgs/s1/icon_latlng_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  LOCATION_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s1/icon_location.png',
    shadowUrl:    'assets/imgs/s1/icon_location_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  AIRPORT_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s1/icon_airport.png',
    shadowUrl:    'assets/imgs/s1/icon_airport_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
}

class IconSize2 {
  ICON_WIDTH         = 80;
  ICON_HEIGHT        = 40;
  ICON_ANCHOR_WIDTH  = this.ICON_WIDTH / 4;
  ICON_ANCHOR_HEIGHT = this.ICON_WIDTH / 2;

  NDB_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s2/icon_ndb_s2.png',
    shadowUrl:    'assets/imgs/s2/icon_ndb_s2_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],  // point of the icon which will correspond to marker's location
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],  // the same for the shadow
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]  // point from which the popup should open relative to the iconAnchor
  });
  VOR_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s2/icon_vor_s2.png',
    shadowUrl:    'assets/imgs/s2/icon_vor_s2_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  FIX_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s2/icon_fix_s2.png',
    shadowUrl:    'assets/imgs/s2/icon_fix_s2_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  LATLNG_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s2/icon_latlng_s2.png',
    shadowUrl:    'assets/imgs/s2/icon_latlng_s2_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  LOCATION_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s2/icon_location_s2.png',
    shadowUrl:    'assets/imgs/s2/icon_location_s2_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  AIRPORT_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/s2/icon_airport_s2.png',
    shadowUrl:    'assets/imgs/s2/icon_airport_s2_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
}

var iconSize1 = new IconSize1();
var iconSize2 = new IconSize2();

var zoomIconSize1 = [10,18];
var zoomIconSize2 = [8,9];
var zoomIconSize3 = [6,7];
var zoomIconSize4 = [5,5];

/*
var icon = centerMarker.options.icon;
icon.options.iconSize = [newwidth, newheight];
centerMarker.setIcon(icon);
*/

@Injectable()
export class FlightPlan {

    versionPrinted = 0;

    constructor(public utils: Utils,
        public aviation: Aviation) {
          flightPlanMarkersAirportGroup1 = new leaflet.FeatureGroup();
          flightPlanMarkersAirportGroup2 = new leaflet.FeatureGroup();
          flightPlanMarkersSize1Group    = new leaflet.FeatureGroup();
          flightPlanMarkersSize2Group    = new leaflet.FeatureGroup();
          flightPlanMarkersSize3Group    = new leaflet.FeatureGroup();
          flightPlanMarkersSize4Group    = new leaflet.FeatureGroup();
    }        

    setMap(_map) {
        map = _map;
    }

    showFlightPlan(flightPlan){
        this.utils.debug(flightPlan);
        if ( flightPlan  ) {
            // clean previous if exists
            this.cleanPreviousFlightPlan();

            let previousLatLng = [];
            let departLatLng   = [];
            let pointList      = [];
            let marker;

            for (var index = 0; index < flightPlan.waypoints.length; ++index) {
                var wpt = flightPlan.waypoints[index];
                pointList.push(new leaflet.LatLng(wpt.latitude,wpt.longitude));

                let distanceFromPreviousWpt = 0;
                let distanceFromDepartWpt   = 0;

                // Depart Airport
                if ( index == 0 ) {
                  departLatLng = [wpt.latitude, wpt.longitude, wpt.id];
                  this.addAirportToGroups(wpt);
                } else
                // Arrival Airport
                if ( index == (flightPlan.waypoints.length - 1) ) {
                  this.addAirportToGroups(wpt);
                } else {
                  if ( previousLatLng.length > 0 ) {
                    // Calculating distances From Depart Airport and from Last Waypoint
                    //distanceFromPreviousWpt = Math.floor(this.aviation.distance(wpt.longitude, wpt.latitude, previousLatLng[1], previousLatLng[0]));
                    //distanceFromDepartWpt   = Math.floor(this.aviation.distance(wpt.longitude, wpt.latitude, departLatLng[1], departLatLng[0]));

                    //var msg = previousLatLng[2] + " to " + wpt.id + " " + distanceFromPreviousWpt + " From Departing " + distanceFromDepartWpt;
                    //console.log(msg);
                  }

                  // Marker Navadis
                  marker = this.createNextDestinationMarker(wpt,iconSize1);
                  flightPlanMarkersSize1Group.addLayer(marker);

                  marker = this.createNextDestinationMarker(wpt,iconSize2);
                  flightPlanMarkersSize2Group.addLayer(marker);

                  marker = this.createNextDestinationCircle(wpt,3);
                  flightPlanMarkersSize3Group.addLayer(marker);

                  marker = this.createNextDestinationCircle(wpt,4);
                  flightPlanMarkersSize4Group.addLayer(marker);

                  if (  distanceFromPreviousWpt <= 100 ) {
                  } 
                }

                // Vector FlightPlan
                if ( previousLatLng.length > 0  ) {
                  var path  = new leaflet.polyline([[previousLatLng[0], previousLatLng[1]],[wpt.latitude, wpt.longitude]], {
                    color: 'black',
                    weight: 3,
                    opacity: 0.9,
                    smoothFactor: 9
                  });
                  path.addTo(map);
                  flightPlanPaths.push(path);
                }

                previousLatLng = [wpt.latitude, wpt.longitude, wpt.id];
            }

            if ( map.getZoom() >= zoomIconSize1[0] &&  map.getZoom() <= zoomIconSize1[1] )   {
              map.addLayer(flightPlanMarkersSize1Group);
            } else 
            if ( map.getZoom() >= zoomIconSize2[0] &&  map.getZoom() <= zoomIconSize2[1] )   {
              map.addLayer(flightPlanMarkersSize2Group);
            } else 
            if ( map.getZoom() >= zoomIconSize3[0] &&  map.getZoom() <= zoomIconSize3[1] )   {
              map.addLayer(flightPlanMarkersSize3Group);
            } else 
            if ( map.getZoom() >= zoomIconSize4[0] &&  map.getZoom() <= zoomIconSize4[1] )   {
              map.addLayer(flightPlanMarkersSize4Group);
            }
            this.versionPrinted = flightPlan.version;
        }
    }

  private addAirportToGroups(wpt: any) {
    flightPlanMarkersAirportGroup1.addLayer(this.createAirportMarker(wpt, iconSize1));
    flightPlanMarkersAirportGroup2.addLayer(this.createAirportMarker(wpt, iconSize2));
  }

    cleanPreviousFlightPlan() {
      if (flightPlanPaths) {
         for (var path of flightPlanPaths) {
           map.removeLayer(path);
         }
      }
      flightPlanMarkersSize1Group.clearLayers();
      flightPlanMarkersSize2Group.clearLayers();
      flightPlanMarkersSize3Group.clearLayers();
      flightPlanMarkersSize4Group.clearLayers();
      if ( flightPlanMarkersSize1Group ) {
        map.removeLayer(flightPlanMarkersSize1Group);
      }
      if ( flightPlanMarkersSize2Group ) {
        map.removeLayer(flightPlanMarkersSize2Group);
      }
      if ( flightPlanMarkersSize3Group ) {
        map.removeLayer(flightPlanMarkersSize3Group);
      }
      if ( flightPlanMarkersSize4Group ) {
        map.removeLayer(flightPlanMarkersSize4Group);
      }
      if ( flightPlanMarkersAirportGroup1 ) {
        map.removeLayer(flightPlanMarkersAirportGroup1);
      }
      if ( flightPlanMarkersAirportGroup2 ) {
        map.removeLayer(flightPlanMarkersAirportGroup2);
      }
    }

    /*flightPlanMarkersSize1Group.eachLayer(function(layer){
            var icon = layer.options.icon;
            icon.options.iconSize   = [100, 50];
            icon.options.shadowSize = [100, 50];
            layer.setIcon(icon);
          });*/
    adaptFlightPlanToZoom(zoom) {
      if ( flightPlanPaths && flightPlanPaths.length > 0 ) {
        console.log( map.getZoom() );
        if ( map.getZoom() >= zoomIconSize1[0] &&  map.getZoom() <= zoomIconSize1[1] )   {
          console.log("Size1");
          map.removeLayer(flightPlanMarkersSize2Group);
          map.removeLayer(flightPlanMarkersSize3Group);
          map.removeLayer(flightPlanMarkersSize4Group);
          map.addLayer(flightPlanMarkersSize1Group);
          map.addLayer(flightPlanMarkersAirportGroup1);
          map.removeLayer(flightPlanMarkersAirportGroup1);
        } else 
        if ( map.getZoom() >= zoomIconSize2[0] &&  map.getZoom() <= zoomIconSize2[1] )   {
          console.log("Size2");
          map.removeLayer(flightPlanMarkersSize1Group);
          map.removeLayer(flightPlanMarkersSize3Group);
          map.removeLayer(flightPlanMarkersSize4Group);
          map.addLayer(flightPlanMarkersSize2Group);
          map.addLayer(flightPlanMarkersAirportGroup1);
          map.removeLayer(flightPlanMarkersAirportGroup1);
        } else 
        if ( map.getZoom() >= zoomIconSize3[0] &&  map.getZoom() <= zoomIconSize3[1] )   {
          console.log("Size3");
          map.removeLayer(flightPlanMarkersSize1Group);
          map.removeLayer(flightPlanMarkersSize2Group);
          map.removeLayer(flightPlanMarkersSize4Group);
          map.addLayer(flightPlanMarkersSize3Group);
          map.addLayer(flightPlanMarkersAirportGroup2);
          map.removeLayer(flightPlanMarkersAirportGroup2);
        } else 
        if ( map.getZoom() >= zoomIconSize4[0] &&  map.getZoom() <= zoomIconSize4[1] )   {
          console.log("Size4");
          map.removeLayer(flightPlanMarkersSize1Group);
          map.removeLayer(flightPlanMarkersSize2Group);
          map.removeLayer(flightPlanMarkersSize3Group);
          map.addLayer(flightPlanMarkersSize4Group);
          map.addLayer(flightPlanMarkersAirportGroup2);
          map.removeLayer(flightPlanMarkersAirportGroup2);
        } else {
          map.removeLayer(flightPlanMarkersSize1Group);
          map.removeLayer(flightPlanMarkersSize2Group);
          map.removeLayer(flightPlanMarkersSize3Group);
          map.removeLayer(flightPlanMarkersSize4Group);
          map.addLayer(flightPlanMarkersAirportGroup2);
          map.removeLayer(flightPlanMarkersAirportGroup2);
        }
      }
    }

    createNextDestinationMarker(navaid, iconSize) {
        let icon = iconSize.LOCATION_ICON;
        if ( "NDB" == navaid.type ) {
             icon = iconSize.NDB_ICON;
        } else
        if ( "VOR" == navaid.type ) {
             icon = iconSize.VOR_ICON;
        } else
        if ( "FIX" == navaid.type ) {
             icon = iconSize.FIX_ICON;
        } else
        if ( "Lat/Lng" == navaid.type ) {
             icon = iconSize.LATLNG_ICON;
        } else
        if ( "Airport" == navaid.type ) {
             icon = iconSize.AIRPORT_ICON;
        } else {
          this.utils.warn(navaid.type + " Not found an ICON for it!!!");
        }
        this.utils.trace("Adding next destination marker to " + navaid.latitude + ":" + navaid.longitude);
        var nextDestinationMarker    = leaflet.marker([navaid.latitude,navaid.longitude], {icon: icon});
        let htmlPopup                = this.destinationHtmlPopup(navaid);
        var nextDestinationPopUp     = nextDestinationMarker.bindPopup(htmlPopup);
        nextDestinationPopUp.setLatLng([navaid.latitude,navaid.longitude]);
        return nextDestinationMarker;
    }

    createNextDestinationCircle(navaid, iconSize) {
        let radius;
        if ( iconSize == 3 ) {
          radius = 6;
        } else
        if ( iconSize == 4 ) {
          radius = 2;
        } 
        let icon = iconSize.LOCATION_ICON;
        if ( "NDB" == navaid.type ) {
            icon = iconSize.NDB_ICON;
        } else
        if ( "VOR" == navaid.type ) {
            icon = iconSize.VOR_ICON;
        } else
        if ( "FIX" == navaid.type ) {
            icon = iconSize.FIX_ICON;
        } else
        if ( "Lat/Lng" == navaid.type ) {
            icon = iconSize.LATLNG_ICON;
        } else
        if ( "Airport" == navaid.type ) {
            icon = iconSize.AIRPORT_ICON;
        } else {
          this.utils.warn(navaid.type + " Not found an ICON for it!!!");
        }
        this.utils.trace("Adding next destination marker to " + navaid.latitude + ":" + navaid.longitude);
        var circle = new leaflet.circleMarker([navaid.latitude,navaid.longitude],
        {
          radius: radius,
          stroke: true,
          color: 'black',
          fillColor: 'white',
          fillOpacity: 0.5,
          weight: 1,
          lineCap: 'round'
        });
        let htmlPopup                = this.destinationHtmlPopup(navaid);
        var nextDestinationPopUp     = circle.bindPopup(htmlPopup);
        nextDestinationPopUp.setLatLng([navaid.latitude,navaid.longitude]);
        return circle;
     }

    createAirportMarker(navaid, iconSize) {
      let icon     = iconSize.AIRPORT_ICON;
      this.utils.trace("Adding next destination marker to " + navaid.latitude + ":" + navaid.longitude);
      //var nextDestinationMarker    = leaflet.marker([navaid.latitude,navaid.longitude], {icon: icon}).addTo(map);
      var nextDestinationMarker    = leaflet.marker([navaid.latitude,navaid.longitude], {icon: icon});
      let htmlPopup                = this.destinationHtmlPopup(navaid);
      var nextDestinationPopUp     = nextDestinationMarker.bindPopup(htmlPopup);
      nextDestinationPopUp.setLatLng([navaid.latitude,navaid.longitude]);
      return nextDestinationMarker;
  }

    destinationHtmlPopup(navaid, markerFrom?, airplaneLocation?) {
        let paddingValue  = 3;
        let fontSizeLabel = 12;
        let fontSizeValue = 12;
        let fontSizeUnit  = 11;

        let time;
        if ( navaid.fmsTime ) {
          time = navaid.fmsTime;
        } else {
          time = navaid.dmeTime;
        }
        let timeCell = `
          <tr>
            <td>
              <span style="font-size:` + fontSizeLabel + `px;font-family:Consolas">Time.....:</span>
            </td>
            <td align="right" style="padding-right:` + paddingValue + `px;">
              <span style="font-size:` + fontSizeValue + `px;color:blue;font-weight:bold;">` + time + `</span>
            </td>
            <td>
              <span style="color:black;font-weight:bold;font-size:` + fontSizeUnit +`px;"> </span>
            </td>
          </tr>
        `;
        if ( markerFrom ) {
          timeCell = "";
        }

        let distance;
        if ( markerFrom ) {
            distance = markerFrom.getLatLng().distanceTo(airplaneLocation) * 0.000539957; // Convert meters to nautical miles
            distance = this.utils.formatNumber(Math.round(distance)) ; 
        } else {
            distance = this.utils.formatNumber(navaid.distance);
        }
    
        let idCell = `
        <tr>
            <td>
              <span style="font-size:` + fontSizeLabel + `px;font-family:Consolas">ID.......:</span>
            </td>
            <td align="right" style="padding-right:` + paddingValue + `px;">
              <span style="font-size:` + fontSizeValue + `px;color:blue;font-weight:bold;">` + navaid.id + `</span>
            </td>
            <td>
              <span style="color:black;font-weight:bold;font-size:` + fontSizeUnit +`px;"> </span>
            </td>
          </tr>
        `;

        let name = navaid.name;
        if ( navaid.type == "Lat./Long." || navaid.type == "Last Location" )  {
          idCell = "";
        }    

        var html = `
          <span style="font-size:12px;"><b>` + name + `</b></span>
          <hr>
          <table border=0 cellspacing=0 cellpadding=0>
          ` + idCell + `
          <tr>
            <td>
              <span style="font-size:` + fontSizeLabel + `px;font-family:Consolas">Distance.:</span>
            </td>
            <td align="right" style="padding-right:` + paddingValue + `px;">
              <span style="font-size:` + fontSizeValue + `px;color:blue;font-weight:bold;">` + distance + `</span>
            </td>
            <td>
              <span style="color:black;font-weight:bold;font-size:` + fontSizeUnit +`px;">nm</span>
            </td>
          </tr>
          ` + timeCell + `
          <tr>
            <td>
              <span style="font-size:` + fontSizeLabel + `px;font-family:Consolas">Navaid...:</span>
            </td>
            <td align="right" style="padding-right:` + paddingValue + `px;">
              <span style="font-size:` + fontSizeValue + `px;color:blue;font-weight:bold;">` + navaid.type + `</span>
            </td>
            <td>
              <span style="color:black;font-weight:bold;font-size:` + fontSizeUnit +`px;"> </span>
            </td>
          </tr>
          <tr>
            <td>
              <span style="font-size:` + fontSizeLabel + `px;font-family:Consolas">Latitude.:</span>&nbsp;&nbsp;
            </td>
            <td align="right" style="padding-right:` + paddingValue + `px;">
              <span style="font-size:` + fontSizeValue + `px;color:blue;font-weight:bold;">` + navaid.latitude + `</span>
            </td>
            <td>
              <span style="color:black;font-weight:bold;font-size:` + fontSizeUnit +`px;"> </span>
            </td>
          </tr>
          <tr>
            <td>
              <span style="font-size:` + fontSizeLabel + `px;font-family:Consolas">Longitude:</span>&nbsp;&nbsp;
            </td>
            <td align="right" style="padding-right:` + paddingValue + `px;">
              <span style="font-size:` + fontSizeValue + `px;color:blue;font-weight:bold;">` + navaid.longitude + `</span>
            </td>
            <td>
              <span style="color:black;font-weight:bold;font-size:` + fontSizeUnit +`px;"> </span>
            </td>
          </tr>
          </table>
        `;
        return html;
      }

}