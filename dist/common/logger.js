"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInputs = exports.logExtendLastLine = exports.logWriteLine = void 0;
var terminal_kit_1 = require("terminal-kit");
var lastLogLine = '';
var lastLogTime = new Date();
var logWriteLine = function (scope, content) {
    lastLogTime = new Date();
    lastLogLine = "[" + lastLogTime.toISOString() + "] " + scope + ": " + content.trim();
    (0, terminal_kit_1.terminal)(lastLogLine + "\n");
};
exports.logWriteLine = logWriteLine;
var logExtendLastLine = function (content) {
    var duration = (new Date().getTime() - lastLogTime.getTime()) / 1000;
    terminal_kit_1.terminal.up(1)("" + lastLogLine + content.trim() + " (" + duration.toFixed(3) + "s)\n");
};
exports.logExtendLastLine = logExtendLastLine;
var logInputs = function (jobName, ipnuts) {
    if (ipnuts === void 0) { ipnuts = {}; }
    (0, terminal_kit_1.terminal)('-'.repeat(30) + '\n');
    (0, terminal_kit_1.terminal)("Performing '" + jobName + "' job with " + JSON.stringify(ipnuts) + "...\n");
};
exports.logInputs = logInputs;
//# sourceMappingURL=logger.js.map