var fs = require('fs');
var ffmpeg = require('./lib/ffmpeg');

var aa = 2; // Antialiasing
var width = 1920;
var height = 1080;
var width_aa = width*aa;
var height_aa = height*aa;


var buf = fs.readFileSync('./temp/points.bin');
var imgBuf = new Buffer(width_aa*height_aa*3);
var zBuf = new Buffer(width_aa*height_aa*4);
var frameBuf = new Buffer(width*height*3);

var n = buf.length/15;

var ax = 0.15;
var ay = 0;
var zoom = 10*aa;
var perspective = 300;
var maxFrames = 100;

var frame = 0;

var video = ffmpeg('./video/test.mp4');

step();

function step() {
	ay = frame*2*Math.PI/maxFrames + 1.8;
	drawFrame(function () {
		frame++;
		if (frame < maxFrames) {
			process.nextTick(step);
		} else {
			video.close();
		}
	});	
}


function drawFrame(cb) {
	console.log('frame '+frame);

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

	var faa = aa*aa;
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var r = 0, g = 0, b = 0;

			for (var ya = 0; ya < aa; ya++) {
				for (var xa = 0; xa < aa; xa++) {
					var i = ((y*aa+ya)*width_aa + (x*aa+xa))*3;
					r += imgBuf.readUInt8(i+0);
					g += imgBuf.readUInt8(i+1);
					b += imgBuf.readUInt8(i+2);
				}
			}

			var fi = (y*width+x)*3;
			frameBuf.writeUInt8(Math.round(r/faa), fi+0);
			frameBuf.writeUInt8(Math.round(g/faa), fi+1);
			frameBuf.writeUInt8(Math.round(b/faa), fi+2);
		}
	}

	video.addFrame(frameBuf, cb)
}

