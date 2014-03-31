var pixel_width = 400;
var pixel_height = 400;

var amb = 0.2;
var spec_coeff = 0;
var diff_coeff = 2;

//Vector constructor and helper methods
function vec3 (x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;
}

vec3.prototype.neg = function() {
	return new vec3(-this.x, -this.y, -this.z);
}

function add (vecA, vecB)
{
	var sum = new vec3(vecA.x+vecB.x, vecA.y+vecB.y, vecA.z+vecB.z);
	return sum;
}

function mul(vec, factor)
{
	var multiplied = new vec3(vec.x*factor, vec.y*factor, vec.z*factor);
	return multiplied;
}

function dot (vecA, vecB)
{
	var dot_product = vecA.x*vecB.x + vecA.y*vecB.y + vecA.z*vecB.z;
	return dot_product;
}

function sub (vecA, vecB)
{
	var difference = new vec3( vecA.x-vecB.x, vecA.y-vecB.y, vecA.z-vecB.z);
	return difference;
}

function normalize(vec)
{
	var length = Math.sqrt(Math.pow(vec.x,2) + Math.pow(vec.y,2) + Math.pow(vec.z,2));
	return new vec3(vec.x/length, vec.y/length, vec.z/length);
}

// setting up the camera
var cam = new Object();

cam.pos = new vec3(0.01,0.01,0.01); //position of the camera
cam.dir = new vec3(0,0,-1); //direction that the camera is looking

cam.res = 2; //resolution of camera in pixels
cam.resx = Math.round(pixel_width/cam.res);
cam.resy = Math.round(pixel_height/cam.res);
cam.ppx = Math.round(cam.resx/2); //principal point x position
cam.ppy = Math.round(cam.resy/2); //principal point y position

cam.fov = 70;
cam.focal_length = (cam.ppx) / Math.tan((cam.fov/2)/180*Math.PI);
cam.fl_sqrd = Math.pow(cam.focal_length,2); // calculate focal length squared

// constructor for a sphere object
function sphere (position, radius, colour)
{
	this.pos = position;
	this.radius = radius;
	this.colour = colour;
}

function light (position)
{
	this.pos = position;
}

var mainLight = new light(new vec3(-8.1, 10.1, -1.1));

var spheres = new Array();
spheres.push(new sphere(new vec3(-1.9,0.1,-5.1), 1, new vec3(45,120,90)));
spheres.push(new sphere(new vec3(0.1,0.1,-5.1), 1, new vec3(30,95,130)));
spheres.push(new sphere(new vec3(2.1,0.1,-5.1), 1, new vec3(150,80,25)));

function drawRectangle(x,y,colour)
{
	var c = document.getElementById("mainCanvas");
	var ctx = c.getContext("2d");
	ctx.fillStyle = colour;
	ctx.fillRect(x*cam.res,y*cam.res,cam.res,cam.res);
}

function computeRay(x,y)
{
	var x_comp = x-cam.ppx;
	var y_comp = cam.ppy-y;
	var length = Math.sqrt(Math.pow(x_comp,2) + Math.pow(y_comp,2) + cam.fl_sqrd)
	var ray = new vec3(x_comp/length, y_comp/length, -cam.focal_length/length);
	return ray;
}

//sphere intersection based on code found at http://wiki.cgsociety.org/index.php/Ray_Sphere_Intersection
function raySphereIntersection(origin,d,sphere)
{
	var o = sub(origin, sphere.pos);
	var a = dot(d,d);
	var b = 2*dot(d,o);
	var c = dot(o,o) - (sphere.radius*sphere.radius);
	
	var disc = b*b-4*a*c;
	
	if(disc < 0)  
		return -1;
	
	var distSqrt = Math.sqrt(disc);
	var q;
	if(b<0)
		q = (-b - distSqrt)/2.0;
	else
	    q = (-b + distSqrt)/2.0;
	
	var t0 = q/a;
	var t1 = c/q;
	
	if(t0 > t1)
	{
		var temp = t0;
        t0 = t1;
        t1 = temp;
	}
	
	if (t1 < 0.000001)
        return -1;
	
	if (t0 < 0.000001)
    {
        t = t1;
		return t;
    }

    else
    {
        t = t0;
        return t;
		//return t;
    }
}
	
function raytrace()
{
	for(var y=0; y<cam.resy; y++){
		for(var x=0; x<cam.resx; x++){
			drawRectangle(x,y, 'rgb(100,100,100)');
		}
	}
	
	var ray;
	var dist = 100;
	var temp_dist = 0;
	var sphere_index;
	var collision;
	var count = 0;
	
	for(var y=0; y<cam.resy; y++){
		for(var x=0; x<cam.resx; x++){
			
			ray = computeRay(x,y);
			collision = false;
			dist = 100;
			temp_dist = 0
			
			for(var i=0; i<spheres.length; i++)
			{
				temp_dist = raySphereIntersection(cam.pos, ray, spheres[i]);
				
				if( temp_dist > 0.000001)
				{
					collision = true;
					if(temp_dist < dist)
					{
						dist = temp_dist;
						sphere_index = i;
					}
				}
			}
			if(collision == true)
			{
				var point = add(cam.pos, mul(ray,dist)); //location of the intersection
				var surf_norm = normalize(sub(point, spheres[sphere_index].pos)) //surface normal at intersection
				var shadow = false; //bool value that indicates whether or not the intersection location is in shadow
				var shadow_ray = normalize(sub(mainLight.pos,point));
				
				var rad = amb;
				var colour = spheres[sphere_index].colour;
				
				for(var i=0; i<spheres.length; i++)
				{
					if(raySphereIntersection(point,shadow_ray,spheres[i]) > 0.000001)
						shadow = true;
				}
				if(!shadow)
				{
					var diffuse = Math.max(0,dot(shadow_ray, surf_norm));
					var reflected = sub(ray.neg(), mul(surf_norm, 2*dot(ray.neg(), surf_norm)));
					var specular = Math.pow(dot(reflected.neg(), shadow_ray),96);
					var specular = Math.max(0, specular);
					
					rad = rad + diff_coeff*diffuse + spec_coeff*specular;
				}
				drawRectangle(x,y, 'rgb('+Math.round(rad*colour.x) +','+ Math.round(rad*colour.y) +','+ Math.round(rad*colour.z)+')');
			}
		}
		
	}
}