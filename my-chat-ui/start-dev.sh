#!/bin/bash

echo "🚀 Starting My Chat UI Development Environment"
echo "=============================================="
echo ""

# Check if simple-langgraph-server is running
if ! curl -s http://localhost:2024/health > /dev/null; then
    echo "⚠️  Simple LangGraph Server is not running on port 2024"
    echo ""
    echo "Please start the server first:"
    echo "cd ../simple-langgraph-server && npm start"
    echo ""
    exit 1
fi

echo "✅ Simple LangGraph Server is running on port 2024"
echo ""

# Set environment variables for the chat UI
export VITE_API_URL=http://localhost:2024
export VITE_ASSISTANT_ID=agent

echo "🔧 Environment configured:"
echo "   API URL: $VITE_API_URL"
echo "   Assistant ID: $VITE_ASSISTANT_ID"
echo ""

echo "🚀 Starting Chat UI..."
echo ""

# Start the development server
npm run dev
