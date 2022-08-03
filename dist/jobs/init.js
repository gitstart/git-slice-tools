"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
var simple_git_1 = __importDefault(require("simple-git"));
var common_1 = require("../common");
var init = function (actionInputs) { return __awaiter(void 0, void 0, void 0, function () {
    var sliceGit, upstreamGit, sliceRemote, upstreamRemote;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!actionInputs.forceInit) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, common_1.gitInit)('Slice', actionInputs.sliceRepo)];
            case 1:
                sliceGit = _a.sent();
                return [4 /*yield*/, (0, common_1.gitInit)('Upstream', actionInputs.upstreamRepo, actionInputs.isOpenSourceFlow ? actionInputs.openSourceUrl : undefined)];
            case 2:
                upstreamGit = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                sliceGit = (0, simple_git_1.default)(actionInputs.sliceRepo.dir, { binary: 'git' });
                upstreamGit = (0, simple_git_1.default)(actionInputs.upstreamRepo.dir, { binary: 'git' });
                _a.label = 4;
            case 4:
                (0, common_1.logWriteLine)('Slice', 'Fetching...');
                return [4 /*yield*/, sliceGit.fetch('origin', ['-p'])];
            case 5:
                _a.sent();
                (0, common_1.logExtendLastLine)('Done!');
                return [4 /*yield*/, sliceGit.remote(['-v'])];
            case 6:
                sliceRemote = _a.sent();
                (0, common_1.logWriteLine)('Slice', "Repo:\n" + sliceRemote);
                // const sliceUser = await sliceGit.getConfig('user.name')
                // terminal(`Slice: User: ${sliceUser.value}\n`)
                (0, common_1.logWriteLine)('Upstream', 'Feching...');
                return [4 /*yield*/, upstreamGit.fetch('origin', ['-p'])];
            case 7:
                _a.sent();
                (0, common_1.logExtendLastLine)('Done!');
                if (!actionInputs.isOpenSourceFlow) return [3 /*break*/, 9];
                (0, common_1.logWriteLine)('OpenSource', 'Feching...');
                return [4 /*yield*/, upstreamGit.fetch(common_1.OPEN_SOURCE_REMOTE, ['-p'])];
            case 8:
                _a.sent();
                (0, common_1.logExtendLastLine)('Done!');
                _a.label = 9;
            case 9: return [4 /*yield*/, upstreamGit.remote(['-v'])];
            case 10:
                upstreamRemote = _a.sent();
                (0, common_1.logWriteLine)('Upstream', "Repo:\n" + upstreamRemote);
                // const upstreamUser = await upstreamGit.getConfig('user.name')
                // terminal(`Upstream: User: ${upstreamUser.value}\n`)
                return [2 /*return*/, {
                        sliceGit: sliceGit,
                        upstreamGit: upstreamGit,
                    }];
        }
    });
}); };
exports.init = init;
//# sourceMappingURL=init.js.map