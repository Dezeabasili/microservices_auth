const subscription_mail = (customer_name) => {
    const subscription_template = `
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
        Management and staff at Meridian Hosts appreciate your interest in our hotels. 
        We hope you will be having a wonderful stay in one of our properties.    
    </p>
    <p>
        We send out newsletters every quarter and you will start receiving them in your email.
    </p>
    <p>
        We thank you for choosing Meridian Hosts and we look forward to hosting you in one of our distinctive properties.
    </p>
    <h5>Best regards,</h5>
    <h5>Hotel Management</h5>
</body>
</html>
`

return subscription_template

}

module.exports = subscription_mail