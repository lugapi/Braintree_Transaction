document.getElementById("transactionSaleForm").addEventListener("submit", function (event) {
    event.preventDefault();

    // Récupérer les données du formulaire
    const formData = new FormData(event.target);

    // Récupérer les éléments de ligne JSONEditor
    const lineItems = document.getElementById('lineItems');
    const lineItemsValue = lineItems.checked ? editor.get(): null;

    console.log('lineItemsValue', lineItemsValue)


    // Effectuer la requête POST avec fetch
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

//   TOGGLE NONCE TOKEN
const paymentTypeNonce = document.getElementById('paymentTypeNonce');
const paymentTypeToken = document.getElementById('paymentTypeToken');
const nonceSection = document.getElementById('nonceSection');
const tokenSection = document.getElementById('tokenSection');
const customerSection = document.querySelector('.customer');

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

const lineItems = document.getElementById('lineItems');
const editorLineItems = document.getElementById('jsoneditor');

// Ajoutez un écouteur d'événements pour la case à cocher lineItems
lineItems.addEventListener('change', function () {
    // Si la case à cocher est cochée, affichez l'éditeur JSON
    if (lineItems.checked) {
        editorLineItems.style.display = 'block';
    } else {
        editorLineItems.style.display = 'none';
    }
});