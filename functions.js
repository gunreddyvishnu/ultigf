function generateOtp() {
  const otp = Math.floor(Math.random() * 9000) + 1000;
  return otp;
}

function rollDice() {
  // Generate a random number between 1 and 6
  return Math.floor(Math.random() * 6) + 1;
}

function generateUuid() {
  let result = "";
  const characters = "0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generatejwt() {
  let result = "";
  const characters = "0123456789qwertyuiopasdfghjklzxcvbnm";
  const charactersLength = characters.length;
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = {
  generateOtp,
  generateUuid,
  generatejwt,

  rollDice,
};
