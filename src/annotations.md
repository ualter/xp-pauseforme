# Install OpenStreetMaps Plugin
$ npm install leaflet --save

# Cordova Plugin Geolocation (openstreetmaps) to work on devices
$ ionic cordova plugin add cordova-plugin-geolocation
$ npm install @ionic-native/geolocation --save

# Run Android Emulator
$ ionic cordova run android --prod

# List Valid Emulators
$ ionic cordova run android --list

# Add Browser Platform for Desktop tests
$ ionic cordova platform add browser
$ ionic cordova run browser