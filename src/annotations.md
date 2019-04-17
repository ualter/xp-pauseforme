## Simple Annotations
#### Steps new workspace Ionic Project (basically)
```shell
$ npm i -g cordova ionic
$ npm install
$ ionic cordova prepare
```
#### Development Server
```shell
$ ionic serve -c ## Print app console logs to Ionic CLI
$ ionic serve -l ## Test your apps on multiple platform types in the browser
$ ionic serve --prod ## Build the application for production
$ ionic serve --help ## See all available options
```
---
## Plugins
#### Check Plugins Outdated
```shell
$ npm outdated
```
#### Check Outdate packages (install plugin for that)
```shell
$ npm install -g npm-check
$ npm-check
$ npm-check --skip-unused
```
#### Update Plugins
```shell
## Simple Version
$ npm update (simple version)
## Update package.json, etc.
$ npm i -g npm-check-updates && ncu -u && npm i
```
#### Install OpenStreetMaps Plugin (no need if fresh start)
```shell
$ npm install leaflet --save
```
#### Cordova Plugin Geolocation (openstreetmaps) to work on devices
```shell
$ ionic cordova plugin add cordova-plugin-geolocation
$ npm install @ionic-native/geolocation --save
```
#### Animations
```shell
$ npm install --save web-animations-js
```
#### Local Notifications Plugin
```shell
$ ionic cordova plugin add cordova-plugin-local-notification
$ npm install @ionic-native/local-notifications
```
---
## Platforms
#### Android
```shell
$ ionic cordova run android --prod
```
#### iOS
```shell
## First option to Build (cleaner)
$ ionic cordova build
## First option to Emulate (cleaner)
$ ionic cordova emulate ios
## If any problems, trying some alternatives...
$ ionic cordova build ios -- --buildFlag="-UseModernBuildSystem=0"
$ ionic cordova run ios -l -- --buildFlag="-UseModernBuildSystem=0"
$ ionic cordova emulate ios -- --buildFlag="-UseModernBuildSystem=0"
$ cordova run ios --debug --target "iPhone-8" --buildFlag='-UseModernBuildSystem=0'
```
#### Browser Desktop
```shell
## Add Platform if not present
$ ionic cordova platform add browser
## Run it
$ ionic cordova run browser
```
---
### Troubleshooting

##### For this error:
```diff
$ ionic build prod
-Error: The Angular Compiler requires TypeScript >=3.1.1 and <3.3.0 but 2.6.2 was found instead. 
```
##### Try (https://bit.ly/2IxKCJc)
```shell
$ npm i typescript@3.1.6 --save-dev --save-exact
$ npm i
```
---
#### Ualter Jr.
