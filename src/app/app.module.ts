import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { IonicStorageModule } from '@ionic/storage';
import { MyApp } from './app.component';
import { TabsPage } from '../pages/tabs/tabs';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { MapPage } from '../pages/map/map';
import { SettingsPage } from '../pages/settings/settings';
import { XpWebSocketService } from './services/Xp.web.socket.service';
import { Utils } from './services/Utils';
import { Aviation } from './services/Aviation';
import { DataService } from './services/DataService';
import { Settings } from './services/Settings';
import { Router } from './services/Router';
import { FlightPlan } from './services/FlightPlan';
import { AirplanesPage } from '../pages/airplanes/airplanes';
import { AirplaneServices } from './services/AirplaneServices';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';


@NgModule({
  declarations: [
    MyApp,
    MapPage,
    SettingsPage,
    AirplanesPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    MapPage,
    SettingsPage,
    AirplanesPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Geolocation,
    XpWebSocketService,
    Utils,
    Aviation,
    DataService,
    Settings,
    Router,
    FlightPlan,
    AirplaneServices,
    LocalNotifications,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
