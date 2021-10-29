"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadValidateActionInputs = void 0;
var dotenv_1 = __importDefault(require("dotenv"));
var fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
var loadValidateActionInputs = function () {
    if (!process.env.GIT_SLICE_UPSTREAM_REPO_DIR || !fs_1.default.existsSync(process.env.GIT_SLICE_UPSTREAM_REPO_DIR)) {
        throw new Error("Missing 'UPSTREAM_REPO_DIR' or 'UPSTREAM_REPO_DIR' doesn't exist ");
    }
    if (!process.env.GIT_SLICE_SLICE_REPO_DIR || !fs_1.default.existsSync(process.env.GIT_SLICE_SLICE_REPO_DIR)) {
        throw new Error("Missing 'SLICE_REPO_DIR' or 'SLICE_REPO_DIR' doesn't exist ");
    }
    if (!process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH) {
        throw new Error("Missing 'GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH'");
    }
    if (!process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH) {
        throw new Error("Missing 'GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH'");
    }
    var sliceIgnores = ['.github/workflows/*', 'git-slice.json'];
    if (process.env.GIT_SLICE_SLICE_IGNORES) {
        try {
            var parsedSliceIgnores = JSON.parse(process.env.GIT_SLICE_SLICE_IGNORES);
            if (!Array.isArray(parsedSliceIgnores)) {
                throw new Error();
            }
            sliceIgnores.push.apply(sliceIgnores, parsedSliceIgnores);
        }
        catch (error) {
            throw new Error("Parsing 'GIT_SLICE_SLICE_IGNORES' failed");
        }
    }
    return {
        upstreamRepoDir: process.env.GIT_SLICE_UPSTREAM_REPO_DIR,
        upstreamDefaultBranch: process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH,
        sliceRepoDir: process.env.GIT_SLICE_SLICE_REPO_DIR,
        sliceDefaultBranch: process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH,
        sliceIgnores: sliceIgnores,
    };
};
exports.loadValidateActionInputs = loadValidateActionInputs;
