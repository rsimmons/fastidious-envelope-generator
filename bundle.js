!function(e){function t(n){if(a[n])return a[n].exports;var i=a[n]={exports:{},id:n,loaded:!1};return e[n].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}var a={};return t.m=e,t.c=a,t.p="",t(0)}([function(e,t,a){"use strict";function n(e,t){var a=e.createBuffer(1,2,e.sampleRate),n=a.getChannelData(0);n[0]=t,n[1]=t;var i=e.createBufferSource();return i.buffer=a,i.loop=!0,i.start(),i}function i(e){var t=document.createElement("div");t.className="setting-wrapper";var a,n=document.createElement("label");if(e.options){a=document.createElement("select");for(var i=0;i<e.options.length;i++){var r=e.options[i],s=document.createElement("option");s.value=r[0],s.textContent=r[1],a.appendChild(s)}}else a=document.createElement("input"),a.type="number",a.step="any";a.value=m[e.name],a.addEventListener("input",function(){e.options?m[e.name]=a.value:m[e.name]=parseFloat(a.value)}),n.appendChild(document.createTextNode(e.name+" ")),n.appendChild(a),t.appendChild(n),f.appendChild(t)}var r=a(1),s=a(2),o=new(window.AudioContext||window.webkitAudioContext),u=o.createOscillator();u.frequency.value=440,u.type="sine",u.start();var c=o.createGain();c.gain.value=0;var l=n(o,1),h=o.createGain();h.gain.value=0;var d=s(o,document.querySelector("#env-graph"),1024);u.connect(c),c.connect(o.destination),l.connect(h);var m=new r(o,h.gain);h.connect(d),d.connect(c.gain);var p=document.querySelector("#gate-button");p.addEventListener("mousedown",function(e){e.preventDefault(),m.gateOn()}),p.addEventListener("mouseup",function(e){e.preventDefault(),m.gateOff()});for(var _=[{name:"mode",options:[["AD","AD"],["ASR","ASR"],["ADSR","ADSR"]]},{name:"attackShape",options:[[m.LINEAR,"linear"]]},{name:"attackTime"},{name:"attackLevel"},{name:"decayShape",options:[[m.LINEAR,"linear"],[m.EXPONENTIAL,"exponential"]]},{name:"decayTime"},{name:"sustainLevel"},{name:"releaseShape",options:[[m.LINEAR,"linear"],[m.EXPONENTIAL,"exponential"]]},{name:"releaseTime"}],f=document.querySelector("#settings"),g=0;g<_.length;g++)i(_[g])},function(e,t){"use strict";function a(e){if(!e)throw new Error("Assertion error")}function n(e,t){function i(){0===u._attackTime?u._attackRate=Number.POSITIVE_INFINITY:u._attackShape===u.LINEAR?u._attackRate=Math.abs(u._attackLevel-r)/u._attackTime:a(!1)}function s(){if(0===u._decayTime)u._decayRate=Number.POSITIVE_INFINITY;else if(u._decayShape===u.LINEAR){var e;e="ADSR"===u._mode?u._sustainLevel:r,u._decayRate=Math.abs(u._attackLevel-e)/u._decayTime}else u._decayShape===u.EXPONENTIAL?u._decayRate=1/u._decayTime:a(!1)}function o(){if(0===u._releaseTime)u._releaseRate=Number.POSITIVE_INFINITY;else if(u._releaseShape===u.LINEAR){var e;e="ADSR"===u._mode?u._sustainLevel:u._attackLevel,u._releaseRate=Math.abs(e-r)/u._releaseTime}else u._releaseShape===u.EXPONENTIAL?u._releaseRate=1/u._releaseTime:a(!1)}if(!(this instanceof n))return new n(e,t);this._audioContext=e,this._targetParam=t;var u=this;Object.defineProperty(this,"mode",{get:function(){return u._mode},set:function(e){u.MODES.indexOf(e)>=0&&(u._mode=e,o())}}),Object.defineProperty(this,"attackShape",{get:function(){return u._attackShape},set:function(e){u.ATTACK_SHAPES.indexOf(e)>=0&&(u._attackShape=e,i())}}),Object.defineProperty(this,"attackTime",{get:function(){return u._attackTime},set:function(e){"number"==typeof e&&!isNaN(e)&&e>=0&&(u._attackTime=e,i())}}),Object.defineProperty(this,"attackLevel",{get:function(){return u._attackLevel},set:function(e){"number"!=typeof e||isNaN(e)||(u._attackLevel=e,i())}}),Object.defineProperty(this,"decayShape",{get:function(){return u._decayShape},set:function(e){u.DECAY_SHAPES.indexOf(e)>=0&&(u._decayShape=e,s())}}),Object.defineProperty(this,"decayTime",{get:function(){return u._decayTime},set:function(e){"number"==typeof e&&!isNaN(e)&&e>=0&&(u._decayTime=e,s())}}),Object.defineProperty(this,"sustainLevel",{get:function(){return u._sustainLevel},set:function(e){"number"!=typeof e||isNaN(e)||(u._sustainLevel=e,s())}}),Object.defineProperty(this,"releaseShape",{get:function(){return u._releaseShape},set:function(e){u.RELEASE_SHAPES.indexOf(e)>=0&&(u._releaseShape=e,o())}}),Object.defineProperty(this,"releaseTime",{get:function(){return u._releaseTime},set:function(e){"number"==typeof e&&!isNaN(e)&&e>=0&&(u._releaseTime=e,o())}}),this._mode="ADSR",this._attackShape=this.LINEAR,this._attackTime=.5,this._attackLevel=1,this._decayShape=this.EXPONENTIAL,this._decayTime=1,this._sustainLevel=.5,this._releaseShape=this.EXPONENTIAL,this._releaseTime=.5,i(),s(),o(),this._targetParam.value=r,this._scheduledSegments=[]}var i=function(){var e=new Uint32Array(1),t=new Float32Array(e.buffer);return function(a){return t[0]=a,e[0]=e[0]+1,t[0]}}(),r=0;n.prototype.MODES=["AD","ASR","ADSR"],n.prototype.LINEAR="L",n.prototype.EXPONENTIAL="E",n.prototype.ATTACK_SHAPES=[n.prototype.LINEAR],n.prototype.DECAY_SHAPES=[n.prototype.LINEAR,n.prototype.EXPONENTIAL],n.prototype.RELEASE_SHAPES=[n.prototype.LINEAR,n.prototype.EXPONENTIAL],n.prototype._computeScheduledValue=function(e){if(!this._scheduledSegments.length)return 0;a(e>=this._scheduledSegments[0].beginTime);for(var t,n=0;n<this._scheduledSegments.length;n++){var i=this._scheduledSegments[n];if(e>=i.beginTime&&e<i.endTime){t=n;break}}if(void 0===t){var r=this._scheduledSegments[this._scheduledSegments.length-1];return a(e>r.endTime),r.endValue}var s=this._scheduledSegments[t];return s.shape===this.LINEAR?s.beginValue===s.endValue?s.beginValue:s.beginValue+(e-s.beginTime)/(s.endTime-s.beginTime)*(s.endValue-s.beginValue):s.shape===this.EXPONENTIAL?s.endValue+(s.beginValue-s.endValue)*Math.exp(s.rate*(s.beginTime-e)):void a(!1)},n.prototype._scheduleSegment=function(e,t,n){a(this._scheduledSegments.length>0);var i=this._scheduledSegments[this._scheduledSegments.length-1];if(a(i.endTime!==Number.POSITIVE_INFINITY),i.endValue!==e){var r;if(n===Number.POSITIVE_INFINITY)r=i.endTime,this._targetParam.setValueAtTime(e,r);else switch(t){case this.LINEAR:r=i.endTime+Math.abs((e-i.endValue)/n),this._targetParam.linearRampToValueAtTime(e,r);break;case this.EXPONENTIAL:r=Number.POSITIVE_INFINITY,this._targetParam.setTargetAtTime(e,i.endTime,1/n);break;default:a(!1)}this._scheduledSegments.push({shape:t,beginTime:i.endTime,endTime:r,beginValue:i.endValue,endValue:e,rate:n})}},n.prototype.gate=function(e,t){if("AD"!==this._mode||e){var a=this._audioContext.currentTime;t=void 0===t?a:t;var n=this._computeScheduledValue(t);if(this._targetParam.setValueAtTime(n,t),this._targetParam.cancelScheduledValues(i(t)),this._scheduledSegments=[{beginTime:t,endTime:t,beginValue:n,endValue:n,shape:this.LINEAR}],e){if(this._scheduleSegment(this._attackLevel,this._attackShape,this._attackRate),"AD"===this._mode||"ADSR"===this._mode){var s;s="AD"===this._mode?r:this._sustainLevel,this._scheduleSegment(s,this._decayShape,this._decayRate)}}else this._scheduleSegment(r,this._releaseShape,this._releaseRate)}},n.prototype.gateOn=function(e){this.gate(!0,e)},n.prototype.gateOff=function(e){this.gate(!1,e)},e.exports=n},function(e,t){function a(e,t,a){function n(e,a){m.lineWidth=1,m.strokeStyle=a,m.beginPath();for(var n=0;n<r;n++){var i=l+n;i>=r&&(i-=r);var u=t.height*(1-(e[i]-s)/(o-s));0===n?m.moveTo(n,u):m.lineTo(n,u)}m.stroke()}function i(){m.fillStyle="rgb(0, 0, 0)",m.fillRect(0,0,t.width,t.height);var e=t.height*(1+s/(o-s));m.strokeStyle="rgb(0, 0, 255)",m.beginPath(),m.moveTo(0,e),m.lineTo(t.width,e),m.stroke(),n(u,"rgb(100, 255, 0)"),n(c,"rgb(0, 255, 100)"),d=requestAnimationFrame(i)}var r=t.width,s=-1,o=1,u=new Float32Array(r),c=new Float32Array(r),l=0,h=e.createScriptProcessor(a,1,1);h.onaudioprocess=function(e){var t=e.inputBuffer.getChannelData(0),a=e.outputBuffer.getChannelData(0),n=Math.min.apply(null,t),i=Math.max.apply(null,t);u[l]=n,c[l]=i,l++,l===r&&(l=0);for(var s=0;s<t.length;s++)a[s]=t[s]};var d,m=t.getContext("2d");return i(),h}e.exports=a}]);