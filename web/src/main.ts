// Polyfills for legacy WebViews (Chromium < 93)
if (typeof (Object as any).hasOwn === 'undefined') {
  (Object as any).hasOwn = (obj: any, prop: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, prop);
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
