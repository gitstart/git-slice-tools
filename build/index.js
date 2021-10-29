"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var terminal_kit_1 = require("terminal-kit");
var config_1 = require("./config");
var jobs_1 = require("./jobs");
var actionInputs = (0, config_1.loadValidateActionInputs)();
(0, jobs_1.init)(actionInputs).then(function (_a) {
    var sliceGit = _a.sliceGit, upstreamGit = _a.upstreamGit;
    (0, terminal_kit_1.terminal)('Initialized git instances\n');
    return (0, jobs_1.pull)(sliceGit, upstreamGit, actionInputs);
});
