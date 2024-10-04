const bitcoin = require('bitcoinjs-lib');
const ethers = require('ethers');
const CryptoJS = require('crypto-js');
const bip39 = require('bip39');
const bip32 = require('bip32');

// DOM Elements
const createWalletBtn = document.getElementById('createWalletBtn');
const accessWalletBtn = document.getElementById('accessWalletBtn');
const chainSelection = document.getElementById('chainSelection');
const accessWalletDiv = document.getElementById('accessWallet');
const chainForm = document.getElementById('chainForm');
const importBtn = document.getElementById('importBtn');

// Extract URL from data-* attribute
const createWalletUrl = chainForm.getAttribute('data-create-url');

let chain;

createWalletBtn.addEventListener('click', () => {
    createWalletBtn.style.display = 'none';
    chainSelection.style.display = 'block';
});

accessWalletBtn.addEventListener('click', () => {
    accessWalletBtn.style.display = 'none';
    accessWalletDiv.style.display = 'block';
});

// Add the event listener for the Import button
importBtn.addEventListener('click', accessWallet);

document.getElementById('nextBtn').addEventListener('click', initiateWalletCreation);

function initiateWalletCreation() {
    chain = document.querySelector('input[name="chain"]:checked').value;
    createPasswordScreen();
}

function createPasswordScreen() {
    const password = prompt("Enter a password to protect your wallet:");
    if (password) {
        generateWallet(chain, password);
    } else {
        alert("Password is required to create a wallet.");
    }
}

async function generateWallet(chain, password) {
    if (chain === 'evm') {
        await generateEvmWallet(password);
    } else if (chain === 'bitcoin') {
        await generateBitcoinWallet(password);
    }
}

async function generateEvmWallet(password) {
    try {
        const wallet = ethers.Wallet.createRandom();
        const privateKey = wallet.privateKey;
        const address = wallet.address;
        const seedPhrase = wallet.mnemonic.phrase;

        const encryptedKey = CryptoJS.AES.encrypt(privateKey, password).toString();
        const encryptedSeedPhrase = CryptoJS.AES.encrypt(seedPhrase, password).toString();

        localStorage.setItem('encryptedKey', encryptedKey);
        localStorage.setItem('encryptedSeedPhrase', encryptedSeedPhrase);

        window.location.href = `${createWalletUrl}?address=${address}&seed_phrase=${encodeURIComponent(encryptedSeedPhrase)}&private_key=${encodeURIComponent(encryptedKey)}&chain=${chain}`;
    } catch (error) {
        console.error("Error when creating or encrypting a wallet:", error);
        alert("An error has occurred. Please try again.");
    }
}

async function generateBitcoinWallet(password) {
    try {
        const mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);

        const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
        const account = root.derivePath("m/44'/0'/0'");
        const child = account.derive(0).derive(0);

        const { address } = bitcoin.payments.p2pkh({ pubkey: child.publicKey });
        const privateKey = child.toWIF();

        const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, password).toString();
        const encryptedSeedPhrase = CryptoJS.AES.encrypt(mnemonic, password).toString();

        localStorage.setItem('encryptedPrivateKey', encryptedPrivateKey);
        localStorage.setItem('encryptedSeedPhrase', encryptedSeedPhrase);

        window.location.href = `${createWalletUrl}?address=${address}&seed_phrase=${encodeURIComponent(encryptedSeedPhrase)}&private_key=${encodeURIComponent(encryptedPrivateKey)}&chain=${chain}`;
    } catch (error) {
        console.error("Error creating Bitcoin wallet:", error);
        alert("An error occurred. Please try again.");
    }
}

async function accessWallet() {
    const input = document.getElementById('recoveryInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const chain = document.querySelector('input[name="chain_import"]:checked').value; // getting a chain

    console.log("chain: " + chain);

    // Extracting URL for wallet import
    const importWalletUrl = chainForm.getAttribute('data-import-url');

    if (!input) {
        alert('Enter your seed phrase or private key');
        return;
    }
    if (!password) {
        alert('Enter the password');
        return;
    }

    try {
        if (chain === 'bitcoin') {
            // Processing for bitcoin wallets
            await importBitcoinWallet(input, password, importWalletUrl);
        } else if (chain === 'evm') {
            // Processing for EVM wallets
            await importEvmWallet(input, password, importWalletUrl);
        } else {
            alert('The selected network is not supported.');
        }
    } catch (error) {
        alert("An error has occurred. Please try again..");
    }
}


// Importing a Bitcoin Wallet
async function importBitcoinWallet(input, password, importWalletUrl) {
    try {
        // Checking the validity of a seed phrase
        if (input.split(' ').length > 1) {
            const seed = await bip39.mnemonicToSeed(input);  // Converting seed phrase to seed
            const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
            const child = root.derivePath("m/44'/0'/0'/0/0");  // Derivation for Bitcoin wallet
            const { address } = bitcoin.payments.p2pkh({ pubkey: child.publicKey });  // Bitcoin address generation

            const privateKey = child.toWIF();  // Getting a private key

            // Encrypting a private key
            const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, password).toString();

            // Sending data via form to server
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = importWalletUrl;
            form.innerHTML = `
                <input type="hidden" name="address" value="${address}">  <!-- transfering the bitcoin address -->
                <input type="hidden" name="private_key" value="${encodeURIComponent(encryptedPrivateKey)}">
                <input type="hidden" name="chain" value="bitcoin">  <!-- indicating that this is Bitcoin -->
                <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
            `;
            document.body.appendChild(form);
            form.submit();
        } else {
            alert('Please enter a valid Bitcoin seed phrase.');
        }
    } catch (error) {
        console.error("Error importing Bitcoin wallet:", error);
        alert("An error occurred while importing Bitcoin wallet. Please try again.");
    }
}


// import EVM-wallet
async function importEvmWallet(input, password, importWalletUrl) {
    let decryptedPrivateKey;
    try {
        let wallet;
        if (input.split(' ').length > 1) { // Check if input is a seed phrase
            wallet = ethers.Wallet.fromMnemonic(input);
        } else { // Otherwise it is a private key
            wallet = new ethers.Wallet(input);
        }

        const address = wallet.address;
        const privateKey = wallet.privateKey;
        const seedPhrase = wallet.mnemonic ? wallet.mnemonic.phrase : null;

        if (seedPhrase) {
            const encryptedSeedPhrase = CryptoJS.AES.encrypt(seedPhrase, password).toString();
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = importWalletUrl;  // use URL for wallet importing
            form.innerHTML = `
                <input type="hidden" name="address" value="${address}">
                <input type="hidden" name="seed_phrase" value="${encodeURIComponent(encryptedSeedPhrase)}">
                <input type="hidden" name="chain" value="evm">
                <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
            `;
            document.body.appendChild(form);
            form.submit();
        } else {
            const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, password).toString();
            localStorage.setItem('encryptedKey', encryptedPrivateKey);
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = importWalletUrl;  // use URL for wallet importing
            form.innerHTML = `
                <input type="hidden" name="address" value="${address}">
                <input type="hidden" name="private_key" value="${encodeURIComponent(encryptedPrivateKey)}">
                <input type="hidden" name="chain" value="evm">
                <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
            `;
            document.body.appendChild(form);
            form.submit();
        }
    } catch (error) {
        console.error("Error importing EVM wallet:", error);
        alert("An error has occurred. Please try again.");
    }
}


