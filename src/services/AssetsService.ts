/**
 * Service for interacting with Deadlock Assets API
 * Documentation: https://assets.deadlock-api.com/scalar
 */

const BASE_URL = "https://assets.deadlock-api.com";

/**
 * Utility function to add delay between requests
 * @param ms - Milliseconds to delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// === Hero Interfaces ===

export interface HeroImages {
  selection_image_webp?: string;
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
      console.log(`Fetching hero data for ID: ${heroId}`);

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
      console.log(`Hero data received:`, hero.name);
      return hero;
    } catch (error) {
      console.error(`Failed to fetch hero ${heroId}:`, error);
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
      console.log(`Fetching ${uniqueIds.length} heroes...`);

      const heroPromises = uniqueIds.map(async (id, index) => {
        // Add 1ms delay between requests to avoid rate limiting
        if (index > 0) {
          await delay(1);
        }
        return this.fetchHeroById(id).catch((error) => {
          console.error(`Failed to fetch hero ${id}:`, error);
          return null;
        });
      });

      const heroes = await Promise.all(heroPromises);
      const heroMap = new Map<number, Hero>();
      const failedIds: number[] = [];

      heroes.forEach((hero, index) => {
        if (hero) {
          heroMap.set(hero.id, hero);
        } else {
          failedIds.push(uniqueIds[index]);
        }
      });

      console.log(
        `Successfully fetched ${heroMap.size}/${uniqueIds.length} heroes`
      );

      if (failedIds.length > 0) {
        console.log(`Failed to fetch heroes: ${failedIds.join(", ")}`);
      }

      return heroMap;
    } catch (error) {
      console.error("Failed to batch fetch heroes:", error);
      throw new Error("Failed to fetch hero data");
    }
  }

  /**
   * Get hero icon URL (WebP format) by hero ID
   * Returns selection_image_webp from hero images
   * @param heroId - Hero ID number
   * @returns Image URL or empty string if not found
   */
  static async getHeroIconUrl(heroId: number): Promise<string> {
    try {
      const hero = await this.fetchHeroById(heroId);
      return hero.images.selection_image_webp || "";
    } catch (error) {
      console.error(`Failed to get icon for hero ${heroId}:`, error);
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
      console.log("Fetching all ranks...");

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
      console.log(`Fetched ${ranks.length} ranks`);
      return ranks;
    } catch (error) {
      console.error("Failed to fetch ranks:", error);
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
    if (!rank) {
      console.warn(`Rank not found for division ${division}`);
      return "";
    }

    const subrankKey = `small_subrank${divisionTier}_webp` as keyof RankImages;
    const imageUrl = rank.images[subrankKey];

    if (!imageUrl) {
      console.warn(
        `Subrank image not found for division ${division}, tier ${divisionTier}`
      );
      return "";
    }

    return imageUrl;
  }
}
