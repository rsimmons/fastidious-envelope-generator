'use strict'

function assert(v) {
  if (!v) {
    throw new Error('Assertion error');
  }
}

// based on http://stackoverflow.com/a/31925519
var nextFloat = (function () {
  var intArr = new Uint32Array(1);
  var floatArr = new Float32Array(intArr.buffer);
  return function(v) {
    floatArr[0] = v;
    intArr[0] = intArr[0] + 1;
    return floatArr[0];
  }
})();

var INITIAL_LEVEL = 0; // It doesn't seem useful for this to be a setting

function EnvGen(audioContext, targetParam) {
  // Support instantiating w/o new
  if (!(this instanceof EnvGen)) {
    return new EnvGen(audioContext, targetParam);
  }

  this._audioContext = audioContext;
  this._targetParam = targetParam;

  var _this = this;

  function updateAttackRate() {
    if (_this._attackTime === 0) {
      _this._attackRate = Number.POSITIVE_INFINITY;
    } else {
      if (_this._attackShape === _this.LINEAR) {
        _this._attackRate = Math.abs(_this._attackLevel - INITIAL_LEVEL)/_this._attackTime;
      } else {
        assert(false);
      }
    }
  }

  function updateDecayRate() {
    if (_this._decayTime === 0) {
      _this._decayRate = Number.POSITIVE_INFINITY;
    } else {
      if (_this._decayShape === _this.LINEAR) {
        var toLevel;
        if (_this._mode === 'ADSR') {
          toLevel = _this._sustainFraction*_this._attackLevel;
        } else {
          toLevel = INITIAL_LEVEL;
        }
        _this._decayRate = Math.abs(_this._attackLevel - toLevel)/_this._decayTime;
      } else if (_this._decayShape === _this.EXPONENTIAL) {
        _this._decayRate = 1.0/_this._decayTime;
      } else {
        assert(false);
      }
    }
  }

  function updateReleaseRate() {
    if (_this._releaseTime === 0) {
      _this._releaseRate = Number.POSITIVE_INFINITY;
    } else {
      if (_this._releaseShape === _this.LINEAR) {
        var fromLevel;
        if (_this._mode === 'ADSR') {
          fromLevel = _this._sustainFraction*_this._attackLevel;
        } else {
          fromLevel = _this._attackLevel;
        }
        _this._releaseRate = Math.abs(fromLevel - INITIAL_LEVEL)/_this._releaseTime;
      } else if (_this._releaseShape === _this.EXPONENTIAL) {
        _this._releaseRate = 1.0/_this._releaseTime;
      } else {
        assert(false);
      }
    }
  }

  Object.defineProperty(this, 'mode', {
    get: function() { return _this._mode; },
    set: function(value) {
      if (_this.MODES.indexOf(value) >= 0) {
        // If we're currently in a 'sustain' state, and we switched into AD mode,
        // we would get stuck in sustain state. So just to be safe, whenever mode
        // is changed we fake a gate-off signal.
        _this.gate(false, nextFloat(Math.max(this._lastGateTime, audioContext.currentTime)));

        _this._mode = value;
        updateReleaseRate(); // can depend on mode
      }
    }
  });

  Object.defineProperty(this, 'attackShape', {
    get: function() { return _this._attackShape; },
    set: function(value) {
      if (_this.ATTACK_SHAPES.indexOf(value) >= 0) {
        _this._attackShape = value;
        updateAttackRate();
      }
    }
  });

  Object.defineProperty(this, 'attackTime', {
    get: function() { return _this._attackTime; },
    set: function(value) {
      if ((typeof(value) === 'number') && !isNaN(value) && (value >= 0)) {
        _this._attackTime = value;
        updateAttackRate();
      }
    }
  });

  Object.defineProperty(this, 'attackLevel', {
    get: function() { return _this._attackLevel; },
    set: function(value) {
      if ((typeof(value) === 'number') && !isNaN(value)) {
        _this._attackLevel = value;
        updateAttackRate();
      }
    }
  });

  Object.defineProperty(this, 'decayShape', {
    get: function() { return _this._decayShape; },
    set: function(value) {
      if (_this.DECAY_SHAPES.indexOf(value) >= 0) {
        _this._decayShape = value;
        updateDecayRate();
      }
    }
  });

  Object.defineProperty(this, 'decayTime', {
    get: function() { return _this._decayTime; },
    set: function(value) {
      if ((typeof(value) === 'number') && !isNaN(value) && (value >= 0)) {
        _this._decayTime = value;
        updateDecayRate();
      }
    }
  });

  Object.defineProperty(this, 'sustainFraction', {
    get: function() { return _this._sustainFraction; },
    set: function(value) {
      if ((typeof(value) === 'number') && !isNaN(value)) {
        _this._sustainFraction = value;
        updateDecayRate();
      }
    }
  });

  Object.defineProperty(this, 'releaseShape', {
    get: function() { return _this._releaseShape; },
    set: function(value) {
      if (_this.RELEASE_SHAPES.indexOf(value) >= 0) {
        _this._releaseShape = value;
        updateReleaseRate();
      }
    }
  });

  Object.defineProperty(this, 'releaseTime', {
    get: function() { return _this._releaseTime; },
    set: function(value) {
      if ((typeof(value) === 'number') && !isNaN(value) && (value >= 0)) {
        _this._releaseTime = value;
        updateReleaseRate();
      }
    }
  });

  // Default settings
  this._mode = 'ADSR';
  this._attackShape = this.LINEAR;
  this._attackTime = 0.5;
  this._attackLevel = 1.0;
  this._decayShape = this.EXPONENTIAL;
  this._decayTime = 1.0;
  this._sustainFraction = 0.5;
  this._releaseShape = this.EXPONENTIAL;
  this._releaseTime = 0.5;
  updateAttackRate();
  updateDecayRate();
  updateReleaseRate();

  this._targetParam.value = INITIAL_LEVEL;

  // Each segment has properties:
  //  beginTime: inclusive
  //  endTime: exclusive. may be +inf
  //  beginValue
  //  endValue
  //  shape: this.LINEAR, etc.
  //  rate: abs(slope-of-value) for LINEAR, abs(slope-of-log(value)) for EXPONENTIAL shapes
  this._scheduledSegments = [];

  // Track info about last gate we received
  this._lastGateTime = audioContext.currentTime;
  this._lastGateState = false;
}

EnvGen.prototype.MODES = ['AD', 'ASR', 'ADSR'];

EnvGen.prototype.LINEAR = 'L';
EnvGen.prototype.EXPONENTIAL = 'E';

EnvGen.prototype.ATTACK_SHAPES = [EnvGen.prototype.LINEAR];
EnvGen.prototype.DECAY_SHAPES = [EnvGen.prototype.LINEAR, EnvGen.prototype.EXPONENTIAL];
EnvGen.prototype.RELEASE_SHAPES = [EnvGen.prototype.LINEAR, EnvGen.prototype.EXPONENTIAL];

EnvGen.prototype._computeScheduledValue = function(time) {
  if (!this._scheduledSegments.length) {
    // If there are no scheduled segments, that means envelope should be at zero
    return 0;
  }

  // Sanity check: Scheduled segments should not start in the future
  assert(time >= this._scheduledSegments[0].beginTime);

  // Find what scheduled segment (if any) would be active at given time
  var activeIdx; // index into _scheduledSegments of one that is active at given time, if any
  for (var i = 0; i < this._scheduledSegments.length; i++) {
    var seg = this._scheduledSegments[i];
    if ((time >= seg.beginTime) && (time < seg.endTime)) {
      activeIdx = i;
      break;
    }
  }

  if (activeIdx === undefined) {
    // This must mean that time is after last scheduled segment
    var lastSeg = this._scheduledSegments[this._scheduledSegments.length-1];
    assert(time > lastSeg.endTime); // sanity check
    return lastSeg.endValue;
  }

  // If we got this far, then the given time falls within a scheduled segment
  var activeSeg = this._scheduledSegments[activeIdx];

  // Determine the mid-segment value at the given time
  if (activeSeg.shape === this.LINEAR) {
    if (activeSeg.beginValue === activeSeg.endValue) {
      // Special case this since endTime may be +inf
      return activeSeg.beginValue;
    }

    // LERP
    // TODO: should be equal to activeSeg.beginValue + activeSeg.rate*(time - activeSeg.beginTime)
    return activeSeg.beginValue + ((time - activeSeg.beginTime)/(activeSeg.endTime - activeSeg.beginTime))*(activeSeg.endValue - activeSeg.beginValue);
  } else if (activeSeg.shape === this.EXPONENTIAL) {
    return activeSeg.endValue + (activeSeg.beginValue - activeSeg.endValue)*Math.exp(activeSeg.rate*(activeSeg.beginTime - time));
  } else {
    assert(false);
  }
};

EnvGen.prototype._scheduleSegment = function(endValue, shape, rate) {
  assert(this._scheduledSegments.length > 0);
  var lastSeg = this._scheduledSegments[this._scheduledSegments.length - 1];

  // It doesn't make sense to schedule a segment after an infinite one
  assert(lastSeg.endTime !== Number.POSITIVE_INFINITY);

  if (lastSeg.endValue === endValue) {
    // We can just skip this segment since value is already there
    return;
  }

  // Based on shape, compute end time and call appropriate scheduling method
  var endTime;
  if (rate === Number.POSITIVE_INFINITY) {
    // Special case this
    endTime = lastSeg.endTime;
    this._targetParam.setValueAtTime(endValue, endTime); // Spec says this should work. "If one of these events is added at a time where there is already one or more events, then it will be placed in the list after them, but before events whose times are after the event."
  } else {
    switch (shape) {
      case this.LINEAR:
        endTime = lastSeg.endTime + Math.abs((endValue - lastSeg.endValue)/rate);
        this._targetParam.linearRampToValueAtTime(endValue, endTime);
        break;

      case this.EXPONENTIAL:
        endTime = Number.POSITIVE_INFINITY;
        this._targetParam.setTargetAtTime(endValue, lastSeg.endTime, 1.0/rate);
        break;

      default:
        assert(false);
    }
  }

  this._scheduledSegments.push({
    shape: shape,
    beginTime: lastSeg.endTime,
    endTime: endTime,
    beginValue: lastSeg.endValue,
    endValue: endValue,
    rate: rate,
  });
};

EnvGen.prototype.gate = function(on, time) {
  // Note the current AudioContext time
  var ct = this._audioContext.currentTime;

  // Default time parameter to current time
  time = (time === undefined) ? ct : time;

  if (time < this._lastGateTime) {
    // Gates can only have times >= the times of previously supplied gates.
    // If we receive a bad one, log a warning and ignore
    console.warn('Received gate with time earlier than a previous gate');
    return;
  }

  this._lastGateTime = time;
  this._lastGateState = on;

  // Special case: In AD mode, we ignore gate-off
  if ((this._mode === 'AD') && !on) {
    return;
  }

  // TODO: verify that time is greater than any previous gate times?

  // Determine value that we'll start from
  var startValue = this._computeScheduledValue(time);

  // Set anchor point at given value
  this._targetParam.setValueAtTime(startValue, time);

  // Cancel all scheduled changes after that
  // TODO: I think this should be finding next double, not just next float, but unsure how to do that
  this._targetParam.cancelScheduledValues(nextFloat(time));

  // Reinit scheduled segments array with a 'dummy' segment to simplify code
  this._scheduledSegments = [{
    beginTime: time,
    endTime: time,
    beginValue: startValue,
    endValue: startValue,
    shape: this.LINEAR,
  }];

  if (on) {
    // Schedule attack
    this._scheduleSegment(this._attackLevel, this._attackShape, this._attackRate);

    // Schedule decay, if needed
    if ((this._mode === 'AD') || (this._mode === 'ADSR')) {
      // Determine target level to which we will decay
      var decayTargetLevel;
      if (this._mode === 'AD') {
        decayTargetLevel = INITIAL_LEVEL;
      } else {
        decayTargetLevel = this._sustainFraction*this._attackLevel;
      }

      this._scheduleSegment(decayTargetLevel, this._decayShape, this._decayRate);
    }

    // NOTE: Sustain does not need to be scheduled
  } else {
    this._scheduleSegment(INITIAL_LEVEL, this._releaseShape, this._releaseRate);
  }
};

EnvGen.prototype.gateOn = function(time) {
  this.gate(true, time);
};

EnvGen.prototype.gateOff = function(time) {
  this.gate(false, time);
};

module.exports = EnvGen;
