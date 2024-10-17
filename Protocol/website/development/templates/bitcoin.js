const bitcoin = require('bitcoinjs-lib');

async function sendBTC() {
    const recipient = document.getElementById('btcRecipient').value;
    const amount = parseFloat(document.getElementById('btcAmount').value);
    const password = document.getElementById('btcPassword').value;

    if (!recipient || !amount || !password) {
        alert('Please enter recipient address, amount, and password.');
        return;
    }

    try {
        const encryptedPrivateKey = localStorage.getItem('encryptedPrivateKey');
        if (!encryptedPrivateKey) {
            alert('No private key found. Please make sure you have a wallet set up.');
            return;
        }

        // Decrypt the private key
        let decryptedPrivateKey;
        try {
            decryptedPrivateKey = CryptoJS.AES.decrypt(encryptedPrivateKey, password).toString(CryptoJS.enc.Utf8);
            if (!decryptedPrivateKey) {
                throw new Error('Decryption failed');
            }
        } catch (error) {
            console.error("Decryption error:", error);
            alert('Error decrypting the private key. Please check your password and try again.');
            return;
        }

        // Set up the Bitcoin network
        const network = bitcoin.networks.bitcoin;

        // Define a key pair using the private key
        const keyPair = bitcoin.ECPair.fromWIF(decryptedPrivateKey, network);

        // Fetch the UTXOs (unspent transaction outputs) for the address
        const address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network }).address;

        // You need an API to fetch UTXOs for the given Bitcoin address
        // Here we are using an example API (like Blockcypher, Blockstream, etc.)
        const response = await fetch(`https://blockstream.info/api/address/${address}/utxo`);
        const utxos = await response.json();
        console.log("UTXOs fetched:", utxos);

        if (!utxos || utxos.length === 0) {
            alert('No UTXOs found. The wallet may not have enough balance.');
            return;
        }

        // Set up the transaction builder
        const txb = new bitcoin.TransactionBuilder(network);

        let inputSum = 0;
        utxos.forEach((utxo) => {
            txb.addInput(utxo.txid, utxo.vout);
            inputSum += utxo.value;
        });

        const amountToSend = Math.floor(amount * 1e8); // Convert BTC to satoshis
        const fee = 10000; // Example fee in satoshis

        if (inputSum < amountToSend + fee) {
            alert('Insufficient balance to complete the transaction.');
            return;
        }

        txb.addOutput(recipient, amountToSend);
        const change = inputSum - amountToSend - fee;

        if (change > 0) {
            txb.addOutput(address, change); // Send change back to yourself
        }

        // Sign each input
        for (let i = 0; i < utxos.length; i++) {
            txb.sign(i, keyPair);
        }

        // Build the transaction
        const rawTransaction = txb.build().toHex();

        // Broadcast the transaction
        const broadcastResponse = await fetch('https://blockstream.info/api/tx', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: rawTransaction,
        });

        if (broadcastResponse.ok) {
            alert('Transaction sent successfully!');
            closeModal('btcModal');
        } else {
            const errorText = await broadcastResponse.text();
            throw new Error(errorText);
        }
    } catch (error) {
        console.error('Error sending BTC:', error);
        alert('Error sending BTC: ' + error.message);
    }
}

module.exports = {
    sendBTC,
};