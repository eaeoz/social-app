#!/bin/bash

# Test script for Netlify contact function
# This script helps you test the contact function locally and in production

echo "=================================="
echo "Netlify Contact Function Test"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local URL=$1
    local DESCRIPTION=$2
    
    echo -e "${YELLOW}Testing: ${DESCRIPTION}${NC}"
    echo "URL: $URL"
    echo ""
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$URL" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "Test User",
            "email": "test@example.com",
            "subject": "Test Subject from Script",
            "message": "This is a test message to verify the Netlify function is working correctly with MongoDB credentials."
        }')
    
    HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
    HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')
    
    echo "Response Status: $HTTP_STATUS"
    echo "Response Body:"
    echo "$HTTP_BODY" | python -m json.tool 2>/dev/null || echo "$HTTP_BODY"
    echo ""
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✓ Test PASSED${NC}"
    else
        echo -e "${RED}✗ Test FAILED${NC}"
    fi
    echo "=================================="
    echo ""
}

# Check if running in interactive mode
if [ -t 0 ]; then
    echo "Select test mode:"
    echo "1) Test local development (http://localhost:8888)"
    echo "2) Test production (custom URL)"
    echo "3) Test both"
    echo ""
    read -p "Enter choice [1-3]: " CHOICE
    
    case $CHOICE in
        1)
            echo ""
            test_endpoint "http://localhost:8888/.netlify/functions/contact" "Local Development Server"
            ;;
        2)
            echo ""
            read -p "Enter your Netlify site URL (e.g., https://your-site.netlify.app): " SITE_URL
            test_endpoint "$SITE_URL/.netlify/functions/contact" "Production Server"
            ;;
        3)
            echo ""
            test_endpoint "http://localhost:8888/.netlify/functions/contact" "Local Development Server"
            read -p "Enter your Netlify site URL (e.g., https://your-site.netlify.app): " SITE_URL
            test_endpoint "$SITE_URL/.netlify/functions/contact" "Production Server"
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
else
    # Non-interactive mode - test local by default
    test_endpoint "http://localhost:8888/.netlify/functions/contact" "Local Development Server"
fi

echo ""
echo "Test completed!"
echo ""
echo "To view detailed logs:"
echo "  Local: Check the terminal where 'netlify dev' is running"
echo "  Production: Go to Netlify Dashboard → Functions → contact → Logs"
echo ""
