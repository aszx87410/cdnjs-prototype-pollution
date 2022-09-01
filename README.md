# Who pollutes your prototype?

(I wrote a blog post for this, [English](https://blog.huli.tw/2022/09/01/en/angularjs-csp-bypass-cdnjs/), [中文](https://blog.huli.tw/2022/09/01/angularjs-csp-bypass-cdnjs/))

One day, I was searching for a way to bypass Angular sandbox, and I found this interesting post: [H5SC Minichallenge 3: "Sh*t, it's CSP!"](https://github.com/cure53/XSSChallengeWiki/wiki/H5SC-Minichallenge-3:-%22Sh*t,-it's-CSP!%22#191-bytes)

One of the solutions caught my eye, it uses Angular combining Prototype.js to bypass the sandbox, like this:

```  html
{{ $on.curry.call().alert(1337) }}
```

Typically, you can not access `window` or `document` in the expression. The reason why above work is because Prototype.js adds a new function called `curry` to `Function.prototype`, here is the [source code](https://github.com/prototypejs/prototype/blob/master/src/prototype/lang/function.js#L226):

``` js
function curry() {
  if (!arguments.length) return this;
  var __method = this, args = slice.call(arguments, 0);
  return function() {
    var a = merge(args, arguments);
    return __method.apply(this, a);
  }
}
```

When we call a function via `.call` or `.apply` without any arguments, `this` will be the global object which is `window` by default in non-strict mode. So, `$on.curry.call()` returns `window`.

After seeing this bypass, I wondered, "Are there any other libraries that have the same behavior?", so I started my research.

## Methodology

There are four steps:

1. Find all libraries hosted on cdn.js
2. Retrieve all data, including the files of the library, via cdn.js API
3. Run a headless browser to automatically detect if the library "pollutes" the  prototype by adding a new function to it.
4. Find the exact file which pollutes the prototype because one library can have multiple files.

Timewise, I only check the latest version of every library.

## Result

There are 4290 libraries on cdn.js at the time of writing, and 74 of them add new functions directly to the prototype(which is not recommended because it pollutes the prototype):

(You can find the detail here: [pollutes.json](https://github.com/aszx87410/cdnjs-prototype-pollution/blob/main/data/pollutes.json))

1. 6to5@3.6.5
2. Colors.js@1.2.4
3. Embetty@3.0.8
4. NicEdit@0.93
5. RGraph@606
6. ScrollTrigger@1.0.5
7. TableExport@5.2.0
8. ajv-async@1.0.1
9. angular-vertxbus@6.4.1
10. asciidoctor.js@1.5.9
11. aurelia-script@1.5.2
12. blendui@0.0.4
13. blissfuljs@1.0.6
14. bootstrap-calendar@0.2.5
15. carto.js@4.2.2
16. cignium-hypermedia-client@1.35.0
17. core-js@3.24.1
18. custombox@4.0.3
19. d3fc@11.0.0
20. d3plus@2.0.1
21. datejs@1.0
22. deb.js@0.0.2
23. defiant.js@2.2.7
24. eddy@0.7.0
25. ext-core@3.1.0
26. extjs@6.2.0
27. fs-tpp-api@2.4.4
28. highcharts@10.2.0
29. inheritance-js@0.4.12
30. jo@0.4.1
31. jquery-ajaxy@1.6.1
32. jquery-ui-bootstrap@0.5pre
33. js-bson@2.0.8
34. jslite@1.1.12
35. json-forms@1.6.3
36. keras-js@0.3.0
37. kwargsjs@1.0.1
38. leaflet.freedraw@2.0.1
39. lobipanel@1.0.6
40. melonjs@1.0.1
41. metro@4.4.3
42. mo@1.7.3
43. monet@0.9.3
44. mootools@1.6.0
45. oidc-client@1.11.5
46. opal@0.3.43
47. prototype@1.7.3
48. qcobjects@2.3.69
49. qoopido.demand@8.0.2
50. qoopido.js@3.7.4
51. qoopido.nucleus@3.2.15
52. quantumui@1.2.0
53. rantjs@1.0.6
54. rita@2.8.1
55. rivescript@2.2.0
56. scriptaculous@1.9.0
57. should.js@13.2.3
58. simple-gallery-js@1.0.3
59. simplecartjs@3.0.5
60. strapdown-topbar@1.6.4
61. string_score@0.1.22
62. survey-angular@1.9.45
63. survey-jquery@1.9.45
64. survey-knockout@1.9.45
65. survey-react@1.9.45
66. survey-vue@1.9.45
67. tablefilter@2.5.0
68. tmlib.js@0.5.2
69. tui-editor@1.4.10
70. typeis@1.1.2
71. uppy@3.0.0
72. vanta@0.5.22
73. waud.js@1.0.3
74. zui@1.10.0

There are 12 libraries that can help you to get `window` by just calling it:

``` json
[
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/asciidoctor.js/1.5.9/asciidoctor.min.js",
    "functions": [
      "Array.prototype.$concat",
      "Array.prototype.$push",
      "Array.prototype.$append",
      "Array.prototype.$rotate!",
      "Array.prototype.$shuffle!",
      "Array.prototype.$sort",
      "Array.prototype.$to_a",
      "Array.prototype.$to_ary",
      "Array.prototype.$unshift",
      "Array.prototype.$prepend",
      "String.prototype.$initialize",
      "String.prototype.$chomp",
      "String.prototype.$force_encoding",
      "Function.prototype.$to_proc"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/jquery-ui-bootstrap/0.5pre/third-party/jQuery-UI-Date-Range-Picker/js/date.js",
    "functions": [
      "Number.prototype.milliseconds",
      "Number.prototype.millisecond",
      "Number.prototype.seconds",
      "Number.prototype.second",
      "Number.prototype.minutes",
      "Number.prototype.minute",
      "Number.prototype.hours",
      "Number.prototype.hour",
      "Number.prototype.days",
      "Number.prototype.day",
      "Number.prototype.weeks",
      "Number.prototype.week",
      "Number.prototype.months",
      "Number.prototype.month",
      "Number.prototype.years",
      "Number.prototype.year"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/ext-core/3.1.0/ext-core.min.js",
    "functions": [
      "Function.prototype.createInterceptor"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/datejs/1.0/date.min.js",
    "functions": [
      "Number.prototype.milliseconds",
      "Number.prototype.millisecond",
      "Number.prototype.seconds",
      "Number.prototype.second",
      "Number.prototype.minutes",
      "Number.prototype.minute",
      "Number.prototype.hours",
      "Number.prototype.hour",
      "Number.prototype.days",
      "Number.prototype.day",
      "Number.prototype.weeks",
      "Number.prototype.week",
      "Number.prototype.months",
      "Number.prototype.month",
      "Number.prototype.years",
      "Number.prototype.year"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/json-forms/1.6.3/js/brutusin-json-forms.min.js",
    "functions": [
      "String.prototype.format"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/inheritance-js/0.4.12/inheritance.min.js",
    "functions": [
      "Object.prototype.mix",
      "Object.prototype.mixDeep"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/melonjs/1.0.1/melonjs.min.js",
    "functions": [
      "Array.prototype.remove"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/mootools/1.6.0/mootools-core-compat.min.js",
    "functions": [
      "Array.prototype.erase",
      "Array.prototype.empty",
      "Function.prototype.extend",
      "Function.prototype.implement",
      "Function.prototype.hide",
      "Function.prototype.protect"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/mootools/1.6.0/mootools-core.min.js",
    "functions": [
      "Array.prototype.erase",
      "Array.prototype.empty",
      "Function.prototype.extend",
      "Function.prototype.implement",
      "Function.prototype.hide",
      "Function.prototype.protect"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/opal/0.3.43/opal.min.js",
    "functions": [
      "Array.prototype.$extend",
      "Array.prototype.$to_proc",
      "Array.prototype.$to_a",
      "Array.prototype.$collect!",
      "Array.prototype.$delete_if",
      "Array.prototype.$each_index",
      "Array.prototype.$fill",
      "Array.prototype.$insert",
      "Array.prototype.$keep_if",
      "Array.prototype.$map!",
      "Array.prototype.$push",
      "Array.prototype.$shuffle",
      "Array.prototype.$to_ary",
      "Array.prototype.$unshift",
      "String.prototype.$as_json",
      "String.prototype.$extend",
      "String.prototype.$intern",
      "String.prototype.$to_sym",
      "Number.prototype.$as_json",
      "Number.prototype.$extend",
      "Number.prototype.$to_proc",
      "Number.prototype.$downto",
      "Number.prototype.$nonzero?",
      "Number.prototype.$ord",
      "Number.prototype.$times",
      "Function.prototype.$include",
      "Function.prototype.$module_function",
      "Function.prototype.$extend",
      "Function.prototype.$to_proc"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/prototype/1.7.3/prototype.min.js",
    "functions": [
      "Array.prototype.clear",
      "Number.prototype.times",
      "Function.prototype.curry"
    ]
  },
  {
    "url": "https://cdnjs.cloudflare.com/ajax/libs/tmlib.js/0.5.2/tmlib.min.js",
    "functions": [
      "Array.prototype.swap",
      "Array.prototype.eraseAll",
      "Array.prototype.eraseIf",
      "Array.prototype.eraseIfAll",
      "Array.prototype.clear",
      "Array.prototype.shuffle",
      "Number.prototype.times",
      "Number.prototype.upto",
      "Number.prototype.downto",
      "Number.prototype.step",
      "Object.prototype.$extend",
      "Object.prototype.$safe",
      "Object.prototype.$strict"
    ]
  }
]
```
## Files

All JSON files are placed under `/data` folder.

* `libs.json` is all the data from the algolia of cdnjs
* `libDetail.json` is all the data from cdnjs API
* `pollutes.json` is all the libraries that pollute the prototype
* `pollutesForWindow.json` is all the files that pollute the prototype and can get window by calling it

## Development

Install dependencies:

``` 
npm i
```

Then, run `getLibs.js` to get all library's name from algolia, it generates `data/libs.json`:

``` js
node getLibs.js
```

Next, run `getLibDetail.js` to get all file paths from cdnjs API, it generates `data/libDetail.json`:

``` js
node getLibDetail.js
```

After getting all the files, we can run `scan.js` to test all libraries and generate `data/pollutes.json` and `data/pollutesForWindow.json`

``` js
node scan.js
```
