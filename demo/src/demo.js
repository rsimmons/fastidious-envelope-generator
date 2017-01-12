'use strict';

var EnvGen = require('../../index');
var createGrapher = require('./grapher');

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

// Hook up setting controls
var SETTINGS = [
  {name: 'mode', options: [['AD', 'AD'], ['ASR', 'ASR'], ['ADSR', 'ADSR']]},
  {name: 'attackShape', options: [[egen.LINEAR, 'linear']]},
  {name: 'attackTime'},
  {name: 'attackLevel'},
  {name: 'decayShape', options: [[egen.LINEAR, 'linear'], [egen.EXPONENTIAL, 'exponential']]},
  {name: 'decayTime'},
  {name: 'sustainFraction'},
  {name: 'releaseShape', options: [[egen.LINEAR, 'linear'], [egen.EXPONENTIAL, 'exponential']]},
  {name: 'releaseTime'},
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
