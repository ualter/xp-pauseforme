import { Injectable } from "@angular/core";
import { Utils } from "./Utils";
import { Aviation } from './Aviation';
import leaflet from 'leaflet';
import { isRightSide } from "ionic-angular/umd/util/util";
import { MapOperator } from "rxjs/operators/map";
import { connectableObservableDescriptor } from "rxjs/observable/ConnectableObservable";

var map;
var flightPlanVector;
var flightPlanMarkersSize1Group;
var flightPlanMarkersSize2Group;

class IconSize1 {
  ICON_WIDTH         = 100;
  ICON_HEIGHT        = 50;
  ICON_ANCHOR_WIDTH  = this.ICON_WIDTH / 4;
  ICON_ANCHOR_HEIGHT = this.ICON_WIDTH / 2;

  NDB_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_ndb.png',
    shadowUrl:    'assets/imgs/icon_ndb_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],  // point of the icon which will correspond to marker's location
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],  // the same for the shadow
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]  // point from which the popup should open relative to the iconAnchor
  });
  VOR_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_vor.png',
    shadowUrl:    'assets/imgs/icon_vor_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  FIX_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_fix.png',
    shadowUrl:    'assets/imgs/icon_fix_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  LATLNG_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_latlng.png',
    shadowUrl:    'assets/imgs/icon_latlng_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  LOCATION_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_location.png',
    shadowUrl:    'assets/imgs/icon_location_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  AIRPORT_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_airport.png',
    shadowUrl:    'assets/imgs/icon_airport_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
}

class IconSize2 {
  ICON_WIDTH         = 50;
  ICON_HEIGHT        = 25;
  ICON_ANCHOR_WIDTH  = this.ICON_WIDTH / 4;
  ICON_ANCHOR_HEIGHT = this.ICON_WIDTH / 2;

  NDB_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_ndb.png',
    shadowUrl:    'assets/imgs/icon_ndb_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],  // point of the icon which will correspond to marker's location
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],  // the same for the shadow
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]  // point from which the popup should open relative to the iconAnchor
  });
  VOR_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_vor.png',
    shadowUrl:    'assets/imgs/icon_vor_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  FIX_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_fix.png',
    shadowUrl:    'assets/imgs/icon_fix_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  LATLNG_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_latlng.png',
    shadowUrl:    'assets/imgs/icon_latlng_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  LOCATION_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_location.png',
    shadowUrl:    'assets/imgs/icon_location_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
  AIRPORT_ICON = leaflet.icon({
    iconUrl:      'assets/imgs/icon_airport.png',
    shadowUrl:    'assets/imgs/icon_airport_shadow.png',
    iconSize:     [this.ICON_WIDTH,this.ICON_HEIGHT],
    shadowSize:   [this.ICON_WIDTH,this.ICON_HEIGHT],
    iconAnchor:   [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    shadowAnchor: [this.ICON_ANCHOR_WIDTH,this.ICON_ANCHOR_HEIGHT],
    popupAnchor:  [0,((this.ICON_HEIGHT/2) + 23) * -1]
  });
}

var iconSize1 = new IconSize1();
var iconSize2 = new IconSize2();

var zoomIconSize1 = [6,18];
var zoomIconSize2 = [0,5];

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
          flightPlanMarkersSize1Group = new leaflet.FeatureGroup();
          flightPlanMarkersSize2Group = new leaflet.FeatureGroup();
    }

    setMap(_map) {
        map = _map;
    }

    showFlightPlan(flightPlan){
        this.utils.debug(flightPlan);
        if ( flightPlan  ) {
            // clean previous if exists
            this.cleanPreviousFlightPlan();

            var pointList = [];
            for (var index = 0; index < flightPlan.waypoints.length; ++index) {
                var wpt = flightPlan.waypoints[index];
                pointList.push(new leaflet.LatLng(wpt.latitude,wpt.longitude));
                flightPlanMarkersSize1Group.addLayer(this.createNextDestinationMarker(wpt,iconSize1));
                flightPlanMarkersSize2Group.addLayer(this.createNextDestinationMarker(wpt,iconSize2));
            }

            if ( map.getZoom() >= zoomIconSize1[0] &&  map.getZoom() <= zoomIconSize1[1] )   {
              map.addLayer(flightPlanMarkersSize1Group);
            } else 
            if ( map.getZoom() >= zoomIconSize2[0] &&  map.getZoom() <= zoomIconSize2[1] )   {
              map.addLayer(flightPlanMarkersSize2Group);
            }

            this.createRouteLine(pointList);
            this.versionPrinted = flightPlan.version;
        }
    }

    cleanPreviousFlightPlan() {
      if (flightPlanVector) {
        map.removeLayer(flightPlanVector);
      }
      if ( flightPlanMarkersSize1Group ) {
        map.removeLayer(flightPlanMarkersSize1Group);
      }
      if ( flightPlanMarkersSize2Group ) {
        map.removeLayer(flightPlanMarkersSize2Group);
      }
    }

    adaptFlightPlanToZoom(zoom) {
      if ( flightPlanVector ) {
        if ( map.getZoom() >= zoomIconSize1[0] &&  map.getZoom() <= zoomIconSize1[1] )   {
          //map.removeLayer(flightPlanMarkersSize2Group);
          //map.addLayer(flightPlanMarkersSize1Group);

          flightPlanMarkersSize1Group.eachLayer(function(layer){
            var icon = layer.options.icon;
            icon.options.iconSize = [100, 50];
            layer.setIcon(icon);
          });


        } else 
        if ( map.getZoom() >= zoomIconSize2[0] &&  map.getZoom() <= zoomIconSize2[1] )   {
          //map.removeLayer(flightPlanMarkersSize1Group);
          //map.addLayer(flightPlanMarkersSize2Group);

          flightPlanMarkersSize1Group.eachLayer(function(layer){
            var icon = layer.options.icon;
            icon.options.iconSize = [50, 25];
            layer.setIcon(icon);
          });

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
        //var nextDestinationMarker    = leaflet.marker([navaid.latitude,navaid.longitude], {icon: icon}).addTo(map);
        var nextDestinationMarker    = leaflet.marker([navaid.latitude,navaid.longitude], {icon: icon});
        let htmlPopup                = this.destinationHtmlPopup(navaid);
        var nextDestinationPopUp     = nextDestinationMarker.bindPopup(htmlPopup);
        nextDestinationPopUp.setLatLng([navaid.latitude,navaid.longitude]);
        return nextDestinationMarker;
    }

    createRouteLine(pointList) {
        flightPlanVector = new leaflet.Polyline(pointList, {
            color: 'blue',
            weight: 2,
            opacity: 0.5,
            smoothFactor: 9
        });
        flightPlanVector.addTo(map);
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