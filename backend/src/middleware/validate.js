export const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Replace parsed body/query/params with sanitized data
    req.body = validatedData.body || req.body;
    req.query = validatedData.query || req.query;
    req.params = validatedData.params || req.params;
    next();
  } catch (error) {
    if (error.errors) {
      const issues = error.errors.map((err) => ({
        field: err.path.slice(1).join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: issues[0]?.message || 'Validation error',
        errors: issues,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid request data',
    });
  }
};
