import { config, orderbook } from "@imtbl/sdk";

// https://sphere.market/immutable/collection/0x2483CD7f6bdE4cC603cd9587273692791E7B0569
const CONTRACT_ADDRESS = "0x2483CD7f6bdE4cC603cd9587273692791E7B0569"; 

(async () => {
  try {
    const client = new orderbook.Orderbook({
      baseConfig: {
        environment: config.Environment.PRODUCTION,
      },
    });

    const listOfListings = await client.listListings({
      sellItemContractAddress: CONTRACT_ADDRESS,
      status: orderbook.OrderStatusName.FILLED,
      pageSize: 100, // change pageSize to get more responses
    });

    console.log(listOfListings);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
