const validateParam = (param, schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(
            req.params[param]
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${param}.`,
                errors: result.error.issues,
            });
        }

        req.params[param] = result.data;

        next();
    };
};

module.exports = validateParam;