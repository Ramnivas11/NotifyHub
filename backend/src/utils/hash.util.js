const crypto = require("crypto")

function generateRequestHash(Data) {
    return crypto.createHash("sha256")
        .update(JSON.stringify(Data))
        .digest("hex");
}

module.exports = {
    generateRequestHash,
}