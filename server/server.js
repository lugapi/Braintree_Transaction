// server.js
import "dotenv/config";
import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";

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

app.post("/transaction/bulk", async (req, res) => {
  console.log("req.body", req.body);
  try {
    const numberOfTransactions = parseInt(req.body.contentBody.numberBulk);
    const bulkResults = [];

    // Create a table of promises for transaction
    const transactionPromises = Array.from({
      length: numberOfTransactions
    }, async (_, i) => {
      const randomAmount = Math.floor(Math.random() * 1000) + 1;

      const orderId = "orderFromBulk-" + Math.floor(Math.random() * 1000000) + 1;

      // List of possible nonces
      const possibleNonces = [];

      // If addPPforBulk == 'on' add a PayPal payment method
      if (req.body.contentBody.addPPforBulk === 'on') {
        possibleNonces.push('fake-paypal-one-time-nonce');
      }
      if (req.body.contentBody.addVISAforBulk === 'on') {
        possibleNonces.push('fake-valid-visa-nonce');
        possibleNonces.push('fake-processor-declined-visa-nonce');
      }
      if (req.body.contentBody.addMCforBulk === 'on') {
        possibleNonces.push('fake-valid-mastercard-nonce');
        possibleNonces.push('fake-processor-declined-mastercard-nonce');
      }

      // Choose a random nonce from the list
      const randomNonce = possibleNonces[Math.floor(Math.random() * possibleNonces.length)];

      const transactionParams = {
        amount: randomAmount,
        paymentMethodNonce: randomNonce,
        orderId: orderId,
        options: {},
        // Add additional transaction parameters
      };

      // Randomly choose if the transaction should be submitted for settlement
      if (Math.random() > 0.5) {
        transactionParams.options.submitForSettlement = true;
      }
      // Randomly choose if the transaction should be stored in the vault
      if (Math.random() > 0.5) {
        transactionParams.options.storeInVault = true;
      }
      // Add other transaction parameters as needed

      console.log("transactionParams", transactionParams);

      const transactionResult = await gateway.transaction.sale(transactionParams);
      bulkResults.push(transactionResult);
    });

    // Wait for all promises to resolve
    await Promise.all(transactionPromises);

    res.json({
      result: bulkResults,
    });

  } catch (error) {
    console.error("Failed to process bulk transactions:", error);
    res.status(500).json({
      error: "Failed to process bulk transactions."
    });
  }
});


app.post("/transaction/create", async (req, res) => {
  try {
    const amountToSend = req.body.contentBody.amountToSend;
    const paymentType = req.body.contentBody.paymentType;
    const nonceFromTheClient = req.body.contentBody.nonceToSend;
    const paymentMethodToken = req.body.contentBody.tokenToSend;

    const customerId = req.body.contentBody.customerIDToSend;
    const orderId = req.body.contentBody.orderIDToSend;
    console.log("ORDER ID", orderId);
    const submitSettlement = req.body.contentBody.submitSettlement;
    const lineItems = req.body.contentBody.lineItems;
    const lineItemsContent = req.body.lineItems;
    const scaExemption = req.body.contentBody.scaExemption;
    const transactionSource = req.body.contentBody.transactionSource;
    const savePM = req.body.contentBody.savePM;

    // Request params
    const transactionParams = {
      amount: amountToSend,
      options: {},
      orderId: orderId,
      customerId: customerId,
      lineItems: lineItems || [],
    };

    // add nonce or token to transactionParams depending on paymentType
    if (paymentType === 'nonce') {
      transactionParams.paymentMethodNonce = nonceFromTheClient;
    } else if (paymentType === 'token') {
      transactionParams.paymentMethodToken = paymentMethodToken;
    } else if (paymentType === "nonceCVV") {
      transactionParams.paymentMethodToken = paymentMethodToken;
      transactionParams.paymentMethodNonce = nonceFromTheClient;
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

    if (savePM === 'on') {
      transactionParams.options.storeInVaultOnSuccess = true;
    }

    if (lineItems === "on" && lineItemsContent.length > 0) {
      transactionParams.lineItems = lineItemsContent;
    }

    const transactionResult = await gateway.transaction.sale(transactionParams);

    console.log("Braintree transactionParams:", transactionParams);
    // console.log("Braintree Request:", transactionResult);

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


app.get("/transaction/bulk/sample", (req, res) => {
  // Generate the sample content (you can adapt this according to your logic)
  let sampleContent = "amount,nonce,submitForSettlement,storeInVault\n";
  sampleContent += "100,fake-valid-visa-nonce,true,false\n";
  sampleContent += "200,fake-paypal-one-time-nonce,true,true\n";
  sampleContent += "300,fake-valid-mastercard-nonce,false,false";

  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename=bulk_sample.csv');
  res.send(sampleContent);
});

const upload = multer({
  dest: 'uploads/'
});

app.post("/transaction/bulk/upload", upload.single('bulkFile'), async (req, res) => {
  // Process the uploaded file here
  const uploadedFile = req.file;
  console.log(uploadedFile);

  // Create an array to store the results of bulk transactions
  const bulkResults = [];

  // Create a promise for each transaction
  const transactionPromises = [];

  // Read the CSV file
  fs.createReadStream(uploadedFile.path)
    .pipe(csv())
    .on('data', (row) => {

      const randomAmount = parseInt(row.amount);
      const orderId = row.orderId || ("orderFromBulk-" + Math.floor(Math.random() * 1000000) + 1);
      const nonceFromTheClient = row.nonce;
      const submitForSettlement = row.submitForSettlement;
      const storeInVault = row.storeInVault;

      // Process each row here
      console.log("Processing row:", row);

      // Request params
      let transactionParams = {
        amount: randomAmount,
        orderId: orderId,
        paymentMethodNonce: nonceFromTheClient,
        options: {
          submitForSettlement: submitForSettlement,
        }
        // Add other transaction parameters as needed
      };

      transactionParams.options.storeInVaultOnSuccess = storeInVault;

      // Add the promise for this transaction to the array
      transactionPromises.push(
        gateway.transaction.sale(transactionParams)
        .then((transactionResult) => {
          bulkResults.push(transactionResult);
        })
        .catch((error) => {
          console.error("Error processing row:", error);
          // Handle the error for this row (you can choose to continue or stop processing)
        })
      );
    })
    .on('end', () => {
      // Every line has been processed
      console.log('CSV file successfully processed.');

      // Wait for all promises to resolve
      Promise.all(transactionPromises)
        .then(() => {
          // Delete the uploaded file
          fs.unlinkSync(uploadedFile.path);

          // Respond with the results of bulk transactions
          res.json({
            message: "File uploaded successfully",
            file: uploadedFile,
            result: bulkResults,
          });
        })
        .catch((error) => {
          console.error("Error processing bulk transactions:", error);
          res.status(500).json({
            error: "Failed to process bulk transactions."
          });
        });
    });
});



app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});