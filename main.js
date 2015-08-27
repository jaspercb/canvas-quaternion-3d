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
	var size = this.getSize();
	return new Quaternion(this.w/size, -this.x/size, -this.y/size, -this.z/size);
};

Quaternion.prototype.normalize = function(){
	this.setSize(1.0);
	return this;
};

Quaternion.prototype.getScreenPos = function(screenwidth, screenheight){
	if (this.z===0){
		return [-10000,-10000];
	}
	return [ratio*(screenwidth/2.0)*this.x/this.z + (screenwidth/2.0),
			ratio*(screenheight/2.0)*this.y/this.z + (screenheight/2.0)];

};

Quaternion.prototype.real = function(){
	//returns the normalized unit vector along this quaternion's real axis
	self=this;
	return new Quaternion(0.0, self.x, self.y, self.z).normalize();
}

var Sphere = function(pos, radius, myColor){
	this.pos=pos;
	this.radius=radius;
	this.myColor=myColor;
};

Sphere.prototype.preDraw = function(camerapos, cameraRotation, screenwidth, screenheight){
	this.projectedPos = cameraRotation.qMul((this.pos.sub(camerapos)).qMul(cameraRotation.inverse()));
	this.shouldDraw = this.projectedPos.z>0;
	this.distanceFromCamera = this.projectedPos.z;
	if (!this.shouldDraw){
		return;	//why waste time if we ain't gonna draw this
	}
	this.drawRadius = this.radius/this.distanceFromCamera;
	var temp = this.projectedPos.getScreenPos(screenwidth, screenheight);
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
	//cameraPos = cameraPos.add( cameraRotation.inverse().qMul(new Quaternion(0,0,0,1).qMul(cameraRotation)).mul(0.01) )
}

var render = function(){
	for (i=0; i<objects.length; i++){
		objects[i].preDraw(cameraPos, cameraRotation, canvas.width, canvas.height);
	}

	//canvasContext.fillStyle="white";
	//canvasContext.fill()
	canvasContext.clearRect(0,0,canvas.width,canvas.height)

	objects.sort(function (a,b){return b.projectedPos.z-a.projectedPos.z;});
	for (i=0; i<objects.length; i++){
		objects[i].draw(canvasContext);
	}
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

		cameraPos = cameraPos.add( cameraRotation.inverse().qMul(new Quaternion(0,0,0,1).qMul(cameraRotation)).mul(cameraDistance))
		tempRotation = new Quaternion (1, 0.002*dMouseY, -0.002*dMouseX, 0).normalize();
		cameraRotation = tempRotation.qMul(cameraRotation)
		cameraPos = cameraPos.add( cameraRotation.inverse().qMul(new Quaternion(0,0,0,1).qMul(cameraRotation)).mul(-cameraDistance))
	}

	oldMouseX=e.pageX;
	oldMouseY=e.pageY;
};

var mouseScrollListener = function(e){
	oldCameraDistance = cameraDistance;
	cameraDistance*=Math.pow(0.9997,e.wheelDelta);
	cameraPos = cameraPos.add( cameraRotation.inverse().qMul(new Quaternion(0,0,0,1).qMul(cameraRotation)).mul(oldCameraDistance-cameraDistance));
}

var fov = 90;
var ratio = Math.tan(fov/2.0);

var mouseDown=false;
var oldMouseX=0
var oldMouseY=0

var cameraPos = new Quaternion(0,0,0,0);
var cameraVel = new Quaternion(0,0,0,0);
var cameraDistance = 4.0

var cameraRotation = new Quaternion(1,1,1,1).normalize();
cameraRotation.normalize();
var tempRotation = new Quaternion(0,0,0,0);

var canvas = document.getElementById("myCanvas");
var canvasContext = canvas.getContext("2d");

canvas.addEventListener("mousedown", mouseDownListener, false);
canvas.addEventListener("mousemove", mouseMoveListener, false);
canvas.addEventListener("mouseup", mouseUpListener, false);
canvas.addEventListener("mousewheel", mouseScrollListener, false);

var objects=[];
for (var i=0; i<500; i++){
	objects.push(new Sphere(new Quaternion(0,(Math.random()-0.5)*10,(Math.random()-0.5)*10, Math.random()*10), 100, getRandomColor()));
}

render()

var updating = window.setInterval(update, 17)
var rendering = window.setInterval(render, 17)