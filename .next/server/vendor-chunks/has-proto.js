"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/has-proto";
exports.ids = ["vendor-chunks/has-proto"];
exports.modules = {

/***/ "(action-browser)/./node_modules/has-proto/index.js":
/*!*****************************************!*\
  !*** ./node_modules/has-proto/index.js ***!
  \*****************************************/
/***/ ((module) => {

eval("\n\nvar test = {\n\t__proto__: null,\n\tfoo: {}\n};\n\nvar $Object = Object;\n\n/** @type {import('.')} */\nmodule.exports = function hasProto() {\n\t// @ts-expect-error: TS errors on an inherited property for some reason\n\treturn { __proto__: test }.foo === test.foo\n\t\t&& !(test instanceof $Object);\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFjdGlvbi1icm93c2VyKS8uL25vZGVfbW9kdWxlcy9oYXMtcHJvdG8vaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQWE7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsV0FBVyxhQUFhO0FBQ3hCO0FBQ0E7QUFDQSxVQUFVLGlCQUFpQjtBQUMzQjtBQUNBIiwic291cmNlcyI6WyIvVXNlcnMvYXJ1bmRodW5nYW5hL0Rlc2t0b3Avam9ic3RhY2svbm9kZV9tb2R1bGVzL2hhcy1wcm90by9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciB0ZXN0ID0ge1xuXHRfX3Byb3RvX186IG51bGwsXG5cdGZvbzoge31cbn07XG5cbnZhciAkT2JqZWN0ID0gT2JqZWN0O1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLicpfSAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBoYXNQcm90bygpIHtcblx0Ly8gQHRzLWV4cGVjdC1lcnJvcjogVFMgZXJyb3JzIG9uIGFuIGluaGVyaXRlZCBwcm9wZXJ0eSBmb3Igc29tZSByZWFzb25cblx0cmV0dXJuIHsgX19wcm90b19fOiB0ZXN0IH0uZm9vID09PSB0ZXN0LmZvb1xuXHRcdCYmICEodGVzdCBpbnN0YW5jZW9mICRPYmplY3QpO1xufTtcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(action-browser)/./node_modules/has-proto/index.js\n");

/***/ })

};
;