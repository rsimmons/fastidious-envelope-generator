'use strict'

function assert(v) {
  if (!v) {
    throw new Error('Assertion error');
  }
}

function EnvGen(audioContext, targetParam) {
  // Support instantiating w/o new
  if (!(this instanceof EnvGen)) {
    return new EnvGen(audioContext, targetParam);
  }

  this._audioContext = audioContext;
  this._targetParam = targetParam;

  var _this = this;

  function constrainSettings() {
    if (_this.AVAILABLE_MODES.indexOf(_this._mode) < 0) {
      _this._mode = 'AR';
    }

    if (!((_this._attackShape === _this.LINEAR) || (_this._attackShape === _this.FINITE_EXPONENTIAL))) {
      _this._attackShape = _this.LINEAR;
    }

    if (!((_this._decayShape === _this.LINEAR) || (_this._decayShape === _this.FINITE_EXPONENTIAL) || (_this._decayShape === _this.INFINITE_EXPONENTIAL_APPROACH))) {
      _this._decayShape = _this.LINEAR;
    }

    if (!((_this._releaseShape === _this.LINEAR) || (_this._releaseShape === _this.FINITE_EXPONENTIAL) || (_this._releaseShape === _this.INFINITE_EXPONENTIAL_APPROACH))) {
      _this._releaseShape = _this.LINEAR;
    }

    if (_this._attackTime < 0) {
      _this._attackTime = 0;
    }

    if (_this._decayTime < 0) {
      _this._decayTime = 0;
    }

    if (_this._releaseTime < 0) {
      _this._releaseTime = 0;
    }

    if ((_this._initialLevel === 0) && ((_this._attackShape === _this.FINITE_EXPONENTIAL) || (_this._releaseShape === _this.FINITE_EXPONENTIAL))) {
      _this._initialLevel = 1;
    }

    if ((_this._attackLevel === 0) && (_this._decayShape === _this.FINITE_EXPONENTIAL)) {
      _this._attackLevel = 1;
    }

    if ((_this._sustainLevel === 0) && (_this._decayShape === _this.FINITE_EXPONENTIAL)) {
      _this._sustainLevel = 1;
    }

    // TODO: shouldn't let finite-exponentials cross 0

    // Update attack rate
    if (_this._attackTime === 0) {
      _this._attackRate = Number.POSITIVE_INFINITY;
    } else {
      if (_this._attackShape === _this.LINEAR) {
        _this._attackRate = math.abs(_this._attacklevel - _this._initialLevel)/_this._attackTime;
      } else if (_this._attackShape === _this.FINITE_EXPONENTIAL) {
        _this._attackRate = math.abs(math.log(_this._attacklevel/_this._initialLevel))/_this._attackTime;
      }
    }

    // Update decay rate
    if (_this._decayTime === 0) {
      _this._decayRate = Number.POSITIVE_INFINITY;
    } else {
      if (_this._decayShape === _this.LINEAR) {
        _this._decayRate = math.abs(_this._attacklevel - _this._sustainLevel)/_this._decayTime;
      } else if (_this._decayShape === _this.FINITE_EXPONENTIAL) {
        _this._decayRate = math.abs(math.log(_this._attacklevel/_this._sustainLevel))/_this._decayTime;
      }
    }

    // Update release rate
    if (_this._releaseTime === 0) {
      _this._releaseRate = Number.POSITIVE_INFINITY;
    } else {
      if (_this._releaseShape === _this.LINEAR) {
        var fromLevel;
        if (_this._mode === 'ADSR') {
          fromLevel = _this._sustainLevel;
        } else {
          fromLevel = _this._attackLevel;
        }
        _this._releaseRate = math.abs(from - _this._initialLevel)/_this._releaseTime;
      } else if (_this._releaseShape === _this.FINITE_EXPONENTIAL) {
        _this._releaseRate = math.abs(math.log(from/_this._initialLevel))/_this._releaseTime;
      }
    }
  }

  Object.defineProperty(this, 'mode', {
    get: function() { return _this._mode; },
    set: function(value) {
      _this._mode = value;
      constrainSettings();
      // TODO: if we switched into AD mode, and we were left in a sustain, we need to fake a gate-off
    }
  });

  Object.defineProperty(this, 'initialLevel', {
    get: function() { return _this._initialLevel; },
    set: function(value) {
      _this._initialLevel = value;
      constrainSettings();
    }
  });

  Object.defineProperty(this, 'attackShape', {
    get: function() { return _this._attackShape; },
    set: function(value) {
      _this._attackShape = value;
      constrainSettings();
    }
  });

  Object.defineProperty(this, 'attackLevel', {
    get: function() { return _this._attackLevel; },
    set: function(value) {
      _this._attackLevel = value;
      constrainSettings();
    }
  });

  Object.defineProperty(this, 'attackTime', {
    get: function() { return _this._attackTime; },
    set: function(value) {
      _this._attackTime = value;
      constrainSettings();
    }
  });

  Object.defineProperty(this, 'decayShape', {
    get: function() { return _this._decayShape; },
    set: function(value) {
      _this._decayShape = value;
      constrainSettings();
    }
  });

  Object.defineProperty(this, 'decayTime', {
    get: function() { return _this._decayTime; },
    set: function(value) {
      _this._decayTime = value;
      constrainSettings();
    }
  });

  Object.defineProperty(this, 'sustainLevel', {
    get: function() { return _this._sustainLevel; },
    set: function(value) {
      _this._sustainLevel = value;
      constrainSettings();
    }
  });

  Object.defineProperty(this, 'releaseShape', {
    get: function() { return _this._releaseShape; },
    set: function(value) {
      _this._releaseShape = value;
      constrainSettings();
    }
  });

  Object.defineProperty(this, 'releaseTime', {
    get: function() { return _this._releaseTime; },
    set: function(value) {
      _this._releaseTime = value;
      constrainSettings();
    }
  });

  // Default settings
  this._mode = 'AR';
  this._initialLevel = 0;
  this._attackShape = this.LINEAR;
  this._attackLevel = 1.0;
  this._attackTime = 1.0;
  this._decayShape = this.INFINITE_EXPONENTIAL_APPROACH;
  this._decayTime = 1.0;
  this._sustainLevel = 0.5;
  this._releaseShape = this.INFINITE_EXPONENTIAL_APPROACH;
  this._releaseTime = 1.0;
  constrainSettings();

  this._targetParam.value = initialLevel;

  // Each segment has properties:
  //  beginTime: inclusive
  //  endTime: exclusive. may be +inf
  //  beginValue
  //  endValue
  //  shape: this.LINEAR, etc.
  //  rate: abs(slope-of-value) for LINEAR, abs(slope-of-log(value)) for EXPONENTIAL shapes
  this._scheduledSegments = [];

  // TODO: track last gate time for sanity checking
  // TODO: track current gate state. if mode is changed, might need to do gate-off
}

EnvGen.prototype.AVAILABLE_MODES = ['AD', 'AR', 'ADSR'];

EnvGen.prototype.LINEAR = 'L';
EnvGen.prototype.FINITE_EXPONENTIAL = 'FE';
EnvGen.prototype.INFINITE_EXPONENTIAL_APPROACH = 'IEA';

EnvGen.prototype._computeScheduledValue(time) {
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
  } else if (activeSeg.shape === this.FINITE_EXPONENTIAL) {
    // TODO: should be equal to math.exp(math.log(activeSeg.beginValue) + activeSeg.rate*(time - activeSeg.beginTime))
    return activeSeg.beginValue*((time - activeSeg.beginTime)/(activeSeg.endTime - activeSeg.beginTime))*(activeSeg.endValue/activeSeg.beginValue);
  } else if (activeSeg.shape === this.INFINITE_EXPONENTIAL_APPROACH) {
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

      case this.FINITE_EXPONENTIAL:
        endTime = lastSeg.endTime + Math.abs(Math.log(endValue/lastSegment.endValue)/rate);
        this._targetParam.exponentialRampToValueAtTime(endValue, endTime);
        break;

      case this.INFINITE_EXPONENTIAL_APPROACH:
        endTime = Number.POSITIVE_INFINITY;
        this._targetParam.setTargetAtTime(endValue, 1.0/rate);
        break;

      default:
        assert(false);
    }
  }

  this._scheduledSegments.push({
    beginTime: lastSeg.endTime,
    endTime: endTime,
    beginValue: lastSeg.endValue,
    endValue: endValue,
    rate: rate,
  });
};

EnvGen.prototype.gate = function(on, time) {
  // Special case: In AD mode, we ignore gate-off
  if ((this._mode === 'AD') && !on) {
    return;
  }

  // Note the current AudioContext time
  var ct = this._audioContext.currentTime;

  // Default time parameter to current time
  time = (time === undefined) ? ct : time;

  // TODO: verify that time is greater than any previous gate times?

  // Determine value that we'll start from
  var startValue = this._computeScheduledValue(time);

  // Set anchor point at given value
  this._targetParam.setValueAtTime(startValue, time);

  // Cancel all scheduled changes after that
  this._targetParam.cancelScheduledValues(nextDouble(time));

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
        decayTargetLevel = this._initialLevel;
      } else {
        decayTargetLevel = this._sustainLevel;
      }

      this._scheduleSegment(decayTargetLevel, this._decayShape, this._decayRate);
    }

    // NOTE: Sustain does not need to be scheduled
  } else {
    this._scheduleSegment(this.initialLevel, this._releaseShape, this._releaseRate);
  }
};

EnvGen.prototype.gateOn = function(time) {
  this.gate(true, time);
};

EnvGen.prototype.gateOff = function(time) {
  this.gate(false, time);
};

module.exports = EnvGen;
