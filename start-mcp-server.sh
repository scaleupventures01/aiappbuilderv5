#!/bin/bash

# MCP Server Startup Script for Team Leader System
# This script starts the LiteLLM server for multi-LLM integration

echo "🚀 Starting MCP Server for Team Leader System..."

# Check if Python and LiteLLM are available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

if ! python3 -c "import litellm" &> /dev/null; then
    echo "❌ LiteLLM is not installed. Installing now..."
    python3 -m pip install litellm
fi

# Check for API keys
echo "🔑 Checking for API keys..."

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not set. Some models may not work."
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY not set. Some models may not work."
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "⚠️  GOOGLE_API_KEY not set. Some models may not work."
fi

# Start the server
echo "🔌 Starting LiteLLM server on port 4000..."
echo "📊 Server will be available at: http://localhost:4000"
echo "🏥 Health check: http://localhost:4000/health"
echo "📋 Models endpoint: http://localhost:4000/models"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start LiteLLM server
python3 -m litellm --config litellm_config.yaml --port 4000 --host 0.0.0.0 