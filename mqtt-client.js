const { json } = require("express/lib/response");
const mqtt = require("mqtt");
const { generateUuid } = require("./functions");

// Replace these with your own values
const host = "27.6.2.152";
const port = "1883"; // Usually 1883 for non-TLS connections
const username = "admin";
const password = "a123g2madhu@G";

// Create a client connection
const client = mqtt.connect(`mqtt://${host}:${port}`, {
  username: username,
  password: password,
  clientId:"ADMIN_"+generateUuid(),
});

// function connectmqtt(){

//     client.connect();
// }

client.on("connect", function () {
  console.log("Connected to MQTT Broker!");
});

client.on("error", function (errr) {
  console.log(errr + "error");
});


/**
 *
 * @param {string} gameid
 * @param {string} message
 *  * @param {string} otp
 */

function publishData(gameid, message) {
  console.log(" PUBLISH DATA ");


  console.log("Game id : "+gameid);
  console.log("message : "+message);

  if (gameid.length > 4 && message.length > 0) {
    if (client.connected == true) {
      try {

        
        client.publish(gameid,message);
        return true;
      } catch (e) {

        console.log(e);

        return false;
      }
    } else {

      console.log(" Message failed to Send due to disconnect");
      return false;
    }
  } else {


    console.log("Message invalid format ");

    return false;
  }
}

module.exports = { client, publishData };
