# Deadlock Assets API Scripts

Scripts for working with [Deadlock Assets API](https://assets.deadlock-api.com/scalar).

## Script Structure

Each script works with a specific API endpoint. Script names correspond to endpoint names.

### Input Data

Depending on the endpoint, scripts accept:

- **Hero ID** (example: `1` for Infernus)
- **Rank ID** (example: `3` for Emissary)
- **Item ID** (example: `12` for Basic Magazine)

### Output Data

Scripts return various fields depending on the request type:

#### Heroes

- `name` - hero name
- `images.selection_image_webp` - large hero image for selection
- `images.icon_hero_card_webp` - hero card
- `starting_stats` - starting stats
- and other fields from response

#### Items

- `name` - item name
- `image` - item image
- `cost` - cost
- `passive_bonus` - passive bonuses
- and other fields

#### Ranks

- `name` - rank name
- `tier` - rank tier (0-11, where 0 is Obscurus placeholder)
- `images.small_subrank1_webp` - small subrank 1 image
- `images.small_subrank2_webp` - small subrank 2 image
- `images.small_subrank3_webp` - small subrank 3 image
- `images.small_subrank4_webp` - small subrank 4 image
- `images.small_subrank5_webp` - small subrank 5 image
- `images.small_subrank6_webp` - small subrank 6 image
- Note: Tier 0 (Obscurus) has no subrank images

## Output Format

Each script:

1. Displays its name
2. Shows retrieved data
3. For lists - displays each record separately

## Constants

- `BASE_URL` - API base URL (`https://assets.deadlock-api.com`)
- `ENDPOINT` - path to specific endpoint

## Data Structures

API responses are mapped to Rust structures using `serde` for deserialization.
