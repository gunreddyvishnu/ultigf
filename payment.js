const { Cashfree } = require("cashfree-pg"); // Import the Cashfree module

Cashfree.XClientId = "57291593f24c9b07a8b163ceb6519275";
Cashfree.XClientSecret = "cfsk_ma_prod_faab75471acb878c2b571a6f831ec525_17cd6ad1";
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

async function createOrder(OrderPrams) {
  var request = {
    order_amount: OrderPrams["amount"],
    order_currency: "INR",

    customer_details: {
      customer_id: OrderPrams["uid"],
      customer_phone: OrderPrams["mobile"],
    },
    order_meta: {
      return_url:
        "https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id={order_id}",
    },
  };
  var request = await Cashfree.PGCreateOrder("2022-09-01", request)
  .catch((error) => {
    return {
      error: true,
    };
  });

  if (request) {
    return {
      error: false,
      data: request.data,
    };
  }
}



module.exports={
    createOrder
}