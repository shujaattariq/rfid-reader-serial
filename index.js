var Parser = require('binary-parser').Parser;
var SerialPort = require('serialport');


function crc16check(pucY, ucX) {
	var PRESET_VALUE = 0xFFFF
	var POLYNOMIAL = 0x8408
	var ucI, ucJ;
	var uiCrcValue = PRESET_VALUE;
	for (ucI = 0; ucI < ucX; ucI++) {
		uiCrcValue = uiCrcValue ^ pucY[ucI];
		for (ucJ = 0; ucJ < 8; ucJ++) {
			if (uiCrcValue & 0x0001) {
				uiCrcValue = (uiCrcValue >> 1) ^ POLYNOMIAL;
			} else {
				uiCrcValue = (uiCrcValue >> 1);
			}
		}
	}
	return uiCrcValue;
}

var port = new SerialPort('com3', {
	baudRate: 115200,
	dataBits: 8,
	stopBits: 1,
	parity: 'none',
	flowControl: false,
	xon: false,
	xoff: false,
	rtscts: false,
	bufferSize: 30,

});


var resFrameHeader = new Parser()
	.uint8('length')
	.uint8('address')
	.uint8('command')
	.uint8('status')


var resFrameTagData = new Parser()
	.uint8('ant')
	.uint8('num')
	.uint8('epclength')
	.buffer('epcid', {
		encoding: 'hex',
		length: 12
	})
	.uint8('rssi')

var resFrameTagDataRT = new Parser()
	.uint8('ant')
	.uint8('epclength')
	.buffer('epcid', {
		encoding: 'hex',
		length: 12
	})
	.uint8('rssi')

var reqFrametagData = new Parser()
	.uint8('qvalue')
	.uint8('session')
	.uint8('maskmem')
	.uint16('maskaddr')
	.uint8('masklen')
	.uint8('maskdata')
	.uint8('addrtid')
	.uint8('lentid')


var framesBuffer = Buffer.alloc(0);
var frames = [];
var frame;
var frameSize = 0;

// Setup the port even `data` on arrival event handler
port.on('data', function(data) {

	if (!data) {
		return
	}

	framesBuffer = Buffer.concat([framesBuffer, data], framesBuffer.length + data.length);

	frameSize = framesBuffer[0] + 1;

	if (framesBuffer.length >= frameSize) {
		//lets extract the frame (by size only)

		//Create a frame
		frame = Buffer.alloc(frameSize);
		framesBuffer.copy(frame, 0, 0, frameSize);

		// if crc16 return non zero value then the frame is invalid and we are better off droping it
		if (crc16check(frame, frame.length)) {
			frame = null;
		}

		//remove frame from buffer
		framesBufferPendingSize = framesBuffer.length - frameSize
		tempbuffer = Buffer.alloc(framesBufferPendingSize);
		framesBuffer.copy(tempbuffer, 0, frameSize, tempbuffer.length);
		framesBuffer = tempbuffer;

	}

	if (frame) {
		parseframe(frame);
	}

});
var tags = Array();

/**
 * Parse the frame recived from RFID reader (compelete frame)
 * @param  {[type]} frame [description]
 */
function parseframe(frame) {

	var header = Buffer.alloc(4)
	frame.copy(header, 0, 0, header.length)
	var frameHead = resFrameHeader.parse(header);

	var dataBody = Buffer.alloc(frame.length - (header.length + 2))
	frame.copy(dataBody, 0, header.length, frame.length + 2);
	if (dataBody.length > 3) {

		if (frameHead.command == 1) { //Answer Mode
			frameBody = resFrameTagData.parse(dataBody);
		}

		if (frameHead.command == 238) { //Real Time Inventory Mode
			frameBody = resFrameTagDataRT.parse(dataBody);
		}

		if (tags[frameBody.epcid.toString('hex')]) {
			tags[frameBody.epcid.toString('hex')]++;
		} else {
			tags[frameBody.epcid.toString('hex')] = 1;
		}

		console.log("\033[2J");
		console.log("\033[H");
		console.log(Object.keys(tags).length);
		console.log(tags);
	}
}

//Starts Here
//get Info        '04 FF 21       19 95'
//start inventory '06 00 01 04 ff d4 39'  ---> 05 00 01 f8 69 0f

var buf = new Buffer('06000104ffd439', 'hex');
port.write(buf);