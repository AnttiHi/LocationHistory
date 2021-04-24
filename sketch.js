let myMap;
let canvas;
let data;
let latitudes = [];
let longitudes = [];
var dotSize;
var endTime;
var startTime;
var heat;
var dotAlpha;
var firstTimestamp;
var lastTimestamp;

const mappa = new Mappa('Leaflet');

const options = {
  lat: 0,
  lng: 0,
  zoom: 1.5,
  style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
}

function preload() {
  data = loadJSON('locationhistory.json');
}


function setup() {
  canvas = createCanvas(window.innerWidth, window.innerHeight);
  testMap = mappa.tileMap(options);
  testMap.overlay(canvas);

  firstTimestamp = data.locations[0].timestampMs;
  lastTimestamp = data.locations[data.locations.length-1].timestampMs;

  endTime = createSlider(firstTimestamp, lastTimestamp, firstTimestamp, 3600000).size(1000);
  dotSize = createSlider(5, 20, 10, 0.01);
  startTime = createSlider(firstTimestamp, lastTimestamp, firstTimestamp, 3600000).size(1000);
  dotAlpha = createSlider(50, 255, 255, 0.1)

  testMap.onChange(updateMap);
  endTime.changed(updateMap);
  startTime.changed(updateMap);
  dotSize.changed(updateMap);
  dotAlpha.changed(updateMap);


  for (var i in data.locations) {
    lat = data.locations[i].latitudeE7;
    lat = lat.toString();
    lat = lat.slice(0, 2) + "." + lat.slice(2, 8);
    lon = data.locations[i].longitudeE7;
    lon = lon.toString();
    lon = lon.slice(0, 2) + "." + lon.slice(2, 8);
    latitudes.push(lat);
    longitudes.push(lon);
  }
}

function updateMap() {
  clear();
  dots = [[]];
  for (i in data.locations) {
    if (data.locations[i].timestampMs <= endTime.value() && data.locations[i].timestampMs >= startTime.value()) {
      const pix = testMap.latLngToPixel(latitudes[i], longitudes[i]);
      if (pix.x > 0 && pix.x < windowWidth && pix.y > 0 && pix.y < windowHeight) {
        if (!inArray(dots, [pix.x, pix.y])) {
          heat = map(data.locations[i].timestampMs, startTime.value(), endTime.value(), 0, 220);
          fill(heat, 70, (220 - heat), dotAlpha.value());
          ellipse(pix.x, pix.y, dotSize.value());
          noStroke();
          dots.push([pix.x, pix.y]);
        }
      }
    }
  }


  var startFormatted = new Date(startTime.value());
  var endFormatted = new Date(endTime.value());
  var startDate = new Date(startFormatted);
  var endDate = new Date(endFormatted);

  var startResult = startDate.toLocaleDateString('fi',);
  var endResult = endDate.toLocaleDateString('fi',);
  textSize(32);
  fill(0, 0, 0, 120);
  text(startResult + " - " + endResult, 100, 30);
}

function inArray(array, item) {
  for (var i = 0; i < array.length; i++) {
    if (array[i][0] == item[0] && array[i][1] == item[1]) {
      return true;
    }
  }
  return false;
}