const handleError = (res, error, message, code = 500) => {
  console.log("Error:", error);
  return res.status(code).json({
    success: false,
    message,
    error,
  });
};

export default handleError;
