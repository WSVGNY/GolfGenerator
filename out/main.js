var Ground;
(function (Ground) {
    Ground[Ground["HOLE"] = 0] = "HOLE";
    Ground[Ground["GREEN"] = 1] = "GREEN";
    Ground[Ground["FAIRWAY"] = 2] = "FAIRWAY";
    Ground[Ground["ROUGH"] = 3] = "ROUGH";
    Ground[Ground["FOREST"] = 4] = "FOREST";
    Ground[Ground["FLAG_BASE"] = 5] = "FLAG_BASE";
    Ground[Ground["FLAG"] = 6] = "FLAG";
})(Ground || (Ground = {}));
var Point2D = /** @class */ (function () {
    function Point2D(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point2D;
}());
var Vector2D = /** @class */ (function () {
    function Vector2D(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector2D.prototype.normalise = function () {
        var length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length > 0) {
            this.x /= length;
            this.y /= length;
        }
    };
    return Vector2D;
}());
var Course = /** @class */ (function () {
    function Course() {
        this.height = 78;
        this.width = 78;
        this.terrain = [];
        this.initializeArray();
        var basePath = this.generateBasePath();
        var rough = this.generateRough(basePath, this.getAnchors(basePath, 5));
        var fairway = this.generateFairway(basePath, this.getAnchors(basePath, 2));
        this.fill(rough, Ground.ROUGH);
        this.fill(fairway, Ground.FAIRWAY);
        this.generateGreen(basePath[basePath.length - 1], 4);
        this.terrain[basePath[basePath.length - 1].y][basePath[basePath.length - 1].x] = Ground.FAIRWAY;
        this.generateGreen(basePath[0], 6);
        this.terrain[basePath[0].y][basePath[0].x] = Ground.HOLE;
        this.terrain[basePath[0].y - 1][basePath[0].x] = Ground.FLAG_BASE;
        this.terrain[basePath[0].y - 2][basePath[0].x] = Ground.FLAG_BASE;
        this.terrain[basePath[0].y - 2][basePath[0].x + 1] = Ground.FLAG;
    }
    Course.prototype.initializeArray = function () {
        for (var i = 0; i < this.height; i++) {
            this.terrain[i] = [];
            for (var j = 0; j < this.width; j++) {
                this.terrain[i][j] = null;
            }
        }
    };
    Course.prototype.generateBasePath = function () {
        var hBound = 24;
        var upperBound = this.getRandomInt(12, 18);
        var lowerBound = this.getRandomInt(12, 18);
        var path = [];
        path.push(new Point2D(this.getRandomInt(hBound, this.width - hBound), upperBound));
        var lastMove;
        while (path[path.length - 1].y < this.height - lowerBound) {
            var moves = [new Point2D(-2, 2), new Point2D(0, 1), new Point2D(2, 2)];
            var move = void 0;
            if (path[path.length - 1].x < hBound)
                moves[0] = new Point2D(0, 1);
            if (path[path.length - 1].x > this.width - hBound)
                moves[2] = new Point2D(0, 1);
            if (lastMove == undefined || lastMove.x == 0) {
                move = moves[this.getRandomInt(0, 3)];
            }
            else if (lastMove.x < 0) {
                move = moves[this.getRandomInt(0, 2)];
            }
            else if (lastMove.x > 0) {
                move = moves[this.getRandomInt(1, 3)];
            }
            path.push(new Point2D(path[path.length - 1].x + move.x, path[path.length - 1].y + move.y));
            lastMove = move;
        }
        return path;
    };
    Course.prototype.getAnchors = function (path, count) {
        var interval = Math.floor(path.length / count - 1);
        var anchors = [];
        for (var t = 0; t < ((count - 1) * interval + 1); t += interval) {
            anchors.push(path[t]);
        }
        anchors.push(path[path.length - 1]);
        return anchors;
    };
    Course.prototype.generateRough = function (path, anchors) {
        var _this = this;
        var rough = new Spline();
        var i = 0;
        anchors.forEach(function (anchor, j) {
            var widthMin = _this.getRandomInt(14, 18);
            if (j == 0)
                rough.points.push(new Point2D(anchor.x, anchor.y - 10));
            var leftmost = new Point2D(anchor.x - widthMin, anchor.y);
            var rightmost = new Point2D(anchor.x + widthMin, anchor.y);
            while (!(path[i].x == anchor.x && path[i].y == anchor.y)) {
                if (path[i].x < leftmost.x)
                    leftmost.x = path[i].x;
                if (path[i].x > rightmost.x)
                    rightmost.x = path[i].x;
                i++;
            }
            rough.points.unshift(leftmost);
            rough.points.push(rightmost);
            if (j == anchors.length - 1)
                rough.points.push(new Point2D(anchor.x, anchor.y + 8));
        });
        return rough;
    };
    Course.prototype.generateFairway = function (path, anchors) {
        var widthMin = 5;
        var widthMax = 7;
        var fairway = new Spline();
        for (var i = 0; i < anchors.length; i++) {
            var widthLeft = this.getRandomInt(widthMin, widthMax);
            var widthRight = this.getRandomInt(widthMin, widthMax);
            var next = i + 1;
            var prev = i - 1;
            if (i == 0)
                prev = i;
            if (i == anchors.length - 1)
                next = i;
            var vect1 = new Vector2D(anchors[next].x - anchors[i].x, anchors[next].y - anchors[i].y);
            var vect2 = new Vector2D(anchors[i].x - anchors[prev].x, anchors[i].y - anchors[prev].y);
            vect1.normalise();
            vect2.normalise();
            var bisect = new Vector2D(-1 * (vect1.y + vect2.y), vect1.x + vect2.x);
            bisect.normalise();
            fairway.points.unshift(new Point2D(Math.floor(anchors[i].x - bisect.x * widthLeft), Math.floor(anchors[i].y - bisect.y * widthLeft)));
            fairway.points.push(new Point2D(Math.floor(anchors[i].x + bisect.x * widthRight), Math.floor(anchors[i].y + bisect.y * widthRight)));
        }
        return fairway;
    };
    Course.prototype.generateGreen = function (origin, radius) {
        for (var y = -radius; y <= radius; y++)
            for (var x = -radius; x <= radius; x++)
                if (x * x + y * y < radius * radius) {
                    if (x * x + y * y < (radius - 2) * (radius - 2)) {
                        this.terrain[origin.y + y][origin.x + x] = Ground.GREEN;
                    }
                    else {
                        this.terrain[origin.y + y][origin.x + x] = Ground.FAIRWAY;
                    }
                }
    };
    Course.prototype.outlineFromPath = function (points, ground) {
        for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
            var point = points_1[_i];
            this.terrain[point.y][point.x] = ground;
        }
    };
    Course.prototype.outlineFromSpline = function (spline, ground) {
        for (var t = 0; t < spline.points.length; t += 0.005) {
            var pos = spline.getSplinePoint(t, true);
            this.terrain[pos.y][pos.x] = ground;
        }
    };
    Course.prototype.fill = function (spline, ground) {
        var outline = [];
        for (var t = 0; t < spline.points.length; t += 0.005) {
            var pos = spline.getSplinePoint(t, true);
            this.terrain[pos.y][pos.x] = ground;
            outline.push(pos);
        }
        var _loop_1 = function (i) {
            var line = outline.filter(function (point) { return point.y == i; });
            if (line.length == 0)
                return "continue";
            var leftmost = line.reduce(function (prev, curr) { return prev.x < curr.x ? prev : curr; });
            var rightmost = line.reduce(function (prev, curr) { return prev.x > curr.x ? prev : curr; });
            for (var j = leftmost.x; j <= rightmost.x; j++) {
                this_1.terrain[i][j] = ground;
            }
        };
        var this_1 = this;
        for (var i = 0; i < this.height; i++) {
            _loop_1(i);
        }
    };
    Course.prototype.getRandomInt = function (min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    };
    return Course;
}());
// OneLoneCoder @ Github [https://github.com/OneLoneCoder/videos/blob/master/OneLoneCoder_Splines1.cpp]
var Spline = /** @class */ (function () {
    function Spline() {
        this.points = [];
    }
    Spline.prototype.getSplinePoint = function (t, bLooped) {
        var p0, p1, p2, p3;
        if (!bLooped) {
            p1 = Math.floor(t) + 1;
            p2 = p1 + 1;
            p3 = p2 + 1;
            p0 = p1 - 1;
        }
        else {
            p1 = Math.floor(t);
            p2 = (p1 + 1) % this.points.length;
            p3 = (p2 + 1) % this.points.length;
            p0 = p1 >= 1 ? p1 - 1 : this.points.length - 1;
        }
        t = t - Math.floor(t);
        var tt = t * t;
        var ttt = tt * t;
        var q1 = -ttt + 2.0 * tt - t;
        var q2 = 3.0 * ttt - 5.0 * tt + 2.0;
        var q3 = -3.0 * ttt + 4.0 * tt + t;
        var q4 = ttt - tt;
        var tx = 0.5 * (this.points[p0].x * q1 + this.points[p1].x * q2 + this.points[p2].x * q3 + this.points[p3].x * q4);
        var ty = 0.5 * (this.points[p0].y * q1 + this.points[p1].y * q2 + this.points[p2].y * q3 + this.points[p3].y * q4);
        return new Point2D(Math.floor(tx), Math.floor(ty));
    };
    return Spline;
}());
function draw() {
    var canvas = document.getElementById("myCanvas");
    clearCanvas(canvas);
    var course = new Course();
    for (var i = 0; i < course.height; i++) {
        for (var j = 0; j < course.width; j++) {
            var ctx = canvas.getContext("2d");
            ctx.font = "lighter 16px serif";
            if (course.terrain[i][j] == Ground.FAIRWAY) {
                ctx.fillText("-", 9 + j * 10, 17 + i * 10);
            }
            else if (course.terrain[i][j] == Ground.GREEN) {
                ctx.fillText(" ", 7 + j * 10, 15 + i * 10);
            }
            else if (course.terrain[i][j] == Ground.HOLE) {
                ctx.fillText("o", 7 + j * 10, 19 + i * 10);
            }
            else if (course.terrain[i][j] == Ground.ROUGH) {
                ctx.fillText("~", 9 + j * 10, 17 + i * 10);
            }
            else if (course.terrain[i][j] == Ground.FLAG_BASE) {
                ctx.fillText("|", 10 + j * 10, 20 + i * 10);
            }
            else if (course.terrain[i][j] == Ground.FLAG) {
                ctx.fillText(">", 5 + j * 10, 18 + i * 10);
            }
            else {
                ctx.fillText("^", 10 + j * 10, 20 + i * 10);
            }
        }
    }
}
function clearCanvas(canvas) {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}
