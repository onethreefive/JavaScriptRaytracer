var CANVAS_WIDTH = 400;
var CANVAS_HEIGHT = 400;

var AMBIENT_COEFF = 0.2;
var SPECULAR_COEFF = 0;
var DIFFUSE_COEFF = 2;

//Vector Class
function Vec3 (x, y, z)
{
    if( !(this instanceof Vec3) )
        alert( 'Vec3 constructor was called without "new"');
	this.x = x;
	this.y = y;
	this.z = z;
}

Vec3.prototype.neg = function() {
	return new Vec3(-this.x, -this.y, -this.z);
};

Vec3.prototype.sub = function(vec) {
    return new Vec3(this.x-vec.x, this.y-vec.y, this.z-vec.z);
};

Vec3.prototype.add = function(vec) {
    return new Vec3(this.x+vec.x, this.y+vec.y, this.z+vec.z);
};

Vec3.prototype.mul = function(factor) {
    return new Vec3(this.x*factor, this.y*factor, this.z*factor);
};

Vec3.prototype.dot = function(vec) {
    return (this.x*vec.x + this.y*vec.y + this.z*vec.z);
};

Vec3.prototype.norm = function(vec) {
    var length = Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2) + Math.pow(this.z,2));
	return new Vec3(this.x/length, this.y/length, this.z/length);
};


//Camera Class
function Camera(res, canvasWidth, canvasHeight, fov, pos, dir)
{
    
    if( !(this instanceof Camera) )
        alert( 'Camera constructor was called without "new"');
    this.res = res;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.fov = fov;
    this.pos = pos;
    this.dir = dir;
    
    this.resX = Math.round(this.canvasWidth/this.res);
    this.resY = Math.round(this.canvasHeight/this.res);
    
    this.ppX = Math.round(this.resX/2);
    this.ppY = Math.round(this.resY/2);
    
    this.focalLength = this.ppX / Math.tan((fov/2)/180*Math.PI);
    this.flSqrd = Math.pow(this.focalLength,2);
}


// Sphere class
function Sphere (position, radius, colour, spec_coeff, diff_coeff)
{
    if( !(this instanceof Sphere) )
    {
        alert( 'Sphere constructor was called without "new"');
    }
    
	this.pos = position;
	this.radius = radius;
	this.colour = colour;
    
    this.spec_coeff = spec_coeff;
    this.diff_coeff = diff_coeff;
}

// Light class
function light (position)
{
	this.pos = position;
}

//sphere intersection based on code found at http://wiki.cgsociety.org/index.php/Ray_Sphere_Intersection
function raySphereIntersection(origin,d,sphere)
{
    var o = origin.sub(sphere.pos);
    var a = d.dot(d);
    var b = 2 * d.dot(o);
    var c = o.dot(o) - (sphere.radius*sphere.radius);
	
	var disc = b*b-4*a*c;
	
	if(disc < 0)  
    {
		return -1;
    }
	
	var distSqrt = Math.sqrt(disc);
	var q;
    
	if(b<0)
    {
		q = (-b - distSqrt)/2.0;
    }
	else
    {
	    q = (-b + distSqrt)/2.0;
    }
	
	var t0 = q/a;
	var t1 = c/q;
	
	if(t0 > t1)
	{
		var temp = t0;
        t0 = t1;
        t1 = temp;
	}
	
	if (t1 < 0.000001)
    {
        return -1;
    }
	
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


function World ()
{
	this.mainLight = new light(new Vec3(-8.1, 10.1, -1.1));

	this.spheres = new Array();
	this.spheres.push( new Sphere(new Vec3(-2,0.3,-5.1), 1, new Vec3(45,120,90), 2, 1) );
	this.spheres.push( new Sphere(new Vec3(0,0.-1,-9.1), 1, new Vec3(30,95,130), 1, 1) );
	this.spheres.push( new Sphere(new Vec3(2,0.1,-4.1), 1, new Vec3(150,80,25), 0, 1) );
	
	this.cam = new Camera(5, CANVAS_WIDTH, CANVAS_HEIGHT, 70, new Vec3(0,0,0), new Vec3(0,0,-1));
}



World.prototype.drawRectangle = function(x,y,colour)
{
	var c = document.getElementById("mainCanvas");
	var ctx = c.getContext("2d");
	ctx.fillStyle = colour;
	ctx.fillRect(x*this.cam.res,y*this.cam.res,this.cam.res,this.cam.res);
}

World.prototype.computeRay = function(x,y)
{
	var x_comp = x-this.cam.ppX;
	var y_comp = this.cam.ppY-y;
	var length = Math.sqrt(Math.pow(x_comp,2) + Math.pow(y_comp,2) + this.cam.flSqrd)
	var ray = new Vec3(x_comp/length, y_comp/length, -this.cam.focalLength/length);
	return ray;
}

World.prototype.raytrace = function()
{
    console.time("MyTimer");
	
	var ray;
	var dist;
	var temp_dist = 0;
	var sphere_index;
	var collision;
	var count = 0;
	
	for(var y=0; y<this.cam.resY; y++){
		for(var x=0; x<this.cam.resX; x++){
			
			ray = this.computeRay(x,y);
			collision = false;
			dist = 9999;
			temp_dist = 0
			
			for(var i=0; i<this.spheres.length; i++)
			{
				temp_dist = raySphereIntersection(this.cam.pos, ray, this.spheres[i]);
				
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
                var point = this.cam.pos.add( ray.mul(dist) ); //location of the intersection
                var surf_norm = (point.sub(this.spheres[sphere_index].pos)).norm() //surface normal at intersection
				var shadow = false; //bool value that indicates whether or not the intersection location is in shadow
				var shadow_ray = (this.mainLight.pos.sub(point)).norm();
                
				var rad = AMBIENT_COEFF;
				var colour = this.spheres[sphere_index].colour;
				
				for(var i=0; i<this.spheres.length; i++)
				{
					if(raySphereIntersection(point,shadow_ray,this.spheres[i]) > 0.000001)
                    {
						shadow = true;
                        break;
                    }
				}
				if(!shadow)
				{
                    var diffuse = Math.max(0, shadow_ray.dot(surf_norm));
                    var reflected = ray.neg().sub(surf_norm.mul(2*ray.neg().dot(surf_norm)));
					var specular = Math.pow(reflected.neg().dot(shadow_ray),96);
					var specular = Math.max(0, specular);
					
					rad = rad + this.spheres[sphere_index].diff_coeff*diffuse + this.spheres[sphere_index].spec_coeff*specular;
				}
				this.drawRectangle(x,y, 'rgb('+Math.floor(rad*colour.x) +','+ Math.floor(rad*colour.y) +','+ Math.floor(rad*colour.z)+')');
			}
            /*else
            {
                drawRectangle(x,y, 'rgb(0,0,0)');
            }*/
		}
		
	}
    console.timeEnd("MyTimer");
}

var myWorld = new World()
