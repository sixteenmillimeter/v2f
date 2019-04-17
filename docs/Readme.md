## Functions

<dl>
<dt><a href="#initialize">initialize(Commander)</a></dt>
<dd></dd>
<dt><a href="#convert">convert(input, dpi, length)</a></dt>
<dd><p>Create image sequence from source video, using</p>
</dd>
<dt><a href="#stitch">stitch(output, dim, next, pageW, pageL)</a></dt>
<dd><p>Stitch rendered frames into strips</p>
</dd>
</dl>

<a name="initialize"></a>

## initialize(Commander)
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| Commander | <code>Object</code> | object |

<a name="convert"></a>

## convert(input, dpi, length)
Create image sequence from source video, using

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>String</code> | file path (absolute) |
| dpi | <code>Integer</code> | target printing dpi |
| length | <code>Integer</code> | strip length in frames |

<a name="stitch"></a>

## stitch(output, dim, next, pageW, pageL)
Stitch rendered frames into strips

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| output | <code>String</code> | Path of folder containing frames |
| dim | <code>Object</code> | Dimensions object |
| next | <code>function</code> | Async lib callback function |
| pageW | <code>Integer</code> | Page width in inches |
| pageL | <code>Integer</code> | Page length in inches |

