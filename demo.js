'use strict';

var EnvGen = require('./index');
var createGrapher = require('./grapher');

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

// since ConstantSourceNode is not yet widely available
function createConstantNode(audioContext, v) {
  const constantBuffer = audioContext.createBuffer(1, 2, audioContext.sampleRate);
  const constantData = constantBuffer.getChannelData(0);
  constantData[0] = v;
  constantData[1] = v;
  const node = audioContext.createBufferSource();
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

// Hook up controls
var gateButtonElem = document.querySelector('#gate-button');
gateButtonElem.addEventListener('mousedown', function(e) {
  e.preventDefault();
  egen.gateOn();
});
gateButtonElem.addEventListener('mouseup', function(e) {
  e.preventDefault();
  egen.gateOff();
});
