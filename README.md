iecstruct
=========

A NodeJS library for parsing and saving IEC 61131-3 structs and types.

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


var ST_ScenarioTrigger = new iecstruct()
	.addElement('eTriggerFunction', E_TriggerFunction)
	.addElement('nElementNo', iecstruct.UINT);

var ST_Scenario = new iecstruct()
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

License (MIT)
-------------
Copyright (c) 2014 Håkon Nessjøen <haakon.nessjoen@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
