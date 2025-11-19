#!/bin/bash

echo "🚀 Simple LangGraph Server"
echo "=========================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Environment file not found!"
    echo ""
    echo "Please create a .env file with your OpenAI API key:"
    echo ""
    echo "cp env.example .env"
    echo ""
    echo "Then edit .env and add your OPENAI_API_KEY"
    echo ""
    exit 1
fi

# Check if OPENAI_API_KEY is set
source .env
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY is not set in .env file"
    echo ""
    echo "Please edit .env and add your OpenAI API key:"
    echo "OPENAI_API_KEY=your_api_key_here"
    echo ""
    exit 1
fi

echo "✅ Environment configured"
echo "🔧 Building server..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo "🚀 Starting server..."
    echo ""
    npm start
else
    echo "❌ Build failed"
    exit 1
fi
