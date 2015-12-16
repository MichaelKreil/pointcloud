var fs = require('fs');
var gm = require('gm');

var aa = 2;
var width = 1920;
var height = 1080;
var width_aa = width*aa;
var height_aa = height*aa;


var buf = fs.readFileSync('points.bin');
var imgBuf = new Buffer(width_aa*height_aa*3);
var zBuf = new Buffer(width_aa*height_aa*4);

var n = buf.length/15;

var ax = 0.15;
var ay = 0;
var zoom = 10*aa;
var perspective = 300;

var frame = 0;
step();

function step() {
	ay = frame*Math.PI/500 + 1.8;
	drawFrame(function () {
		frame++;
		step()
	});	
}


function drawFrame(cb) {
	console.log('draw '+frame);

	zBuf.fill(0);
	imgBuf.fill(0);

	var axc = Math.cos(ax);
	var axs = Math.sin(ax);
	var ayc = Math.cos(ay);
	var ays = Math.sin(ay);

	var x,y,z,t,r,g,b,p,offset;
	for (var i = 0; i < n; i++) {
		offset = i*15;

		x =  buf.readFloatLE(offset+0);
		z =  buf.readFloatLE(offset+4)-40;
		y = -buf.readFloatLE(offset+8)-0;

		r = buf.readUInt8(offset+12);
		g = buf.readUInt8(offset+13);
		b = buf.readUInt8(offset+14);

		t = x;
		x = ayc*x - ays*z;
		z = ays*t + ayc*z;

		t = y;
		y = axc*y - axs*z;
		z = axs*t + axc*z;

		p = perspective/(z+perspective);
		x = Math.round(p*x*zoom +  width_aa/2);
		y = Math.round(p*y*zoom + height_aa/2);
		z = z - 10000;

		if (x < 0) continue;
		if (y < 0) continue;
		if (x >  width_aa-1) continue;
		if (y > height_aa-1) continue;

		offset = x + y*width_aa;

		if (zBuf.readFloatLE(offset*4) < z) continue;

		zBuf.writeFloatLE(z, offset*4);
		imgBuf.writeUInt8(r, offset*3+0);
		imgBuf.writeUInt8(g, offset*3+1);
		imgBuf.writeUInt8(b, offset*3+2);
	}

	var gmImage = gm(imgBuf);

	gmImage._sourceFormatters.push(function (a) { a[0] = 'RGB:-';  });
	gmImage.options({imageMagick: true});
	gmImage.in('-size');
	gmImage.in(width_aa+'x'+height_aa);
	gmImage.in('-depth');
	gmImage.in('8');
	gmImage.resize(width, height);
	gmImage.write('frames/frame'+frame+'.png', function (err) {
		if (err) throw err;
		cb();
	});
}

