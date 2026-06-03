# Todo Client & Server (v0.2.0)

A minimal Todo list project consisting of a Vanilla JavaScript frontend and a Python/Flask backend. Developed as an academic project focusing on REST API design.

## Project Structure

```
/
├── client/          # Frontend (HTML, CSS, Vanilla JS)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── config.js    # API base URL configuration
└── server/          # REST API (Python, Flask)
    ├── server.py
    ├── requirements.txt
    └── openapi.yaml # API specification
```

## Installation & Setup

### Server

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS / Linux
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r server/requirements.txt
   ```

3. Start the server:
   ```bash
   python server/server.py
   ```
   The API will be available at `http://127.0.0.1:5000`.

### Client

The client is a static frontend with no build step required.

1. Open `client/config.js` and set `API_BASE_URL` to the address of your running server:
   ```js
   const CONFIG = {
       API_BASE_URL: "http://127.0.0.1:5000"
   };
   ```

2. Open `client/index.html` directly in your browser — or serve the `client/` folder with any static file server, e.g.:
   ```bash
   npx serve client/
   ```

## API

The full REST API specification is documented in [`server/openapi.yaml`](server/openapi.yaml).
