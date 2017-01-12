!function(e){function t(n){if(a[n])return a[n].exports;var i=a[n]={exports:{},id:n,loaded:!1};return e[n].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}var a={};return t.m=e,t.c=a,t.p="",t(0)}([function(e,t,a){"use strict";function n(e,t){var a=e.createBuffer(1,2,e.sampleRate),n=a.getChannelData(0);n[0]=t,n[1]=t;var i=e.createBufferSource();return i.buffer=a,i.loop=!0,i.start(),i}function i(e){var t=document.createElement("div");t.className="setting-wrapper";var a,n=document.createElement("label");if(e.options){a=document.createElement("select");for(var i=0;i<e.options.length;i++){var r=e.options[i],s=document.createElement("option");s.value=r[0],s.textContent=r[1],a.appendChild(s)}}else a=document.createElement("input"),a.type="number",a.step="any",e.hasOwnProperty("min")&&(a.min=e.min),e.hasOwnProperty("max")&&(a.max=e.max);a.value=p[e.name],a.addEventListener("input",function(){e.options?p[e.name]=a.value:p[e.name]=parseFloat(a.value)}),n.appendChild(document.createTextNode(e.name+" ")),n.appendChild(a),t.appendChild(n),g.appendChild(t)}var r=a(1),s=a(2),o=new(window.AudioContext||window.webkitAudioContext),u=o.createOscillator();u.frequency.value=440,u.type="sine",u.start();var c=o.createGain();c.gain.value=0;var h=n(o,1),l=o.createGain();l.gain.value=0;var d=s(o,document.querySelector("#env-graph"),1024);u.connect(c),c.connect(o.destination),h.connect(l);var p=new r(o,l.gain);l.connect(d),d.connect(c.gain);var m=document.querySelector("#gate-button");m.addEventListener("mousedown",function(e){e.preventDefault(),p.gateOn()}),m.addEventListener("mouseup",function(e){e.preventDefault(),p.gateOff()});for(var f=[{name:"mode",options:[["AD","AD"],["ASR","ASR"],["ADSR","ADSR"]]},{name:"attackShape",options:[[p.LINEAR,"linear"]]},{name:"attackRate",min:0},{name:"attackLevel"},{name:"decayShape",options:[[p.LINEAR,"linear"],[p.EXPONENTIAL,"exponential"]]},{name:"decayRate",min:0},{name:"sustainFraction",min:0,max:1},{name:"releaseShape",options:[[p.LINEAR,"linear"],[p.EXPONENTIAL,"exponential"]]},{name:"releaseRate",min:0}],g=document.querySelector("#settings"),_=0;_<f.length;_++)i(f[_])},function(e,t){"use strict";function a(e){if(!e)throw new Error("Assertion error")}function n(e,t){if(!(this instanceof n))return new n(e,t);this._audioContext=e,this._targetParam=t;var a=this;Object.defineProperty(this,"mode",{get:function(){return a._mode},set:function(t){a.MODES.indexOf(t)>=0&&(a.gate(!1,i(Math.max(this._lastGateTime,e.currentTime))),a._mode=t)}}),Object.defineProperty(this,"attackShape",{get:function(){return a._attackShape},set:function(e){a.ATTACK_SHAPES.indexOf(e)>=0&&(a._attackShape=e)}}),Object.defineProperty(this,"attackRate",{get:function(){return a._attackRate},set:function(e){"number"==typeof e&&!isNaN(e)&&e>=0&&(a._attackRate=e)}}),Object.defineProperty(this,"attackLevel",{get:function(){return a._attackLevel},set:function(e){"number"!=typeof e||isNaN(e)||(a._attackLevel=e)}}),Object.defineProperty(this,"decayShape",{get:function(){return a._decayShape},set:function(e){a.DECAY_SHAPES.indexOf(e)>=0&&(a._decayShape=e)}}),Object.defineProperty(this,"decayRate",{get:function(){return a._decayRate},set:function(e){"number"==typeof e&&!isNaN(e)&&e>=0&&(a._decayRate=e)}}),Object.defineProperty(this,"sustainFraction",{get:function(){return a._sustainFraction},set:function(e){"number"==typeof e&&!isNaN(e)&&e>=0&&e<=1&&(a._sustainFraction=e)}}),Object.defineProperty(this,"releaseShape",{get:function(){return a._releaseShape},set:function(e){a.RELEASE_SHAPES.indexOf(e)>=0&&(a._releaseShape=e)}}),Object.defineProperty(this,"releaseRate",{get:function(){return a._releaseRate},set:function(e){"number"==typeof e&&!isNaN(e)&&e>=0&&(a._releaseRate=e)}}),this._mode="ADSR",this._attackShape=this.LINEAR,this._attackRate=2,this._attackLevel=1,this._decayShape=this.EXPONENTIAL,this._decayRate=1,this._sustainFraction=.5,this._releaseShape=this.EXPONENTIAL,this._releaseRate=1,this._targetParam.value=r,this._scheduledSegments=[],this._lastGateTime=e.currentTime,this._lastGateState=!1}var i=function(){var e=new Uint32Array(1),t=new Float32Array(e.buffer);return function(a){return t[0]=a,e[0]=e[0]+1,t[0]}}(),r=0;n.prototype.MODES=["AD","ASR","ADSR"],n.prototype.LINEAR="L",n.prototype.EXPONENTIAL="E",n.prototype.ATTACK_SHAPES=[n.prototype.LINEAR],n.prototype.DECAY_SHAPES=[n.prototype.LINEAR,n.prototype.EXPONENTIAL],n.prototype.RELEASE_SHAPES=[n.prototype.LINEAR,n.prototype.EXPONENTIAL],n.prototype._computeScheduledValue=function(e){if(!this._scheduledSegments.length)return 0;a(e>=this._scheduledSegments[0].beginTime);for(var t,n=0;n<this._scheduledSegments.length;n++){var i=this._scheduledSegments[n];if(e>=i.beginTime&&e<i.endTime){t=n;break}}if(void 0===t){var r=this._scheduledSegments[this._scheduledSegments.length-1];return a(e>r.endTime),r.endValue}var s=this._scheduledSegments[t];return s.shape===this.LINEAR?s.beginValue===s.endValue?s.beginValue:s.beginValue+(e-s.beginTime)/(s.endTime-s.beginTime)*(s.endValue-s.beginValue):s.shape===this.EXPONENTIAL?s.endValue+(s.beginValue-s.endValue)*Math.exp(s.rate*(s.beginTime-e)):void a(!1)},n.prototype._scheduleSegment=function(e,t,n){a(this._scheduledSegments.length>0);var i=this._scheduledSegments[this._scheduledSegments.length-1];if(a(i.endTime!==Number.POSITIVE_INFINITY),i.endValue!==e){var r;if(n===Number.POSITIVE_INFINITY)r=i.endTime,this._targetParam.setValueAtTime(e,r);else switch(t){case this.LINEAR:r=i.endTime+Math.abs((e-i.endValue)/n),this._targetParam.linearRampToValueAtTime(e,r);break;case this.EXPONENTIAL:r=Number.POSITIVE_INFINITY,this._targetParam.setTargetAtTime(e,i.endTime,1/n);break;default:a(!1)}this._scheduledSegments.push({shape:t,beginTime:i.endTime,endTime:r,beginValue:i.endValue,endValue:e,rate:n})}},n.prototype.gate=function(e,t){var a=this._audioContext.currentTime;if(t=void 0===t?a:t,t<this._lastGateTime)return void console.warn("Received gate with time earlier than a previous gate");if(this._lastGateTime=t,this._lastGateState=e,"AD"!==this._mode||e){var n=this._computeScheduledValue(t);if(this._targetParam.setValueAtTime(n,t),this._targetParam.cancelScheduledValues(i(t)),this._scheduledSegments=[{beginTime:t,endTime:t,beginValue:n,endValue:n,shape:this.LINEAR}],e){if(this._scheduleSegment(this._attackLevel,this._attackShape,this._attackRate),"AD"===this._mode||"ADSR"===this._mode){var s;s="AD"===this._mode?r:this._sustainFraction*this._attackLevel,this._scheduleSegment(s,this._decayShape,this._decayRate)}}else this._scheduleSegment(r,this._releaseShape,this._releaseRate)}},n.prototype.gateOn=function(e){this.gate(!0,e)},n.prototype.gateOff=function(e){this.gate(!1,e)},e.exports=n},function(e,t){function a(e,t,a){function n(e,a){p.lineWidth=1,p.strokeStyle=a,p.beginPath();for(var n=0;n<r;n++){var i=h+n;i>=r&&(i-=r);var u=t.height*(1-(e[i]-s)/(o-s));0===n?p.moveTo(n,u):p.lineTo(n,u)}p.stroke()}function i(){p.fillStyle="rgb(0, 0, 0)",p.fillRect(0,0,t.width,t.height);var e=t.height*(1+s/(o-s));p.strokeStyle="rgb(0, 0, 255)",p.beginPath(),p.moveTo(0,e),p.lineTo(t.width,e),p.stroke(),n(u,"rgb(100, 255, 0)"),n(c,"rgb(0, 255, 100)"),d=requestAnimationFrame(i)}var r=t.width,s=-1,o=1,u=new Float32Array(r),c=new Float32Array(r),h=0,l=e.createScriptProcessor(a,1,1);l.onaudioprocess=function(e){var t=e.inputBuffer.getChannelData(0),a=e.outputBuffer.getChannelData(0),n=Math.min.apply(null,t),i=Math.max.apply(null,t);u[h]=n,c[h]=i,h++,h===r&&(h=0);for(var s=0;s<t.length;s++)a[s]=t[s]};var d,p=t.getContext("2d");return i(),l}e.exports=a}]);