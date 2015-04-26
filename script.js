$(document).ready(function() {
    var canvas = document.getElementById('lavalamp-canvas');

    // CONSTANTS
    var SUM_MULTIPLIER = 200;
    var colorStopsList = [
        [
            {force: 1.89, color: {r: 0, g: 0, b: 0, a: 0}},
            {force: 1.9, color: {r: 255, g: 255, b: 0, a: 100}},
            {force: 2, color: {r: 255, g: 180, b: 0, a: 200}},
            {force: 3, color: {r: 255, g: 10, b: 0, a: 255}}
        ],
        [
            {force: 1.89, color: {r: 0, g: 0, b: 0, a: 0}},
            {force: 2, color: {r: 200, g: 0, b: 255, a: 200}},
            {force: 3, color: {r: 200, g: 0, b: 255, a: 255}}
        ],
        [
            {force: 1.89, color: {r: 0, g: 0, b: 0, a: 0}},
            {force: 1.9, color: {r: 150, g: 50, b: 150, a: 100}},
            {force: 2.3, color: {r: 200, g: 50, b: 200, a: 150}},
            {force: 2.9, color: {r: 100, g: 150, b: 255, a: 200}},
            {force: 3, color: {r: 0, g: 255, b: 255, a: 255}}
        ]
    ];
    var colorStopIdx = 0;

    // SETUP CANVAS2D API, START RENDERING
    var context = canvas.getContext('2d');
    context.translate(0.5, 0.5);

    var w = canvas.width;
    var h = canvas.height;
    var vw = w;
    var vh = h * 0.9;

    var imageData = context.createImageData(w, h);

    // LAVA LAMP STATE
    var blobs = [
        blob(0.2, 0.05),
        blob(0.35, 0.04),
        blob(0.3, 0.04),
        blob(0.5, 0.1),
        blob(0.6, 0.075),
        blob(0.8, 0.03),
        blob(0.7, 0.03),
        blob(0.9, 0.09),
    ];

    $('body').click(function() {
        colorStopIdx = (colorStopIdx + 1) % colorStopsList.length;
    });
    requestAnimationFrame(frame);

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

    function colorAt(force) {
        var colorStops = colorStopsList[colorStopIdx];
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

/*
            console.log("force: ",force);
            console.log("cs0: ");
            console.log(cs0);
            console.log("cs1: ");
            console.log(cs1);
            console.log("t0: ",t0);
            console.log("t1: ",t1);
            console.log("t1 * cs0.color.r: ", t1 * cs0.color.r);
            console.log("t1 * cs0.color.g: ", t1 * cs0.color.g);
            console.log("t1 * cs0.color.b: ", t1 * cs0.color.b);
            console.log("t1 * cs0.color.a: ", t1 * cs0.color.a);
            console.log("t0 * cs1.color.r: ", t0 * cs1.color.r);
            console.log("t0 * cs1.color.g: ", t0 * cs1.color.g);
            console.log("t0 * cs1.color.b: ", t0 * cs1.color.b);
            console.log("t0 * cs1.color.a: ", t0 * cs1.color.a);
*/
            return {
                r: t1 * cs0.color.r + t0 * cs1.color.r,
                g: t1 * cs0.color.g + t0 * cs1.color.g,
                b: t1 * cs0.color.b + t0 * cs1.color.b,
                a: t1 * cs0.color.a + t0 * cs1.color.a
            }
        }

        return colorStops[colorStops.length - 1].color;
    }

    function blob(x, r) {
        var LIFTING_FORCE = 3;

        var _x = x,
            _y = 1.0,
            _r = r,
            _r2 = r*r;

        // center of metaball, in pixel coords
        var _px = Math.floor(_x * vw + 0.5),
            _py = Math.floor(_y * vh + 0.5);

        var _pr = _r * (vw + vh) / 2,
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
            _px = Math.floor(_x * vw + 0.5);
            _py = Math.floor(_y * vh + 0.5);
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
