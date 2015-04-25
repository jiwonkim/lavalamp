$(document).ready(function() {
    var canvas = document.getElementById('lavalamp-canvas');
    var context = canvas.getContext('2d');
    context.translate(0.5, 0.5);

    var blobs = [
        blob(canvas, 0.3, 0.12),
        blob(canvas, 0.6, 0.075),
        blob(canvas, 0.8, 0.06),
        blob(canvas, 0.7, 0.08),
        blob(canvas, 0.4, 0.07),
    ];

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
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (var bidx = 0; bidx < blobs.length; bidx++) {
            blobs[bidx].render();
        }

        for (var x = 0; x < canvas.width; x++) {
            for (var y = 0; y < canvas.height; y++) {
                var sum = 0;
                
                for (var bidx = 0; bidx < blobs.length; bidx++) {
                    sum += blobs[bidx].m(x, y);
                }

                sum /= blobs.length;
                
                if (sum > 0.0019) {
                    context.fillStype = 'black';
                    context.fillRect(x, y, 1, 1);
                }
            }
        }
    }
});

function blob(canvas, x, r) {
    var LIFTING_FORCE = 2;
    var GOO_FACTOR = 1;

    var _canvas = canvas,
        _context = canvas.getContext('2d'),
        _x = x,
        _y = 1.0,
        _r = r,
        _r2 = r*r;

    var _halfWidth = _canvas.width / 2;
    var _halfHeight = _canvas.height / 2;

    // center of metaball, in pixel coords
    var _px = _x * canvas.width,
        _py = _y * canvas.height;

    // origin of the potential map of the metaball, in pixel coords
    var _opx = _px - canvas.width,
        _opy = _py - canvas.height; 
    var _pr = _r * (canvas.width + canvas.height) / 2,
        _pr2 = _pr*_pr;
    var _mass = Math.PI * Math.pow(_r, 3) * 3/4;

    // initial velocity
    var _vy = 0;

    var _potentialMap = [];
    _computePotentialMap();

    function _computePotentialMap() {
        for (var x = 0; x < canvas.width * 2; x++) {
            _potentialMap[x] = new Float32Array(canvas.height * 2);
            for (var y = 0; y < canvas.height * 2; y++) {
                var dx2 = (x - canvas.width)*(x - canvas.width);
                var dy2 = (y - canvas.height)*(y - canvas.height);
                _potentialMap[x][y] = _pr / (dx2 + dy2);
            }
        }
    }

    /** Computes acceleration in the y direction */
    function _ay() {
        return -LIFTING_FORCE * (_y - 0.5) / 0.5 * _mass;
    }

    function _tick(dt) {
        _vy += dt * _ay();
        _y += _vy * dt;

        // update px, py, pr
        _px = _x * canvas.width;
        _py = _y * canvas.height;
        _opx = _px - canvas.width;
        _opy = _py - canvas.height;
        /*
        if (_atBottom()) {
            _morph();
        }
*/
    }

    function _atBottom() {
    }

    function _morph() {
    }

    /** The metaball equation */
    function _m(px1, py1) {
        var xi = Math.floor(px1 - _opx);
        var yi = Math.floor(py1 - _opy);
        if (xi < 0 || yi < 0 || xi >= canvas.width * 2 || yi >= canvas.height * 2) {
            return 0;
        }
        return _potentialMap[xi][yi];
    }

    function _render() {
        _context.beginPath();
        _context.arc(_px, _py, _pr, 0, 2 * Math.PI, false);
        _context.strokeStyle = 'green';
        _context.stroke(); 
        _context.closePath();
    }

    return {
        m: _m,
        tick: _tick,
        render: _render
    }
}
