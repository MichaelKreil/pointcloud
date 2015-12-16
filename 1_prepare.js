var filename = './data/F2_Point.txt';

var fs = require('fs');

var stream = fs.createReadStream(filename, {encoding:'utf8'});

var buffer = '';
var size = 0;
var index = 0;
var output = fs.createWriteStream('./temp/points.bin');

stream.on('data', function (data) {
	size += data.length;
	if (index % 300 == 0) console.log((size/(1024*1024)).toFixed(0)+'MB');
	index++;

	buffer += data;
	data = buffer.split('\r\n');
	buffer = data.pop();
	
	var buf = new Buffer(15*data.length);
	var offset = 0;

	data.forEach(function (line) {
		line = line.split(' ');
		buf.writeFloatLE(parseFloat(line[0]) -  367500, offset+0);
		buf.writeFloatLE(parseFloat(line[1]) - 5841600, offset+4);
		buf.writeFloatLE(parseFloat(line[2]) -      50, offset+8);
		buf.writeUInt8(parseInt(line[3], 10), offset+12);
		buf.writeUInt8(parseInt(line[4], 10), offset+13);
		buf.writeUInt8(parseInt(line[5], 10), offset+14);
		offset += 15;
	})
	
	output.write(buf);
})

stream.on('end', function () {
	output.end();
	console.log('end');
}) 