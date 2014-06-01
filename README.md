iecstruct
=========

A NodeJS library for parsing and saving IEC 61131-3 structs and types from/to binary buffers.

Support for types
-----------------

All variable types are supported, look in table below for syntax.

Variable type | ST Syntax | iecstruct syntax
--- | --- | ---
ARRAY | ARRAY[1..25] OF VARIABLETYPE | new iecstruct.ARRAY(VARIABLETYPE, 25)
STRUCT | TYPE name : STRUCT .. END STRUCT | new iecstruct.STRUCT()
STRING | STRING[20] | new iecstruct.STRING(20)
WSTRING | WSTRING[20] | new iecstruct.WSTRING(20)
ENUM | **see note 1** | **see note 1**
BOOL | BOOL | iecstruct.BOOL
BYTE | BYTE | iecstruct.BYTE
WORD | WORD | iecstruct.WORD
DWORD | DWORD | iecstruct.DWORD
SINT | SINT | iecstruct.SINT
USINT | USINT | iecstruct.USINT
INT | INT | iecstruct.INT
UINT | UINT | iecstruct.UINT
DINT | DINT | iecstruct.DINT
UDINT | UDINT | iecstruct.UDINT
LINT | LINT | iecstruct.LINT
ULINT | ULINT | iecstruct.ULINT
REAL | REAL | iecstruct.REAL
LREAL | LREAL | iecstruct.LREAL
TIME | TIME | iecstruct.TIME
TIME_OF_DAY (TOD) | TOD | iecstruct.TOD
DATE | DATE | iecstruct.DATE
DATE_AND_TIME (DT) | DT | iecstruct.DT

All variable types, also included the types you "create" by making structs or arrays, have the same two methods, and a parameter:
  * asObject([buffer],[offset])
  * fromObject(object, [buffer], [offset])
  * bytelength


### asObject[buffer],[offset])

Returns a javascript object containting a javascript version of the data contained in buffer.

### fromObject(object, [buffer], [offset])

Writes the object back to the buffer, according to the variable type you are using. Se examples below.

### bytelength

Holds the number of actual bytes the specified variable/struct would need to read/write to a buffer.

**Note 1**: Heres an example of a ENUM in structured text, and then with iecstruct:

```
TYPE E_TRAFFIC_SIGNAL:
	(
		Red,
		Yellow:=10,
		Green
	);
END_TYPE
```

```javascript
var E_TRAFFIC_SIGNAL = new iecstruct.ENUM({
	Red: '',
	Yellow: 10,
	Green: ''
});

/* OR */

var E_TRAFFIC_SIGNAL = new iecstruct.ENUM()
	.addValue('Red')
	.addValue('Yellow', 10)
	.addValue('Green');

```
Enum variables will return string names for the known enum values, and plain digits if an invalid ENUM value is set/read.

Examples
--------

### Struct with structs and arrrays

```javascript
var iecstruct = require('iecstruct');

var E_TriggerFunction = new iecstruct.ENUM({
	TRG_RE: '',
	TRG_FE: '',
	TRG_HOLD: ''
});


var ST_ScenarioTrigger = new iecstruct.STRUCT()
	.addElement('eTriggerFunction', E_TriggerFunction)
	.addElement('nElementNo', iecstruct.UINT);

var ST_Scenario = new iecstruct.STRUCT()
	.addElement('sName', new iecstruct.STRING(256))
	.addElement('bScenarioEnabled', iecstruct.BOOL)
	.addElement('bScenarioInUse', iecstruct.BOOL)
	.addArray  ('Triggers', ST_ScenarioTrigger, 100);

var Scenarios = new iecstruct.ARRAY('ST_Scenario', 100);

var obj = Scenarios.asObject();
obj[0].sName = "First scenario";

console.log(obj);

// Back to buffer:
Scenarios.fromObject(obj);

/* Buffer can be specified: */
var buffer = new Buffer(Scenarios.bytelength);
/* .. put code to insert data into buffer here */
var obj = Scenarios.asObject(buffer);
/* You can also write to a buffer */
Scenarios.fromObject(obj, buffer);


```

### Reading/Writing arrays directly

```javascript
var iecstruct = require('iecstruct');

/* MyArray : ARRAY[1..10] OF BOOL; */
var MyArray = new iecstruct.ARRAY(iecstruct.BOOL, 10);
var obj = MyArray.asObject(my_iec_buffer);

/* StructArray : ARRAY[1..25] OF ST_Simple; */
var ST_Simple = new iecstruct.STRUCT()
	.addElement('bActive', iecstruct.BOOL)
	.addElement('nNumber', iecstruct.UINT);
var StructArray = new iecstruct.ARRAY(ST_Simple, 25);
var obj = StructArray.asObject(my_iec_buffer);
```

### Dual syntax for arrays
```javascript

var ST_Scenario = new iecstruct.STRUCT()
	.addElement('sName', new iecstruct.STRING(256))
	.addElement('bScenarioEnabled', iecstruct.BOOL)
	.addElement('bScenarioInUse', iecstruct.BOOL)
	.addArray  ('Triggers', ST_ScenarioTrigger, 100);

/* Is the same as */

var ST_Scenario = new iecstruct.STRUCT()
	.addElement('sName', new iecstruct.STRING(256))
	.addElement('bScenarioEnabled', iecstruct.BOOL)
	.addElement('bScenarioInUse', iecstruct.BOOL)
	.addElement('Triggers', new iecstruct.ARRAY(ST_ScenarioTrigger, 100));

```

License (MIT)
-------------
Copyright (c) 2014 Håkon Nessjøen <haakon.nessjoen@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
