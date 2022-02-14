p5.disableFriendlyErrors = true;

let myMap;
let canvas;
let data;
let latitudes = [];
let longitudes = [];
let times = [];
let sel;
var dotSize;
var endTime;
var startTime;
var heat;
var dotAlpha;
var firstTimestamp;
var lastTimestamp;
var mapstyle = "http://{s}.tile.osm.org/{z}/{x}/{y}.png";
var dragged = false;
var accuracy;
var opacity;
var heatOn = true;
var play;
var playMode = false;
var timePoint = 0;
var grain;
var startTimeIndex;
var prev = [];
var timePoints = [];
var triple = [];

const mappa = new Mappa('Leaflet');

const options = {
  lat: 0,
  lng: 0,
  zoom: 1.5,
  style: mapstyle,
  zoomSnap: 0,
  boxZoom: true
}

function preload() {
  data = loadJSON('locationhistory.json');
}


function setup() {
  canvas = createCanvas(window.innerWidth, window.innerHeight);
  drawMap();

  firstTimestamp = data.locations[0].timestampMs;
  lastTimestamp = data.locations[data.locations.length - 1].timestampMs;

  endTime = createSlider(firstTimestamp, lastTimestamp, firstTimestamp, 3600000).size(1000);
  dotSize = createSlider(3, 20, 6, 0.01);
  startTime = createSlider(firstTimestamp, lastTimestamp, firstTimestamp, 3600000).size(1000);
  dotAlpha = createSlider(50, 255, 255, 0.1);
  accuracy = createSlider(1, 20, 1, 1);
  opacity = createSlider(0, 255, 0, 1);
  play = createButton('PLAY');
  grain = createSlider(1, 100, 1, 1);

  testMap.onChange(updateMap);
  endTime.changed(updateMap);
  startTime.changed(updateMap);
  dotSize.changed(updateMap);
  dotAlpha.changed(updateMap);
  accuracy.changed(updateMap);
  play.mousePressed(changeMode);

  sel = createSelect();
  sel.option('Street map');
  sel.option('Satellite');
  sel.changed(chooseMap);


  for (var i in data.locations) {
    lat = data.locations[i].latitudeE7;
    lat = lat.toString();
    lat = lat.slice(0, 2) + "." + lat.slice(2, 8);
    lon = data.locations[i].longitudeE7;
    lon = lon.toString();
    lon = lon.slice(0, 2) + "." + lon.slice(2, 8);
    time = parseInt(data.locations[i].timestampMs);
    latitudes.push(lat);
    longitudes.push(lon);
    times.push(time);
    triple.push({time, lat, lon});
  }
}

function updateMap() {
  if (dragged) {
    clear();
    background(255, opacity.value());
    return;
  } else {
    clear();
    background(255, opacity.value());
    dots = [[]];
    if (!playMode) {
      for (i in times) {
        if (i % accuracy.value() == 0) {
          if (times[i] > startTime.value() && times[i] < endTime.value()) {
            const pix = testMap.latLngToPixel(latitudes[i], longitudes[i]);
            if (pix.x > 0 && pix.x < windowWidth && pix.y > 0 && pix.y < windowHeight) {
              //if (!inArray(dots, [pix.x, pix.y])) {
              if (heatOn) {
                heat = map(data.locations[i].timestampMs, startTime.value(), endTime.value(), 0, 220);
                fill(heat, 70, (220 - heat), dotAlpha.value());
              } else {
                fill(255, 0, 255, dotAlpha.value());
              }
              ellipse(pix.x, pix.y, dotSize.value());
              noStroke();
              //dots.push([pix.x, pix.y]);
            }
            //}
          }
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

function chooseMap() {
  if (sel.value() == 'Satellite') {
    mapstyle = 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    heatOn = false;
  } else {
    mapstyle = "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
    heatOn = true;
    drawMap;
  }
}

function drawMap() {
  testMap = mappa.tileMap(options);
  testMap.overlay(canvas);
}

function mouseDragged() {
  dragged = true;
}

function mouseReleased() {
  dragged = false;
  updateMap();
}

function changeMode() {
  if (playMode == true) {
    playMode = false;
  } else {
    startTimeIndex = 0;
    while (times[startTimeIndex] < startTime.value()) {
      startTimeIndex += 1;
    }
    timePoint = startTimeIndex;
    playMode = true;
    prev = [0, 0];
    timePoints = [timePoint];
  }
}

function draw() {
  if (playMode) {
    clear();
    background(255, opacity.value());
    for (let x in timePoints) {
      dot = timePoints[x];
      if (times[dot] < endTime.value()) {
        const pix = testMap.latLngToPixel(latitudes[dot], longitudes[dot]);
          if (pix.x - prev[0] != 0 && pix.y - prev[1] != 0) {
            if (heatOn) {
              heat = map(x, 0, (timePoints.length - 1), 0, 220);
              fill(heat, 70, (220 - heat), Math.max(heat, 100));
            } else {
              fill(255, 0, 255, dotAlpha.value());
            }
            ellipse(pix.x, pix.y, dotSize.value());
            noStroke();
            prev[0] = pix.x;
            prev[1] = pix.y;
          }
      } else {
        playMode = false;
      }
    }
    timePoint += grain.value();
    timePoints.push(timePoint);

    var currentFormatted = new Date(times[timePoint]);
    var currentDate = new Date(currentFormatted);

    var currentResult = currentDate.toLocaleString('fi');
    textSize(32);
    fill(0, 0, 0, 120);
    text(currentResult, 100, 30);
  }
}