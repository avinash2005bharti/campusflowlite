export const sendSuccess = (res, data = {}, meta = null, statusCode = 200) => {
  const payload = {
    success: true,
    data,
  };

  if (meta !== null && meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

export const sendCreated = (res, data = {}) => {
  return sendSuccess(res, data, null, 201);
};

export default {
  sendSuccess,
  sendCreated,
};
