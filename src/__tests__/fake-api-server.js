"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var app = (0, express_1.default)();
var port = 3051;
app.get('*', function (req, res) {
    res.json({ test: 'test' });
});
app.listen(port, function () {
    // eslint-disable-next-line no-console
    console.log("Fake server listening on port ".concat(port));
});
