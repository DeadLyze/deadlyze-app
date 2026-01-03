/**
 * Service for interacting with Deadlock Assets API
 * Documentation: https://assets.deadlock-api.com/scalar
 */

import {
  ASSETS_API_BASE_URL,
  HERO_FETCH_DELAY_MS,
} from "../constants/apiConstants";

const BASE_URL = ASSETS_API_BASE_URL;

/**
 * Utility function to add delay between requests
 * @param ms - Milliseconds to delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// === Hero Interfaces ===

export interface HeroImages {
  selection_image_webp?: string;
  top_bar_image_webp?: string;
}

export interface Hero {
  id: number;
  name: string;
  images: HeroImages;
}

// === Rank Interfaces ===

export interface RankImages {
  small_subrank1_webp?: string;
  small_subrank2_webp?: string;
  small_subrank3_webp?: string;
  small_subrank4_webp?: string;
  small_subrank5_webp?: string;
  small_subrank6_webp?: string;
}

export interface Rank {
  tier: number;
  name: string;
  images: RankImages;
}

/**
 * Service for fetching Deadlock game assets
 */
export class AssetsService {
  /**
   * Fetch hero data by hero ID
   * @param heroId - Hero ID number
   * @returns Hero data including name and images
   */
  static async fetchHeroById(heroId: number): Promise<Hero> {
    try {
      const url = `${BASE_URL}/v2/heroes/${heroId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const hero: Hero = await response.json();
      return hero;
    } catch (error) {
      throw new Error(
        typeof error === "string"
          ? error
          : `Failed to fetch hero data for ID ${heroId}`
      );
    }
  }

  /**
   * Batch fetch multiple heroes by IDs
   * @param heroIds - Array of hero IDs
   * @returns Map of hero ID to Hero data
   */
  static async fetchHeroesByIds(heroIds: number[]): Promise<Map<number, Hero>> {
    try {
      const uniqueIds = [...new Set(heroIds)];

      const heroPromises = uniqueIds.map(async (id, index) => {
        // Add small delay between requests to avoid rate limiting
        if (index > 0) {
          await delay(HERO_FETCH_DELAY_MS);
        }
        return this.fetchHeroById(id).catch(() => null);
      });

      const heroes = await Promise.all(heroPromises);
      const heroMap = new Map<number, Hero>();

      heroes.forEach((hero) => {
        if (hero) {
          heroMap.set(hero.id, hero);
        }
      });

      return heroMap;
    } catch (error) {
      throw new Error("Failed to fetch hero data");
    }
  }

  /**
   * Get hero icon URL (WebP format) by hero ID
   * Returns top_bar_image_webp from hero images, falls back to selection_image_webp
   * @param heroId - Hero ID number
   * @returns Image URL or empty string if not found
   */
  static async getHeroIconUrl(heroId: number): Promise<string> {
    try {
      const hero = await this.fetchHeroById(heroId);
      return (
        hero.images.top_bar_image_webp || hero.images.selection_image_webp || ""
      );
    } catch (error) {
      return "";
    }
  }

  /**
   * Fetch all ranks from the game
   * @returns Array of all ranks with their images
   */
  static async fetchAllRanks(): Promise<Rank[]> {
    try {
      const url = `${BASE_URL}/v2/ranks`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const ranks: Rank[] = await response.json();
      return ranks;
    } catch (error) {
      throw new Error("Failed to fetch rank data");
    }
  }

  /**
   * Get rank image URL by division and division_tier
   * @param division - Rank tier (0-11)
   * @param divisionTier - Subrank within tier (1-6)
   * @param ranks - Array of ranks (fetched once via fetchAllRanks)
   * @returns Rank image URL or empty string if not found
   */
  static getRankImageUrl(
    division: number,
    divisionTier: number,
    ranks: Rank[]
  ): string {
    const rank = ranks.find((r) => r.tier === division);
    if (!rank) return "";

    const subrankKey = `small_subrank${divisionTier}_webp` as keyof RankImages;
    return rank.images[subrankKey] || "";
  }
}
