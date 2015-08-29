# canvas-quaternion-3d
A 3D engine that uses the 2D HTML5 canvas

A self-imposed challenge that is not really intended to be used seriously. WebGL is better.

##Implemented features
###Camera
Quaternion-based camera

Click and drag to orbit a point a fixed distance away

Scroll up and down to zoom in and out

Shift-click and drag to move camera up, down, left and right

###3D Functionality
Uniform spheres

Spheres can follow paths - orbiting a fixed point or another path (epicycles)

##Unimplemented features that will probably make it in eventually
Render optimization when camera is not moving - only call preDraw() on objects with moving paths, use cached results otherwise

Lines

Polygons

Hacked-together shading using gradient that will look marginally better than no shading at all

##How to use
Recommended browser is Chrome

Check out the [demo on RawGit](https://rawgit.com/jasperchapmanblack/canvas-quaternion-3d/master/mainpage.html).
