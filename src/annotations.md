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

# Emulate iOS Version 12 need be this way:
$ ionic cordova run ios -- --buildFlag="-UseModernBuildSystem=0"
# Just build...
$ ionic cordova build ios -- --buildFlag="-UseModernBuildSystem=0"

# Animations
$ npm install --save web-animations-js