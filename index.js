
const axios = require('axios');

async function main() {
    const data = await getTransactionsData();
    if (data && data.transactions && data.transactions.length > 0) {
        const topEarner = getTopEarner(data.transactions);
        const lastYearTransactions = data.transactions.filter(tran => {
            const lastYear = new Date().getFullYear() - 1;
            const transactionDate = new Date(tran.timeStamp);
            if (transactionDate.getFullYear() === lastYear) {
                return tran
            }
        })
        const alphaTransactionIDs = getAlphaTransactions(lastYearTransactions, topEarner.id);

        if (alphaTransactionIDs.length > 0) {
            await submitTask(data.id, alphaTransactionIDs);
        } else {
            console.log('No alpha transactions found for top earner.');
        }
    } else {
        console.log('No transactions data available.');
    }
}

async function getTransactionsData() {
    try {
        const response = await axios.get('https://interview.adpeai.com/api/v2/get-task');
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

function getTopEarner(transactions) {
    const lastYear = new Date().getFullYear() - 1;
    let employeeTotals = {};

    transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.timeStamp);
        if (transactionDate.getFullYear() === lastYear) { //check for having records for last year
            const { employee, amount } = transaction;
            if (!employeeTotals[employee.id]) {
                employeeTotals[employee.id] = { name: employee.name, totalAmount: amount, id: employee.id };
            }
            employeeTotals[employee.id].totalAmount += amount;
        }
    });

    const topEarner = Object.values(employeeTotals).reduce((max, current) =>
        current.totalAmount > max.totalAmount ? current : max
    );

    return topEarner;
}

function getAlphaTransactions(transactions, topEarnerId) {
    const lastYear = new Date().getFullYear() - 1;

    return transactions
        .filter(transaction => transaction.employee.id === topEarnerId && transaction.type === 'alpha')
        .map(transaction => transaction.transactionID);
}

async function submitTask(id, result) {
    try {
        const response = await axios.post('https://interview.adpeai.com/api/v2/submit-task', {
            id: id,
            result: result
        });
        console.log('Task submitted successfully:', response.status);
    } catch (error) {
        console.log(error)
        console.error('Error submitting task:', error.response ? error.response.status : error.message);
    }
}

main();