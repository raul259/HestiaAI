// Node.js v24 en Windows: fs.readlink devuelve EISDIR en ficheros normales.
// Webpack y @vercel/nft esperan EINVAL. Parcheamos callback y promises.
const fs = require("fs");

function makeEinval(p) {
  return Object.assign(
    new Error(`EINVAL: invalid argument, readlink '${p}'`),
    { code: "EINVAL", syscall: "readlink", path: p }
  );
}

// --- callback ---
const _rl = fs.readlink.bind(fs);
fs.readlink = (p, opts, cb) => {
  if (typeof opts === "function") { cb = opts; opts = {}; }
  _rl(p, opts, (err, link) => {
    cb(err && err.code === "EISDIR" ? makeEinval(p) : err, link);
  });
};

// --- sync ---
const _rlSync = fs.readlinkSync.bind(fs);
fs.readlinkSync = (p, opts) => {
  try { return _rlSync(p, opts); }
  catch (err) {
    if (err && err.code === "EISDIR") throw makeEinval(p);
    throw err;
  }
};

// --- promises ---
const _rlPromise = fs.promises.readlink.bind(fs.promises);
fs.promises.readlink = async (p, opts) => {
  try { return await _rlPromise(p, opts); }
  catch (err) {
    if (err && err.code === "EISDIR") throw makeEinval(p);
    throw err;
  }
};
