var getRandomColor = function() { //source: http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
	return '#' + Math.random().toString(16).substr(-6);
};

var Quaternion = function(w, x, y, z) {
	this.w = w;
	this.x = x;
	this.y = y;
	this.z = z;
};
Quaternion.prototype.qMul = function(b) {
	return new Quaternion(this.w * b.w - this.x * b.x - this.y * b.y - this
		.z * b.z, this.w * b.x + this.x * b.w + this.y * b.z - this.z *
		b.y, this.w * b.y - this.x * b.z + this.y * b.w + this.z * b.x,
		this.w * b.z + this.x * b.y - this.y * b.x + this.z * b.w);
};
Quaternion.prototype.mul = function(b) {
	return new Quaternion(b * this.w, b * this.x, b * this.y, b * this.z);
};
Quaternion.prototype.div = function(b) {
	return new Quaternion(this.w / b, this.x / b, this.y / b, this.z / b);
};
Quaternion.prototype.add = function(b) {
	return new Quaternion(this.w + b.w, this.x + b.x, this.y + b.y, this.z +
		b.z);
};
Quaternion.prototype.sub = function(b) {
	return new Quaternion(this.w - b.w, this.x - b.x, this.y - b.y, this.z -
		b.z);
};
Quaternion.prototype.getSize = function() {
	return Math.sqrt(Math.pow(this.w, 2) + Math.pow(this.x, 2) + Math.pow(
		this.y, 2) + Math.pow(this.z, 2));
};
Quaternion.prototype.setSize = function(size) {
	var factor = size / this.getSize();
	this.w *= factor;
	this.x *= factor;
	this.y *= factor;
	this.z *= factor;
};
Quaternion.prototype.inverse = function() {
	var size = this.getSize();
	return new Quaternion(this.w / size, -this.x / size, -this.y / size, -
		this.z / size);
};
Quaternion.prototype.normalize = function() {
	this.setSize(1.0);
	return this;
};
Quaternion.prototype.getScreenPos = function(camera, screenwidth, screenheight) {
	if (this.z === 0) {
		return [-10000, -10000];
	}
	return [camera.ratio * (screenwidth / 2.0) * this.x / this.z + (
			screenwidth / 2.0),
		camera.ratio * (screenwidth / 2.0) * this.y / this.z + (
			screenheight / 2.0)
	];
};
Quaternion.prototype.real = function() {
	//returns the quaternion, with real part set to 0
	return new Quaternion(0.0, this.x, this.y, this.z);
};
Quaternion.prototype.log = function() {
	console.log("w:", this.w, "x:", this.x, "y:", this.y, "z:", this.z);
};
Quaternion.prototype.applyRotation = function(rotation) {
	//
	//if (this.w!=0){
	//	throw "attempted to apply rotation to quaternion with real part"
	//}
	return rotation.qMul(this.qMul(rotation.inverse()));
};

var Camera = function(pos, orientation, vel) {
	this.pos = pos;
	this.orientation = orientation;
	this.vel = vel;
	this.fov = 90;
	this.ratio = Math.tan(this.fov / 2.0);
};
Camera.prototype.rotateOrientation = function(rotation) {
	//applies rotation to current orientation quaternion
	//rotates objectively
	this.orientation = rotation.qMul(this.orientation); //works
	// works but backwards this.orientation = rotation.qMul(this.orientation); //works but backwards
	//this.orientation = this.orientation.applyRotation(rotation) //works but fast
};
Camera.prototype.rotateAroundPoint = function(rotation, point) {
	//rotates camera position and perspective around a fixed point
	//currently does not actually work
	this.pos = this.pos.sub(point);
	//this.pos = this.pos.applyRotation(this.orientation.inverse());
	this.rotateOrientation(rotation.inverse());
	this.pos = this.pos.applyRotation(rotation.inverse());
	//this.pos = this.pos.applyRotation(this.orientation);
	this.pos = this.pos.add(point);
};
Camera.prototype.rotateAroundDistance = function(rotation, distance) {
		//moves camera forwards by distance, rotates, moves camera backwards by amount
		//net effect, the camera seems to orbit around a point distance away
		this.pos = this.pos.add(this.orientation.inverse().qMul(new Quaternion(
			0, 0, 0, 1).qMul(this.orientation)).mul(distance));
		this.orientation = rotation.qMul(this.orientation);
		this.pos = this.pos.sub(this.orientation.inverse().qMul(new Quaternion(
			0, 0, 0, 1).qMul(this.orientation)).mul(distance));
	};
	/*Camera.prototype.rotateAroundDistance = function(rotation, distance){
	this.rotateAroundPoint(rotation, this.pos.add(new Quaternion(0,0,0,1).mul(distance)));
} */
Camera.prototype.renderObjects = function(objects, canvas) {
	for (i = 0; i < objects.length; i++) {
		objects[i].preDraw(this, canvas.width, canvas.height);
		//console.log(objects[i].projectedPos.w)
	}
	//canvasContext.fillStyle="white";
	//canvasContext.fill()
	canvasContext = canvas.getContext("2d");
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	canvasContext.fillStyle = "black";
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
	objects.sort(function(a, b) {
		return b.distanceFromCamera - a.distanceFromCamera;
	});
	for (i = 0; i < objects.length; i++) {
		objects[i].draw(canvasContext);
	}
};

var OrbitPath = function(center, orbitOffset, rotation) {
	this.center = center; // path representing center of orbit
	this.orbitOffset = orbitOffset; // imaginary quaternion representing the displacement from the center of the orbit
	this.rotation = rotation; // quaternion representing the rotation applied to the offset per tick;
	this.displacement = new Quaternion(0, 0, 0, 0);
};
OrbitPath.prototype.update = function() {
	this.orbitOffset = this.orbitOffset.applyRotation(this.rotation);
	this.center.update();
};
OrbitPath.prototype.getPos = function() {
	return this.center.getPos().add(this.orbitOffset).add(this.displacement);
};

var ConstantPath = function(pos) {
	this.pos = pos;
	this.displacement = new Quaternion(0, 0, 0, 0);
};
ConstantPath.prototype.getPos = function() {
	return this.pos.add(this.displacement);
};
ConstantPath.prototype.update = function() {};

var Drawable = function(paths){
	/*	Parent class for anything that's drawn to the screen
		Required properties:
				.paths				| list of paths denoting edges
			Updated during .update():
				.shouldDraw			| boolean indicating whether to draw this object this frame
				.distanceFromCamera	| float indicating the distance to use when sorting objects by distance
				.drawCoords			| list of (x,y) pairs
	*/
}

Drawable.prototype.updateProjectedPaths = function(camera){
	//returns all items in this.paths, from the perspective of the camera
	this.projectedPaths = [];
	for (var i=0; i<this.paths.length; i++){
		this.projectedPaths.push(this.paths[i].getPos().sub(camera.pos).applyRotation(camera.orientation));
	}
};

Drawable.prototype.updateDrawCoords = function(camera, screenwidth, screenheight){
	this.drawCoords = [];
	for (var i=0; i<this.paths.length; i++){
		this.drawCoords.push(this.projectedPaths[i].getScreenPos(camera, screenwidth, screenheight));
	}
};

Drawable.prototype.updatePaths = function(){
	for (var i=0; i<this.paths.length; i++){
		this.paths[i].update()
	}
};

Drawable.prototype.update = function(){
	this.updatePaths();
};

Drawable.prototype.preDraw = function(){
	this.shouldDraw = false;
	console.log("unimplemented preDraw call on Drawable");
	console.log(this);
};

Drawable.prototype.draw = function(){
	console.log("unimplemented draw call on Drawable");
	console.log(this);
};

var Sphere = function(path, radius, myColor) {
	this.paths = [path];
	this.radius = radius;
	this.myColor = myColor;
};

Sphere.prototype = new Drawable();
Sphere.prototype.constructor = Sphere;

Sphere.prototype.preDraw = function(camera, screenwidth, screenheight) {
	this.updateProjectedPaths(camera);
	this.shouldDraw = this.projectedPaths[0].z > 0;
	this.distanceFromCamera = this.projectedPaths[0].z;

	if (this.shouldDraw) { //why waste time if we ain't gonna draw this
		this.updateDrawCoords(camera, screenwidth, screenheight);
		this.drawRadius = Number(camera.ratio * (screenwidth / 2.0) * this.radius /
			this.distanceFromCamera);
	}
};
Sphere.prototype.draw = function(canvasContext) {
	if (this.shouldDraw) {
		canvasContext.beginPath();
		canvasContext.arc(this.drawCoords[0][0], this.drawCoords[0][1], this.drawRadius, 0, 2 *
			Math.PI, false);
		//console.log(this.drawCoords)
		//console.log(this.drawCoords[0][0]);
		//console.log(this.drawY);
		canvasContext.fillStyle = this.myColor;
		canvasContext.fill();
	}
};

var Line = function(path1, path2, myColor, thickness) {
	this.paths = [path1,path2];
	this.myColor = myColor;
	this.thickness = thickness;
};

Line.prototype = new Drawable;
Line.prototype.constructor = Line;

Line.prototype.preDraw = function(camera, screenwidth, screenheight) {
	this.updateProjectedPaths(camera);
	this.shouldDraw = (this.projectedPaths[0].z > 0) || (this.projectedPaths[1].z > 0);
	if (this.shouldDraw) { //why waste time if we ain't gonna draw this
		this.distanceFromCamera = (this.projectedPaths[0].z + this.projectedPaths[1].z) / 2; //yolo average
		this.projectedPaths[0] = ClipLineToPositive(this.projectedPaths[0], this.projectedPaths[1]);
		this.projectedPaths[1] = ClipLineToPositive(this.projectedPaths[1], this.projectedPaths[0]);
		
		this.updateDrawCoords(camera, screenwidth, screenheight);
	}
};

Line.prototype.draw = function(canvasContext) {
	if (this.shouldDraw) {
		canvasContext.beginPath();
		canvasContext.moveTo(this.drawCoords[0][0], this.drawCoords[0][1]);
		canvasContext.lineTo(this.drawCoords[1][0], this.drawCoords[1][1]);
		canvasContext.lineWidth = this.thickness;
		canvasContext.strokeStyle = this.myColor;
		canvasContext.stroke();
	}
};

var ClipLineToPositive = function(A, B) {
	// A and B are both Quaternion objects
	// if A is z-positive, returns A
	// if A is z-negative, returns a point on the line connecting A and B which is just in front of the camera
	if (A.z > 0) return A;
	else {
		return A.add((B.sub(A)).mul((0.0001 - A.z) / (B.z - A.z)));
	}
};
var updateAll = function() {
	for (var i = 0; i < objects.length; i++) {
		objects[i].update();
	}
	//cameraVel = cameraVel.add(cameraRotation.inverse().qMul(Quaternion(0,0,0,0.01).mul()))
	//camera.pos = camera.pos.add( camera.orientation.inverse().qMul(new Quaternion(0,0,0,1).qMul(camera.orientation)).mul(0.01) )
};
var renderAll = function() {
	camera.renderObjects(objects, canvas);
};
var logState = function() {
	//console.log(linetest);
	//camera.pos.add(new Quaternion(0,0,0,1).applyRotation(camera.orientation.inverse()).mul(cameraDistance)).log()
};
var mouseDownListener = function(e) {
	mouseDown = true;
};
var mouseUpListener = function(e) {
	mouseDown = false;
};
var mouseMoveListener = function(e) {
	if (mouseDown) {
		var dMouseX = e.pageX - oldMouseX;
		var dMouseY = e.pageY - oldMouseY;
		if (e.shiftKey) {
			var tmp = new Quaternion(0, -0.001 * dMouseX * cameraDistance, -0.001 *
				dMouseY * cameraDistance, 0).applyRotation(camera.orientation
				.inverse());
			console.log(tmp);
			camera.pos = camera.pos.add(tmp);
		} else {
			//camera.rotateAroundDistance(new Quaternion (1, 0.002*dMouseY, -0.002*dMouseX, 0).normalize(), cameraDistance)
			//camera.rotateOrientation(new Quaternion (1, 0.002*dMouseY, -0.002*dMouseX, 0).normalize())
			//camera.rotateAroundPoint(new Quaternion (1, 0.002*dMouseY, -0.002*dMouseX, 0).normalize(), new Quaternion(0,5,5,5))
			camera.rotateAroundDistance(new Quaternion(1, 0.002 * dMouseY, -
				0.002 * dMouseX, 0).normalize(), cameraDistance);
		}
	}
	oldMouseX = e.pageX;
	oldMouseY = e.pageY;
};
var mouseScrollListener = function(e) {
	var oldCameraDistance = cameraDistance;
	cameraDistance *= Math.pow(0.9997, e.wheelDelta);
	camera.pos = camera.pos.add(new Quaternion(0, 0, 0, 1).applyRotation(
		camera.orientation.inverse()).mul(oldCameraDistance -
		cameraDistance));
};
var mouseDown = false;
var oldMouseX = 0;
var oldMouseY = 0;
var camera = new Camera(new Quaternion(0, 0, 0, -5), new Quaternion(1, 0, 0, 0),
	new Quaternion(0, 0, 0, 0));
var cameraDistance = 5.0;
	//tempRotation = new Quaternion(0,0,0,0);
var canvas = document.getElementById("myCanvas");
var canvasContext = canvas.getContext("2d");
canvas.addEventListener("mousedown", mouseDownListener, false);
canvas.addEventListener("mousemove", mouseMoveListener, false);
canvas.addEventListener("mouseup", mouseUpListener, false);
canvas.addEventListener("mousewheel", mouseScrollListener, false);
var objects = [];

//stars
for (var i = 0; i < 400; i++) {
	objects.push(new Sphere(new ConstantPath(new Quaternion(0, (Math.random() -
		0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() -
		0.5) * 10)), 0.01, "white"));
}
objects.push(new Sphere(new ConstantPath(new Quaternion(0, 0, 0, 0)),
	0.1, "yellow"));
/*
for (var i=-1; i<=1; i+=2){
	for (var j=-1; j<=1; j+=2){
		for (var k=-1; k<=1; k+=2){
			objects.push(new Sphere(new ConstantPath(new Quaternion(0, 5*i, 5*j, 5*k)), 0.1, "red"));
			objects.push(new Sphere(new ConstantPath(new Quaternion(0, 2.5*i, 2.5*j, 2.5*k)), 0.1, "blue"));
		}
	}
}*/

for (var i = -5; i <= 5; i += 10) {
	for (var j = -5; j <= 5; j += 10) {
		objects.push(new Line(new ConstantPath(new Quaternion(0, j, -i, i)),
			new ConstantPath(new Quaternion(0, j, i, i)), "red", 2));
		objects.push(new Line(new ConstantPath(new Quaternion(0, i, j, -i)),
			new ConstantPath(new Quaternion(0, i, j, i)), "red", 2));
		objects.push(new Line(new ConstantPath(new Quaternion(0, -i, i, j)),
			new ConstantPath(new Quaternion(0, i, i, j)), "red", 2));
	}
}
for (var i = -2.5; i <= 2.5; i += 5) {
	for (var j = -2.5; j <= 2.5; j += 5) {
		objects.push(new Line(new ConstantPath(new Quaternion(0, j, -i, i)),
			new ConstantPath(new Quaternion(0, j, i, i)), "blue", 2));
		objects.push(new Line(new ConstantPath(new Quaternion(0, i, j, -i)),
			new ConstantPath(new Quaternion(0, i, j, i)), "blue", 2));
		objects.push(new Line(new ConstantPath(new Quaternion(0, -i, i, j)),
			new ConstantPath(new Quaternion(0, i, i, j)), "blue", 2));
	}
}
for (var i = -4; i <= 4; i += 8) {
	for (var j = -4; j <= 4; j += 8) {
		objects.push(new Line(new ConstantPath(new Quaternion(0, j, -i, i)),
			new ConstantPath(new Quaternion(0, j, i, i)), "green", 2));
		objects.push(new Line(new ConstantPath(new Quaternion(0, i, j, -i)),
			new ConstantPath(new Quaternion(0, i, j, i)), "green", 2));
		objects.push(new Line(new ConstantPath(new Quaternion(0, -i, i, j)),
			new ConstantPath(new Quaternion(0, i, i, j)), "green", 2));
		for (var k = 1; k <= 3; k++) {
			objects[objects.length - k].paths[0].pos = objects[objects.length - k]
				.paths[0].pos.applyRotation(new Quaternion(1, 1, 1, 0).normalize());
			objects[objects.length - k].paths[1].pos = objects[objects.length - k]
				.paths[1].pos.applyRotation(new Quaternion(1, 1, 1, 0).normalize());
		}
	}
}
for (var i = -4; i <= 4; i += 8) {
	for (var j = -4; j <= 4; j += 8) {
		objects.push(new Line(new ConstantPath(new Quaternion(0, j, -i, i)),
			new ConstantPath(new Quaternion(0, j, i, i)), "yellow", 2));
		objects.push(new Line(new ConstantPath(new Quaternion(0, i, j, -i)),
			new ConstantPath(new Quaternion(0, i, j, i)), "yellow", 2));
		objects.push(new Line(new ConstantPath(new Quaternion(0, -i, i, j)),
			new ConstantPath(new Quaternion(0, i, i, j)), "yellow", 2));
		for (var k = 1; k <= 3; k++) {
			objects[objects.length - k].paths[0].pos = objects[objects.length - k]
				.paths[0].pos.applyRotation(new Quaternion(1, 1, 0, 1).normalize());
			objects[objects.length - k].paths[1].pos = objects[objects.length - k]
				.paths[1].pos.applyRotation(new Quaternion(1, 1, 0, 1).normalize());
		}
	}
}
//objects.push(new Line(new ConstantPath(new Quaternion(0,0,0,0)),new ConstantPath(new Quaternion(0,5,5,5)),"red",2));
//objects.push(linetest);
objects.push(new Sphere(new OrbitPath(new ConstantPath(new Quaternion(0, 0, 0,
	0)), new Quaternion(0, 0, 0, 0.2), new Quaternion(60, 0, 1,
	0).normalize()), 0.05, getRandomColor()));
objects.push(new Sphere(new OrbitPath(new ConstantPath(new Quaternion(0, 0, 0,
	0)), new Quaternion(0, 0, 0, 0.4), new Quaternion(80, 0, 1,
	0).normalize()), 0.05, getRandomColor()));
objects.push(new Sphere(new OrbitPath(new ConstantPath(new Quaternion(0, 0, 0,
	0)), new Quaternion(0, 0, 0, 0.7), new Quaternion(120, 0, 1,
	0).normalize()), 0.05, getRandomColor()));
objects.push(new Sphere(new OrbitPath(new ConstantPath(new Quaternion(0, 0, 0,
	0)), new Quaternion(0, 0, 0, 1), new Quaternion(160, 0, 1,
	0).normalize()), 0.05, getRandomColor()));
objects.push(new Sphere(new OrbitPath(new OrbitPath(new ConstantPath(new Quaternion(
		0, 0, 0, 0)), new Quaternion(0, 0, 0, 1), new Quaternion(
		160, 0, 1, 0).normalize()), new Quaternion(0, 0, 0, 0.1),
	new Quaternion(30, 0, 1, 0).normalize()), 0.03, "grey"));
objects.push(new Sphere(new OrbitPath(new OrbitPath(new ConstantPath(new Quaternion(
		0, 0, 0, 0)), new Quaternion(0, 0, 0, 1), new Quaternion(
		160, 0, 1, 0).normalize()), new Quaternion(0, 0, 0, 0.15),
	new Quaternion(40, 0, 1, 0).normalize()), 0.02, "grey"));
for (var i = 0; i <= 100; i++) {
	var rotation = new Quaternion(160 + Math.random() * 100, 0, 1, 0).normalize();
	var theta = Math.random() * 2 * Math.PI;
	var distance = 1.2 + Math.random() * 0.4;
	objects.push(new Sphere(new OrbitPath(new ConstantPath(new Quaternion(0, 0,
		0, 0)), new Quaternion(0, distance * Math.cos(theta), (
		Math.random() - 0.5) * 0.2, distance * Math.sin(
		theta)), rotation), 0.01, "grey"));
}

renderAll();
var updating = window.setInterval(updateAll, 17);
var rendering = window.setInterval(renderAll, 17);
//var loggingState = window.setInterval(logState, 500)