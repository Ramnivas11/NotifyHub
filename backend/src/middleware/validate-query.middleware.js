const validateQuery = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters.",
                errors: result.error.issues,
            });
        }

        req.query = result.data;

        next();
    };
};

module.exports = validateQuery;