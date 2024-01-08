document.getElementById("transactionSaleForm").addEventListener("submit", function (event) {
    event.preventDefault();

    if(!checkValidityForm()){
        alert("Please fill at least AMOUNT and TOKEN or NONCE fields and if you send line items, check total amount = transaction amount");
        console.error("Please fill at least AMOUNT and TOKEN or NONCE fields and if you send line items, check total amount = transaction amount");
        return false
    }

    const formData = new FormData(event.target);

    const lineItems = document.getElementById('lineItems');
    const lineItemsValue = lineItems.checked ? editor.get() : null;

    fetch("/transaction/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contentBody: Object.fromEntries(formData.entries()),
                lineItems: lineItemsValue,
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("full data", data);
            document.querySelector('.results .response').innerHTML = prettyPrintObject(data.result);

            // Display BT request fromatted in JSON
            document.querySelector('.results .braintree-request').innerHTML = prettyPrintObject(data.transactionParams);
            document.querySelector('.results').classList.remove('hidden');

            if (data.result.success) {
                const urlToBo = "https://sandbox.braintreegateway.com/merchants/" + mid + "//transactions/" + data.result.transaction.id
                document.querySelector('.transactionToBo p').innerHTML = "<a target='_blank' class='underline text-blue-600 hover:text-blue-800' href='" + urlToBo + "'>" + data.result.transaction.id + "</a>";
                document.querySelector('.transactionToBo').classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
});

editor.container.addEventListener('focusout', function () {
    checkValidityLineItems()
});

document.getElementById('amountToSend').addEventListener('focusout', function () {
    checkValidityLineItems()
});

//   TOGGLE NONCE TOKEN
const paymentTypeNonce = document.getElementById('paymentTypeNonce');
const paymentTypeToken = document.getElementById('paymentTypeToken');
const nonceSection = document.getElementById('nonceSection');
const tokenSection = document.getElementById('tokenSection');
const customerSection = document.querySelector('.customer');
const lineItems = document.getElementById('lineItems');
const editorLineItems = document.getElementById('editorSection');

paymentTypeNonce.addEventListener('change', function () {
    nonceSection.style.display = 'block';
    tokenSection.style.display = 'none';
    customerSection.style.display = 'block';
});

paymentTypeToken.addEventListener('change', function () {
    nonceSection.style.display = 'none';
    tokenSection.style.display = 'block';
    customerSection.style.display = 'none';
});

lineItems.addEventListener('change', function () {
    if (lineItems.checked) {
        editorLineItems.classList.remove('hidden');
        checkValidityLineItems()
    } else {
        editorLineItems.classList.add('hidden');
    }
});

function checkValidityLineItems() {
    if (!lineItems.checked) {
        return true;
    }

    const amountTransaction = Number(document.getElementById('amountToSend').value);
    
    return calculateLineItemsTotalAmount() === amountTransaction;
}

// check validity form : amount and token or nonce is required + if line items is checked, check total amount = transaction amount
function checkValidityForm() {
    const hasNonceOrToken = document.getElementById('nonceToSend').value !== '' || document.getElementById('tokenToSend').value !== '';
    const hasAmount = document.getElementById('amountToSend').value !== '';
    const isValidLineItems = checkValidityLineItems();

    return hasNonceOrToken && hasAmount && isValidLineItems;
}

function setTransactionAmount(){
    document.getElementById('amountToSend').value = calculateLineItemsTotalAmount()
}

function calculateLineItemsTotalAmount() {
    const jsonContent = editor.get();

    let totalAmount = 0;

    jsonContent.forEach(item => {
        item.totalAmount = item.quantity * item.unitAmount;
        totalAmount += item.totalAmount;
    });

    return totalAmount;
}