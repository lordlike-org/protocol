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

// Извлечение URL из data-* атрибута
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

    // Извлечение URL для импорта кошелька
    const importWalletUrl = chainForm.getAttribute('data-import-url');

    if (!input) {
        alert('Enter Seed Phrase or Private Key');
        return;
    }
    if (!password) {
        alert('Enter password');
        return;
    }

    try {
        let wallet;
        if (input.split(' ').length > 1) { // Checking if input is a seed phrase
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
            form.action = importWalletUrl; // Используем URL для импорта кошелька
            form.innerHTML = `
                <input type="hidden" name="address" value="${address}">
                <input type="hidden" name="seed_phrase" value="${encodeURIComponent(encryptedSeedPhrase)}">
                <input type="hidden" name="chain" value="${chain}">
                <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
            `;
            document.body.appendChild(form);
            form.submit();
        } else {
            const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, password).toString();
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = importWalletUrl; // Используем URL для импорта кошелька
            form.innerHTML = `
                <input type="hidden" name="address" value="${address}">
                <input type="hidden" name="private_key" value="${encodeURIComponent(encryptedPrivateKey)}">
                <input type="hidden" name="chain" value="${chain}">
                <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
            `;
            document.body.appendChild(form);
            form.submit();
        }
    } catch (error) {
        alert("An error has occurred. Please try again.");
    }
}

