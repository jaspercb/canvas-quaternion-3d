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

var Sphere = function(pos, radius, myColor){
	this.pos=pos;
	this.radius=radius;
	this.myColor=myColor;
};

Sphere.prototype.preDraw = function(camerapos, cameraRotation, screenwidth, screenheight){
	this.projectedPos = cameraRotation.qMul((this.pos.sub(camerapos)).qMul(cameraRotation.inverse()));
	this.distanceFromCamera = this.projectedPos.z;
	this.drawRadius = this.radius/this.distanceFromCamera;
	var temp = this.projectedPos.getScreenPos(screenwidth, screenheight);
	this.drawX = temp[0];
	this.drawY = temp[1];
};

Sphere.prototype.draw = function(canvasContext){
	canvasContext.beginPath();
	canvasContext.arc(this.drawX, this.drawY, this.drawRadius, 0, 2*Math.PI, false);
	//console.log(this.drawX);
	//console.log(this.drawY);
	canvasContext.fillStyle = this.myColor;
	canvasContext.fill();
};

var fov = 90;
var ratio = Math.tan(fov/2.0);

var cameraPos = new Quaternion(0,0,0,0);
var camerVel = new Quaternion(0,0,0,0);
var cameraRotation = new Quaternion(1,0,0,0);
cameraRotation.normalize();
var tempRotation = new Quaternion(0,0,0,0);

var objects=[];
for (var i=0; i<1000; i++){
	objects.push(new Sphere(new Quaternion(0,(Math.random()-0.5)*10,(Math.random()-0.5)*10, Math.random()*10), 100, getRandomColor()));
}

var canvas = document.getElementById("myCanvas");
var canvasContext = canvas.getContext("2d");

objects.sort(function (a,b){return b.pos.z-a.pos.z;});

for (i=0; i<objects.length; i++){
	objects[i].preDraw(cameraPos, cameraRotation, canvas.width, canvas.height);
}

for (i=0; i<objects.length; i++){
	objects[i].draw(canvasContext);
}
