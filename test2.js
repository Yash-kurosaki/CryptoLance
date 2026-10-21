const path = require('path');
console.log("starting");
try {
  const express = require(path.resolve('./backend/node_modules/express'));
  console.log("express loaded");
} catch (e) { console.log(e); }
try {
  const solana = require(path.resolve('./backend/node_modules/@solana/web3.js'));
  console.log("solana loaded");
} catch (e) { console.log(e); }
try {
  const prisma = require('./backend/src/lib/prisma');
  console.log("prisma loaded");
} catch (e) { console.log(e); }
