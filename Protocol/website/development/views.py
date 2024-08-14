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

USDT_CONTRACT_ADDRESSES = {
    'eth': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'bnb': '0x55d398326f99059fF775485246999027B3197955',
    'matic': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
}
USDT_ABI = ('[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,'
            '"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress",'
            '"type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable",'
            '"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value",'
            '"type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable",'
            '"type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"",'
            '"type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,'
            '"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,'
            '"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply",'
            '"outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},'
            '{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},'
            '{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,'
            '"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress",'
            '"outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},'
            '{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"",'
            '"type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,'
            '"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,'
            '"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":['
            '{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},'
            '{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],'
            '"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],'
            '"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},'
            '{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{'
            '"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,'
            '"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{'
            '"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},'
            '{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,'
            '"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],'
            '"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view",'
            '"type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,'
            '"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner",'
            '"outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},'
            '{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,'
            '"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{'
            '"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},'
            '{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],'
            '"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},'
            '{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee",'
            '"type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable",'
            '"type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue",'
            '"outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,'
            '"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,'
            '"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner",'
            '"type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{'
            '"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},'
            '{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],'
            '"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"",'
            '"type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,'
            '"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser",'
            '"type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable",'
            '"type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"",'
            '"type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,'
            '"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,'
            '"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{'
            '"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,'
            '"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},'
            '{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals",'
            '"type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},'
            '{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue",'
            '"type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],'
            '"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress",'
            '"type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,'
            '"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],'
            '"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser",'
            '"type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds",'
            '"type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],'
            '"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user",'
            '"type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{'
            '"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},'
            '{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,'
            '"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},'
            '{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,'
            '"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause",'
            '"type":"event"}]')


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


def get_token_balance(w3, token_address, address):
    contract = w3.eth.contract(address=token_address, abi=USDT_ABI)
    balance = contract.functions.balanceOf(address).call()
    decimals = contract.functions.decimals().call()
    return balance / (10 ** decimals)


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

        # Getting ETH, BNB and MATIC balances
        balance_eth = get_balance(eth_w3, address)
        balance_bnb = get_balance(bnb_w3, address)
        balance_matic = get_balance(polygon_w3, address)

        # Getting USDT balances on different networks
        balance_usdt_eth = get_token_balance(eth_w3, USDT_CONTRACT_ADDRESSES['eth'], address)
        balance_usdt_bnb = get_token_balance(bnb_w3, USDT_CONTRACT_ADDRESSES['bnb'], address)
        balance_usdt_matic = get_token_balance(polygon_w3, USDT_CONTRACT_ADDRESSES['matic'], address)

        # Getting token balances
        token_balances = get_token_balances(address)

        return render(request, 'wallet_created.html', {
            'address': address,
            'balance_eth': balance_eth,
            'balance_bnb': balance_bnb,
            'balance_matic': balance_matic,
            'balance_usdt_eth': balance_usdt_eth,
            'balance_usdt_bnb': balance_usdt_bnb,
            'balance_usdt_matic': balance_usdt_matic,
            'token_balances': token_balances
        })
    return render(request, 'index.html')


def create_smart_wallet(request):
    # Logic of creating a smart wallet
    return render(request, 'create_smart_wallet.html')
