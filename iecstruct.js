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

function iecstruct() {}
iecstruct._VARIABLE = {
	prototype: {
		asObject: function (buffer, offset) {
			this.offset = arguments.length > 1 && typeof(arguments[1]) != 'undefined' ? arguments[1] : 0;
			if (arguments.length == 0) {
				if (typeof(this.buffer) == 'undefined') {
					this.buffer = new Buffer(this.bytelength);
					this.buffer.fill('\0');
				}
			} else {
				this.buffer = arguments[0];
			}
			return this._asObject();
		},
		fromObject: function (obj, buffer, offset) {
			this.offset = arguments.length > 2 && typeof(arguments[2]) != 'undefined' ? arguments[2] : 0;
			if (arguments.length <= 1) {
				if (typeof(this.buffer) == 'undefined') {
					this.buffer = new Buffer(this.bytelength);
					this.buffer.fill('\0');
				}
			} else {
				this.buffer = arguments[1];
			}
			this._fromObject(obj);
		}
	}
};

iecstruct.STRUCT = function () {
	this.elements = [];
	this.elementNames = [];
	this.bytelength = 0;

	this._asObject = function () {
		var output = {};
		for (var i = 0; i < this.elementNames.length; ++i) {
			output[this.elementNames[i]] = this.elements[i].type.asObject(this.buffer, this.offset);
			this.offset += this.elements[i].bytelength;
		}
		return output;
	};
	this._fromObject = function (obj) {
		for (var i = 0; i < this.elementNames.length; ++i) {
			this.elements[i].type.fromObject(obj[this.elementNames[i]], this.buffer, this.offset);
			this.offset += this.elements[i].bytelength;
		}
	};
}
iecstruct.STRUCT.prototype.addElement = function (name, type) {
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

iecstruct.STRUCT.prototype.addArray = function (name, type, length) {
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
iecstruct.STRUCT.prototype.__proto__ = iecstruct._VARIABLE.prototype;

iecstruct.ARRAY = function (type, length) {
	this.bytelength = length * type.bytelength;
	this._asObject = function () {
		var obj=[];
		for (var i = 0; i < length; ++i) {
			obj.push(type.asObject(this.buffer, this.offset));
			this.offset += type.bytelength;
		}
		return obj;
	};
	this._fromObject = function (obj) {
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
	this._asObject = function () {
		var str = this.buffer.toString('utf8', this.offset, this.offset + this.bytelength);
		return str.replace(/\0.*/,'');
	};
	this._fromObject = function (obj) {
		obj = obj+""; /* ensure string */
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
	this._asObject = function () {
		var str = this.buffer.toString('utf16le', this.offset, this.offset + this.bytelength);
		return str.replace(/\0.*/,'');
	};
	this._fromObject = function (obj) {
		this.buffer.write(obj, this.offset, this.bytelength, 'utf16le');
		if (this.bytelength - obj.length > 0) {
			this.buffer.fill('\0', this.offset + (obj.length * 2), this.offset + (this.bytelength - (obj.length * 2)));
		}
	};
};
iecstruct.WSTRING.prototype.__proto__ = iecstruct._VARIABLE.prototype;

iecstruct.ENUM = function () {
	this.enumlist={};
	this.lastval = -1;
	this.bytelength = 2;
	var enumlist = arguments.length > 0 ? arguments[0] : undefined;

	if (typeof enumlist != 'undefined' && typeof enumlist != 'object') {
		throw new Error("If specified, the first parameter must be a object of key value pairs containing name and numbers");
		return;
	}

	this.addValue = function (name) {
		var value = arguments.length > 1 ? arguments[1] : '';
		if (!(value+'').match(/^\d+$/)) {
			this.enumlist[name] = ++this.lastval;
		} else {
			this.enumlist[name] = value;
			this.lastval = value;
		}
		return this;
	};
	this._asObject = function () {
		var value = this.buffer.readUInt16LE(this.offset);
		for (var key in this.enumlist) {
			if (this.enumlist[key] === value) {
				return key;
			}
		}
		return value;
	};
	this._fromObject = function (obj) {
		var value;
		if (typeof(obj) == 'undefined') {
			obj = 0;
		}
		if (obj in this.enumlist) {
			value = this.enumlist[obj];
		} else if (!(obj+"").match(/^\d+$/)) {
			throw new Error("Invalid enum value: '" + obj + "' not in ENUM(" + Object.keys(this.enumlist).join(",") + ").");
		} else {
			value = obj;
		}
		this.buffer.writeUInt16LE(value, this.offset);
	};

	if (typeof enumlist == 'object') {
		for (var key in enumlist) {
			this.addValue(key, enumlist[key]);
		}
	}
};
iecstruct.ENUM.prototype.__proto__ = iecstruct._VARIABLE.prototype;

iecstruct._BOOL = function() {
	this.bytelength = 1;
	this._asObject = function () {
		return this.buffer.readUInt8(this.offset) != 0 ? true : false;
	};
	this._fromObject = function (obj) {
		this.buffer.writeUInt8(obj ? 1 : 0, this.offset);
	};
};
iecstruct._BOOL.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.BOOL = new iecstruct._BOOL();

iecstruct._SINT = function() {
	this.bytelength = 1;
	this._asObject = function () {
		return this.buffer.readInt8(this.offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeInt8(obj, this.offset);
	};
};
iecstruct._SINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.SINT = new iecstruct._SINT();

iecstruct._USINT = function() {
	this.bytelength = 1;
	this._asObject = function () {
		return this.buffer.readUInt8(offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeUInt8(obj, this.offset);
	};
};
iecstruct._USINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.BYTE = iecstruct.USINT = new iecstruct._USINT();

iecstruct._INT = function() {
	this.bytelength = 2;
	this._asObject = function () {
		return this.buffer.readInt16LE(this.offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeInt16LE(obj, this.offset);
	};
};
iecstruct._INT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.INT = new iecstruct._INT();

iecstruct._UINT = function() {
	this.bytelength = 2;
	this._asObject = function () {
		return this.buffer.readUInt16LE(this.offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeUInt16LE(obj, this.offset);
	};
};
iecstruct._UINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.WORD = iecstruct.UINT = new iecstruct._UINT();

iecstruct._DINT = function() {
	this.bytelength = 4;
	this._asObject = function (buffer) {
		return this.buffer.readInt32LE(this.offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeInt32LE(obj, this.offset);
	};
};
iecstruct._DINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.DINT = new iecstruct._DINT();

iecstruct._UDINT = function() {
	this.bytelength = 4;
	this._asObject = function () {
		return this.buffer.readUInt32LE(this.offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeUInt32LE(obj, this.offset);
	};
};
iecstruct._UDINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.DATE_AND_TIME = iecstruct.DT = iecstruct.DATE = iecstruct.DWORD = iecstruct.UDINT = new iecstruct._UDINT();

iecstruct._REAL = function() {
	this.bytelength = 4;
	this._asObject = function () {
		return this.buffer.readFloatLE(this.offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeFloatLE(obj, this.offset);
	};
};
iecstruct._REAL.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.REAL = new iecstruct._REAL();

iecstruct._TIME = function () {
	this.bytelength = 4;
	this._asObject = function () {
		return this.buffer.readUInt32LE(this.offset) / 1000;
	};
	this._fromObject = function (obj) {
		this.buffer.writeUInt32LE(obj * 1000, this.offset);
	};
};
iecstruct._TIME.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.TOD = iecstruct.TIME_OF_DAY = iecstruct.TIME = new iecstruct._TIME();

iecstruct._LINT = function() {
	this.bytelength = 8;
	this._asObject = function () {
		return this.buffer.readInt64LE(this.offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeInt64LE(obj, this.offset);
	};
};
iecstruct._LINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.LINT = new iecstruct._LINT();

iecstruct._ULINT = function() {
	this.bytelength = 8;
	this._asObject = function () {
		return this.buffer.readUInt64LE(this.offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeUInt64LE(obj, this.offset);
	};
};
iecstruct._ULINT.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.LWORD = iecstruct.ULINT = new iecstruct._ULINT();

iecstruct._LREAL = function() {
	this.bytelength = 8;
	this._asObject = function () {
		return this.buffer.readDoubleLE(this.offset);
	};
	this._fromObject = function (obj) {
		this.buffer.writeDoubleLE(obj, this.offset);
	};
};
iecstruct._LREAL.prototype.__proto__ = iecstruct._VARIABLE.prototype;
iecstruct.LREAL = new iecstruct._LREAL();

module.exports = exports = iecstruct;
