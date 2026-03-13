import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TmdbService } from '../services/tmdb.service';
import { MediaCarouselComponent, MediaRowItem } from './media-carousel';
import { HeroCarouselComponent, HeroSlide } from './hero-carousel';
import { PreviewSheetComponent, PreviewPlayEvent } from './preview-sheet';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [NgIf, MediaCarouselComponent, HeroCarouselComponent, PreviewSheetComponent],
  template: `
    <div class="loading-screen" [class.done]="!isLoading">
      <img src="assets/Stream 1.png" alt="Stream" class="loading-logo" />
    </div>

    <app-hero-carousel
      *ngIf="heroSlides.length > 0"
      [slides]="heroSlides"
      (slideClick)="onHeroClick($event)"
    ></app-hero-carousel>

    <section class="media-section">
      <h2 *ngIf="continueItems.length > 0">Continue Watching</h2>
      <app-media-carousel
        *ngIf="continueItems.length > 0"
        [items]="continueItems"
        (itemClick)="onCarouselClick($event)"
      ></app-media-carousel>

      <h2 style="margin-top:1.25rem;">Top Rated Movies</h2>
      <app-media-carousel
        *ngIf="!isLoading"
        [items]="topRatedMovieItems"
        (itemClick)="onCarouselClick($event)"
        (nearEnd)="loadMoreMovies()"
      ></app-media-carousel>


      <h2 style="margin-top:1.25rem;">Top Rated TV Shows</h2>
      <app-media-carousel
        *ngIf="!isLoading"
        [items]="tvItems"
        (itemClick)="onCarouselClick($event)"
        (nearEnd)="loadMoreTv()"
      ></app-media-carousel>


      <h2 style="margin-top:1.25rem;">Popular Movies</h2>
      <app-media-carousel
        *ngIf="!isLoading"
        [items]="popularMovieItems"
        (itemClick)="onCarouselClick($event)"
        (nearEnd)="loadMorePopular()"
      ></app-media-carousel>

      <h2 style="margin-top:1.25rem;">Popular TV Shows</h2>
      <app-media-carousel
        *ngIf="!isLoading"
        [items]="popularTvItems"
        (itemClick)="onCarouselClick($event)"
        (nearEnd)="loadMorePopularTv()"
      ></app-media-carousel>
    </section>

    <app-preview-sheet
      [open]="previewOpen"
      [mediaType]="previewMediaType"
      [mediaId]="previewMediaId"
      (play)="onPreviewPlay($event)"
      (closed)="closePreview()"
    ></app-preview-sheet>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .media-section { padding: 1rem 1.25rem; }
    h2 { color: #ffffff; margin: 0 0 0.75rem 0; font-family: 'Doto', 'Roboto', system-ui, sans-serif; font-size: 1.8rem; font-weight: 800; padding: 0 8vw; box-sizing: border-box; }
    .loading { color: #6b7280; margin: 1rem 0; padding: 0 8vw; box-sizing: border-box; }

    @media (max-width: 768px) {
      .media-section { padding: 0.75rem 0.5rem; }
      h2 { font-size: 1.3rem; padding: 0 4vw; margin-bottom: 0.5rem; }
      .loading { padding: 0 4vw; }
    }

    @media (max-width: 480px) {
      .media-section { padding: 0.5rem 0.25rem; }
      h2 { font-size: 1.15rem; padding: 0 3vw; margin-bottom: 0.4rem; }
      .loading { padding: 0 3vw; }
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
export class Home implements OnInit {
  heroSlides: HeroSlide[] = [];
  topRatedMovieItems: MediaRowItem[] = [];
  popularMovieItems: MediaRowItem[] = [];
  tvItems: MediaRowItem[] = [];
  popularTvItems: MediaRowItem[] = [];
  continueItems: MediaRowItem[] = [];
  isLoading = true;

  // pagination state for infinite scroll
  moviesPage = 1;
  moviesTotalPages = 1;
  loadingMoreMovies = false;

  popularPage = 1;
  popularTotalPages = 1;
  loadingMorePopular = false;

  tvPage = 1;
  tvTotalPages = 1;
  loadingMoreTv = false;

  popularTvPage = 1;
  popularTvTotalPages = 1;
  loadingMorePopularTv = false;

  // preview sheet state
  previewOpen = false;
  previewMediaType: 'movie' | 'tv' = 'movie';
  previewMediaId: number | null = null;

  constructor(private readonly tmdb: TmdbService, private readonly router: Router) {}

  ngOnInit(): void {
    // Build hero slides from combined top rated movies + TV
    forkJoin({
      movies: this.tmdb.getTopRatedMovies().pipe(catchError(() => of({ results: [], page: 1, total_pages: 1 }))),
      tv: this.tmdb.getTopRatedTvShows().pipe(catchError(() => of({ results: [], page: 1, total_pages: 1 }))),
    }).subscribe(({ movies, tv }) => {
      const movieResults = movies.results.filter((m: any) => m.original_language === 'en');
      const tvResults = tv.results.filter((s: any) => s.original_language === 'en');

      // populate carousels
      this.topRatedMovieItems = movieResults.map((m: any) => this.movieToItem(m));
      this.moviesPage = movies.page || 1;
      this.moviesTotalPages = movies.total_pages || 1;

      this.tvItems = tvResults.map((s: any) => this.tvToItem(s));
      this.tvPage = tv.page || 1;
      this.tvTotalPages = tv.total_pages || 1;

      // build hero slides (5 movies + 5 shows, interleaved)
      const heroMovies: HeroSlide[] = movieResults.filter((m: any) => m.backdrop_path).slice(0, 5).map((m: any) => ({
        id: m.id, media_type: 'movie' as const, title: m.title,
        overview: m.overview, backdrop_path: m.backdrop_path,
        vote_average: m.vote_average, year: (m.release_date || '').slice(0, 4),
        genres: TmdbService.idsToGenres(m.genre_ids),
      }));
      const heroTv: HeroSlide[] = tvResults.filter((s: any) => s.backdrop_path).slice(0, 5).map((s: any) => ({
        id: s.id, media_type: 'tv' as const, title: s.name,
        overview: s.overview, backdrop_path: s.backdrop_path,
        vote_average: s.vote_average, year: (s.first_air_date || '').slice(0, 4),
        genres: TmdbService.idsToGenres(s.genre_ids),
      }));
      // interleave
      const merged: HeroSlide[] = [];
      const max = Math.max(heroMovies.length, heroTv.length);
      for (let i = 0; i < max; i++) {
        if (i < heroMovies.length) merged.push(heroMovies[i]);
        if (i < heroTv.length) merged.push(heroTv[i]);
      }
      this.heroSlides = merged;

      // fetch logos for each hero slide
      this.heroSlides.forEach((slide, idx) => {
        const img$ = slide.media_type === 'movie'
          ? this.tmdb.getMovieImages(slide.id)
          : this.tmdb.getTvImages(slide.id);
        img$.pipe(catchError(() => of(null))).subscribe((images: any) => {
          const logo = (images?.logos || [])[0];
          if (logo?.file_path) {
            this.heroSlides[idx] = { ...this.heroSlides[idx], logo_path: logo.file_path };
            this.heroSlides = [...this.heroSlides];
          }
        });
      });

      this.isLoading = false;
      this.loadContinueFromStorage();
    });

    this.tmdb.getPopularMovies().subscribe({
      next: (response) => {
        this.popularMovieItems = response.results
          .filter((m) => m.original_language === 'en')
          .map((m) => this.movieToItem(m));
        this.popularPage = response.page || 1;
        this.popularTotalPages = response.total_pages || 1;
      },
      error: (err) => {
        console.error(err);
      },
    });

    this.tmdb.getPopularTvShows().subscribe({
      next: (response) => {
        this.popularTvItems = response.results
          .filter((s) => s.original_language === 'en')
          .map((s) => this.tvToItem(s));
        this.popularTvPage = response.page || 1;
        this.popularTvTotalPages = response.total_pages || 1;
      },
      error: (err) => {
        console.error(err);
      },
    });

    window.addEventListener('continueMoviesUpdated', () => this.loadContinueFromStorage());
    window.addEventListener('continueShowsUpdated', () => this.loadContinueFromStorage());
  }

  // ── data mapping helpers ──

  private movieToItem(m: { id: number; poster_path: string | null; title: string; release_date?: string; vote_average: number }): MediaRowItem {
    return { id: m.id, media_type: 'movie', poster_path: m.poster_path, title: m.title, year: (m.release_date || '').slice(0, 4), vote_average: m.vote_average };
  }

  private tvToItem(s: { id: number; poster_path: string | null; name: string; first_air_date?: string; vote_average: number }): MediaRowItem {
    return { id: s.id, media_type: 'tv', poster_path: s.poster_path, title: s.name, year: (s.first_air_date || '').slice(0, 4), vote_average: s.vote_average };
  }

  onHeroClick(slide: HeroSlide) {
    if (slide.media_type === 'movie') {
      this.router.navigate(['/movie', slide.id]);
    } else {
      this.router.navigate(['/show', slide.id]);
    }
  }

  onCarouselClick(item: MediaRowItem) {
    this.openPreview(item.media_type, item.id);
  }

  // ── preview ──

  openPreview(mediaType: 'movie' | 'tv', id: number) {
    this.previewMediaType = mediaType;
    this.previewMediaId = id;
    this.previewOpen = true;
  }

  closePreview() {
    this.previewOpen = false;
    this.previewMediaId = null;
  }

  onPreviewPlay(event: PreviewPlayEvent) {
    this.closePreview();
    this.openContinue(event);
  }

  // ── continue watching ──

  private loadContinueFromStorage() {
    this.continueItems = [];
    const rawMovies = localStorage.getItem('continueMovies');
    if (rawMovies) {
      let ids: number[] = [];
      try { ids = JSON.parse(rawMovies) as number[]; } catch { ids = []; }
      ids.forEach((id) => {
        if (this.continueItems.find((i) => i.id === id && i.media_type === 'movie')) return;
        this.tmdb.getMovieDetails(id).subscribe({
          next: (m) => {
            this.continueItems.push(this.movieToItem(m));
          },
          error: () => {},
        });
      });
    }

    const rawShows = localStorage.getItem('continueShows');
    if (rawShows) {
      let entries: Array<{ id: number; season?: number | null; episode?: number | null }> = [];
      try { entries = JSON.parse(rawShows) as Array<{ id: number; season?: number | null; episode?: number | null }>; } catch { entries = []; }
      entries.forEach((e) => {
        if (this.continueItems.find((i) => i.id === e.id && i.media_type === 'tv')) return;
        this.tmdb.getTvDetails(e.id).subscribe({
          next: (s) => {
            this.continueItems.push({
              ...this.tvToItem(s),
              data: { season: e.season ?? null, episode: e.episode ?? null },
            });
          },
          error: () => {},
        });
      });
    }
  }

  openContinue(item: { id: number; media_type: 'movie' | 'tv'; season?: number | null; episode?: number | null }) {
    if (item.media_type === 'movie') {
      this.router.navigate(['/movie', item.id]);
    } else {
      const query: any = {};
      if (item.season) query.season = item.season;
      if (item.episode) query.episode = item.episode;
      this.router.navigate(['/show', item.id], { queryParams: query });
    }
  }

  // ── infinite scroll (called by carousel nearEnd) ──

  loadMoreMovies() {
    if (this.loadingMoreMovies || this.moviesPage >= this.moviesTotalPages) return;
    this.loadingMoreMovies = true;
    const next = this.moviesPage + 1;
    this.tmdb.getTopRatedMovies(next).subscribe({
      next: (res) => {
        const more = res.results.filter((m) => m.original_language === 'en').map((m) => this.movieToItem(m));
        this.topRatedMovieItems.push(...more);
        this.moviesPage = res.page || this.moviesPage;
        this.moviesTotalPages = res.total_pages || this.moviesTotalPages;
        this.loadingMoreMovies = false;
      },
      error: () => (this.loadingMoreMovies = false),
    });
  }

  loadMorePopular() {
    if (this.loadingMorePopular || this.popularPage >= this.popularTotalPages) return;
    this.loadingMorePopular = true;
    const next = this.popularPage + 1;
    this.tmdb.getPopularMovies(next).subscribe({
      next: (res) => {
        const more = res.results.filter((m) => m.original_language === 'en').map((m) => this.movieToItem(m));
        this.popularMovieItems.push(...more);
        this.popularPage = res.page || this.popularPage;
        this.popularTotalPages = res.total_pages || this.popularTotalPages;
        this.loadingMorePopular = false;
      },
      error: () => (this.loadingMorePopular = false),
    });
  }

  loadMoreTv() {
    if (this.loadingMoreTv || this.tvPage >= this.tvTotalPages) return;
    this.loadingMoreTv = true;
    const next = this.tvPage + 1;
    this.tmdb.getTopRatedTvShows(next).subscribe({
      next: (res) => {
        const more = res.results.filter((s) => s.original_language === 'en').map((s) => this.tvToItem(s));
        this.tvItems.push(...more);
        this.tvPage = res.page || this.tvPage;
        this.tvTotalPages = res.total_pages || this.tvTotalPages;
        this.loadingMoreTv = false;
      },
      error: () => (this.loadingMoreTv = false),
    });
  }

  loadMorePopularTv() {
    if (this.loadingMorePopularTv || this.popularTvPage >= this.popularTvTotalPages) return;
    this.loadingMorePopularTv = true;
    const next = this.popularTvPage + 1;
    this.tmdb.getPopularTvShows(next).subscribe({
      next: (res) => {
        const more = res.results.filter((s) => s.original_language === 'en').map((s) => this.tvToItem(s));
        this.popularTvItems.push(...more);
        this.popularTvPage = res.page || this.popularTvPage;
        this.popularTvTotalPages = res.total_pages || this.popularTvTotalPages;
        this.loadingMorePopularTv = false;
      },
      error: () => (this.loadingMorePopularTv = false),
    });
  }

  openMovie(tmdbId: number) {
    this.router.navigate(['/movie', tmdbId]);
  }

  openShow(tmdbId: number) {
    this.router.navigate(['/show', tmdbId]);
  }
}
