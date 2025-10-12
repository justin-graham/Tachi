"""
Tachi SDK for Python
AI Crawler SDK for pay-per-crawl protocol with automatic payment processing
"""

import asyncio
import json
import time
from typing import Dict, Optional, Any, Union, TypedDict, Literal
from dataclasses import dataclass
from decimal import Decimal
import logging

import requests
from web3 import Web3
# from web3.middleware import geth_poa_middleware  # This import might not be available in newer versions
from eth_account import Account
from eth_typing import ChecksumAddress


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TachiError(Exception):
    """Base exception for Tachi SDK"""
    def __init__(self, message: str, code: str = "UNKNOWN_ERROR", details: Any = None):
        super().__init__(message)
        self.code = code
        self.details = details


class PaymentError(TachiError):
    """Payment-related errors"""
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, "PAYMENT_ERROR", details)


class NetworkError(TachiError):
    """Network-related errors"""
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, "NETWORK_ERROR", details)


@dataclass
class TachiConfig:
    """Configuration for Tachi SDK"""
    # Network configuration
    network: Literal['base', 'base-sepolia']
    rpc_url: str
    
    # Account configuration
    private_key: Optional[str] = None
    account_address: Optional[ChecksumAddress] = None
    
    # Payment configuration
    usdc_address: ChecksumAddress = None
    payment_processor_address: ChecksumAddress = None
    
    # Request configuration
    user_agent: str = "TachiSDK-Python/1.0"
    timeout: int = 30
    max_retries: int = 3
    
    def __post_init__(self):
        # Set default USDC addresses based on network
        if self.usdc_address is None:
            if self.network == 'base':
                self.usdc_address = Web3.to_checksum_address('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
            elif self.network == 'base-sepolia':
                self.usdc_address = Web3.to_checksum_address('0x036CbD53842c5426634e7929541eC2318f3dCF7e')


class PaymentInfo(TypedDict):
    """Payment information from 402 response"""
    amount: str
    currency: str
    network: str
    chain_id: int
    recipient: ChecksumAddress
    token_address: ChecksumAddress
    token_id: Optional[str]


class TachiResponse(TypedDict):
    """Response from fetch_with_tachi"""
    content: str
    status_code: int
    headers: Dict[str, str]
    payment_required: bool
    payment_amount: Optional[str]
    transaction_hash: Optional[str]


class TachiSDK:
    """
    Tachi SDK for AI crawlers
    Handles pay-per-crawl protocol with automatic payment processing
    """
    
    def __init__(self, config: TachiConfig):
        self.config = config
        self.w3 = None
        self.account = None
        self.session = requests.Session()
        
        # Initialize Web3 and account
        self._initialize_web3()
        self._initialize_account()
        
        # USDC contract ABI (minimal)
        self.usdc_abi = [
            {
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "inputs": [{"name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "spender", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "owner", "type": "address"},
                    {"name": "spender", "type": "address"}
                ],
                "name": "allowance",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
            },
            {
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            }
        ]
        
        # PaymentProcessor contract ABI (minimal)
        self.payment_processor_abi = [
            {
                "inputs": [
                    {"name": "publisher", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "payPublisher",
                "outputs": [],
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "crawlNFT", "type": "address"},
                    {"name": "tokenId", "type": "uint256"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "payPublisherByNFT",
                "outputs": [],
                "type": "function"
            }
        ]
    
    def _initialize_web3(self):
        """Initialize Web3 connection"""
        self.w3 = Web3(Web3.HTTPProvider(self.config.rpc_url))
        
        # Add PoA middleware for Base network (commented out due to web3.py version compatibility)
        # self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        if not self.w3.is_connected():
            raise NetworkError(f"Failed to connect to RPC endpoint: {self.config.rpc_url}")
        
        logger.info(f"Connected to {self.config.network} network")
    
    def _initialize_account(self):
        """Initialize account from private key"""
        if self.config.private_key:
            self.account = Account.from_key(self.config.private_key)
            logger.info(f"Account initialized: {self.account.address}")
        elif self.config.account_address:
            logger.info(f"Account address set: {self.config.account_address}")
        else:
            logger.warning("No private key or account address provided. Payment functionality will be limited.")
    
    def fetch_with_tachi(
        self, 
        url: str, 
        method: str = 'GET',
        headers: Optional[Dict[str, str]] = None,
        body: Optional[str] = None
    ) -> TachiResponse:
        """
        Main function to fetch content with automatic payment handling
        """
        headers = headers or {}
        
        # Step 1: Initial request
        logger.info(f"[TachiSDK] Fetching: {url}")
        
        initial_response = self._make_http_request(url, method, headers, body)
        
        # If not 402, return content immediately
        if initial_response.status_code != 402:
            return TachiResponse(
                content=initial_response.text,
                status_code=initial_response.status_code,
                headers=dict(initial_response.headers),
                payment_required=False,
                payment_amount=None,
                transaction_hash=None
            )
        
        logger.info("[TachiSDK] Payment required - processing payment...")
        
        # Step 2: Parse payment requirements
        payment_info = self._parse_payment_info(initial_response)
        logger.info(f"[TachiSDK] Payment info: {payment_info}")
        
        # Step 3: Process payment
        transaction_hash = self._process_payment(payment_info)
        logger.info(f"[TachiSDK] Payment sent: {transaction_hash}")
        
        # Step 4: Retry request with payment proof
        auth_headers = headers.copy()
        auth_headers['Authorization'] = f"Bearer {transaction_hash}"
        
        paid_response = self._make_http_request(url, method, auth_headers, body)
        
        if paid_response.status_code != 200:
            raise PaymentError(
                f"Payment verification failed: {paid_response.status_code}",
                {"transaction_hash": transaction_hash, "status": paid_response.status_code}
            )
        
        return TachiResponse(
            content=paid_response.text,
            status_code=paid_response.status_code,
            headers=dict(paid_response.headers),
            payment_required=True,
            payment_amount=payment_info['amount'],
            transaction_hash=transaction_hash
        )
    
    def _make_http_request(
        self, 
        url: str, 
        method: str, 
        headers: Dict[str, str], 
        body: Optional[str] = None
    ) -> requests.Response:
        """Make HTTP request with retry logic"""
        headers = headers.copy()
        headers['User-Agent'] = self.config.user_agent
        
        last_error = None
        
        for attempt in range(1, self.config.max_retries + 1):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    data=body,
                    timeout=self.config.timeout
                )
                return response
                
            except requests.RequestException as error:
                last_error = error
                logger.warning(f"[TachiSDK] Request attempt {attempt} failed: {error}")
                
                if attempt == self.config.max_retries:
                    raise NetworkError(
                        f"Request failed after {self.config.max_retries} attempts",
                        {"url": url, "last_error": str(last_error)}
                    )
                
                # Exponential backoff
                time.sleep(2 ** attempt)
        
        raise NetworkError(f"Request failed: {last_error}")
    
    def _parse_payment_info(self, response: requests.Response) -> PaymentInfo:
        """Parse payment information from 402 response"""
        headers = response.headers
        
        try:
            body = response.json()
        except json.JSONDecodeError:
            body = {}
        
        # Parse from headers (preferred)
        price = headers.get('x402-price')
        currency = headers.get('x402-currency')
        recipient = headers.get('x402-recipient')
        token_address = headers.get('x402-contract')
        chain_id = headers.get('x402-chain-id')
        
        # Convert price from wei to USDC if needed
        amount = price or body.get('payment', {}).get('amount', '0')
        if price and currency == 'USDC':
            # Convert from wei to USDC (6 decimals)
            amount = str(Decimal(price) / Decimal(10**6))
        
        # Fallback to body parsing
        payment_info = PaymentInfo(
            amount=amount,
            currency=currency or body.get('payment', {}).get('currency', 'USDC'),
            network=body.get('payment', {}).get('network', 'Base'),
            chain_id=int(chain_id or body.get('payment', {}).get('chainId', 8453)),
            recipient=Web3.to_checksum_address(recipient or body.get('payment', {}).get('recipient', '')),
            token_address=Web3.to_checksum_address(token_address or body.get('payment', {}).get('tokenAddress', '')),
            token_id=body.get('payment', {}).get('tokenId')
        )
        
        # Validate required fields
        if not payment_info['recipient'] or not payment_info['token_address']:
            raise PaymentError('Invalid payment information in 402 response', payment_info)
        
        return payment_info
    
    def _process_payment(self, payment_info: PaymentInfo) -> str:
        """Process payment using wallet"""
        if not self.account:
            raise PaymentError('Account not initialized. Private key required for payments.')
        
        # Convert amount to wei (USDC has 6 decimals)
        amount_in_wei = int(Decimal(payment_info['amount']) * Decimal(10**6))
        
        logger.info(f"[TachiSDK] Sending {payment_info['amount']} USDC to {payment_info['recipient']}")
        
        try:
            # Get USDC contract
            usdc_contract = self.w3.eth.contract(
                address=payment_info['token_address'],
                abi=self.usdc_abi
            )
            
            # Check USDC balance
            balance = usdc_contract.functions.balanceOf(self.account.address).call()
            logger.info(f"[TachiSDK] USDC balance: {Decimal(balance) / Decimal(10**6)} USDC")
            
            if balance < amount_in_wei:
                raise PaymentError(
                    f"Insufficient USDC balance. Required: {payment_info['amount']}, Available: {Decimal(balance) / Decimal(10**6)}",
                    {
                        "required": payment_info['amount'],
                        "available": str(Decimal(balance) / Decimal(10**6))
                    }
                )
            
            # Check allowance
            allowance = usdc_contract.functions.allowance(
                self.account.address,
                payment_info['recipient']
            ).call()
            
            # Approve if needed
            if allowance < amount_in_wei:
                logger.info('[TachiSDK] Approving PaymentProcessor to spend USDC...')
                
                approve_tx = usdc_contract.functions.approve(
                    payment_info['recipient'],
                    amount_in_wei
                ).build_transaction({
                    'from': self.account.address,
                    'gas': 100000,
                    'gasPrice': self.w3.eth.gas_price,
                    'nonce': self.w3.eth.get_transaction_count(self.account.address),
                })
                
                signed_approve_tx = self.account.sign_transaction(approve_tx)
                approve_tx_hash = self.w3.eth.send_raw_transaction(signed_approve_tx.rawTransaction)
                
                logger.info(f"[TachiSDK] Approval transaction: {approve_tx_hash.hex()}")
                
                # Wait for approval confirmation
                self.w3.eth.wait_for_transaction_receipt(approve_tx_hash)
                logger.info('[TachiSDK] Approval confirmed')
            
            # Send payment via PaymentProcessor
            payment_processor_contract = self.w3.eth.contract(
                address=payment_info['recipient'],
                abi=self.payment_processor_abi
            )
            
            # Use payPublisher function (assuming publisher address is available)
            publisher_address = self.config.payment_processor_address or payment_info['recipient']
            
            payment_tx = payment_processor_contract.functions.payPublisher(
                publisher_address,
                amount_in_wei
            ).build_transaction({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
            
            signed_payment_tx = self.account.sign_transaction(payment_tx)
            payment_tx_hash = self.w3.eth.send_raw_transaction(signed_payment_tx.rawTransaction)
            
            logger.info(f"[TachiSDK] Payment transaction: {payment_tx_hash.hex()}")
            
            # Wait for payment confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(payment_tx_hash)
            logger.info('[TachiSDK] Payment confirmed')
            
            return payment_tx_hash.hex()
            
        except Exception as error:
            logger.error(f'[TachiSDK] Payment failed: {error}')
            raise PaymentError(
                f"Payment transaction failed: {str(error)}",
                {"payment_info": payment_info, "error": str(error)}
            )
    
    def get_usdc_balance(self) -> Dict[str, Union[int, str]]:
        """Get USDC balance for the account"""
        if not self.account:
            raise TachiError('Account not initialized. Private key required.', 'CONFIG_ERROR')
        
        usdc_contract = self.w3.eth.contract(
            address=self.config.usdc_address,
            abi=self.usdc_abi
        )
        
        balance = usdc_contract.functions.balanceOf(self.account.address).call()
        
        return {
            'wei': balance,
            'formatted': str(Decimal(balance) / Decimal(10**6))
        }
    
    def get_account_address(self) -> Optional[ChecksumAddress]:
        """Get account address"""
        return self.account.address if self.account else None

    # === Tachi API Integration Methods ===

    def register_crawler(self, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Register crawler with Tachi API"""
        api_url = getattr(self.config, 'api_url', 'http://localhost:3001')
        
        registration_data = {
            'name': 'AI Crawler',
            'contact': 'crawler@example.com',
            'description': 'Automated content crawler',
            'companyName': 'AI Company',
            'type': 'startup',
        }
        
        if data:
            registration_data.update(data)
        
        try:
            response = self.session.post(
                f'{api_url}/api/crawlers/register',
                json=registration_data,
                headers={'User-Agent': self.config.user_agent},
                timeout=self.config.timeout
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Store API key if provided
            if 'apiKey' in result:
                self.config.api_key = result['apiKey']
            
            return result
            
        except requests.RequestException as e:
            raise NetworkError(f'Registration failed: {str(e)}', {'response': getattr(e, 'response', None)})

    def authenticate(self, api_key: Optional[str] = None) -> Dict[str, Any]:
        """Authenticate with Tachi API using API key"""
        key = api_key or getattr(self.config, 'api_key', None)
        if not key:
            raise TachiError('API key required for authentication', 'CONFIG_ERROR')
        
        api_url = getattr(self.config, 'api_url', 'http://localhost:3001')
        
        try:
            response = self.session.post(
                f'{api_url}/api/crawlers/auth',
                json={'apiKey': key},
                headers={'User-Agent': self.config.user_agent},
                timeout=self.config.timeout
            )
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            raise NetworkError(f'Authentication failed: {str(e)}', {'response': getattr(e, 'response', None)})

    def get_publishers_directory(self) -> Dict[str, Any]:
        """Get publishers directory from Tachi API"""
        api_url = getattr(self.config, 'api_url', 'http://localhost:3001')
        
        try:
            response = self.session.get(
                f'{api_url}/api/publishers/directory',
                headers={'User-Agent': self.config.user_agent},
                timeout=self.config.timeout
            )
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            raise NetworkError(f'Failed to fetch publishers: {str(e)}', {'response': getattr(e, 'response', None)})

    def fetch_content(self, domain: str, path: str, token: Optional[str] = None) -> Dict[str, Any]:
        """Fetch content through Tachi API with authentication"""
        api_url = getattr(self.config, 'api_url', 'http://localhost:3001')
        url = f'{api_url}/api/content/{domain}/{path}'
        
        headers = {'User-Agent': self.config.user_agent}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            response = self.session.get(url, headers=headers, timeout=self.config.timeout)
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            raise NetworkError(f'Content fetch failed: {str(e)}', {'response': getattr(e, 'response', None)})

    def get_content_pricing(self, domain: str) -> Dict[str, Any]:
        """Get content pricing for a domain"""
        api_url = getattr(self.config, 'api_url', 'http://localhost:3001')
        
        try:
            response = self.session.get(
                f'{api_url}/api/content/pricing/{domain}',
                headers={'User-Agent': self.config.user_agent},
                timeout=self.config.timeout
            )
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            raise NetworkError(f'Failed to fetch pricing: {str(e)}', {'response': getattr(e, 'response', None)})

    def batch_request(self, requests_list: list, token: Optional[str] = None) -> Dict[str, Any]:
        """Perform batch content requests"""
        api_url = getattr(self.config, 'api_url', 'http://localhost:3001')
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': self.config.user_agent
        }
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            response = self.session.post(
                f'{api_url}/api/content/batch',
                json={'requests': requests_list},
                headers=headers,
                timeout=self.config.timeout
            )
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            raise NetworkError(f'Batch request failed: {str(e)}', {'response': getattr(e, 'response', None)})

    def check_health(self) -> Dict[str, Any]:
        """Check API health"""
        api_url = getattr(self.config, 'api_url', 'http://localhost:3001')
        
        try:
            response = self.session.get(
                f'{api_url}/health',
                headers={'User-Agent': self.config.user_agent},
                timeout=self.config.timeout
            )
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            raise NetworkError(f'Health check failed: {str(e)}', {'response': getattr(e, 'response', None)})


# Convenience functions
def fetch_with_tachi(
    url: str, 
    config: TachiConfig,
    method: str = 'GET',
    headers: Optional[Dict[str, str]] = None,
    body: Optional[str] = None
) -> TachiResponse:
    """Convenience function for quick usage"""
    sdk = TachiSDK(config)
    return sdk.fetch_with_tachi(url, method, headers, body)


def create_base_sdk(
    rpc_url: str,
    private_key: Optional[str] = None,
    payment_processor_address: Optional[ChecksumAddress] = None,
    **kwargs
) -> TachiSDK:
    """Create a pre-configured SDK instance for Base mainnet"""
    config = TachiConfig(
        network='base',
        rpc_url=rpc_url,
        private_key=private_key,
        payment_processor_address=payment_processor_address,
        **kwargs
    )
    return TachiSDK(config)


def create_base_sepolia_sdk(
    rpc_url: str,
    private_key: Optional[str] = None,
    payment_processor_address: Optional[ChecksumAddress] = None,
    **kwargs
) -> TachiSDK:
    """Create a pre-configured SDK instance for Base Sepolia testnet"""
    config = TachiConfig(
        network='base-sepolia',
        rpc_url=rpc_url,
        private_key=private_key,
        payment_processor_address=payment_processor_address,
        **kwargs
    )
    return TachiSDK(config)


# Export main classes and functions
__all__ = [
    'TachiSDK',
    'TachiConfig',
    'TachiResponse',
    'PaymentInfo',
    'TachiError',
    'PaymentError',
    'NetworkError',
    'fetch_with_tachi',
    'create_base_sdk',
    'create_base_sepolia_sdk'
]
