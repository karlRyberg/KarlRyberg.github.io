var Blur = (function () {

    function _pixel() {
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.alpha = 0;
        this.divider = 1;
    }

    var _canvasContext;
    var _canvasWidth;
    var _canvasHeight;
    this.SetContext = function (ct) {
        _canvasContext = ct;
        _canvasWidth = ct.canvas.width;
        _canvasHeight = ct.canvas.height;
    }
    this.GetContext = function () {
        return _canvasContext;
    }

    function _getPixel(data, x, y) {

        if (x > _canvasWidth) x = 0;
        if (x < 0) x = _canvasWidth;
        if (y > _canvasHeight) y = 0;
        if (y < 0) y = _canvasHeight;

        var posX = x;
        var posY = y * _canvasWidth;
        var pos = (posX + posY) * 4;

        var returnPix = new _pixel();

        returnPix.red = data[pos];
        returnPix.green = data[pos + 1];
        returnPix.blue = data[pos + 2];
        returnPix.alpha = data[pos + 3];

        return returnPix;

    }


    function _drawPixel(px, x, y, w, h) {
        ctx.fillStyle = 'rgb(' + Math.round(px.red / px.divider) + ',' + Math.round(px.green / px.divider) + ',' + Math.round(px.blue / px.divider) + ')';
        ctx.fillRect(x, y, w, h);
    }


    this.BoxBlur = function (radius) {

        if (!_canvasContext) return;
        var data = _canvasContext.getImageData(0, 0, cw, ch).data;

        var p;
        var sumPixel = new _pixel();
        for (var x = 0;  x < radius; x ++) {
            p = _getPixel(data, x, 0);
            console.log(p.red)
            sumPixel.red += p.red;
            sumPixel.green += p.green;
            sumPixel.blue += p.blue;
            sumPixel.divider++;
        }

        _drawPixel(sumPixel, 0, 0, 1, 1);

        for (var y = radius; y < _canvasHeight; y += radius) {

        }

        for (var x = radius; x < _canvasWidth; x += radius) {

        }

    }

    return this;

})();
