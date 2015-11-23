var Blur = (function(){

    function _getPixel(data, x, y) {
        
        if (x > cw - 1) x = cw - 1;
        if (x < 0) x = 0;
        if (y > ch - 1) y = ch - 1;
        if (y < 0) y = 0;
        
        var posX = x;
        var posY = y * cw;
        var pos = (posX + posY) * 4;

        return {
            red: data[pos],
            green: data[pos + 1],
            blue: data[pos + 2],
            alpha: data[pos + 3]
        };
    }

    function _getZeroPix(data, x, y, radius, dir) {
        var r = 0;
        var g = 0;
        var b = 0;
        var cnt = 0;
        var addX = dir == 'x' ? 1 : 0;
        var addY = dir == 'y' ? 1 : 0;

        for (var n = -radius; n < radius; n++) {
            var p = _getPixel(data, x + (n * addX), y + (n * addX));
            r += p.red;
            g += p.green;
            b += p.blue;

            cnt++;
        }

        return {
            red: r,
            green: g,
            blue: b,
            divider: cnt
        };

    }

    function _getAvregePix(data, x, y, radius, dir) {

        var addX = dir == 'x' ? 1 : 0;
        var addY = dir == 'y' ? 1 : 0;

        var basePixel = {};
        basePixel.red = 0;
        basePixel.green = 0;
        basePixel.blue = 0;
        basePixel.divider = 0;
        var P;
        for (var i = -radius; i < radius; i++) {
            p = _getPixel(data, x + (i * addX), y + (i * addY));
            basePixel.red += p.red;
            basePixel.green += p.green;
            basePixel.blue += p.blue;
            basePixel.divider+= 1;
        }


        return basePixel;

    }

    function _drawPixel(px, x, y, w, h) {
        ctx.fillStyle = 'rgb(' + Math.round(px.red / px.divider) + ',' + Math.round(px.green / px.divider) + ',' + Math.round(px.blue / px.divider) + ')';
        ctx.fillRect(x, y, w, h);
    }
    
    this.CanvasContext = null;

    this.BoxBlur = function(radius, dir) {
        
        if(!this.CanvasContext) return;

        var sweepDir = dir || 'x';
        var sweepX = sweepDir == 'x';

        var addX = sweepX ? 1 : 0;
        var addY = sweepX ? 0 : 1;

        var pixels = this.CanvasContext.getImageData(0, 0, cw, ch).data;

        var pixel;
        var ox;
        var oy;
        var ix;
        var iy;

        var iMax = sweepX ? ch : cw;

        for (var i = 0; i <= iMax; i++) {

            var r = 0;
            var g = 0;
            var b = 0;

            ox = sweepX ? 0 : i;
            oy = sweepX ? i : 0;

            var mMax = sweepX ? cw : ch;

            for (var m = 0; m <= mMax; m++) {

                ix = sweepX ? m : i;
                iy = sweepX ? i : m;

               var zeroPixel = _getAvregePix(pixels, ix, iy, radius, sweepDir);

                _drawPixel(zeroPixel, ix, iy, 1, 1);
            }
        }

        if (!dir) BoxBlur(radius, 'y');

    }

    return this;

})()
