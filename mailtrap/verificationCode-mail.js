const verificationCode_mail = (customer_name, verificationCode) => {
    const verificationCode_template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .hotelName {
            background-color: blue;
            color: white;
            text-align: center;
            padding: 1px;
        }
    </style>
</head>
<body>
    <div class="hotelName">
        <h1>Meridian Hosts</h1>
    </div>
    <h4>Hi ${customer_name},</h4>
    <p>
        Management and staff at Meridian Hosts are pleased to welcome you. 
        We hope you will be having a wonderful stay in our property.    
    </p>
    <p>        
        Below is your six digit verification Code.
    </p>
    <p>        
        The code will expire after 10 mins.
    </p>
    <h2>${verificationCode}</h2>
    <p>
        We thank you for choosing Meridian Hosts and we look forward to hosting you in one of our distinctive properties.
    </p>
    <h5>Best regards,</h5>
    <h5>Hotel Management</h5>
</body>
</html>
`

return verificationCode_template

}

module.exports = verificationCode_mail