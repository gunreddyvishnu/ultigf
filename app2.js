app.post(
  "/deposit",

  {
    preHandler: authenticate,
    schema: {
      body: {
        type: "object",
        properties: {
          amount: { type: "integer" },
          //  email: { type: 'string', format: 'email' },
          //  age: { type: 'integer' },
          //  mobile: { type: 'string', minLength: 10 },
        },
        required: ["amount"],
      },
    },
  },

  async (req, res) => {
    const jwtToken = req.headers.authorization.split(" ")[1];
    var result = await auth.verifyIdToken(jwtToken);

    if (result["error"]) {
      res.status(401).send(result);
    } else {
      var orderdetails = await createOrder({
        amount: 1,
        uid: result.data["uid"],
        mobile: result.data["mobile"],
      });

      console.log(orderdetails.data["order_id"]);
      // console.log(orderdetails.data["data"]["order_id"],);

      res.send({
        error: false,
        data: {
          orderid: orderdetails.data["order_id"],
          paymentid: orderdetails.data["payment_session_id"],
        },
      });

      if (orderdetails["error"] == false) {
        await database.db.collection("transactions").insertOne({
          uid: result.data["uid"],
          amount: req.body["amount"],
          mobile: result.data["mobile"],
          createdAt: Date.now(),
          orderid: orderdetails.data["order_id"],
          paymentid: orderdetails.data["payment_session_id"],
        });
      } else {
        res.send({
          error: true,
          message: "Unknown Error",
        });
      }
    }
  }
);
