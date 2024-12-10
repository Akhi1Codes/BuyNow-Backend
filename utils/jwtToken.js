//Create and send token and save it to cookie

const sendToken = (user, statusCode, res) => {
  //Create Jwt Token
  const token = user.getJwtToken();

  //Options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === "PRODUCTION",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "PRODUCTION" ? "None" : "Lax",
  };
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
  return token;
};
module.exports = sendToken;
