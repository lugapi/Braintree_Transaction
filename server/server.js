import "dotenv/config";
import express from "express";
import path from "path";

import braintree from "braintree";

const app = express();

// static file
app.use(express.static("client"));

// analyse POST params sent in JSON
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join("views"));

const {
  BRAINTREE_MERCHANT_ID,
  BRAINTREE_API_KEY,
  BRAINTREE_API_SECRET,
  BRAINTREE_CURRENCY,
  PORT
} = process.env;

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: BRAINTREE_MERCHANT_ID,
  publicKey: BRAINTREE_API_KEY,
  privateKey: BRAINTREE_API_SECRET
});

app.get("/", async (req, res) => {
  // render paypal view
  res.render("index", {
    currency: BRAINTREE_CURRENCY,
    MID: BRAINTREE_MERCHANT_ID,
  })
});

app.post("/transaction/create", async (req, res) => {
  try {
    const amountToSend = req.body.contentBody.amountToSend;
    const paymentType = req.body.contentBody.paymentType;
    const nonceFromTheClient = req.body.contentBody.nonceToSend;
    const paymentMethodToken = req.body.contentBody.tokenToSend;

    const customerId = req.body.contentBody.customerIDToSend;
    const submitSettlement = req.body.contentBody.submitSettlement;
    const lineItems = req.body.contentBody.lineItems;
    const lineItemsContent = req.body.lineItems;
    const scaExemption = req.body.contentBody.scaExemption;
    const transactionSource = req.body.contentBody.transactionSource;

    // Request params
    const transactionParams = {
      amount: amountToSend,
      options: {},
      customerId: customerId,
      lineItems: lineItems || [],
    };

    // add nonce or token to transactionParams depending on paymentType
    if (paymentType === 'nonce') {
      transactionParams.paymentMethodNonce = nonceFromTheClient;
    } else if (paymentType === 'token') {
      transactionParams.paymentMethodToken = paymentMethodToken;
    } else {
      throw new Error('Invalid paymentType');
    }

    if (scaExemption !== 'none') {
      transactionParams.scaExemption = scaExemption;
    }
    if (transactionSource !== 'none') {
      transactionParams.transactionSource = transactionSource;
    }
    transactionParams.options.submitForSettlement = submitSettlement === 'on';

    if (lineItems === "on" && lineItemsContent.length > 0) {
      transactionParams.lineItems = lineItemsContent;
    }

    const transactionResult = await gateway.transaction.sale(transactionParams);

    console.log("Braintree Request:", transactionResult);

    res.json({
      result: transactionResult,
      transactionParams: transactionParams,
    });
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({
      error: "Failed to create order."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});