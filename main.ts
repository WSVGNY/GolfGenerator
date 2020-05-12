enum Ground { HOLE, GREEN, FAIRWAY, ROUGH, FOREST, FLAG_BASE, FLAG }

class Point2D {
    public x;
    public y;
    constructor(x: number, y: number) { this.x = x; this.y = y; }
}

class Vector2D {
    public x;
    public y;
    constructor(x: number, y: number) { this.x = x; this.y = y; }

    public normalise(): void {
        const length: number = Math.sqrt(this.x * this.x + this.y * this.y)
        if (length > 0) {
            this.x /= length
            this.y /= length
        }
    }
}

class Course {
    public height: number = 78;
    public width: number = 78;
    public terrain: Ground[][] = [];

    constructor() {
        this.initializeArray()
        const basePath: Point2D[] = this.generateBasePath()

        const rough: Spline = this.generateRough(basePath, this.getAnchors(basePath, 5))
        const fairway: Spline = this.generateFairway(basePath, this.getAnchors(basePath, 2))

        this.fill(rough, Ground.ROUGH);
        this.fill(fairway, Ground.FAIRWAY);

        this.generateGreen(basePath[basePath.length - 1], 4)
        this.generateGreen(basePath[0], 6)
        this.terrain[basePath[0].y][basePath[0].x] = Ground.HOLE
        this.terrain[basePath[0].y - 1][basePath[0].x] = Ground.FLAG_BASE
        this.terrain[basePath[0].y - 2][basePath[0].x] = Ground.FLAG_BASE
        this.terrain[basePath[0].y - 2][basePath[0].x + 1] = Ground.FLAG
    }

    private initializeArray(): void {
        for (var i: number = 0; i < this.height; i++) {
            this.terrain[i] = [];
            for (var j: number = 0; j < this.width; j++) {
                this.terrain[i][j] = null;
            }
        }
    }

    private generateBasePath(): Point2D[] {
        const hBound: number = 24
        const vBound: number = 12
        const path: Point2D[] = []
        path.push(new Point2D(this.getRandomInt(hBound, this.width - hBound), vBound))
        let lastMove: Point2D;

        while (path[path.length - 1].y < this.height - vBound) {
            const moves: Point2D[] = [new Point2D(-2, 2), new Point2D(0, 1), new Point2D(2, 2)]
            let move: Point2D;

            if (path[path.length - 1].x < hBound)
                moves[0] = new Point2D(0, 1)

            if (path[path.length - 1].x > this.width - hBound)
                moves[2] = new Point2D(0, 1)

            if (lastMove == undefined || lastMove.x == 0) {
                move = moves[this.getRandomInt(0, 3)]
            } else if (lastMove.x < 0) {
                move = moves[this.getRandomInt(0, 2)]
            } else if (lastMove.x > 0) {
                move = moves[this.getRandomInt(1, 3)]
            }

            path.push(new Point2D(path[path.length - 1].x + move.x, path[path.length - 1].y + move.y))
            lastMove = move
        }

        return path
    }

    private getAnchors(path: Point2D[], count: number): Point2D[] {
        const interval: number = Math.floor(path.length / count - 1)
        const anchors: Point2D[] = []

        for (let t = 0; t < ((count - 1) * interval + 1); t += interval) {
            anchors.push(path[t])
        }

        anchors.push(path[path.length - 1])

        return anchors
    }

    private generateRough(path: Point2D[], anchors: Point2D[]): Spline {
        const rough: Spline = new Spline();
        let i = 0
        anchors.forEach((anchor, j) => {

            const widthMin: number = this.getRandomInt(14, 18)
            if (j == 0)
                rough.points.push(new Point2D(anchor.x, anchor.y - 10))

            let leftmost: Point2D = new Point2D(anchor.x - widthMin, anchor.y)
            let rightmost: Point2D = new Point2D(anchor.x + widthMin, anchor.y)

            while (!(path[i].x == anchor.x && path[i].y == anchor.y)) {
                if (path[i].x < leftmost.x)
                    leftmost.x = path[i].x

                if (path[i].x > rightmost.x)
                    rightmost.x = path[i].x

                i++
            }

            rough.points.unshift(leftmost)
            rough.points.push(rightmost)

            if (j == anchors.length - 1)
                rough.points.push(new Point2D(anchor.x, anchor.y + 8))
        })

        return rough
    }

    private generateFairway(path: Point2D[], anchors: Point2D[]): Spline {
        const widthMin: number = 5
        const widthMax: number = 7
        const fairway: Spline = new Spline();

        for (let i = 0; i < anchors.length; i++) {
            const widthLeft: number = this.getRandomInt(widthMin, widthMax)
            const widthRight: number = this.getRandomInt(widthMin, widthMax)
            let next: number = i + 1
            let prev: number = i - 1

            if (i == 0)
                prev = i

            if (i == anchors.length - 1)
                next = i

            const vect1: Vector2D = new Vector2D(anchors[next].x - anchors[i].x, anchors[next].y - anchors[i].y)
            const vect2: Vector2D = new Vector2D(anchors[i].x - anchors[prev].x, anchors[i].y - anchors[prev].y)
            vect1.normalise()
            vect2.normalise()

            const bisect: Vector2D = new Vector2D(-1 * (vect1.y + vect2.y), vect1.x + vect2.x)
            bisect.normalise()

            fairway.points.unshift(new Point2D(Math.floor(anchors[i].x - bisect.x * widthLeft), Math.floor(anchors[i].y - bisect.y * widthLeft)))
            fairway.points.push(new Point2D(Math.floor(anchors[i].x + bisect.x * widthRight), Math.floor(anchors[i].y + bisect.y * widthRight)))
        }

        return fairway
    }

    private generateGreen(origin: Point2D, radius: number): void {
        for (let y: number = -radius; y <= radius; y++)
            for (let x: number = -radius; x <= radius; x++)
                if (x * x + y * y < radius * radius) {
                    if (x * x + y * y < (radius - 2) * (radius - 2)) {
                        this.terrain[origin.y + y][origin.x + x] = Ground.GREEN;
                    } else {
                        this.terrain[origin.y + y][origin.x + x] = Ground.FAIRWAY;
                    }
                }
    }

    private outlineFromPath(points: Point2D[], ground: Ground): void {
        for (let point of points) {
            this.terrain[point.y][point.x] = ground;
        }
    }

    private outlineFromSpline(spline: Spline, ground: Ground): void {
        for (let t = 0; t < spline.points.length; t += 0.005) {
            const pos: Point2D = spline.getSplinePoint(t, true);
            this.terrain[pos.y][pos.x] = ground;
        }
    }

    private fill(spline: Spline, ground: Ground): void {
        const outline: Point2D[] = []
        for (let t = 0; t < spline.points.length; t += 0.005) {
            const pos: Point2D = spline.getSplinePoint(t, true);
            this.terrain[pos.y][pos.x] = ground;
            outline.push(pos)
        }

        for (let i = 0; i < this.height; i++) {
            const line: Point2D[] = outline.filter((point) => point.y == i)
            if (line.length == 0)
                continue

            const leftmost: Point2D = line.reduce((prev, curr) => prev.x < curr.x ? prev : curr)
            const rightmost: Point2D = line.reduce((prev, curr) => prev.x > curr.x ? prev : curr)

            for (let j: number = leftmost.x; j <= rightmost.x; j++) {
                this.terrain[i][j] = ground
            }
        }
    }

    private getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }
}

// OneLoneCoder.com - Splines Part 1, Modified from original c++ code.
class Spline {
    public points: Point2D[] = []

    public getSplinePoint(t: number, bLooped: boolean): Point2D {
        let p0: number, p1: number, p2: number, p3: number;

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

        const tt: number = t * t;
        const ttt: number = tt * t;

        const q1: number = -ttt + 2.0 * tt - t;
        const q2: number = 3.0 * ttt - 5.0 * tt + 2.0;
        const q3: number = -3.0 * ttt + 4.0 * tt + t;
        const q4: number = ttt - tt;

        const tx: number = 0.5 * (this.points[p0].x * q1 + this.points[p1].x * q2 + this.points[p2].x * q3 + this.points[p3].x * q4);
        const ty: number = 0.5 * (this.points[p0].y * q1 + this.points[p1].y * q2 + this.points[p2].y * q3 + this.points[p3].y * q4);

        return new Point2D(Math.floor(tx), Math.floor(ty));
    }
}

function draw(): void {
    var canvas: HTMLCanvasElement = document.getElementById("myCanvas") as HTMLCanvasElement;
    clearCanvas(canvas);
    const course: Course = new Course();

    for (let i = 0; i < course.height; i++) {
        for (let j = 0; j < course.width; j++) {
            var ctx = canvas.getContext("2d");
            ctx.font = "lighter 16px serif";
            if (course.terrain[i][j] == Ground.FAIRWAY) {
                ctx.fillText("-", 9 + j * 10, 17 + i * 10);
            } else if (course.terrain[i][j] == Ground.GREEN) {
                ctx.fillText("_", 7 + j * 10, 15 + i * 10);
            } else if (course.terrain[i][j] == Ground.HOLE) {
                ctx.fillText("o", 7 + j * 10, 19 + i * 10);
            } else if (course.terrain[i][j] == Ground.ROUGH) {
                ctx.fillText("~", 9 + j * 10, 17 + i * 10);
            } else if (course.terrain[i][j] == Ground.FLAG_BASE) {
                ctx.fillText("|", 10 + j * 10, 20 + i * 10);
            } else if (course.terrain[i][j] == Ground.FLAG) {
                ctx.fillText(">", 5 + j * 10, 18 + i * 10);
            }
            else {
                ctx.fillText("^", 10 + j * 10, 20 + i * 10);
            }
        }
    }
}

function clearCanvas(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

// Erik Koopmans @ StackOverflow [https://stackoverflow.com/questions/14488849/higher-dpi-graphics-with-html5-canvas]
function setDPI(canvas, dpi) {
    // Set up CSS size.
    canvas.style.width = canvas.style.width || canvas.width + 'px';
    canvas.style.height = canvas.style.height || canvas.height + 'px';

    // Resize canvas and scale future draws.
    var scaleFactor = dpi / 96;
    canvas.width = Math.ceil(canvas.width * scaleFactor);
    canvas.height = Math.ceil(canvas.height * scaleFactor);
    var ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);
}