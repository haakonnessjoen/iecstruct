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

iecstruct.STRING = function (length) {
	if (typeof(length) == 'undefined') {
		length = 80;
	}
	/* Null terminator */
	length++;
	this.bytelength = length;
	this.asObject = function (buffer, offset) {
		var str = buffer.toString('utf8', offset, offset + this.bytelength);
		return str.replace(/\0.*/,'');
	};
	this.fromObject = function (obj, buffer, offset) {
		buffer.write(obj, offset, this.bytelength, 'utf8');
		if (this.bytelength - obj.length > 0) {
			buffer.fill('\0', offset + obj.length, offset + (this.bytelength - obj.length));
		}
	};
};

/* untested */
iecstruct.WSTRING = function (length) {
	this.bytelength = length * 2;
	this.asObject = function (buffer, offset) {
		var str = buffer.toString('utf16le', offset, offset + this.bytelength);
		return str.replace(/\0.*/,'');
	};
	this.fromObject = function (obj, buffer, offset) {
		buffer.write(obj, offset, this.bytelength, 'utf16le');
		if (this.bytelength - obj.length > 0) {
			buffer.fill('\0', offset + (obj.length * 2), offset + (this.bytelength - (obj.length * 2)));
		}
	};
};

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
	this.asObject = function (buffer, offset) {
		var value = buffer.readUInt16LE(offset);
		for (var key in enumlist) {
			if (enumlist[key] === value) {
				return key;
			}
		}
		return value;
	};
	this.fromObject = function (obj, buffer, offset) {
		var value;
		if (obj in enumlist) {
			value = enumlist[obj];
		} else if (!(obj+"").match(/^\d+$/)) {
			throw new Error("Invalid enum value");
		} else {
			value = obj;
		}
		buffer.writeUInt16LE(value, offset);
	};
};

iecstruct.BOOL = new function() {
	this.bytelength = 1;
	this.asObject = function (buffer, offset) {
		return buffer.readUInt8(offset) != 0 ? true : false;
	};
	this.fromObject = function (obj, buffer, offset) {
		buffer.writeUInt8(obj ? 1 : 0, offset);
	};
};

iecstruct.SINT = new function() {
	this.bytelength = 1;
	this.asObject = function (buffer, offset) {
		return buffer.readInt8(offset);
	};
	this.fromObject = function (obj, buffer, offset) {
		buffer.writeInt8(obj, offset);
	};
};

iecstruct.USINT = new function() {
	this.bytelength = 1;
	this.asObject = function (buffer, offset) {
		return buffer.readUInt8(offset);
	};
	this.fromObject = function (obj, buffer, offset) {
		buffer.writeUInt8(obj, offset);
	};
};
iecstruct.BYTE = iecstruct.USINT;

iecstruct.INT = new function() {
	this.bytelength = 2;
	this.asObject = function (buffer, offset) {
		return buffer.readInt16LE(offset);
	};
	this.fromObject = function (obj, buffer, offset) {
		buffer.writeInt16LE(obj, offset);
	};
};

iecstruct.UINT = new function() {
	this.bytelength = 2;
	this.asObject = function (buffer, offset) {
		return buffer.readUInt16LE(offset);
	};
	this.fromObject = function (obj, buffer, offset) {
		buffer.writeUInt16LE(obj, offset);
	};
};
iecstruct.WORD = iecstruct.UINT;

iecstruct.DINT = new function() {
        this.bytelength = 4;
        this.asObject = function (buffer, offset) {
                return buffer.readInt32LE(offset);
        };
        this.fromObject = function (obj, buffer, offset) {
                buffer.writeInt32LE(obj, offset);
        };
};

iecstruct.UDINT = new function() {
        this.bytelength = 4;
        this.asObject = function (buffer, offset) {
                return buffer.readUInt32LE(offset);
        };
        this.fromObject = function (obj, buffer, offset) {
                buffer.writeUInt32LE(obj, offset);
        };
};
iecstruct.DATE_AND_TIME = iecstruct.DT = iecstruct.DATE = iecstruct.DWORD = iecstruct.UDINT;

iecstruct.REAL = new function() {
	this.bytelength = 4;
        this.asObject = function (buffer, offset) {
                return buffer.readFloatLE(offset);
        };
        this.fromObject = function (obj, buffer, offset) {
                buffer.writeFloatLE(obj, offset);
        };
};

iecstruct.TIME = new function () {
	this.bytelength = 4;
	this.asObject = function (buffer, offset) {
		return buffer.readUInt32LE(offset) / 1000;
	};
	this.fromObject = function (obj, buffer, offset) {
		buffer.writeUInt32LE(obj * 1000, offset);
	};
};
iecstruct.TOD = iecstruct.TIME_OF_DAY = iecstruct.TIME;

iecstruct.LINT = new function() {
        this.bytelength = 8;
        this.asObject = function (buffer, offset) {
                return buffer.readInt64LE(offset);
        };
        this.fromObject = function (obj, buffer, offset) {
                buffer.writeInt64LE(obj, offset);
        };
};

iecstruct.ULINT = new function() {
        this.bytelength = 8;
        this.asObject = function (buffer, offset) {
                return buffer.readUInt64LE(offset);
        };
        this.fromObject = function (obj, buffer, offset) {
                buffer.writeUInt64LE(obj, offset);
        };
};
iecstruct.LWORD = iecstruct.ULINT;

iecstruct.LREAL = new function() {
	this.bytelength = 8;
        this.asObject = function (buffer, offset) {
                return buffer.readDoubleLE(offset);
        };
        this.fromObject = function (obj, buffer, offset) {
                buffer.writeDoubleLE(obj, offset);
        };
};

iecstruct.prototype.addElement = function (name, type) {
	var element = {
		single: true,
		name: name,
		type: type
	};
	if (typeof type == 'object') {
		element.bytelength = type.bytelength;
	}
	this.elements.push(element);
	this.elementNames.push(name);
	this.bytelength += element.bytelength;
	return this;
};

iecstruct.prototype.addArray = function (name, type, length) {
	var element = {
		single: false,
		name: name,
		type: type,
		length: length
	};
	if (typeof type == 'object') {
		element.bytelength = type.bytelength * length;
	}
	this.elements.push(element);
	this.elementNames.push(name);
	this.bytelength += element.bytelength;
	return this;
};

iecstruct.prototype.asObject = function (buffer, offset) {
	var output = {};
	for (var i = 0; i < this.elementNames.length; ++i) {
		if (this.elements[i].single) {
			output[this.elementNames[i]] = this.elements[i].type.asObject(buffer, offset);
			offset += this.elements[i].bytelength;
		} else {
			var newArr = [];
			for (var ii = 0; ii < this.elements[i].length; ++ii) {
				newArr.push(this.elements[i].type.asObject(buffer, offset));
				offset += this.elements[i].type.bytelength;
			}
			output[this.elementNames[i]] = newArr;
		}
	}
	return output;
};
iecstruct.prototype.fromObject = function (obj, buffer, offset) {
	for (var i = 0; i < this.elementNames.length; ++i) {
		if (this.elements[i].single) {
			this.elements[i].type.fromObject(obj[this.elementNames[i]], buffer, offset);
			offset += this.elements[i].bytelength;
		} else {
			for (var ii = 0; ii < this.elements[i].length; ++ii) {
				this.elements[i].type.fromObject(obj[this.elementNames[i]][ii], buffer, offset);
				offset += this.elements[i].type.bytelength;
			}
		}
	}
};

module.exports = exports = iecstruct;
