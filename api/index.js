const { requestHandler } = require('../server/index.cjs');

module.exports = async (req, res) => requestHandler(req, res);
