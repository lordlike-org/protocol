from django.shortcuts import render
from eth_utils import currency
from web3 import Web3
from web3.middleware import geth_poa_middleware
import requests


# Connect to public nodes for different blockchains
eth_w3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/a4c60cf1bd7e4c288d9221144f9efbe2'))
bnb_w3 = Web3(Web3.HTTPProvider('https://bsc-dataseed.binance.org/'))
polygon_w3 = Web3(Web3.HTTPProvider('https://polygon-rpc.com/'))

# Adding middleware for BSC and Polygon if necessary
bnb_w3.middleware_onion.inject(geth_poa_middleware, layer=0)
polygon_w3.middleware_onion.inject(geth_poa_middleware, layer=0)

ETHERSCAN_API_KEY = 'BXJHEB8XMMVEAQ7GKE1PGFTURZV31AYG8Q'


def index(request):
    return render(request, 'index.html')


def create_wallet(request):
    if request.method == 'GET':
        address = request.GET.get('address')
        chain = request.GET.get('chain')
        seed_phrase = request.GET.get('seedPhrase')
        return render(request, 'create_wallet.html', {
            'address': address,
            'seed_phrase': seed_phrase,
            'chain': chain
        })
    return render(request, 'index.html')


def get_balance(w3, address):
    balance = w3.eth.get_balance(address)
    return currency.from_wei(balance, 'ether')  # Using the from_wei method from the web3.utils.currency module


def get_token_balances(address):
    url = (f'https://api.etherscan.io/api?module=account&action=tokentx&address={address}&startblock=0&endblock'
           f'=999999999&sort=asc&apikey={ETHERSCAN_API_KEY}')
    response = requests.get(url).json()
    tokens = {}

    if response['status'] == '1':
        for tx in response['result']:
            token_name = tx['tokenSymbol']
            token_decimal = int(tx['tokenDecimal'])
            token_value = int(tx['value']) / (10 ** token_decimal)

            if token_name in tokens:
                tokens[token_name] += token_value
            else:
                tokens[token_name] = token_value

    return tokens


def wallet_created(request):
    if request.method == 'POST':
        address = request.POST.get('address')

        # Receiving ETH, BNB and MATIC balances
        balance_eth = get_balance(eth_w3, address)
        balance_bnb = get_balance(bnb_w3, address)
        balance_matic = get_balance(polygon_w3, address)

        # Receiving token balances
        token_balances = get_token_balances(address)

        return render(request, 'wallet_created.html', {
            'address': address,
            'balance_eth': balance_eth,
            'balance_bnb': balance_bnb,
            'balance_matic': balance_matic,
            'token_balances': token_balances
        })
    return render(request, 'index.html')


def create_smart_wallet(request):
    # Logic of creating a smart wallet
    return render(request, 'create_smart_wallet.html')
