const success = (res, { statusCode = 200, message = 'Success', data = null, meta = null }) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

const created = (res, { message = 'Created successfully', data = null }) => {
  return success(res, { statusCode: 201, message, data });
};

const noContent = (res) => {
  return res.status(204).send();
};

module.exports = { success, created, noContent };
