import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TmdbService } from '../services/tmdb.service';
import { MediaCarouselComponent, MediaRowItem } from '../home/media-carousel';
import { HeroCarouselComponent, HeroSlide } from '../home/hero-carousel';
import { PreviewSheetComponent, PreviewPlayEvent } from '../home/preview-sheet';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-series-page',
  imports: [NgIf, NgFor, MediaCarouselComponent, HeroCarouselComponent, PreviewSheetComponent],
  template: `
    <div class="loading-screen" [class.done]="!isLoading">
      <img src="assets/Stream 1.png" alt="Stream" class="loading-logo" />
    </div>

    <app-hero-carousel
      *ngIf="heroSlides.length > 0"
      [slides]="heroSlides"
      (slideClick)="onHeroClick($event)"
    ></app-hero-carousel>

    <section class="page">
      <h1>Series</h1>

      <h2>Top Rated</h2>
      <app-media-carousel
        *ngIf="topRatedItems.length > 0"
        [items]="topRatedItems"
        (itemClick)="onCarouselClick($event)"
        (nearEnd)="loadMoreTopRated()"
      ></app-media-carousel>

      <h2>Popular</h2>
      <app-media-carousel
        *ngIf="popularItems.length > 0"
        [items]="popularItems"
        (itemClick)="onCarouselClick($event)"
        (nearEnd)="loadMorePopular()"
      ></app-media-carousel>

      <ng-container *ngFor="let gc of genreCarousels">
        <h2>{{ gc.name }}</h2>
        <app-media-carousel
          *ngIf="gc.items.length > 0"
          [items]="gc.items"
          (itemClick)="onCarouselClick($event)"
          (nearEnd)="loadMoreGenre(gc)"
        ></app-media-carousel>
      </ng-container>
    </section>

    <app-preview-sheet
      [open]="previewOpen"
      [mediaType]="'tv'"
      [mediaId]="previewMediaId"
      (play)="onPreviewPlay($event)"
      (closed)="closePreview()"
    ></app-preview-sheet>
  `,
  styles: [`
    :host { display: block; font-family: 'Roboto', system-ui, sans-serif; }
    .page { padding: 1rem 1.25rem; }
    h1 { color: #fff; font-family: 'Doto', 'Roboto', system-ui, sans-serif; font-size: 2.2rem; font-weight: 800; padding: 0 8vw; margin: 0 0 0.5rem; }
    h2 { color: #fff; font-family: 'Doto', 'Roboto', system-ui, sans-serif; font-size: 1.8rem; font-weight: 800; padding: 0 8vw; margin: 1.25rem 0 0.75rem; }

    @media (max-width: 768px) {
      .page { padding: 0.75rem 0.5rem; }
      h1 { font-size: 1.6rem; padding: 0 4vw; }
      h2 { font-size: 1.3rem; padding: 0 4vw; margin: 0.75rem 0 0.5rem; }
    }
    @media (max-width: 480px) {
      .page { padding: 0.5rem 0.25rem; }
      h1 { font-size: 1.4rem; padding: 0 3vw; }
      h2 { font-size: 1.15rem; padding: 0 3vw; margin: 0.5rem 0 0.4rem; }
    }

    /* Loading screen */
    .loading-screen {
      position: fixed; inset: 0; z-index: 2000;
      display: flex; align-items: center; justify-content: center;
      background: #0e0e0e;
      transition: opacity 420ms ease;
    }
    .loading-screen.done { opacity: 0; pointer-events: none; }
    .loading-logo {
      height: 48px; width: auto;
      filter: brightness(0) invert(1);
      animation: logoPulse 1.4s ease-in-out infinite;
    }
    @keyframes logoPulse {
      0%, 100% { opacity: 0.35; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.06); }
    }
  `],
})
export class SeriesPageComponent implements OnInit {
  heroSlides: HeroSlide[] = [];
  topRatedItems: MediaRowItem[] = [];
  popularItems: MediaRowItem[] = [];
  isLoading = true;
  genreCarousels: { id: number; name: string; items: MediaRowItem[]; page: number; totalPages: number; loading: boolean }[] = [];

  private topRatedPage = 1;
  private topRatedTotal = 1;
  private loadingTopRated = false;

  private popularPage = 1;
  private popularTotal = 1;
  private loadingPopular = false;

  // preview state
  previewOpen = false;
  previewMediaId: number | null = null;

  constructor(private readonly tmdb: TmdbService, private readonly router: Router) {}

  ngOnInit(): void {
    this.tmdb.getTopRatedTvShows().subscribe({
      next: (res) => {
        const filtered = res.results.filter((s) => s.original_language === 'en');
        this.topRatedItems = filtered.map((s) => this.toItem(s));
        this.topRatedPage = res.page || 1;
        this.topRatedTotal = res.total_pages || 1;

        this.heroSlides = filtered.filter((s: any) => s.backdrop_path).slice(0, 10).map((s: any) => ({
          id: s.id, media_type: 'tv' as const, title: s.name,
          overview: s.overview, backdrop_path: s.backdrop_path,
          vote_average: s.vote_average, year: (s.first_air_date || '').slice(0, 4),
          genres: TmdbService.idsToGenres(s.genre_ids),
        }));

        this.heroSlides.forEach((slide, idx) => {
          this.tmdb.getTvImages(slide.id).pipe(catchError(() => of(null))).subscribe((images: any) => {
            const logo = (images?.logos || [])[0];
            if (logo?.file_path) {
              this.heroSlides[idx] = { ...this.heroSlides[idx], logo_path: logo.file_path };
              this.heroSlides = [...this.heroSlides];
            }
          });
        });

        this.isLoading = false;
      },
    });

    this.tmdb.getPopularTvShows().subscribe({
      next: (res) => {
        this.popularItems = res.results.filter((s) => s.original_language === 'en').map((s) => this.toItem(s));
        this.popularPage = res.page || 1;
        this.popularTotal = res.total_pages || 1;
      },
    });

    // fetch TV genre list → build a carousel per genre
    this.tmdb.getTvGenres().subscribe({
      next: (res) => {
        (res.genres || []).forEach((g) => {
          const gc = { id: g.id, name: g.name, items: [] as MediaRowItem[], page: 1, totalPages: 1, loading: false };
          this.genreCarousels.push(gc);
          this.tmdb.discoverTvByGenre(g.id).subscribe({
            next: (dr) => {
              gc.items = dr.results.filter((s) => s.original_language === 'en').map((s) => this.toItem(s));
              gc.page = dr.page || 1;
              gc.totalPages = dr.total_pages || 1;
            },
          });
        });
      },
    });
  }

  private toItem(s: { id: number; poster_path: string | null; name: string; first_air_date?: string; vote_average: number }): MediaRowItem {
    return { id: s.id, media_type: 'tv', poster_path: s.poster_path, title: s.name, year: (s.first_air_date || '').slice(0, 4), vote_average: s.vote_average };
  }

  onCarouselClick(item: MediaRowItem) {
    this.openPreview(item.id);
  }

  onHeroClick(slide: HeroSlide) {
    this.router.navigate(['/show', slide.id]);
  }

  // ── preview ──

  openPreview(id: number) {
    this.previewMediaId = id;
    this.previewOpen = true;
  }

  closePreview() {
    this.previewOpen = false;
    this.previewMediaId = null;
  }

  onPreviewPlay(event: PreviewPlayEvent) {
    this.closePreview();
    const q: any = {};
    if (event.season) q.season = event.season;
    if (event.episode) q.episode = event.episode;
    this.router.navigate(['/show', event.id], { queryParams: q });
  }

  // ── infinite scroll ──

  loadMoreTopRated() {
    if (this.loadingTopRated || this.topRatedPage >= this.topRatedTotal) return;
    this.loadingTopRated = true;
    this.tmdb.getTopRatedTvShows(this.topRatedPage + 1).subscribe({
      next: (res) => {
        this.topRatedItems.push(...res.results.filter((s) => s.original_language === 'en').map((s) => this.toItem(s)));
        this.topRatedPage = res.page || this.topRatedPage;
        this.topRatedTotal = res.total_pages || this.topRatedTotal;
        this.loadingTopRated = false;
      },
      error: () => (this.loadingTopRated = false),
    });
  }

  loadMorePopular() {
    if (this.loadingPopular || this.popularPage >= this.popularTotal) return;
    this.loadingPopular = true;
    this.tmdb.getPopularTvShows(this.popularPage + 1).subscribe({
      next: (res) => {
        this.popularItems.push(...res.results.filter((s) => s.original_language === 'en').map((s) => this.toItem(s)));
        this.popularPage = res.page || this.popularPage;
        this.popularTotal = res.total_pages || this.popularTotal;
        this.loadingPopular = false;
      },
      error: () => (this.loadingPopular = false),
    });
  }

  loadMoreGenre(gc: { id: number; items: MediaRowItem[]; page: number; totalPages: number; loading: boolean }) {
    if (gc.loading || gc.page >= gc.totalPages) return;
    gc.loading = true;
    this.tmdb.discoverTvByGenre(gc.id, gc.page + 1).subscribe({
      next: (res) => {
        gc.items.push(...res.results.filter((s) => s.original_language === 'en').map((s) => this.toItem(s)));
        gc.page = res.page || gc.page;
        gc.totalPages = res.total_pages || gc.totalPages;
        gc.loading = false;
      },
      error: () => (gc.loading = false),
    });
  }
}
