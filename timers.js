// const database = require("./database-functions");
// const { publishData } = require("./mqtt-client");

// setTimeout(() => {
//   console.log("Timer Started");

//   ///// game timer
//   setInterval(async () => {
//     const fiveMinutesAgo = Date.now() - 1000 * 60 * 10;

//     // console.log(fiveMinutesAgo);

//     const games = await database.db
//       .collection("games")
//       .find(
//         {
//           status: 1,
//           action_time: { $lt: fiveMinutesAgo }, // Filter for game times greater than 5 minutes ago
//         },
//         {
//           projection: {
//             _id: 0, // Exclude the _id field from the result
//           },
//         }
//       )
//       .toArray();

//     // console.log(games);

//     games.forEach(async (gamedata) => {


//       if (gamedata["p1_score"] > gamedata["p2_score"]) {
//         //// player 1 win

//         console.log("p1 win");

//         var updateee = await database.db.collection("games").updateOne(
//           {
//             // find
//             status: 1,
//             gameid: gamedata["gameid"],
//           },
//           {
//             $set: {
//               status: 2,
//               winner: "p1",

//               //  update values
//             },
//           },
//           {
//             upsert: true,
//           }
//         );

//         if (updateee.acknowledged) {
//           var updatee1 = await database.db.collection("usersdata").updateOne(
//             {
//               uid: gamedata["p1_id"],
//             },
//             {
//               $inc: {
//                 winnings: gamedata["stake"] + gamedata["stake"] * 0.8,
//                 //  update values
//               },
//             }
//           );

//           if (updatee1.acknowledged) {
//             publishData(
//               gamedata["roomcode"],
//               JSON.stringify({
//                 win: "p1",
//                 action: "game-end",
//                 status: 2,
//               })
//             );
//           }
//         }
//       } else if (gamedata["p2_score"] > gamedata["p1_score"]) {
//         console.log("p2 win");
//         var updateee = await database.db.collection("games").updateOne(
//           {
//             // find
//             gameid: gamedata["gameid"],
//           },
//           {
//             $set: {
//               status: 2,
//               winner: "p2",

//               //  update values
//             },
//           }
//         );

//         if (updateee.acknowledged) {
//           var updatee1 = await database.db.collection("usersdata").updateOne(
//             {
//               uid: gamedata["p2_id"],
//             },
//             {
//               $inc: {
//                 winnings: gamedata["stake"] * 0.8,
//                 //  update values
//               },
//             }
//           );

//           if (updatee1.acknowledged) {
//             publishData(
//               gamedata["roomcode"],
//               JSON.stringify({
//                 win: "p2",
//                 action: "game-end",
//                 status: 2,
//               })
//             );
//           }
//         }
//       } else {
//         console.log("TIE -- MATCH");
//         /// tie game
//       }
//     });
//   }, 1000);

  
// }, 5000);
