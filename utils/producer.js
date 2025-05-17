const amqplib = require('amqplib');

const sendTask = async () => {
  const connection = await amqplib.connect(process.env.RABBITMQ_URI);

    return connection
  
}

module.exports = sendTask