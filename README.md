# Fastidious-envelope-generator

## Overview

**Fastidious** is an envelope generator (aka ADSR) for the Web Audio API that aims to be free of artifacts and handle edge cases well. Most notably, if a new envelope begins when an old one is still in progress, it picks up from where the old one left off so that there are no discontinuities.

[Check out the demo](https://rsimmons.github.io/fastidious-envelope-generator/).

## Installation

```bash
$ npm install fastidious-envelope-generator`
```

## Example

```js
var EnvGen = require('fastidious-envelope-generator');

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create nodes
var oscNode = audioContext.createOscillator();
oscNode.start();

var vcaNode = audioContext.createGain();

// Connect up node graph
oscNode.connect(vcaNode);
vcaNode.connect(audioContext.destination);

// Instantiate envelope generator, leaving some settings as defaults
var eg = new EnvGen(audioContext, vcaNode.gain);
eg.mode = 'ASR';
eg.attackRate = 100;
eg.releaseRate = 50;

// Every second, schedule a gate cycle a little bit in the future
setInterval(function() {
  var t = audioContext.currentTime;
  eg.gateOn(t + 0.1);
  eg.gateOff(t + 0.4);
}, 1000);
```

## Background

The [Web Audio API](https://webaudio.github.io/web-audio-api/) is a fantastic new-ish API that lets you do sophisticated audio processing in the browser. One particularly important building block for audio synthesis is called an *envelope generator* (aka ADSR), and the API helpfully includes "automation" methods (`AudioParam.linearRampToValueAtTime()`, etc.) to make it easy to build those.

And if you build an envelope generator using those handy methods, it will sound good, being free of any weird pops or other sonic artifacts. ... Right?

**Sadly, no**. It turns out that it is rather tricky to build a well-behaved envelope generator given the API at the time of this writing (April 2017). For example, there are several other envelope generators on GitHub, but as far as I know they all have the issue that if a new envelope (gate-on) is started when a previous one is still playing, there will be a discontinuity that may result in a very audible click. (*please hit me up if you know of any that avoid this issue!*)

The authors of the API seem to be aware of this problem, and have spec'd an important new method called `cancelAndHoldAtTime` that will improve the situation, but that method is not yet implemented by most browsers. And even with that method, it's still somewhat tricky to build an envelope generator that handles edge cases properly and has a consistent sound.

So long story short, I really wanted a Web Audio envelope generator that worked correctly and handled all the various edge cases and so I tried to make one and it was not fun to make but I did it anyways and without further ado I humbly present to you (*snare rush, please*): **Fastidious Envelope Generator**.

## Continuity, Shapes, Rates

The most important feature of Fastidious is that if a new envelope is started when an old one is still in progress, there will be no unwanted discontinuity. The new envelope will start from where the old one is interrupted. This is how almost all analog synthesizer envelopes work, and usually sounds better than the alternative of restarting the new attack from zero. Abruptly transitioning an envelope to zero will likely cause an audible click if the envelope is not already at a low value.

Most software synthesizers let you specify a **time** for each envelope phase. Fastidious instead has you specify a **rate**, the speed with which that phase transitions to its target value. This makes more sense given that envelopes may start from where an old one left off. If a new attack starts when the value is already quite high, it sounds more natural for the attack to proceed at the same **rate** as normal (taking shorter time), vs. taking its specified time (and hence having a lower rate). Also, specifing by rate makes more sense if the phase has an exponential approach shape, in which case the length of the transition is theoretically infinte (it asymptotically appraoches its target value).

Fastidious generates envelopes with exponential curves for attack, decay, and release. However, the attack phase has such a slight curvature that it is effectively linear, and can be treated as such.

Having exponential decay and release curves means that the distance between the current value and its target decreases at an exponential rate. In other words, each second the distance between the value and its target gets divided by a constant amount. This results in an asymptotic approach where the value never reaches its target. This shape tends to sound good for amplitude decay and release phases, giving a natural fade out. For decay and release, each second the distance to target value decreases by a factor of `exp(rate)`, so a higher `rate` setting will result in a faster decay. This is implemented via the Web Audio API method `setTargetAtTime`, (**not** `exponentialRampToValueAtTime`, which sounds relevant but has a different purpose).

## API

#### `new EnvGen(audioContext, targetParam)`

Instantiate a new envelope generator

- `audioContext`: Web Audio `AudioContext` object
- `targetParam`: `AudioParam` to which envelope automation should be applied. There should be no other callers applying automation to the same `AudioParam` or all hell will break loose.

#### `.gate(on, time)`

Notify the envelope generator that its input gate is going on or off (aka high or low).

- `on`: `true` for gate on/high, `false` for gate off/low
- `time`: Optional indication of time when gate change is to take effect. If omitted, the gate change happens "now". If supplied, the time should be in the same coordinates as `AudioContext.currentTime` and >= that `currentTime`. Supplied gate times must be monotonically increasing, i.e. it's not allowed to schedule gates at times earlier than other gates that have already been scheduled.

Note: It is OK to send an 'on' followed by another 'on', or an 'off' followed by another 'off'. If an 'on' is sent when the last gate already 'on', then the envelope will behave as if there was an 'off' an infinitesimal time before the new 'on' (and vice verse for 'off' followed by 'off'). In some cases this will have no effect. But it can be useful e.g. in AD mode to only send gate-on notifications to trigger successive notes, without needing to ever send gate-offs.

#### `.gateOn(time)`

Convenience method that is equivalent to `.gate(true, time)`.

#### `.gateOff(time)`

Convenience method that is equivalent to `.gate(false, time)`.

#### `.mode`

The current mode or style of envelope being generated. Changes to this property will not take effect until after any current scheduled gate changes. Valid values are:
- `'AD'`: Attack-decay envelope. The envelope will attack from 0 to 1, and then immediately decay back to 0. It has no sustain, and will always complete its full attack phase even if a gate-off arrives during it. This means that it ignores gate-off changes completely, and the width of incoming gates is irrelevant. This behavior is sometimes referred to as a "trigger" style envelope, and is useful for percussive sounds.
- `'ASR'`: Attack-sustain-release envelope, also known as an AR envelope. This envelope will attack from 0 to 1, sustain at 1 for as long as the gate is held on, and then when the gate goes off will release back to 0. If the gate goes off during the attack, it will immediately transition to the release phase. Because the sustain will always be at full 1, the `sustainLevel` setting is irrelevant for this mode.
- `'ADSR'`: Attack-decay-sustain-release envelope. This envelope will attack from 0 to 1, and then immediately decay to the `sustainLevel` for as long as the gate is held on. When the gate goes off it will release back to 0. If the gate goes off during the attack or decay phases, it will immediately transition to the release phase.

The default mode is `'ADSR'`.

#### `.attackRate`

The speed with which the attack phase will (almost-linearly) transition to 1. Must be > 0. The default rate is 2.

#### `.decayRate`

The speed with which the decay phase will transition to the sustain level (in ADSR mode) or 0 (in AD mode). Must be > 0. The default rate is 1.

#### `.sustainLevel`

In ADSR mode, the level to which the envelope transitions after the attack phase completes. Must be >= 0 and <= 1. The default value is 0.5.

#### `.releaseRate`

The speed with which the release phase will transition to 0. Must be > 0. The default rate is 1.

#### `.MODES`

Array of valid `.mode` settings.
