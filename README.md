# 🔥 Flame: Smart Start Page with GeoIP Weather

**Flame** is a self-hosted homepage for your homelab or server — now enhanced with:

- 🌦 Weather based on **client IP geolocation** (automatic)
- 💾 Fallback to custom coordinates from `config.json` as configured in GUI settings
- 🔁 Caching logic to reduce WeatherAPI requests
- 🗄️ External logging, including reverse proxy logic for IPs, for integration to Vector > mtail > Prometheus > Grafana
- 🐳 Docker-first deployment using the included Dockerfile

---

## 📦 Features

- Bookmark & application launcher
- Categories for bookmarks and (soon) apps
- IP geolocation-based weather with caching
- Light & dark themes
- Mobile-responsive design
- No database required — JSON file-backed
- Secure auth with optional login
- Traefik-friendly and ready for reverse proxy setups

---

## 🚀 Quick Start (Docker)

```yaml
version: "3.8"

services:
  flame:
    build:
      context: https://github.com/spiicytuna/flame.git#feature/weather-by-ip-location-and-app-categories:.docker
      dockerfile: Dockerfile
    container_name: flame
    restart: unless-stopped
    ports:
      - "5005:5005"
    volumes:
      - /path/to/data:/app/data
      - /path/to/ext/log:/app/log
    environment:
      - PASSWORD=changeme
      - WEATHER_CACHE_HOURS=6
```

## 🌎 IP-Based Weather

- Uses public services like `ip-api.com` and `ipinfo.io` to determine client geolocation.
- Falls back to static coordinates defined in `config.json` (from Flame settings) if IP lookup fails.
- Weather is retrieved from [WeatherAPI.com](https://www.weatherapi.com/), using your API key.
- Supports IP-based switching (e.g. VPN users will see weather for new IP automatically).

### 🔁 Caching Logic

- Weather is cached per `lat,lon` pair for a configurable duration via `WEATHER_CACHE_HOURS` (defaults to 3).
- Cached weather is served on all subsequent connections from the same IP/location.
- If the IP address changes, weather is re-fetched immediately and cached separately.
- Logs show whether the request was served from cache or fetched fresh.

```log
[Weather] Fetching fresh data from WeatherAPI for key 37.6403,-122.0667
[Weather] Serving from cache for key 37.6403,-122.0667
```

---

## 🧠 How It Works

- On client connection, Flame reads the external IP and resolves coordinates.
- The backend sends the weather data via WebSocket (`/socket`) to the frontend.
- This enables real-time updates on page load — no reload required.
- If the client’s coordinates differ from what’s in the SQLite DB (or cache TTL expired), it fetches new data.

### 🗃 Where Data Is Stored

| File                    | Purpose                                 |
|-------------------------|-----------------------------------------|
| `data/config.json`      | Static lat/lon fallback, units, etc.    |
| `data/geo-cache.json`   | IP → lat/lon cache                      |
| `data/access.log`      | Weather fetch & WebSocket logs (if enabled) |

---

## 🔧 Optional Environment Variables

| Variable              | Description                                              | Default     |
|-----------------------|----------------------------------------------------------|-------------|
| `WEATHER_CACHE_HOURS` | Max time to cache weather data per unique IP location    | `3`         |
| `PASSWORD`            | Initial login password                                   | _none_      |
| `PORT`                | HTTP port Flame listens on                               | `5005`      |
| `NODE_ENV`            | Set to `production` or `development`                     | `production`|

_Important_: If `WEATHER_CACHE_HOURS` is set above 23, it is clamped to 23 and logged.

---

## 📁 Data Volume Structure

Make sure to persist `/app/data` in your Docker container.

```plaintext
/app/data/
├── apps.json            # Application entries
├── bookmarks.json       # Bookmarks and categories
├── categories.json      # Bookmark categories
├── config.json          # Settings (API key, units, etc.)
├── geo-cache.json       # IP-to-location cache
├── users.json           # Login credentials
└── access.log          # Optional debug/weather logging
```

---

## 🛠 Manual Build (Optional)

To build from your fork:

```bash
git clone https://github.com/spiicytuna/flame.git
cd flame
docker build -f .docker/Dockerfile -t flame-custom .
```

Then run with:

```bash
docker run -p 5005:5005 -v /your/data:/app/data flame-custom
```

## 📄 License

MIT License
