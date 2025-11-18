# Real Image Search Implementation

## ✅ Now Using Real Web Image Search!

Your chatbot now **actually searches the web** for images instead of using placeholder URLs!

## How It Works

### 1. User Request
```
User: "Show me 5 images of taj mahal"
```

### 2. AI Tool Call
```
AI calls: searchAndCreateSlider(query: "taj mahal", count: 5)
```

### 3. Backend Searches Web
- Backend receives tool call
- Calls **Pexels API** to search for "taj mahal"
- Gets 5 real image URLs
- Returns them to frontend

### 4. Frontend Renders
- ImageSlider displays the 5 real images of Taj Mahal

## Setup (Optional - Get Real Images)

### Without API Key (Current):
- Works immediately
- Uses placeholder images (Picsum)
- Images are NOT topic-specific

### With Pexels API Key (Recommended):
- **Free** - 200 requests per hour
- **Real** topic-specific images
- Takes 2 minutes to setup

## Get Pexels API Key (FREE)

### Step 1: Sign Up
1. Go to https://www.pexels.com/api/
2. Click "Get Started"
3. Create free account

### Step 2: Get API Key
1. After signup, go to: https://www.pexels.com/api/documentation/
2. Scroll down to "Your API Key"
3. Copy your API key

### Step 3: Add to .env
In `backend/.env` file, add:
```env
PEXELS_API_KEY=your_api_key_here
```

### Step 4: Restart Backend
```bash
cd backend
npm start
```

That's it! Now you'll get **real images**! 🎉

## Testing

### Without Pexels Key:
```
User: "Show me 5 images of cats"
Result: 5 placeholder images (not cats)
```

### With Pexels Key:
```
User: "Show me 5 images of cats"
Result: 5 actual cat photos from Pexels! 🐱
```

## Backend Changes Made

### 1. New System Prompt
- AI now calls `searchAndCreateSlider(query, count)`
- Simpler - no need to generate URLs
- Backend handles the search

### 2. Image Search Function
```javascript
async function searchImages(query, count) {
  // If Pexels API key exists:
  //   → Search Pexels for real images
  // Else:
  //   → Return placeholder images
}
```

### 3. Tool Execution
- Backend intercepts tool call
- Executes image search
- Returns real URLs to frontend

## Why This Is Better

### Before:
❌ GPT tried to generate URLs (couldn't actually search)
❌ Used deprecated Unsplash Source API
❌ Images didn't load / were null

### Now:
✅ Backend actually searches the web
✅ Real, topic-specific images
✅ Falls back to placeholders if no API key
✅ Works with any search term

## Alternative APIs (If You Want)

### Unsplash API
- Website: https://unsplash.com/developers
- Pros: High quality photos
- Cons: 50 requests/hour free tier

### Pixabay API
- Website: https://pixabay.com/api/docs/
- Pros: 100 requests/minute
- Cons: Requires attribution

### Current (Pexels)
- Website: https://www.pexels.com/api/
- Pros: 200 req/hour, no attribution needed
- Best for this use case! ✅

## Example Flow

```
1. User: "Give me 7 sunset images"

2. Frontend → Backend:
   POST /api/chat
   { messages: [...] }

3. Backend → OpenAI:
   "User wants 7 sunset images"
   
4. OpenAI → Backend:
   Tool call: searchAndCreateSlider("sunset", 7)
   
5. Backend → Pexels API:
   GET /v1/search?query=sunset&per_page=7
   
6. Pexels → Backend:
   { photos: [
     { src: { large: "https://..." } },
     { src: { large: "https://..." } },
     ...
   ]}
   
7. Backend → Frontend:
   {
     toolCalls: [{
       name: "createSlider",
       args: {
         topic: "sunset",
         count: 7,
         imageUrls: ["https://...", "https://...", ...]
       }
     }]
   }
   
8. Frontend renders ImageSlider with 7 real sunset images! 🌅
```

## Logs to Check

**Backend console should show:**
```
Tool called: searchAndCreateSlider with args: { query: 'sunset', count: 7 }
Found image URLs: [ 'https://images.pexels.com/...', ... ]
```

**If working:** You'll see Pexels URLs
**If no API key:** You'll see "No Pexels API key found, using placeholder images"

## Troubleshooting

### Still getting placeholder images?
1. Check `backend/.env` has `PEXELS_API_KEY=...`
2. Restart backend server
3. Check backend logs for "No Pexels API key found"

### Getting API errors?
1. Check API key is correct
2. Check you haven't exceeded 200 requests/hour
3. Check backend logs for error messages

### Images not loading?
1. Check browser console for image load errors
2. Check network tab - are Pexels URLs being fetched?
3. Some Pexels images might be slow to load

---

**Status**: ✅ Real web image search is now working!

Without API key: Uses placeholders (works now)
With API key: Uses real searched images (recommended!)


