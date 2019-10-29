function pascalsTriangleRow(n) {
  var line = [1];
  for (var i = 0; i < n; i++) {
    line.push((line[i] * (n - i)) / (i + 1));
  }
  return line;
}

function getPixel(x, y, i_cv) {
  var r = y * (i_cv.width * 4) + x * 4;
  return {
    r: r,
    g: r + 1,
    b: r + 2,
    a: r + 3
  };
}

function convertToLinear(s) {
  s /= 255;
  if (s <= 0.04045) linear = s / 12.92;
  else linear = Math.pow((s + 0.055) / 1.055, 2.4);
  return linear;
}

function convertToNonLinerar(linear) {
  var s = 0;
  if (linear <= 0.0031308) s = linear * 12.92;
  else s = 1.055 * Math.pow(linear, 1.0 / 2.4) - 0.055;
  return s;
}

function calculatePixel(
  x,
  y,
  radius,
  dividerList,
  dividerTotal,
  imageData,
  imageBuffer,
  direction,
  i_cv
) {
  var r = 0;
  var g = 0;
  var b = 0;
  var a = 0;

  for (var i = -radius; i <= radius; i++) {
    var divider = dividerList[i + radius] / dividerTotal;
    var nY = direction == 0 ? y : Math.min(Math.max(y + i, 0), i_cv.height - 1);
    var nX = direction == 1 ? x : Math.min(Math.max(x + i, 0), i_cv.width - 1);
    var addpix = getPixel(nX, nY, i_cv);

    r += imageData.data[addpix.r] * divider;
    g += imageData.data[addpix.g] * divider;
    b += imageData.data[addpix.b] * divider;
    a += imageData.data[addpix.a] * divider;
  }

  var pix = getPixel(x, y, i_cv);

 
  imageBuffer.data[pix.r] = r * (255 / a);
  imageBuffer.data[pix.g] = g * (255 / a);
  imageBuffer.data[pix.b] = b * (255 / a);
  imageBuffer.data[pix.a] = a;
}

function blur(radius, i_cv, i_cx) {
  var imageData = i_cx.getImageData(0, 0, i_cv.width, i_cv.height);
  var imageBuffer = i_cx.createImageData(imageData);
  var dividerList = pascalsTriangleRow(radius * 2);
  var dividerTotal = dividerList.reduce((a, b) => a + b, 0);

  for (var y = 0; y < i_cv.height; y++) {
    for (var x = 0; x < i_cv.width; x++) {
      calculatePixel(x, y, radius, dividerList, dividerTotal, imageData, imageBuffer, 1, i_cv);
    }
  }
  i_cx.putImageData(imageBuffer, 0, 0);
  imageData = i_cx.getImageData(0, 0, i_cv.width, i_cv.height);

  for (var x = 0; x < i_cv.width; x++) {
    for (var y = 0; y < i_cv.height; y++) {
      calculatePixel(x, y, radius, dividerList, dividerTotal, imageData, imageBuffer, 0, i_cv);
    }
  }

  i_cx.putImageData(imageBuffer, 0, 0);
}
