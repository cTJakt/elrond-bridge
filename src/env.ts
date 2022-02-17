// Load env

// eslint-disable-next-line node/no-extraneous-require
require('dotenv').config();

export const elrondPoolSeeds = process.env.ELROND_POOL_SEEDS as string;
