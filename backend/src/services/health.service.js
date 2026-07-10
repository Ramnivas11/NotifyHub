const getHealth = () => {
    return {
        success: true,
        message: "NotifyHub API is running 🚀",
        timestamp: new Date(),
    };
};

module.exports = {
    getHealth,
};