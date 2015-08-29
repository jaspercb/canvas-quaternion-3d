function getRandomColor() {	//source: http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
	return '#'+Math.random().toString(16).substr(-6);
}


var Quaternion = function(w, x, y, z){
	this.w = w;
	this.x = x;
	this.y = y;
	this.z = z;
};

Quaternion.prototype.qMul = function(b) {
	return new Quaternion(	this.w*b.w - this.x*b.x - this.y*b.y - this.z*b.z,
						this.w*b.x + this.x*b.w + this.y*b.z - this.z*b.y,
						this.w*b.y - this.x*b.z + this.y*b.w + this.z*b.x,
						this.w*b.z + this.x*b.y - this.y*b.x + this.z*b.w
					);
};

Quaternion.prototype.mul = function(b) {
	return new Quaternion(b*this.w, b*this.x, b*this.y, b*this.z);
};

Quaternion.prototype.div = function(b) {
	return new Quaternion(this.w/b, this.x/b, this.y/b, this.z/b);
};

Quaternion.prototype.add = function(b){
	return new Quaternion(this.w+b.w, this.x+b.x, this.y+b.y, this.z+b.z);
};

Quaternion.prototype.sub = function(b){
	return new Quaternion(this.w-b.w, this.x-b.x, this.y-b.y, this.z-b.z);
};

Quaternion.prototype.getSize = function(){
	return Math.sqrt(Math.pow(this.w,2) + Math.pow(this.x,2) + Math.pow(this.y,2) + Math.pow(this.z,2));
};

Quaternion.prototype.setSize = function(size){
	var factor = size/this.getSize();

	this.w*=factor;
	this.x*=factor;
	this.y*=factor;
	this.z*=factor;
};

Quaternion.prototype.inverse = function(){
	size = this.getSize();
	return new Quaternion(this.w/size, -this.x/size, -this.y/size, -this.z/size);
};

Quaternion.prototype.normalize = function(){
	this.setSize(1.0);
	return this;
};

Quaternion.prototype.getScreenPos = function(camera, screenwidth, screenheight){
	if (this.z===0){
		return [-10000,-10000];
	}
	return [camera.ratio*(screenwidth/2.0)*this.x/this.z + (screenwidth/2.0),
			camera.ratio*(screenwidth/2.0)*this.y/this.z + (screenheight/2.0)];

};

Quaternion.prototype.real = function(){
	//returns the normalized unit vector along this quaternion's real axis
	self=this;
	return new Quaternion(0.0, self.x, self.y, self.z).normalize();
}

Quaternion.prototype.log = function(){
	console.log("w:",this.w,"x:",this.x,"y:",this.y,"z:",this.z)
}

var Sphere = function(pos, radius, myColor){
	this.pos=pos;
	this.radius=radius;
	this.myColor=myColor;
};

Quaternion.prototype.applyRotation = function(rotation){
	//
	//if (this.w!=0){
	//	throw "attempted to apply rotation to quaternion with real part"
	//}
	return rotation.qMul(this.qMul(rotation.inverse()))
}

var Camera = function(pos, orientation, vel){
	this.pos = pos;
	this.orientation = orientation;
	this.vel = vel;

	this.fov = 90;
	this.ratio = Math.tan(this.fov/2.0);
}

Camera.prototype.rotateOrientation = function(rotation){
	//applies rotation to current orientation quaternion
	//rotates objectively
	 this.orientation = rotation.qMul(this.orientation); //works
	// works but backwards this.orientation = rotation.qMul(this.orientation); //works but backwards

	//this.orientation = this.orientation.applyRotation(rotation) //works but fast
}

Camera.prototype.rotateAroundPoint = function(rotation, point){
	//rotates camera position and perspective around a fixed point
	//currently does not actually work

	this.pos = this.pos.sub(point);
	//this.pos = this.pos.applyRotation(this.orientation.inverse());
	this.rotateOrientation(rotation.inverse());
	this.pos = this.pos.applyRotation(rotation.inverse());
	//this.pos = this.pos.applyRotation(this.orientation);
	this.pos = this.pos.add(point);
}

Camera.prototype.rotateAroundDistance = function(rotation, distance){
	//moves camera forwards by distance, rotates, moves camera backwards by amount
	//net effect, the camera seems to orbit around a point distance away
	this.pos = this.pos.add(this.orientation.inverse().qMul(new Quaternion(0,0,0,1).qMul(this.orientation)).mul(distance));
	this.orientation = rotation.qMul(this.orientation);
	this.pos = this.pos.sub(this.orientation.inverse().qMul(new Quaternion(0,0,0,1).qMul(this.orientation)).mul(distance));
}

/*Camera.prototype.rotateAroundDistance = function(rotation, distance){
	this.rotateAroundPoint(rotation, this.pos.add(new Quaternion(0,0,0,1).mul(distance)));
} */

Camera.prototype.renderObjects = function(objects, canvas){
	for (i=0; i<objects.length; i++){
			objects[i].preDraw(this, canvas.width, canvas.height);
			//console.log(objects[i].projectedPos.w)

		}

		//canvasContext.fillStyle="white";
		//canvasContext.fill()

		canvasContext = canvas.getContext("2d")

		canvasContext.clearRect(0,0,canvas.width,canvas.height)
		canvasContext.fillStyle="black";
		canvasContext.fillRect(0,0,canvas.width,canvas.height);


		objects.sort(function (a,b){return b.projectedPos.z-a.projectedPos.z;});
		for (i=0; i<objects.length; i++){
			objects[i].draw(canvasContext);
		}
}

Sphere.prototype.preDraw = function(camera, screenwidth, screenheight){
	this.projectedPos = this.pos.sub(camera.pos).applyRotation(camera.orientation);
	this.shouldDraw = this.projectedPos.z>0;
	this.distanceFromCamera = this.projectedPos.z;
	if (!this.shouldDraw){
		return;	//why waste time if we ain't gonna draw this
	}
	this.drawRadius = Number(camera.ratio*(screenwidth/2.0)*this.radius/this.distanceFromCamera);
	
	temp = this.projectedPos.getScreenPos(camera, screenwidth, screenheight);
	this.drawX = temp[0];
	this.drawY = temp[1];
};

Sphere.prototype.draw = function(canvasContext){
	if (this.shouldDraw){
		canvasContext.beginPath();
		canvasContext.arc(this.drawX, this.drawY, this.drawRadius, 0, 2*Math.PI, false);
		//console.log(this.drawX);
		//console.log(this.drawY);
		canvasContext.fillStyle = this.myColor;
		canvasContext.fill();
	}
};

var update = function(){
	//cameraVel = cameraVel.add(cameraRotation.inverse().qMul(Quaternion(0,0,0,0.01).mul()))
	//camera.pos = camera.pos.add( camera.orientation.inverse().qMul(new Quaternion(0,0,0,1).qMul(camera.orientation)).mul(0.01) )
}

var render = function(){
	camera.renderObjects(objects, canvas);
}

var logState = function(){
	//camera.pos.log()
	camera.pos.add(new Quaternion(0,0,0,1).applyRotation(camera.orientation.inverse()).mul(cameraDistance)).log()
}

var mouseDownListener = function(e){
	mouseDown=true;
};

var mouseUpListener = function(e){
	mouseDown=false;
};

var mouseMoveListener = function(e){
	if (mouseDown){
		var dMouseX = e.pageX-oldMouseX;
		var dMouseY = e.pageY-oldMouseY;

		//camera.rotateAroundDistance(new Quaternion (1, 0.002*dMouseY, -0.002*dMouseX, 0).normalize(), cameraDistance)
		//camera.rotateOrientation(new Quaternion (1, 0.002*dMouseY, -0.002*dMouseX, 0).normalize())
		//camera.rotateAroundPoint(new Quaternion (1, 0.002*dMouseY, -0.002*dMouseX, 0).normalize(), new Quaternion(0,5,5,5))
		camera.rotateAroundDistance(new Quaternion (1, 0.002*dMouseY, -0.002*dMouseX, 0).normalize(), cameraDistance);
	}

	oldMouseX=e.pageX;
	oldMouseY=e.pageY;
};

var mouseScrollListener = function(e){
	oldCameraDistance = cameraDistance;
	cameraDistance*=Math.pow(0.9997,e.wheelDelta);
	camera.pos = camera.pos.add( new Quaternion(0,0,0,1).applyRotation(camera.orientation.inverse()).mul(oldCameraDistance-cameraDistance));
}

var mouseDown=false;
var oldMouseX=0
var oldMouseY=0

var camera = new Camera(new Quaternion(0,0,0,-5), new Quaternion(1,0,0,0), new Quaternion(0,0,0,0))
var cameraDistance = 5.0

//tempRotation = new Quaternion(0,0,0,0);

var canvas = document.getElementById("myCanvas");
var canvasContext = canvas.getContext("2d");

canvas.addEventListener("mousedown", mouseDownListener, false);
canvas.addEventListener("mousemove", mouseMoveListener, false);
canvas.addEventListener("mouseup", mouseUpListener, false);
canvas.addEventListener("mousewheel", mouseScrollListener, false);

var objects=[];
for (var i=0; i<2000; i++){
	objects.push(new Sphere(new Quaternion(0, (Math.random()-0.5)*10,(Math.random()-0.5)*10, (Math.random()-0.5)*10), 0.01, "white"));
}

objects.push(new Sphere(new Quaternion(0, 0,0,0), 0.1, "yellow"));

for (var i=-1; i<=1; i+=2){
	for (var j=-1; j<=1; j+=2){
		for (var k=-1; k<=1; k+=2){
			objects.push(new Sphere(new Quaternion(0, 5*i, 5*j, 5*k), 0.1, "red"));
			objects.push(new Sphere(new Quaternion(0, 2.5*i, 2.5*j, 2.5*k), 0.1, "blue"));
		}
	}
}

//for (var x=0; x<10; x++){ for (var y=0; y<10; y++){ for (var z=0; z<10; z++){ 	objects.push(new Sphere(new Quaternion(0, x,y,z), 0.1, getRandomColor())); }}}

render();

var updating = window.setInterval(update, 17);
var rendering = window.setInterval(render, 17);
var loggingState = window.setInterval(logState, 500)