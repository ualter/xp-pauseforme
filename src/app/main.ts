import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app.module';
import 'web-animations-js/web-animations.min';

enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule);
