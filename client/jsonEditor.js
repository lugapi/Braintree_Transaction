const jsonContentLineItems = [{
        name: 'Item #1',
        description: 'two for one',
        quantity: '2',
        unitAmount: '10.00',
        totalAmount: '20.00',
        kind: 'debit',
        discountAmount: '0.00',
        url: 'http://inserturlhere/item',
    },
    {
        name: 'Item #2',
        description: 'Discount',
        quantity: '1',
        unitAmount: '40.00',
        kind: 'debit',
        totalAmount: '40.00',
        discountAmount: '0.00',
        url: 'http://inserturlhere/item',
    }
];


const container = document.getElementById("jsoneditor");
const options = {
    modes: ["text", "code", "tree", "form", "view"],
    mode: "tree",
    search: true,
};
const editor = new JSONEditor(container, options);

editor.set(jsonContentLineItems);
editor.expandAll();