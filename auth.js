const database = require("./database-functions");
const axios = require("axios");
const values = require("./values.js");
const functions = require("./functions.js");
/**
 *
 * @param {string} phoneNumber
 * @param {string} device
 *  * @param {string} otp
 */

async function signInWithPhoneNumber(phoneNumber, device) {
  //  error: false
  //  validationToken

  var otp = functions.generateOtp().toString();

  const params = new URLSearchParams({
    authorization: values.smskey,
    variables_values: otp,
    route: "otp",
    numbers: phoneNumber,
  });
  const headers = {
    "cache-control": "no-cache",
  };

  try {
    var resp = await axios.get(values.smsurl, { params, headers });
    console.log(resp.data);
    if (resp.data["return"]) {
      var ack = await database.db.collection("tokens").insertOne({
        mobile: phoneNumber,
        otp: otp,
        time: Date.now(),
        device: device,
        token: resp.data["request_id"],
        expired: false,
      });

      if (ack.acknowledged) {
        return {
          error: false,
          token: resp.data["request_id"],
        };
      } else {
        return {
          error: true,
          message: "There was a problem while sending Otp.",
        };
      }
    } else {
      return {
        error: true,
        message: "There was a problem while sending Otp.",
      };
    }
  } catch (ee) {
    console.log("error");
    return {
      error: true,
      message: "There was a problem while sending Otp.",
    };
  }
}

function invalidLogin() {
  console.log("invalid login");

  return {
    error: true,
    message: "Invalid Otp",
  };
}

async function verifyOtp(phoneNumber, token, otp, device) {
  //  error: false
  //  validationToken

  console.log({
    mobile: phoneNumber,
    otp: otp,
    device: device,
    token: token,
    expired: false,
  });

  var tokendata = await database.db.collection("tokens").findOne({
    mobile: phoneNumber,
    otp: otp,
    device: device,
    token: token,
    expired: false,
  });

  if (tokendata != null || tokendata != undefined) {
    console.log("creating session");

    var jwtToken = functions.generatejwt();

    var updateToken = await database.db.collection("tokens").updateOne(
      {
        token: token,
      },
      {
        $set: {
          expired: true,

          //  update values
        },
      }
    );

    if (updateToken.acknowledged) {
      //// token updated to expired

      var userdata = await database.db.collection("usersdata").findOne({
        mobile: phoneNumber,
      });

      if (userdata != null || userdata != undefined) {
        /// user exists in db

        if (userdata["blocked"] != true) {
          /// user not blocked

          var session = await database.db.collection("sessions").insertOne({
            jwt: jwtToken,
            mobile: phoneNumber,
            uid: userdata["uid"],
          });

          if (session.acknowledged) {
            return {
              error: false,
              jwtToken: jwtToken,
              uid: uuid,
              register:
                userdata["name"] != null || userdata["name"] != undefined
                  ? false
                  : true,
            };
          } else {
            return {
              error: true,
              message: "Unkown Error ",
            };
          }
        } else {
          return {
            error: true,
            message: "Your Account Was Blocked !!",
          };

          /// user blocked
        }
      } else {
        console.log("creating user");

        //// user not exists

        var uuid = functions.generateUuid();

        var createuser = await database.db.collection("usersdata").insertOne({
          uid: uuid,
          mobile: phoneNumber,
          blocked: false,
          deposit: values.welcome_deposit,
          winnings: 0,
          promotional: values.promotional,
          kyc_status: 0,
          email_verified: false,
        });

        if (createuser.acknowledged) {
          var session = await database.db.collection("sessions").insertOne({
            jwt: jwtToken,
            mobile: phoneNumber,
            uid: uuid,
          });

          if (session.acknowledged) {
            return {
              error: false,
              jwtToken: jwtToken,
              uid: uuid,
              register: true,
            };
          }
        } else {
          return {
            error: true,
            message: "unknown Error !",
          };
        }
      }
    } else {
      //// token updated to expired failed

      return {
        error: true,
        message: "unknown Error !",
      };
    }
  } else {
    return invalidLogin();
  }
}

async function verifyIdToken(sessionToken) {
  console.log(sessionToken);
  var uid = await database.db.collection("sessions").findOne(
    {
      jwt: sessionToken,
    },
    {
      projection: {
        _id: 0,
      },
    }
  );
  // console.log(uid);

  if (uid != null) {
    var userdetails = await database.db.collection("usersdata").findOne(
      {
        uid: uid["uid"],
      },
      {
        projection: {
          _id: 0,
        },
      }
    );

    if (userdetails != null && userdetails != undefined) {
      return {
        error: false,
        data: userdetails,
      };
    } else {
      return {
        error: true,
        message: "Please Relogin",
      };
    }
  } else {
    return {
      error: true,
      message: "Please Relogin",
    };
  }
}

async function signOut(mobile, sessionToken) {
  var ssnupdate = await database.db.collection("sessions").deleteOne({
    mobile: mobile,

    jwt: sessionToken,
  });

  console.log(ssnupdate);
  if (ssnupdate.acknowledged && ssnupdate.deletedCount > 0) {
    return {
      error: false,
    };
  } else {
    return {
      error: true,
      message: "unable to logout",
    };
  }
}

module.exports = { signInWithPhoneNumber, verifyOtp, verifyIdToken, signOut };
