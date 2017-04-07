'use strict';

var EnvGen = require('../../index');
var createGrapher = require('./grapher');
var EventScheduler = require('./scheduler');

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

// since ConstantSourceNode is not yet widely available
function createConstantNode(audioContext, v) {
  var constantBuffer = audioContext.createBuffer(1, 2, audioContext.sampleRate);
  var constantData = constantBuffer.getChannelData(0);
  constantData[0] = v;
  constantData[1] = v;
  var node = audioContext.createBufferSource();
  node.buffer = constantBuffer;
  node.loop = true;
  node.start();
  return node;
}

// Create nodes
var oscNode = audioContext.createOscillator();
oscNode.frequency.value = 440;
oscNode.type = 'sine';
oscNode.start();

var vcaNode = audioContext.createGain();
vcaNode.gain.value = 0;

var constNode = createConstantNode(audioContext, 1);

var envGainNode = audioContext.createGain();
envGainNode.gain.value = 0;

var grapherNode = createGrapher(audioContext, document.querySelector('#env-graph'), 1024);

// Connect everything up
oscNode.connect(vcaNode);
vcaNode.connect(audioContext.destination);
constNode.connect(envGainNode);
var egen = new EnvGen(audioContext, envGainNode.gain);
envGainNode.connect(grapherNode);
grapherNode.connect(vcaNode.gain); // We have to insert it 'inline' otherwise it seems to get GC'd

// Hook up gate controls
var gateButtonElem = document.querySelector('#gate-button');
gateButtonElem.addEventListener('mousedown', function(e) {
  e.preventDefault();
  egen.gateOn();
});
gateButtonElem.addEventListener('mouseup', function(e) {
  e.preventDefault();
  egen.gateOff();
});

document.querySelector('#gate-on-button').addEventListener('click', function(e) {
  e.preventDefault();
  egen.gateOn();
});

document.querySelector('#gate-off-button').addEventListener('click', function(e) {
  e.preventDefault();
  egen.gateOff();
});

var scheduler = new EventScheduler(audioContext);
var autoGateNextTime;
var autoGateNextNumber;
var autoGateSpacing ;
var autoGateDuty;

function startAutoGates() {
  autoGateNextTime = audioContext.currentTime + 0.01; // start first tick a little in the future
  autoGateNextNumber = 0;

  scheduler.start(function(e) {
    while (autoGateNextTime < e.end) {
      egen.gate(true, autoGateNextTime);
      egen.gate(false, autoGateNextTime + autoGateDuty*autoGateSpacing);

      autoGateNextTime += autoGateSpacing;
      autoGateNextNumber++;
    }
  });
}

function stopAutoGates() {
  scheduler.stop();
}

document.querySelector('#auto-gate-enable').addEventListener('change', function(e) {
  if (e.target.checked) {
    startAutoGates();
  } else {
    stopAutoGates();
  }
});

var autoGateSpacingElem = document.querySelector('#auto-gate-spacing');
function updateGateSpacing() {
  var v = parseFloat(autoGateSpacingElem.value);
  if (v > 0) {
    autoGateSpacing = v;
  }
}
updateGateSpacing();
autoGateSpacingElem.addEventListener('input', updateGateSpacing);

var autoGateDutyElem = document.querySelector('#auto-gate-duty');
function updateGateDuty() {
  var v = parseFloat(autoGateDutyElem.value);
  if ((v > 0) && (v < 100)) {
    autoGateDuty = 0.01*v;
  }
}
updateGateDuty();
autoGateDutyElem.addEventListener('input', updateGateDuty);

// Hook up setting controls
var SETTINGS = [
  {name: 'mode', options: [['AD', 'AD'], ['ASR', 'ASR'], ['ADSR', 'ADSR']]},
  {name: 'attackTime', min: 0},
  {name: 'decayTime', min: 0},
  {name: 'sustainLevel', min: 0, max: 1},
  {name: 'releaseTime', min: 0},
];

var settingsElem = document.querySelector('#settings');

function addSetting(setting) {
  var wrapperElem = document.createElement('div');
  wrapperElem.className = 'setting-wrapper';

  var labelElem = document.createElement('label');

  var controlElem;
  if (setting.options) {
    controlElem = document.createElement('select');
    for (var j = 0; j < setting.options.length; j++) {
      var option = setting.options[j];
      var optionElem = document.createElement('option');
      optionElem.value = option[0];
      optionElem.textContent = option[1];
      controlElem.appendChild(optionElem);
    }
  } else {
    controlElem = document.createElement('input');
    controlElem.type = 'number';
    controlElem.step = 'any';
    if (setting.hasOwnProperty('min')) {
      controlElem.min = setting.min;
    }
    if (setting.hasOwnProperty('max')) {
      controlElem.max = setting.max;
    }
  }

  controlElem.value = egen[setting.name];
  controlElem.addEventListener('input', function() {
    if (setting.options) {
      egen[setting.name] = controlElem.value;
    } else {
      egen[setting.name] = parseFloat(controlElem.value);
    }
  });

  labelElem.appendChild(document.createTextNode(setting.name + ' '));
  labelElem.appendChild(controlElem);
  wrapperElem.appendChild(labelElem);
  settingsElem.appendChild(wrapperElem);
}

for (var i = 0; i < SETTINGS.length; i++) {
  addSetting(SETTINGS[i]);
}
