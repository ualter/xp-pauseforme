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
var flightPlanMarkersSize5Group;

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
var zoomIconSize3 = [7,7];
var zoomIconSize4 = [6,6];
var zoomIconSize5 = [5,5];

/*
var icon = centerMarker.options.icon;
icon.options.iconSize = [newwidth, newheight];
centerMarker.setIcon(icon);
*/

@Injectable()
export class FlightPlan {

    airplaneData;
    versionPrinted      = 0;
    flightPlanWaypoints = []

    constructor(public utils: Utils,
        public aviation: Aviation) {
          flightPlanMarkersAirportGroup1 = new leaflet.FeatureGroup();
          flightPlanMarkersAirportGroup2 = new leaflet.FeatureGroup();
          flightPlanMarkersSize1Group    = new leaflet.FeatureGroup();
          flightPlanMarkersSize2Group    = new leaflet.FeatureGroup();
          flightPlanMarkersSize3Group    = new leaflet.FeatureGroup();
          flightPlanMarkersSize4Group    = new leaflet.FeatureGroup();
          flightPlanMarkersSize5Group    = new leaflet.FeatureGroup();
    }        

    setMap(_map) {
        map = _map;
    }

    showFlightPlan(flightPlan, _airplaneData){
        this.utils.debug(flightPlan);
        if ( flightPlan  ) {
            this.airplaneData = _airplaneData;

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
                    distanceFromPreviousWpt = Math.floor(this.aviation.distance(wpt.longitude, wpt.latitude, previousLatLng[1], previousLatLng[0]));
                    distanceFromDepartWpt   = Math.floor(this.aviation.distance(wpt.longitude, wpt.latitude, departLatLng[1], departLatLng[0]));

                    //var msg = previousLatLng[2] + " to " + wpt.id + " " + distanceFromPreviousWpt + " From Departing " + distanceFromDepartWpt;
                    //console.log(msg);
                  }

                  // Marker Navaids
                  marker = this.createNextDestinationMarker(wpt,iconSize1);
                  this.flightPlanWaypoints.push(marker);
                  flightPlanMarkersSize1Group.addLayer(marker);

                  marker = this.createNextDestinationMarker(wpt,iconSize2);
                  flightPlanMarkersSize2Group.addLayer(marker);

                  marker = this.createNextDestinationCircle(wpt,7);
                  flightPlanMarkersSize3Group.addLayer(marker);

                  marker = this.createNextDestinationCircle(wpt,6);
                  flightPlanMarkersSize4Group.addLayer(marker);

                  marker = this.createNextDestinationCircle(wpt,5);
                  flightPlanMarkersSize5Group.addLayer(marker);
                  
                  if (  distanceFromPreviousWpt <= 100 ) {
                  } 
                }

                // Vector FlightPlan
                if ( previousLatLng.length > 0  ) {
                  var path  = new leaflet.polyline([[previousLatLng[0], previousLatLng[1]],[wpt.latitude, wpt.longitude]], {
                    color: 'blue',
                    weight: 4,
                    opacity: 0.85,
                    smoothFactor: 9
                  });
                  path.addTo(map);
                  flightPlanPaths.push(path);
                }

                previousLatLng = [wpt.latitude, wpt.longitude, wpt.id];
            }

            if ( map.getZoom() >= zoomIconSize1[0] &&  map.getZoom() <= zoomIconSize1[1] )   {
              map.addLayer(flightPlanMarkersAirportGroup1);
              map.addLayer(flightPlanMarkersSize1Group);
            } else 
            if ( map.getZoom() >= zoomIconSize2[0] &&  map.getZoom() <= zoomIconSize2[1] )   {
              map.addLayer(flightPlanMarkersAirportGroup1);
              map.addLayer(flightPlanMarkersSize2Group);
            } else 
            if ( map.getZoom() >= zoomIconSize3[0] &&  map.getZoom() <= zoomIconSize3[1] )   {
              map.addLayer(flightPlanMarkersAirportGroup2);
              map.addLayer(flightPlanMarkersSize3Group);
            } else 
            if ( map.getZoom() >= zoomIconSize4[0] &&  map.getZoom() <= zoomIconSize4[1] )   {
              map.addLayer(flightPlanMarkersAirportGroup2);
              map.addLayer(flightPlanMarkersSize4Group);
            } else 
            if ( map.getZoom() >= zoomIconSize5[0] &&  map.getZoom() <= zoomIconSize5[1] )   {
              map.addLayer(flightPlanMarkersAirportGroup2);
              map.addLayer(flightPlanMarkersSize4Group);
            }

            this.versionPrinted = flightPlan.version;
        }
    }

    private addAirportToGroups(wpt: any) {
      let waypoint = this.createAirportMarker(wpt, iconSize1);
      flightPlanMarkersAirportGroup1.addLayer(waypoint);
      this.flightPlanWaypoints.push(waypoint);
      waypoint = this.createAirportMarker(wpt, iconSize1);
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
      flightPlanMarkersSize5Group.clearLayers();

      flightPlanMarkersAirportGroup1.clearLayers();
      flightPlanMarkersAirportGroup2.clearLayers();

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
      if ( flightPlanMarkersSize5Group ) {
        map.removeLayer(flightPlanMarkersSize5Group);
      }

      if ( flightPlanMarkersAirportGroup1 ) {
        map.removeLayer(flightPlanMarkersAirportGroup1);
      }
      if ( flightPlanMarkersAirportGroup2 ) {
        map.removeLayer(flightPlanMarkersAirportGroup2);
      }
    }

    updateAirplaneData(_airplaneData) {
      console.log("updateAirplaneData");
      this.airplaneData = _airplaneData;
      this.updateMarkerPopUps();
    }

    updateMarkerPopUps() {
      flightPlanMarkersAirportGroup1.eachLayer(function(layer){
        console.log(layer.getLatLng());
        //layer.setPopupContent("<h2>nothing</h2>");
      });
      flightPlanMarkersAirportGroup2.eachLayer(function(layer){
        //layer.setPopupContent("<h2>nothing</h2>");
      });
      flightPlanMarkersSize1Group.eachLayer(function(layer){
        console.log(layer.getLatLng());
        //layer.setPopupContent("<h2>nothing</h2>");
      });
      flightPlanMarkersSize2Group.eachLayer(function(layer){
        //layer.setPopupContent("<h2>nothing</h2>");
      });
      flightPlanMarkersSize3Group.eachLayer(function(layer){
        //layer.setPopupContent("<h2>nothing</h2>");
      });
      flightPlanMarkersSize4Group.eachLayer(function(layer){
        //layer.setPopupContent("<h2>nothing</h2>");
      });
      flightPlanMarkersSize5Group.eachLayer(function(layer){
        //layer.setPopupContent("<h2>nothing</h2>");
      });
    }

    adaptFlightPlanToZoom(zoom) {
      if ( flightPlanPaths && flightPlanPaths.length > 0 ) {
        var size = "none";
        if ( map.getZoom() >= zoomIconSize1[0] &&  map.getZoom() <= zoomIconSize1[1] )   {
          size = "Size1";
          map.removeLayer(flightPlanMarkersSize2Group);
          map.removeLayer(flightPlanMarkersSize3Group);
          map.removeLayer(flightPlanMarkersSize4Group);
          map.removeLayer(flightPlanMarkersSize5Group);
          map.addLayer(flightPlanMarkersSize1Group);
          map.addLayer(flightPlanMarkersAirportGroup1);
          map.removeLayer(flightPlanMarkersAirportGroup2);
        } else 
        if ( map.getZoom() >= zoomIconSize2[0] &&  map.getZoom() <= zoomIconSize2[1] )   {
          size = "Size2";
          map.removeLayer(flightPlanMarkersSize1Group);
          map.removeLayer(flightPlanMarkersSize3Group);
          map.removeLayer(flightPlanMarkersSize4Group);
          map.removeLayer(flightPlanMarkersSize5Group);
          map.addLayer(flightPlanMarkersSize2Group);
          map.addLayer(flightPlanMarkersAirportGroup1);
          map.removeLayer(flightPlanMarkersAirportGroup2);
        } else 
        if ( map.getZoom() >= zoomIconSize3[0] &&  map.getZoom() <= zoomIconSize3[1] )   {
          size = "Size3";
          map.removeLayer(flightPlanMarkersSize1Group);
          map.removeLayer(flightPlanMarkersSize2Group);
          map.removeLayer(flightPlanMarkersSize4Group);
          map.removeLayer(flightPlanMarkersSize5Group);
          map.addLayer(flightPlanMarkersSize3Group);
          map.addLayer(flightPlanMarkersAirportGroup2);
          map.removeLayer(flightPlanMarkersAirportGroup1);
        } else 
        if ( map.getZoom() >= zoomIconSize4[0] &&  map.getZoom() <= zoomIconSize4[1] )   {
          size = "Size4";
          map.removeLayer(flightPlanMarkersSize1Group);
          map.removeLayer(flightPlanMarkersSize2Group);
          map.removeLayer(flightPlanMarkersSize3Group);
          map.removeLayer(flightPlanMarkersSize5Group);
          map.addLayer(flightPlanMarkersSize4Group);
          map.addLayer(flightPlanMarkersAirportGroup2);
          map.removeLayer(flightPlanMarkersAirportGroup1);
        } else 
        if ( map.getZoom() >= zoomIconSize5[0] &&  map.getZoom() <= zoomIconSize5[1] )   {
          size = "Size4";
          map.removeLayer(flightPlanMarkersSize1Group);
          map.removeLayer(flightPlanMarkersSize2Group);
          map.removeLayer(flightPlanMarkersSize3Group);
          map.removeLayer(flightPlanMarkersSize4Group);
          map.addLayer(flightPlanMarkersSize5Group);
          map.addLayer(flightPlanMarkersAirportGroup2);
          map.removeLayer(flightPlanMarkersAirportGroup1);  
        } else {
          map.removeLayer(flightPlanMarkersSize1Group);
          map.removeLayer(flightPlanMarkersSize2Group);
          map.removeLayer(flightPlanMarkersSize3Group);
          map.removeLayer(flightPlanMarkersSize4Group);
          map.removeLayer(flightPlanMarkersSize5Group);
          map.addLayer(flightPlanMarkersAirportGroup2);
          map.removeLayer(flightPlanMarkersAirportGroup1);
        }
        console.log( "Zoom..:" + map.getZoom() + ", Size..:" + size);
        this.utils.trace("Zoom..:" + map.getZoom() + ", Size..:" + size);
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
        let marker        = leaflet.marker([navaid.latitude,navaid.longitude], {icon: icon});
        let htmlPopup     = this.createPopUp(navaid);
        let markerPopUp   = marker.bindPopup(htmlPopup);
        let markerTooltip = this.createTooltip(navaid);
        markerPopUp.setLatLng([navaid.latitude,navaid.longitude]);
        marker.bindTooltip(markerTooltip,{opacity:0.85}).openTooltip();
        return marker;
    }
    createNextDestinationCircle(navaid, zoom) {
        let radius;
        let weight;
        if ( zoom >= 7 ) {
          weight = 3;
          radius = 8;
        } else 
        if ( zoom >= 6 ) {
          weight = 2;
          radius = 6;
        } else 
        if ( zoom >= 5 ) {
          weight = 1;
          radius = 3;  
        } else {
          weight = 5;
          radius = 20;
        }
        this.utils.trace("Adding next destination marker to " + navaid.latitude + ":" + navaid.longitude);
        var circle = new leaflet.circleMarker([navaid.latitude,navaid.longitude],
        {
          radius: radius,
          stroke: true,
          color: 'black',
          fillColor: 'white',
          fillOpacity: 0.85,
          weight: weight,
          lineCap: 'round'
        });
        let htmlPopup    = this.createPopUp(navaid);
        let markerPopUp  = circle.bindPopup(htmlPopup);
        markerPopUp.setLatLng([navaid.latitude,navaid.longitude]);
        let toolTip      = this.createTooltip(navaid);
        circle.bindTooltip(toolTip,{opacity:0.85}).openTooltip();
        return circle;
    }

    createAirportMarker(navaid, iconSize) {
      let icon          = iconSize.AIRPORT_ICON;
      this.utils.trace("Adding next destination marker to " + navaid.latitude + ":" + navaid.longitude);
      let marker        = leaflet.marker([navaid.latitude,navaid.longitude], {icon: icon});
      let htmlPopup     = this.createPopUp(navaid);
      let markerPopUp   = marker.bindPopup(htmlPopup);
      let markerTooltip = this.createTooltip(navaid);
      markerPopUp.setLatLng([navaid.latitude,navaid.longitude]);
      marker.bindTooltip(markerTooltip,{opacity:0.85}).openTooltip();
      return marker;
    }

    createTooltip(navaid) {
      let html = `
          <span style="font-size:12px;"><b>` + navaid.name + `</b></span>
      `;
      return html;
    }

    createPopUp(navaid) {
        let paddingValue  = 3;
        let fontSizeLabel = 12;
        let fontSizeValue = 12;
        let fontSizeUnit  = 11;

        let distance;
        if ( this.airplaneData ) {
            let distFrom = new leaflet.latLng(this.airplaneData.lat, this.airplaneData.lng);
            let distTo   = new leaflet.latLng(navaid.latitude, navaid.longitude);
            distance = distFrom.distanceTo(distTo) * 0.000539957; // Convert meters to nautical miles
            distance = this.utils.formatNumber(Math.round(distance)); 
        } else {
            distance = 9999;
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