// Copyright (c) 2014 Håkon Nessjøen <haakon.nessjoen@gmail.com>

// Permission is hereby granted, free of charge, to any person obtaining a 
// copy of this software and associated documentation files (the "Software"), 
// to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, 
// and/or sell copies of the Software, and to permit persons to whom the 
// Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
// DEALINGS IN THE SOFTWARE.

function iecstruct() {
	this.elements = [];
	this.elementNames = [];
	this.bytelength = 0;
}
iecstruct._VARIABLE = {
	prototype: {
		_asObject: function (arguments) {
			this.offset = arguments.length > 1 && typeof(arguments[1]) != 'undefined' ? arguments[1] : 0;
			if (arguments.length == 0) {
				if (typeof(this.buffer) == 'undefined') {
					this.buffer = new Buffer(this.bytelength);
					this.buffer.fill('\0');
				}
			} else {
				this.buffer = arguments[0];
			}
		},
		_fromObject: function (arguments) {
			this.offset = arguments.length > 2 && typeof(arguments[2]) != 'undefined' ? arguments[2] : 0;
			if (arguments.length <= 1) {
				if (typeof(this.buffer) == 'undefined') {
					this.buffer = new Buffer(this.bytelength);
					this.buffer.fill('\0');
				}
			} else {
				this.buffer = arguments[1];
			}
		}
	}
};

iecstruct.ARRAY = function (type, length) {
	this.bytelength = length * type.bytelength;
	this.asObject = function () {
		this._asObject(arguments);
		var obj=[];
		for (var i = 0; i < length; ++i) {
			obj.push(type.asObject(this.buffer, this.offset));
			this.offset += type.bytelength;
		}
		return obj;
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		if (typeof(obj) != 'object' || !('length' in obj)) {
			/* Should this emit some kind of "silent" warning? */
			//throw new Error('Expecting array input at buffer position ' + this.offset + ', while parsing object.');
			return;
		}
		var readlength = obj.length < length ? obj.length : length;
		for (var i = 0; i < readlength; ++i) {
			type.fromObject(obj[i], this.buffer, this.offset);
			this.offset += type.bytelength;
		}
	};
};
iecstruct.ARRAY.prototype.__proto__ = iecstruct._VARIABLE.prototype;

iecstruct.STRING = function (length) {
	if (typeof(length) == 'undefined') {
		length = 80;
	}
	/* Null terminator */
	length++;

	this.bytelength = length;
	this.asObject = function () {
		this._asObject(arguments);
		var str = this.buffer.toString('utf8', this.offset, this.offset + this.bytelength);
		return str.replace(/\0.*/,'');
	};
	this.fromObject = function (obj) {
		obj = obj+""; /* ensure string */
		this._fromObject(arguments);
		var stringlen = obj.length < length ? obj.length : length;
		this.buffer.write(obj, this.offset, this.bytelength, 'utf8');
		if (this.bytelength - stringlen > 0) {
			this.buffer.fill('\0', this.offset + stringlen, this.offset + (this.bytelength - stringlen));
		}
	};
};
iecstruct.STRING.prototype.__proto__ = iecstruct._VARIABLE.prototype;

/* untested */
iecstruct.WSTRING = function (length) {
	if (typeof(length) == 'undefined') {
		length = 80;
	}
	/* Null terminator */
	length++;

	this.bytelength = length * 2;
	this.asObject = function () {
		this._asObject(arguments);
		var str = this.buffer.toString('utf16le', this.offset, this.offset + this.bytelength);
		return str.replace(/\0.*/,'');
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.write(obj, this.offset, this.bytelength, 'utf16le');
		if (this.bytelength - obj.length > 0) {
			this.buffer.fill('\0', this.offset + (obj.length * 2), this.offset + (this.bytelength - (obj.length * 2)));
		}
	};
};
iecstruct.WSTRING.prototype.__proto__ = iecstruct._VARIABLE.prototype;

iecstruct.ENUM = function (enumlist) {
	this.bytelength = 2;
	if (typeof enumlist != 'object') {
		throw new Error("enumlist must be a object of enumeration key value pairs");
		return;
	}
	var lastval = -1;
	for (var key in enumlist) {
		if (!(enumlist[key]+'').match(/^\d+$/)) {
			enumlist[key] = ++lastval;
		} else {
			lastval = enumlist[key];
		}
	}
	this.asObject = function () {
		this._asObject(arguments);
		var value = this.buffer.readUInt16LE(this.offset);
		for (var key in enumlist) {
			if (enumlist[key] === value) {
				return key;
			}
		}
		return value;
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		var value;
		if (obj in enumlist) {
			value = enumlist[obj];
		} else if (!(obj+"").match(/^\d+$/)) {
			throw new Error("Invalid enum value");
		} else {
			value = obj;
		}
		this.buffer.writeUInt16LE(value, this.offset);
	};
};
iecstruct.ENUM.prototype.__proto__ = iecstruct._VARIABLE.prototype;

iecstruct._BOOL = function() {
	this.bytelength = 1;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readUInt8(this.offset) != 0 ? true : false;
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeUInt8(obj ? 1 : 0, this.offset);
	};
};
iecstruct._BOOL.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.BOOL = new iecstruct._BOOL();

iecstruct._SINT = function() {
	this.bytelength = 1;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readInt8(this.offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeInt8(obj, this.offset);
	};
};
iecstruct._SINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.SINT = new iecstruct._SINT();

iecstruct._USINT = function() {
	this.bytelength = 1;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readUInt8(offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeUInt8(obj, this.offset);
	};
};
iecstruct._USINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.BYTE = iecstruct.USINT = new iecstruct._USINT();

iecstruct._INT = function() {
	this.bytelength = 2;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readInt16LE(this.offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeInt16LE(obj, this.offset);
	};
};
iecstruct._INT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.INT = new iecstruct._INT();

iecstruct._UINT = function() {
	this.bytelength = 2;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readUInt16LE(this.offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeUInt16LE(obj, this.offset);
	};
};
iecstruct._UINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.WORD = iecstruct.UINT = new iecstruct._UINT();

iecstruct._DINT = function() {
	this.bytelength = 4;
	this.asObject = function (buffer) {
		this._asObject(arguments);
		return this.buffer.readInt32LE(this.offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeInt32LE(obj, this.offset);
	};
};
iecstruct._DINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.DINT = new iecstruct._DINT();

iecstruct._UDINT = function() {
	this.bytelength = 4;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readUInt32LE(this.offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeUInt32LE(obj, this.offset);
	};
};
iecstruct._UDINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.DATE_AND_TIME = iecstruct.DT = iecstruct.DATE = iecstruct.DWORD = iecstruct.UDINT = new iecstruct._UDINT();

iecstruct._REAL = function() {
	this.bytelength = 4;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readFloatLE(this.offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeFloatLE(obj, this.offset);
	};
};
iecstruct._REAL.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.REAL = new iecstruct._REAL();

iecstruct._TIME = function () {
	this.bytelength = 4;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readUInt32LE(this.offset) / 1000;
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeUInt32LE(obj * 1000, this.offset);
	};
};
iecstruct._TIME.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.TOD = iecstruct.TIME_OF_DAY = iecstruct.TIME = new iecstruct._TIME();

iecstruct._LINT = function() {
	this.bytelength = 8;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readInt64LE(this.offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeInt64LE(obj, this.offset);
	};
};
iecstruct._LINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.LINT = new iecstruct._LINT();

iecstruct._ULINT = function() {
	this.bytelength = 8;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readUInt64LE(this.offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeUInt64LE(obj, this.offset);
	};
};
iecstruct._ULINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.LWORD = iecstruct.ULINT = new iecstruct._ULINT();

iecstruct._LREAL = function() {
	this.bytelength = 8;
	this.asObject = function () {
		this._asObject(arguments);
		return this.buffer.readDoubleLE(this.offset);
	};
	this.fromObject = function (obj) {
		this._fromObject(arguments);
		this.buffer.writeDoubleLE(obj, this.offset);
	};
};
iecstruct._LREAL.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.LREAL = new iecstruct._LREAL();

iecstruct.prototype.addElement = function (name, type) {
	var element = {
		name: name,
		type: type
	};
	element.bytelength = type.bytelength;
	this.elements.push(element);
	this.elementNames.push(name);
	this.bytelength += element.bytelength;
	return this;
};

iecstruct.prototype.addArray = function (name, type, length) {
	var element = {
		name: name,
		type: new iecstruct.ARRAY(type, length),
	};
	element.bytelength = element.type.bytelength;
	this.elements.push(element);
	this.elementNames.push(name);
	this.bytelength += element.type.bytelength;
	return this;
};

iecstruct.prototype.asObject = function () {
	this._asObject(arguments);
	var output = {};
	for (var i = 0; i < this.elementNames.length; ++i) {
		output[this.elementNames[i]] = this.elements[i].type.asObject(this.buffer, this.offset);
		this.offset += this.elements[i].bytelength;
	}
	return output;
};
iecstruct.prototype.fromObject = function (obj) {
	this._fromObject(arguments);
	for (var i = 0; i < this.elementNames.length; ++i) {
		this.elements[i].type.fromObject(obj[this.elementNames[i]], this.buffer, this.offset);
		this.offset += this.elements[i].bytelength;
	}
};
iecstruct.prototype.__proto__ = iecstruct._VARIABLE.prototype;

module.exports = exports = iecstruct;
