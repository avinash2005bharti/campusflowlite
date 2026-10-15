export const sendSuccess = (res, data = {}, metaOrMsgOrStatus = null, maybeStatus = 200) => {
  let meta = null;
  let message = null;
  let statusCode = 200;

  if (typeof metaOrMsgOrStatus === 'number') {
    statusCode = metaOrMsgOrStatus;
  } else if (typeof metaOrMsgOrStatus === 'string') {
    message = metaOrMsgOrStatus;
    if (typeof maybeStatus === 'number') {
      statusCode = maybeStatus;
    }
  } else if (typeof metaOrMsgOrStatus === 'object' && metaOrMsgOrStatus !== null) {
    meta = metaOrMsgOrStatus;
    if (typeof maybeStatus === 'number') {
      statusCode = maybeStatus;
    }
  } else if (typeof maybeStatus === 'number') {
    statusCode = maybeStatus;
  }

  const payload = {
    success: true,
    data,
  };

  if (message) {
    payload.message = message;
  }

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
