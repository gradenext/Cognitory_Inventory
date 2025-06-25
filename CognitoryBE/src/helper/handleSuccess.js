const handleSuccess = (res, data, message, code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data,
  });
};

export default handleSuccess;
