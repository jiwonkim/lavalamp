$(document).ready(function() {
    var canvas = document.getElementById('lavalamp-canvas');
    var context = canvas.getContext('2d');
    context.translate(0.5, 0.5);

    $.getJSON('schemes.json', function(schemes) {
        initLavalamp(canvas, context, schemes);
    });
});

function initLavalamp(canvas, context, schemes) {
    var dt = 0.1;
    var lamp = lavalamp(canvas, context, schemes);
    requestAnimationFrame(frame);

    $('body').click(function() {
        lamp.toggleScheme();
    });

    function frame() {
        lamp.update(dt);
        lamp.render();
        requestAnimationFrame(frame);
    }
}

function lavalamp(canvas, context, schemes) {

    // CONSTANTS
    var SUM_MULTIPLIER = 200;
    var DEFAULT_SCHEME = {
        bgcolor: '#333',
        colorStops: [
            {force: 1.89, color: {r: 0, g: 0, b: 0, a: 0}},
            {force: 2.1, color: {r: 93, g: 191, b: 140, a: 255}},
            {force: 3, color: {r: 190, g: 214, b: 140, a: 255}},
            {force: 5, color: {r: 240, g: 140, b: 110, a: 255}},
        ]
    };

    // canvas width and height
    var w = canvas.width;
    var h = canvas.height;

    // viewport width and height
    var vw = w;
    var vh = h * 0.9;

    // image data used to render blobs
    var imageData = context.createImageData(w, h);

    // LAVA LAMP STATE
    var blobs = [
        blob(0.2, 0.05),
        blob(0.35, 0.04),
        blob(0.3, 0.042),
        blob(0.5, 0.1),
        blob(0.6, 0.075),
        blob(0.8, 0.031),
        blob(0.7, 0.03),
        blob(0.9, 0.09),
    ];
    var schemeIdx = 0;

    function toggleScheme() {
        schemeIdx = (schemeIdx + 1) % schemes.length;
        $('#lavalamp-canvas').css('background', schemes[schemeIdx].background);
    }

    function update(dt) {
        for (var bidx = 0; bidx < blobs.length; bidx++) {
            blobs[bidx].tick(dt);
        }
    }
    
    function render() {
        context.clearRect(0, 0, w, h);

        for (var y = 0; y < vh; y++) {
            for (var x = 0; x < vw; x++) {
                var sum = 0;
                for (var bidx = 0; bidx < blobs.length; bidx++) {
                    sum += blobs[bidx].m(x, y);
                }

                var pixelIdx = (w * y + x) * 4;
                var force = sum * SUM_MULTIPLIER;
                var rgba = colorAt(force);
                imageData.data[pixelIdx] = rgba.r;
                imageData.data[pixelIdx + 1] = rgba.g;
                imageData.data[pixelIdx + 2] = rgba.b;
                imageData.data[pixelIdx + 3] = rgba.a;
            }
        }
        context.putImageData(imageData, 0, 0);
    }

    /**
     * Returns a color, in rgba [0, 256), for a point experiencing
     * the given force
     *
     * @param {float} force
     */
    function colorAt(force) {
        var colorStops = schemes[schemeIdx].colorStops;
        for (var i = 0; i < colorStops.length; i++) {
            if (force > colorStops[i].force) {
                continue;
            }

            /**
             * force <= colorstop. Interpolate color between
             * colorStop[i - 1] and colorStop[i] and return
             */

            // force is smaller than the colorstop for the smallest force.    
            // the color here should be transparent
            if (i === 0) {
                return {r: 0, g: 0, b: 0, a: 0};
            }
            
            var cs0, cs1;
            cs0 = colorStops[i - 1]; // colorstop with the smaller force
            cs1 = colorStops[i]; // colorstop with the larger force

            var t0, t1;
            t0 = (force - cs0.force) / (cs1.force - cs0.force);
            t1 = 1 - t0;

            return {
                r: t1 * cs0.color.r + t0 * cs1.color.r,
                g: t1 * cs0.color.g + t0 * cs1.color.g,
                b: t1 * cs0.color.b + t0 * cs1.color.b,
                a: t1 * cs0.color.a + t0 * cs1.color.a
            }
        }

        return colorStops[colorStops.length - 1].color;
    }

    /**
     * Represents a blob in the lavalamp.
     * @param {float} x - initial x position for the blob, [0, 1]
     * @param {float} r - radius for the blob, [0, 1]
     */
    function blob(x, r) {
        var LIFTING_FORCE = 3;

        var _x = x,
            _y = 1.0,
            _r = r;

        // center of metaball, in pixel coords
        var _px = Math.floor(_x * vw + 0.5),
            _py = Math.floor(_y * vh + 0.5);

        var _pr = _r * (vw + vh) / 2;
        var _mass = Math.PI * Math.pow(2 * _r, 3) * 3/4;

        // initial velocity
        var _vy = 0;

        // Computes acceleration in the y direction
        function _ay() {
            return -LIFTING_FORCE * (_y - 0.5) / 0.5 * _mass;
        }

        // Updates the position of the blob for dt
        function tick(dt) {
            _vy += dt * _ay();
            _y += _vy * dt;

            // update px, py, pr
            _px = Math.floor(_x * vw + 0.5);
            _py = Math.floor(_y * vh + 0.5);
        }

        // The metaball equation
        function m(px, py) {
            var dpx = px - _px;
            var dpy = py - _py;
            return _pr / (dpx * dpx + dpy * dpy);
        }

        return {m: m, tick: tick}
    }

    return {
        toggleScheme: toggleScheme,
        update: update,
        render: render
    }
}
