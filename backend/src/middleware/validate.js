export const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body && req.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query && req.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.params && req.params) {
      req.params = schema.params.parse(req.params);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (error) {
    next(error);
  }
};

export default validate;
