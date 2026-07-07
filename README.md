# Ăn Bụi · Eat Dust 🌪

Budget street food map for Ho Chi Minh City — local MVP.

## Setup (one time)

```bash
cd an-bui
npm install
```

## Run

```bash
npm run dev
```

Then open **http://localhost:5173**

Two processes start together:
- **Vite** (frontend) on port 5173
- **json-server** (data API) on port 3001

## How it works

| What | Where |
|---|---|
| All spot data | `db.json` — edits persist automatically |
| Add a spot | Click the map → form opens with location pre-filled |
| Add a spot (manual) | "＋ Thêm quán" button → use GPS or type coords |
| Vote on a price | Tap a pin → "Còn đúng" / "Tăng rồi" |
| Filter | ⚙ Lọc button top-right |
| New spots | Blue "new" badge = submitted < 7 days (tribunal period) |

## Price tiers (pin colours)

| Colour | Price |
|---|---|
| 🟢 Green | Under 30,000₫ |
| 🟡 Amber | 30,000–50,000₫ |
| 🔴 Red | 50,001–80,000₫ |

## Tech

- **React 18** + Vite
- **Leaflet** + OpenStreetMap (no API key needed)
- **json-server** — REST API backed by `db.json`

## Seed data

15 real HCMC street food spots pre-loaded across:
District 1, 3, 4, 5, 10, Bình Thạnh, Gò Vấp, Tân Bình, Phú Nhuận
