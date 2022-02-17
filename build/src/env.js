"use strict";
// Load env
Object.defineProperty(exports, "__esModule", { value: true });
exports.elrondPoolSeeds = void 0;
// eslint-disable-next-line node/no-extraneous-require
require('dotenv').config();
exports.elrondPoolSeeds = process.env.ELROND_POOL_SEEDS;
