$(document).ready(function() { var canvas = document.getElementById('lavalamp-canvas');

    // CONSTANTS
    var colorStop0 = {r: 255, g: 0, b: 0, a: 255};
    var colorStop1 = {r: 255, g: 150, b: 0, a: 200};


    // SETUP CANVAS2D API, START RENDERING
    var context = canvas.getContext('2d');
    context.translate(0.5, 0.5);
    var hiddenCanvas = document.getElementById('hidden-canvas');
    var hiddenContext = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var imageData = context.createImageData(w, h);
    requestAnimationFrame(frame);

    // LAVA LAMP STATE
    var blobs = [
        blob(0.3, 0.1),
        blob(0.6, 0.075),
        blob(0.8, 0.05),
        blob(0.7, 0.06),
        blob(0.2, 0.05),
    ];


    function frame() {
        physics();
        render();
        requestAnimationFrame(frame);
    }

    function physics() {
        for (var bidx = 0; bidx < blobs.length; bidx++) {
            blobs[bidx].tick(0.1);
        }
    }
    
    function render() {
        context.clearRect(0, 0, w, h);

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var sum = 0;
                for (var bidx = 0; bidx < blobs.length; bidx++) {
                    sum += blobs[bidx].m(x, y);
                }
                var pixelIdx = (w * y + x) * 4;
                var d0 = (0.015 - sum) * 200;
                var d1 = 1 - d0;
                imageData.data[pixelIdx] = d1 * colorStop1.r + d0 + colorStop0.r;
                imageData.data[pixelIdx + 1] = d1 * colorStop1.g + d0 + colorStop0.g;
                imageData.data[pixelIdx + 2] = d1 * colorStop1.b + d0 + colorStop0.b;
                imageData.data[pixelIdx + 3] = d1 * colorStop1.a + d0 + colorStop0.a;
            }
        }
        context.putImageData(imageData, 0, 0);
    }

    function blob(x, r) {
        var LIFTING_FORCE = 3;

        var _x = x,
            _y = 1.0,
            _r = r,
            _r2 = r*r;

        // center of metaball, in pixel coords
        var _px = Math.floor(_x * w + 0.5),
            _py = Math.floor(_y * h + 0.5);

        // origin of the potential map of the metaball, in pixel coords
        var _opx = _px - w,
            _opy = _py - h; 
        var _pr = _r * (w + h) / 2,
            _pr2 = _pr*_pr;
        var _mass = Math.PI * Math.pow(2 * _r, 3) * 3/4;

        // initial velocity
        var _vy = 0;

        /** Computes acceleration in the y direction */
        function _ay() {
            return -LIFTING_FORCE * (_y - 0.5) / 0.5 * _mass;
        }

        function _tick(dt) {
            _vy += dt * _ay();
            _y += _vy * dt;

            // update px, py, pr
            _px = Math.floor(_x * w + 0.5);
            _py = Math.floor(_y * h + 0.5);
            _opx = _px - w;
            _opy = _py - h;
        }

        /** The metaball equation */
        function _m(px, py) {
            var dpx = px - _px;
            var dpy = py - _py;
            return _pr / (dpx * dpx + dpy * dpy);
        }

        function _render() {
            context.beginPath();
            context.arc(_px, _py, _pr, 0, 2 * Math.PI, false);
            context.strokeStyle = 'green';
            context.stroke(); 
            context.closePath();
        }

        return {
            m: _m,
            tick: _tick,
            render: _render
        }
    }
});
