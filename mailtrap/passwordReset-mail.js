const passwordReset_mail = (passwordResetURL) => {
    const passwordReset_template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <h2>Password reset assistance</h2>
    <p>Forgot your password? Click on the link below to submit a new password.</p>
    <a href=${passwordResetURL}><button>Reset password</button></a>
    <p>If you did not forget your password, please ignore this email</p>
  </body>
</html>
`

return passwordReset_template

}

module.exports = passwordReset_mail