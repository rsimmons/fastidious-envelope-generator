'use strict';

var EnvGen = require('./index.js');

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

var oscNode = audioContext.createOscillator();
oscNode.frequency.value = 440;
oscNode.type = 'sine';
oscNode.start();

var gainNode = audioContext.createGain();

var egen = new EnvGen(audioContext, gainNode.gain);
oscNode.connect(gainNode);
gainNode.connect(audioContext.destination);

var gateButtonElem = document.querySelector('#gate-button');
gateButtonElem.addEventListener('mousedown', function(e) {
  e.preventDefault();
  egen.gateOn();
});
gateButtonElem.addEventListener('mouseup', function(e) {
  e.preventDefault();
  egen.gateOff();
});
