p5.disableFriendlyErrors = true;

let myMap;
let canvas;
let data;
let latitudes = [];
let longitudes = [];
let times = [];
let accs = [];
let sel;
var dotSize;
var endTime;
var startTime;
var heat;
var dotAlpha;
var firstTimestamp;
var lastTimestamp;
//mapstyles:
//http://{s}.tile.osm.org/{z}/{x}/{y}.png
//https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png
//https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png
//http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
var mapstyle = "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png";
var dragged = false;
var accuracy;
var opacity;
var heatOn = true;
var play;
var pause;
var playMode = false;
var timePoint = 0;
var paused = false;
var startTimeIndex;
var prev = [];
var timePoints = [];
var minFade;
var accuracy;
var lineButton;
var lineMode = false;
var tolerance;
var speed;
var timeIterator = 0;

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
  var startMs = 0;
  var endMs = 0;

  for (var i in data.locations) {
    lat = data.locations[i].latitudeE7;
    lat = lat.toString();
    lat = lat.slice(0, 2) + "." + lat.slice(2, 8);
    lon = data.locations[i].longitudeE7;
    lon = lon.toString();
    lon = lon.slice(0, 2) + "." + lon.slice(2, 8);
    time = parseInt(data.locations[i].timestampMs);
    acc = parseInt(data.locations[i].Accuracy);
    latitudes.push(lat);
    longitudes.push(lon);
    times.push(time);
    accs.push(acc);
  }

  $('input[name="datetimes"]').daterangepicker({
    startDate: moment(times[times.length-1]).startOf('week'),
    endDate: moment(times[times.length-1]),
    locale: {
      format: 'DD/MM/YY'
    }
  });
  $('#daterange').on('apply.daterangepicker', function () {
    var start = ($('#daterange').val().slice(0, 8));
    var end = ($('#daterange').val().slice(11));
    startTime = (moment(start, 'DD/MM/YY').valueOf());
    endTime = (moment(end, 'DD/MM/YY').valueOf());
    update();
  });

  canvas = createCanvas(window.innerWidth, window.innerHeight);
  drawMap();

  firstTimestamp = data.locations[0].timestampMs;
  lastTimestamp = data.locations[data.locations.length - 1].timestampMs;

  startTime = startMs;
  endTime = endMs;

  play = createButton('PLAY');
  pause = createButton('PAUSE');
  lineButton = createButton('MODE');

  createSpan('Dot size');
  dotSize = createSlider(1, 20, 2, 0.01);

  createSpan('Map opacity');
  opacity = createSlider(0, 255, 0, 1);

  createSpan('Accuracy threshold');
  accuracy = createSlider(20, 1000, 10000, 20);

  createSpan('Line threshold');
  tolerance = createSlider(1, 200, 200, 1);

  createSpan('Animation speed');
  speed = createSlider(0, 19, 19, 1);

  createSpan('Fade');
  minFade = createSlider(0, 255, 0, 1);

  testMap.onChange(update);
  dotSize.changed(update);
  play.mousePressed(changeMode);
  pause.mousePressed(pauseSwitch);
  accuracy.changed(update);
  lineButton.mousePressed(lineSwitch);
}

function updateMap() {
  if (playMode || lineMode) {
    return;
  }
  if (dragged) {
    clear();
    background(255, opacity.value());
    return;
  } else {
    clear();
    background(255, opacity.value());
    if (!playMode) {
      for (i in times) {
        if (times[i] > startTime && times[i] < endTime) {
          if (accs[i] <= accuracy.value()) {
            const pix = testMap.latLngToPixel(latitudes[i], longitudes[i]);
            if (pix.x > 0 && pix.x < windowWidth && pix.y > 0 && pix.y < windowHeight) {
              if (heatOn) {
                heat = map(data.locations[i].timestampMs, startTime, endTime, 0, 220);
                fill(heat, 70, (220 - heat), 255);
              } else {
                fill(255, 0, 255, 255);
              }
              ellipse(pix.x, pix.y, dotSize.value());
              noStroke();
            }
          }
        }
      }
    }
  }
  var startFormatted = new Date(startTime);
  var endFormatted = new Date(endTime);
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

function drawMap() {
  testMap = mappa.tileMap(options);
  testMap.overlay(canvas);
}

function mouseDragged() {
  dragged = true;
}

function mouseReleased() {
  dragged = false;
  update();
}

function changeMode() {
  if (playMode == true) {
    playMode = false;
  } else {
    startTimeIndex = 0;
    while (times[startTimeIndex] < startTime) {
      startTimeIndex += 1;
    }
    timePoint = startTimeIndex;
    playMode = true;
    paused = false;
    prev = [0, 0];
    timePoints = [timePoint];
  }
}

function pauseSwitch() {
  if (paused) {
    paused = false;
  } else {
    paused = true;
  }
}

function draw() {
  if (playMode && !lineMode) {
    drawPlay();
  } else if (playMode && lineMode) {
    drawPlayLine();
  }
  timeIterator++;
}

function drawPlay() {
  clear();
  background(255, opacity.value());
  for (let x in timePoints) {
    dot = timePoints[x];
    if (times[dot] > startTime && times[dot] < endTime) {
      if (accs[i] <= accuracy.value()) {
        const pix = testMap.latLngToPixel(latitudes[dot], longitudes[dot]);
        if (pix.x - prev[0] != 0 && pix.y - prev[1] != 0) {
          heat = map(x, 0, (timePoints.length - 1), 0, 220);
          if (x == timePoints.length - 1) {
            fill(255, 255, 255, 255);
          } else {
            fill(heat, 70, (220 - heat), Math.max(heat, (255 - minFade.value())));
          }
          ellipse(pix.x, pix.y, dotSize.value());
          noStroke();
          prev[0] = pix.x;
          prev[1] = pix.y;
        }
      }
    } else {
      paused = true;
    }
  }
  if (!paused) {
    if (timeIterator % (20 - speed.value()) == 0) {
      timePoint += 1;
      timePoints.push(timePoint);
    }
    timeIterator++;
  }

  var currentFormatted = new Date(times[timePoint]);
  var currentDate = new Date(currentFormatted);

  var currentResult = currentDate.toLocaleString('fi');
  textSize(32);
  fill(0, 0, 0, 120);
  text(currentResult, 100, 30);
}

function lineSwitch() {
  prev = [0, 0];
  if (lineMode) {
    lineMode = false;
  } else {
    lineMode = true;
  }
}

function update() {
  if (lineMode) {
    updateMapLine();
  } else {
    updateMap();
  }
}

function getDistance(x1, y1, x2, y2) {
  let y = x2 - x1;
  let x = y2 - y1;

  return Math.sqrt(x * x + y * y);
}

function updateMapLine() {
  if (playMode || !lineMode) {
    return;
  }
  if (dragged) {
    clear();
    background(255, opacity.value());
    return;
  } else {
    clear();
    background(255, opacity.value());
    if (!playMode) {
      for (i in times) {
        if (times[i] > startTime && times[i] < endTime) {
          if (accs[i] <= accuracy.value()) {
            const pix = testMap.latLngToPixel(latitudes[i], longitudes[i]);
            if (pix.x > 0 && pix.x < windowWidth && pix.y > 0 && pix.y < windowHeight) {
              heat = map(data.locations[i].timestampMs, startTime, endTime, 0, 220);
              strokeWeight(dotSize.value());
              stroke(heat, 70, (220 - heat), 255);
              if (getDistance(pix.x, pix.y, prev[0], prev[1]) < tolerance.value()) {
                line(pix.x, pix.y, prev[0], prev[1]);
              }
              prev = [pix.x, pix.y];
            }
          }
        }
      }
    }
  }
  noStroke();
  var startFormatted = new Date(startTime);
  var endFormatted = new Date(endTime);
  var startDate = new Date(startFormatted);
  var endDate = new Date(endFormatted);

  var startResult = startDate.toLocaleDateString('fi',);
  var endResult = endDate.toLocaleDateString('fi',);
  textSize(32);
  fill(0, 0, 0, 120);
  text(startResult + " - " + endResult, 100, 30);
}

function drawPlayLine() {
  clear();
  background(255, opacity.value());
  for (let x in timePoints) {
    dot = timePoints[x];
    if (times[dot] > startTime && times[dot] < endTime) {
      if (accs[i] <= accuracy.value()) {
        const pix = testMap.latLngToPixel(latitudes[dot], longitudes[dot]);
        if (pix.x - prev[0] != 0 && pix.y - prev[1] != 0) {
          heat = map(x, 0, (timePoints.length - 1), 0, 220);
          strokeWeight(dotSize.value());
          if (x == timePoints.length - 1) {
            stroke(255, 255, 255, 255);
          } else {
            stroke(heat, 70, (220 - heat), Math.max(heat, (255 - minFade.value())));
          }
          if (getDistance(pix.x, pix.y, prev[0], prev[1]) < tolerance.value()) {
            line(pix.x, pix.y, prev[0], prev[1]);
          }
          prev[0] = pix.x;
          prev[1] = pix.y;
        }
      }
    } else {
      paused = true;
    }
  }
  if (!paused) {
    if (timeIterator % (20 - speed.value()) == 0) {
      timePoint += 1;
      timePoints.push(timePoint);
    }
    timeIterator++;
  }
  noStroke();
  var currentFormatted = new Date(times[timePoint]);
  var currentDate = new Date(currentFormatted);

  var currentResult = currentDate.toLocaleString('fi');
  textSize(32);
  fill(0, 0, 0, 120);
  text(currentResult, 100, 30);
}