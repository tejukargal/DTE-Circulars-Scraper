# DTE Circulars Scraper

A modern web application for scraping and extracting structured data from web pages, specifically designed for DTE circulars and similar content.

## Features

- **URL Input Validation**: Accept and validate website URLs
- **Web Scraping**: Extract structured data including titles, content, images, links, and metadata
- **Circular Detection**: Automatically identify and extract circular documents and PDFs
- **Dark/Light Theme**: Toggle with system preference detection and persistence
- **Mobile Responsive**: Optimized design for all screen sizes
- **Loading States**: Visual feedback during scraping operations
- **Error Handling**: Clear error messages for invalid URLs or failed requests

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Web Scraping**: Playwright
- **Build Tool**: Vite
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dte-circulars-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

### Development

1. Start both frontend and backend:
```bash
npm run dev:full
```

Or run them separately:

Frontend (http://localhost:5173):
```bash
npm run dev
```

Backend (http://localhost:3001):
```bash
npm run server
```

### Building for Production

```bash
npm run build
```

## Usage

1. Open the application in your browser
2. Enter a valid URL (defaults to the DTE circulars page)
3. Click the search button or press Enter
4. View the extracted data organized by type:
   - Circulars and documents
   - Links
   - Images
   - Content preview
   - Metadata

## API Endpoints

### POST /api/scrape

Scrape data from a given URL.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Page Title",
    "url": "https://example.com",
    "content": "Extracted text content...",
    "images": ["image1.jpg", "image2.png"],
    "links": [{"text": "Link Text", "href": "https://link.com"}],
    "metadata": {
      "description": "Page description",
      "keywords": "keyword1, keyword2",
      "author": "Author Name",
      "publishDate": "2023-01-01"
    },
    "circulars": [
      {
        "title": "Circular Title",
        "link": "https://example.com/circular.pdf",
        "date": "01/01/2023"
      }
    ]
  }
}
```

## Project Structure

```
├── backend/
│   ├── server.ts          # Express server
│   └── scraper.ts         # Playwright scraping logic
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## License

MIT License