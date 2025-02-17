import { getCachedMedia, cacheMedia, cleanMediaCache } from '../idb';

interface MediaLoadOptions {
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

class MediaPreloader {
  private loadingPromises = new Map<string, Promise<Blob>>();
  private loadQueue: string[] = [];
  private isProcessingQueue = false;
  private maxConcurrent = 2;

  private async fetchAndCache(cid: string, options: MediaLoadOptions = {}): Promise<Blob> {
    try {
      // Check cache first
      const cached = await getCachedMedia(cid);
      if (cached) {
        options.onComplete?.();
        return cached;
      }

      // Fetch from IPFS
      const response = await fetch(`https://premium.w3ipfs.storage/ipfs/${cid}`);
      if (!response.ok) throw new Error(`Failed to load media: ${response.statusText}`);

      // Get total size for progress calculation
      const totalSize = Number(response.headers.get('content-length')) || 0;
      let loaded = 0;

      // Create response stream
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        options.onProgress?.(totalSize ? loaded / totalSize : 0);
      }

      // Combine chunks into blob
      const blob = new Blob(chunks);
      
      // Cache the blob
      await cacheMedia(cid, blob);
      
      options.onComplete?.();
      return blob;
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.loadQueue.length > 0) {
        const processing = new Set<Promise<void>>();
        
        while (processing.size < this.maxConcurrent && this.loadQueue.length > 0) {
          const cid = this.loadQueue.shift()!;
          if (!this.loadingPromises.has(cid)) {
            const loadPromise = this.fetchAndCache(cid);
            const processPromise = loadPromise.then(() => {
              processing.delete(processPromise);
              this.loadingPromises.delete(cid);
            });
            processing.add(processPromise);
            this.loadingPromises.set(cid, loadPromise);
          }
        }

        if (processing.size > 0) {
          await Promise.race(processing);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  public preloadMedia(cid: string, options: MediaLoadOptions = {}): Promise<Blob> {
    // If already loading, return existing promise
    const existing = this.loadingPromises.get(cid);
    if (existing) return existing;

    // Start new load
    const promise = this.fetchAndCache(cid, options);
    this.loadingPromises.set(cid, promise);
    return promise;
  }

  public queuePreload(cids: string[]) {
    // Add unique CIDs to queue
    const newCids = cids.filter(cid => 
      !this.loadQueue.includes(cid) && 
      !this.loadingPromises.has(cid)
    );
    this.loadQueue.push(...newCids);
    void this.processQueue();
  }

  public async cleanCache(): Promise<void> {
    await cleanMediaCache();
  }
}

// Singleton instance
export const mediaPreloader = new MediaPreloader(); 