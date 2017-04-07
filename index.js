'use strict'

function assert(v) {
  if (!v) {
    throw new Error('Assertion error');
  }
}

// It doesn't seem useful for these to be a settings
var INITIAL_LEVEL = 0;
var ATTACK_LEVEL = 1;

function EnvGen(audioContext, targetParam) {
  // Support instantiating w/o new
  if (!(this instanceof EnvGen)) {
    return new EnvGen(audioContext, targetParam);
  }

  this._audioContext = audioContext;
  this._targetParam = targetParam;

  var _this = this;

  Object.defineProperty(this, 'mode', {
    get: function() { return _this._mode; },
    set: function(value) {
      if (_this.MODES.indexOf(value) >= 0) {
        // If we're currently in a 'sustain' state, and we switched into AD mode,
        // we would get stuck in sustain state. So just to be safe, whenever mode
        // is changed we fake a gate-off signal.
        _this.gate(false, Math.max(this._lastGateTime, audioContext.currentTime));

        _this._mode = value;
      }
    }
  });

  Object.defineProperty(this, 'attackTime', {
    get: function() { return _this._attackTime; },
    set: function(value) {
      if ((typeof(value) === 'number') && !isNaN(value) && (value > 0)) {
        _this._attackTime = value;
      }
    }
  });

  Object.defineProperty(this, 'decayTime', {
    get: function() { return _this._decayTime; },
    set: function(value) {
      if ((typeof(value) === 'number') && !isNaN(value) && (value > 0)) {
        _this._decayTime = value;
      }
    }
  });

  Object.defineProperty(this, 'sustainLevel', {
    get: function() { return _this._sustainLevel; },
    set: function(value) {
      if ((typeof(value) === 'number') && !isNaN(value) && (value >= 0) && (value <= 1)) {
        _this._sustainLevel = value;
      }
    }
  });

  Object.defineProperty(this, 'releaseTime', {
    get: function() { return _this._releaseTime; },
    set: function(value) {
      if ((typeof(value) === 'number') && !isNaN(value) && (value > 0)) {
        _this._releaseTime = value;
      }
    }
  });

  // Default settings
  this._mode = 'ADSR';
  this._attackTime = 0.5;
  this._decayTime = 1;
  this._sustainLevel = 0.5;
  this._releaseTime = 1;

  this._targetParam.value = INITIAL_LEVEL;

  // In case there was preexisting automation on the target parameter, we reset it here to known state.
  this._targetParam.cancelScheduledValues(0);
  this._targetParam.setValueAtTime(INITIAL_LEVEL, 0);

  // All segments are exponential approaches to target values (setTargetAtTime)
  // Each segment has properties:
  //  beginTime
  //  beginValue
  //  targetValue
  //  timeConst: 1/abs(slope-of-log(value))
  // The _scheduledSegments array is kept in time-order, and always has at least one element.
  this._scheduledSegments = [{
    beginTime: 0,
    beginValue: INITIAL_LEVEL,
    targetValue: INITIAL_LEVEL,
    timeConst: 1, // doesn't matter what this is since beginValue === targetValue
  }];

  // Track info about last gate we received
  this._lastGateTime = audioContext.currentTime;
  this._lastGateState = false;
}

EnvGen.prototype.MODES = ['AD', 'ASR', 'ADSR'];

// Schedule a segment with the target AudioParam, and add it to our internal tracking.
// It must start after our current last segment
EnvGen.prototype._appendSegment = function(beginTime, beginValue, targetValue, timeConst) {
  assert(beginTime >= this._scheduledSegments[this._scheduledSegments.length-1].beginTime); // sanity check

  // Set an anchor point for new segment to start from
  this._targetParam.setValueAtTime(beginValue, beginTime);

  // Schedule the new segment
  this._targetParam.setTargetAtTime(targetValue, beginTime, timeConst);

  this._scheduledSegments.push({
    beginTime: beginTime,
    beginValue: beginValue,
    targetValue: targetValue,
    timeConst: timeConst,
  });
};

// Schedule a segment that starts at the given time, which may be during or before previously scheduled segments
EnvGen.prototype._scheduleSegmentFromTime = function(time, targetValue, timeConst) {
  // Find what scheduled segment (if any) would be active at given time
  var activeIdx;
  for (var i = 0; i < this._scheduledSegments.length; i++) {
    if ((time >= this._scheduledSegments[i].beginTime) && ((i === (this._scheduledSegments.length-1) || (time < this._scheduledSegments[i+1].beginTime)))) {
      activeIdx = i;
      break;
    }
  }
  assert(activeIdx !== undefined); // There must always be some active segment at any (current or future) time

  var activeSeg = this._scheduledSegments[activeIdx];

  // Determine the mid-segment value at the given time
  var interruptValue = activeSeg.targetValue + (activeSeg.beginValue - activeSeg.targetValue)*Math.exp((activeSeg.beginTime - time)/activeSeg.timeConst);

  // Truncate _scheduledSegments array to end at the active segment
  this._scheduledSegments.length = activeIdx+1;

  // Cancel all segments from the interrupt time onwward
  this._targetParam.cancelScheduledValues(time);

  // Append the new segment from the interrupted point
  this._appendSegment(time, interruptValue, targetValue, timeConst);
};

// Schedule a segment that starts when the last previously-scheduled segment reaches the given value threshold
EnvGen.prototype._scheduleSegmentFromValueThreshold = function(valueThreshold, targetValue, timeConst) {
  var lastSeg = this._scheduledSegments[this._scheduledSegments.length-1];

  // Determine the time that the last segment will hit the given value threshold
  var interruptTime = Math.abs(Math.log((lastSeg.targetValue - valueThreshold)/(lastSeg.targetValue - lastSeg.beginValue))*lastSeg.timeConst) + lastSeg.beginTime;

  // Append the new segment from the interrupt time
  this._appendSegment(interruptTime, valueThreshold, targetValue, timeConst);
};

// Cull segments from this._scheduledSegments end before beforeTime 
EnvGen.prototype._cullScheduledSegments = function(beforeTime) {
  for (var i = 0; i < (this._scheduledSegments.length-1); i++) {
    // Because we only track beginTime (not endTime), we need to look one segment ahead
    if (beforeTime < this._scheduledSegments[i+1].beginTime) {
      break;
    }
  }
  // When we exit the loop, i will be the index of the segment that should be the first one remaining

  this._scheduledSegments = this._scheduledSegments.slice(i);

  assert(this._scheduledSegments.length > 0); // sanity check
  assert(this._scheduledSegments[0].beginTime <= beforeTime); // sanity check
};

EnvGen.prototype.gate = function(on, time) {
  // Note the current AudioContext time
  var ct = this._audioContext.currentTime;

  // Default time parameter to current time
  time = (time === undefined) ? ct : time;

  // Gates can only have times >= the times of previously supplied gates.
  // If we receive a bad one, log a warning and ignore
  if (time < this._lastGateTime) {
    console.warn('Received gate with time earlier than a previous gate');
    return;
  }
  this._lastGateTime = time;
  this._lastGateState = on;

  // Cull scheduled segments that we are tracking that are now in the past
  this._cullScheduledSegments(ct);

  if (on) {
    // Schedule attack
    // To make an attack that reaches maximum level (1) in a finite amount of time,
    //  we aim to exponentially approach a value that is greater than 1, and then
    //  stop the attack when it reaches 1. This is how analog envgens work.
    var ATTACK_LINEARITY = 100 // Make this nearly-linear. We could expose as a parameter later on
    var attackTargetLevel = 1/(1 - Math.exp(-this._attackTime/ATTACK_LINEARITY));
    this._scheduleSegmentFromTime(time, attackTargetLevel, ATTACK_LINEARITY);

    // Schedule whatever phase that comes after attack (decay or sustain)
    if ((this._mode === 'AD') || (this._mode === 'ADSR')) {
      // Determine target level to which we will decay
      var decayTargetLevel;
      if (this._mode === 'AD') {
        decayTargetLevel = INITIAL_LEVEL;
      } else {
        decayTargetLevel = this._sustainLevel;
      }

      // Schedule decay
      this._scheduleSegmentFromValueThreshold(ATTACK_LEVEL, decayTargetLevel, this._decayTime);
    } else if (this._mode === 'ASR') {
      // Schedule sustain
      this._scheduleSegmentFromValueThreshold(ATTACK_LEVEL, ATTACK_LEVEL, 1); // timeConst here doesn't really matter
    } else {
      assert(false); // invalid mode
    }
  } else {
    if (this._mode === 'AD') {
      // We ignore gate-off when in AD mode
    } else if ((this._mode === 'ASR') || (this._mode === 'ADSR')) {
      // Schedule release
      this._scheduleSegmentFromTime(time, INITIAL_LEVEL, this._releaseTime);
    } else {
      assert(false); // invalid mode
    }
  }
};

EnvGen.prototype.gateOn = function(time) {
  this.gate(true, time);
};

EnvGen.prototype.gateOff = function(time) {
  this.gate(false, time);
};

module.exports = EnvGen;
