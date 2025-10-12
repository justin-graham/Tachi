#!/usr/bin/env python3

"""
Tachi Python SDK Demo Script
Demonstrates how to use the Tachi Pay-Per-Crawl Python SDK
"""

import sys
import os

# Add the tachi_sdk to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from tachi_sdk import TachiSDK, TachiConfig


def main():
    print("🚀 Tachi Python SDK Demo Starting...\n")

    # Initialize SDK with demo configuration
    config = TachiConfig(
        # API configuration (add this field to the config)
        network='base-sepolia',
        rpc_url='https://sepolia.base.org',
        payment_processor_address='0x1234567890123456789012345678901234567890',
        user_agent='TachiSDK-Python-Demo/1.0',
        timeout=10,
    )
    
    # Add API URL to config (since it might not be in the dataclass)
    config.api_url = 'http://localhost:3001'

    sdk = TachiSDK(config)

    try:
        # Step 1: Check API health
        print("1. Checking API health...")
        health = sdk.check_health()
        print(f"✅ API Status: {health['status']}")
        print(f"   Service: {health['service']}")
        print(f"   Version: {health['version']}")
        print()

        # Step 2: Register as a crawler
        print("2. Registering crawler...")
        registration = sdk.register_crawler({
            'name': 'Demo Python Crawler',
            'contact': 'demo@python-crawler.com',
            'description': 'A demo Python crawler for testing the Tachi API',
            'companyName': 'Python AI Company',
            'type': 'startup',
        })
        
        print("✅ Crawler registered!")
        print(f"   Crawler ID: {registration['crawler']['id']}")
        print(f"   API Key: {registration['apiKey']}")
        print(f"   Credits: {registration['crawler']['credits']}")
        print()

        # Step 3: Authenticate with the API key
        print("3. Authenticating with API key...")
        auth = sdk.authenticate(registration['apiKey'])
        print("✅ Authentication successful!")
        print(f"   Token received: {auth['token'][:20]}...")
        print()

        # Step 4: Get publishers directory
        print("4. Fetching publishers directory...")
        publishers = sdk.get_publishers_directory()
        print(f"✅ Publishers found: {publishers['total']}")
        for i, pub in enumerate(publishers['publishers'], 1):
            print(f"   {i}. {pub['name']} ({pub['domain']}) - ${pub['pricePerRequest']}/request")
        print()

        # Step 5: Get pricing for a specific domain
        if publishers['publishers']:
            first_publisher = publishers['publishers'][0]
            print(f"5. Getting pricing for {first_publisher['domain']}...")
            pricing = sdk.get_content_pricing(first_publisher['domain'])
            print("✅ Pricing info:")
            print(f"   Base price: {pricing.get('basePrice', 'N/A')}")
            print(f"   Currency: {pricing.get('currency', 'N/A')}")
            print()

        # Step 6: Fetch content with authentication
        print("6. Fetching content...")
        content = sdk.fetch_content('example.com', 'article/123', auth['token'])
        print("✅ Content retrieved!")
        print(f"   URL: {content['url']}")
        print(f"   Content length: {len(content['content'])} characters")
        print(f"   Charged: {content['billing']['charged']}")
        print(f"   Credits remaining: {content['billing']['remainingCredits']}")
        print()

        # Step 7: Batch request example
        print("7. Performing batch request...")
        batch_requests = [
            {'domain': 'example.com', 'path': 'article/123'},
            {'domain': 'example.com', 'path': 'article/456'},
        ]
        
        batch_results = sdk.batch_request(batch_requests, auth['token'])
        print("✅ Batch request completed!")
        print(f"   Results: {len(batch_results['results'])}")
        print(f"   Total cost: {batch_results['totalCost']}")
        print()

        print("🎉 Demo completed successfully!")
        
    except Exception as error:
        print(f"❌ Demo failed: {error}")
        sys.exit(1)


if __name__ == "__main__":
    main()
