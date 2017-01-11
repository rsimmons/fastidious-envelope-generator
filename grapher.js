
function createGrapher(audioContext, canvasElem, samplesPerPoint) {
  var graphPoints = canvasElem.width;
  var minY = 0;
  var maxY = 1.0;

  var graphDataMin = new Float32Array(graphPoints);
  var graphDataMax = new Float32Array(graphPoints);
  var graphDataStartIdx = 0;
  var grapherNode = audioContext.createScriptProcessor(samplesPerPoint, 1, 1);
  grapherNode.onaudioprocess = function(e) {
    var inputData = e.inputBuffer.getChannelData(0);
    var outputData = e.outputBuffer.getChannelData(0);

    var minValue = Math.min.apply(null, inputData);
    var maxValue = Math.max.apply(null, inputData);
    graphDataMin[graphDataStartIdx] = minValue;
    graphDataMax[graphDataStartIdx] = maxValue;
    graphDataStartIdx++;
    if (graphDataStartIdx === graphPoints) {
      graphDataStartIdx = 0;
    }

    // Copy input to output unmodified
    for (var i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i];
    }
  };

  var canvasCtx = canvasElem.getContext('2d');
  var rafId;

  function drawData(data, color) {
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = color;

    canvasCtx.beginPath();

    for (var x = 0; x < graphPoints; x++) {
      var idx = graphDataStartIdx+x;
      if (idx >= graphPoints) {
        idx -= graphPoints;
      }

      var y = canvasElem.height*(1 - (data[idx]-minY)/(maxY-minY));

      if (x === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
    }

    canvasCtx.stroke();
  }

  function draw() {
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvasElem.width, canvasElem.height);

    drawData(graphDataMin, 'rgb(100, 255, 0)');
    drawData(graphDataMax, 'rgb(0, 255, 100)');

    rafId = requestAnimationFrame(draw);
  };
  draw();

  return grapherNode;
}

module.exports = createGrapher;
