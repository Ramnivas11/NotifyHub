const healthService = require("../services/health.service");

const healthCheck = (req, res) => {
    const response = healthService.getHealth();

    return res.status(200).json(response);
};

module.exports = {
    healthCheck,
};