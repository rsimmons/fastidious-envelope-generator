
function EventScheduler(audioContext) {
  this.audioContext = audioContext;
  this.running = false;
  this.timeoutID = null;
}

EventScheduler.prototype.start = function(callback) {
  var TIMEOUT_DELAY = 0.05; // in seconds
  var BUFFER_DEPTH = 0.10; // in seconds

  var _this = this;

  var startTime = null;
  var bufferedUntil = null;

  var timeoutFunc = function() {
    if (!_this.running) {
      throw new Error('Internal error: timeoutFunc called but scheduler not running');
    }

    var t = _this.audioContext.currentTime;

    if (startTime === null) {
      startTime = t;
      bufferedUntil = t;
    }

    if (bufferedUntil < t) {
      console.log('FELL BEHIND BY', t - bufferedUntil);
    }

    var bufferUntil = t + BUFFER_DEPTH;

    callback({
      begin: bufferedUntil,
      end: bufferUntil,
      relativeBegin: bufferedUntil - startTime,
      relativeEnd: bufferUntil - startTime,
      start: startTime,
    });

    bufferedUntil = bufferUntil;

    _this.timeoutID = setTimeout(timeoutFunc, 1000*TIMEOUT_DELAY);
  }

  this.running = true;

  timeoutFunc();
}

EventScheduler.prototype.stop = function() {
  this.running = false;

  if (this.timeoutID) {
    clearTimeout(this.timeoutID);

    this.timeoutID = null;
  }
}

module.exports = EventScheduler;
