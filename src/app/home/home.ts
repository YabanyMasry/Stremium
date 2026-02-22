import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, SlicePipe, NgStyle } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TmdbMovie, TmdbTv, TmdbService } from '../services/tmdb.service';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [NgFor, NgIf, SlicePipe, NgStyle, MatCardModule],
  template: `
    <section class="movies-section">
      <h2>Continue Watching</h2>
      <p *ngIf="isLoading && continueList.length === 0" class="loading">Loading...</p>
      
      <div *ngIf="continueList.length > 0" class="controls">
        <div class="row-wrapper" (mouseenter)="hoveringContinue = true" (mouseleave)="hoveringContinue = false">
          <div #continueScrollContainer class="movies-row" tabindex="0" role="list" (scroll)="onScrollContinue()">
              <mat-card *ngFor="let item of continueList" class="movie-card" role="listitem" tabindex="0" (click)="openPreview(item.media_type, item.id, item)" (keydown.enter)="openPreview(item.media_type, item.id, item)">
              <img *ngIf="item.poster_path" mat-card-image [src]="'https://image.tmdb.org/t/p/w500' + item.poster_path" [alt]="item.title + ' poster'" class="poster-image" />
              <mat-card-content class="card-info">
                <div class="title">{{ item.title }}</div>
                <div class="meta">
                  <span class="year">{{ item.release_date | slice:0:4 }}</span>
                  <span class="rating"> {{ item.vote_average.toFixed(1) }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <button *ngIf="hoveringContinue && canScrollLeftContinue" class="scroll-btn left" (click)="scrollContinue(-300)" aria-label="Scroll left">‹</button>
          <button *ngIf="hoveringContinue" class="scroll-btn right" (click)="scrollContinue(300)" aria-label="Scroll right">›</button>
        </div>
      </div>

        <h2 style="margin-top:1.25rem;">Top Rated TV Shows</h2>

        <div *ngIf="!isLoading" class="controls">
          <div
            class="row-wrapper"
            (mouseenter)="hoveringTv = true"
            (mouseleave)="hoveringTv = false"
          >
            <div
              #tvScrollContainer
              class="movies-row"
              tabindex="0"
              role="list"
              (scroll)="onScrollTv()"
            >
              <mat-card
                *ngFor="let show of tvShows"
                class="movie-card"
                role="listitem"
                tabindex="0"
                (click)="openPreview('tv', show.id, show)"
                (keydown.enter)="openPreview('tv', show.id, show)"
              >
                <img
                  *ngIf="show.poster_path"
                  mat-card-image
                  [src]="'https://image.tmdb.org/t/p/w500' + show.poster_path"
                  [alt]="show.name + ' poster'"
                  class="poster-image"
                />
                <mat-card-content class="card-info">
                  <div class="title">{{ show.name }}</div>
                  <div class="meta">
                    <span class="year">{{ show.first_air_date | slice:0:4 }}</span>
                    <span class="rating"> {{ show.vote_average.toFixed(1) }}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <button
              *ngIf="hoveringTv && canScrollLeftTv"
              class="scroll-btn left"
              (click)="scrollTv(-300)"
              aria-label="Scroll left"
            >
              ‹
            </button>

            <button
              *ngIf="hoveringTv"
              class="scroll-btn right"
              (click)="scrollTv(300)"
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        </div>

      <h2 style="margin-top:1.25rem;">Top Rated Movies</h2>

      <p *ngIf="isLoading && continueList.length === 0" class="loading">Loading...</p>

      <div *ngIf="!isLoading" class="controls">
        <div
          class="row-wrapper"
          (mouseenter)="hovering = true"
          (mouseleave)="hovering = false"
        >
          <div
            #scrollContainer
            class="movies-row"
            tabindex="0"
            role="list"
            (scroll)="onScroll()"
          >
            <mat-card
              *ngFor="let movie of movies"
              class="movie-card"
              role="listitem"
              tabindex="0"
              (click)="openPreview('movie', movie.id, movie)"
              (keydown.enter)="openPreview('movie', movie.id, movie)"
            >
              <img
                *ngIf="movie.poster_path"
                mat-card-image
                [src]="'https://image.tmdb.org/t/p/w500' + movie.poster_path"
                [alt]="movie.title + ' poster'"
                class="poster-image"
              />
              <mat-card-content class="card-info">
                <div class="title">{{ movie.title }}</div>
                <div class="meta">
                  <span class="year">{{ movie.release_date | slice:0:4 }}</span>
                  <span class="rating"> {{ movie.vote_average.toFixed(1) }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <button
            *ngIf="hovering && canScrollLeft"
            class="scroll-btn left"
            (click)="scroll(-300)"
            aria-label="Scroll left"
          >
            ‹
          </button>

          <button
            *ngIf="hovering"
            class="scroll-btn right"
            (click)="scroll(300)"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>

      <h2 style="margin-top:1.25rem;">Popular Movies</h2>

      <div *ngIf="!isLoading" class="controls">
        <div
          class="row-wrapper"
          (mouseenter)="hoveringPopular = true"
          (mouseleave)="hoveringPopular = false"
        >
          <div
            #popularScrollContainer
            class="movies-row"
            tabindex="0"
            role="list"
            (scroll)="onScrollPopular()"
          >
            <mat-card
              *ngFor="let movie of moviesPopular"
              class="movie-card"
              role="listitem"
              tabindex="0"
              (click)="openPreview('movie', movie.id, movie)"
              (keydown.enter)="openPreview('movie', movie.id, movie)"
            >
              <img
                *ngIf="movie.poster_path"
                mat-card-image
                [src]="'https://image.tmdb.org/t/p/w500' + movie.poster_path"
                [alt]="movie.title + ' poster'"
                class="poster-image"
              />
              <mat-card-content class="card-info">
                <div class="title">{{ movie.title }}</div>
                <div class="meta">
                  <span class="year">{{ movie.release_date | slice:0:4 }}</span>
                  <span class="rating"> {{ movie.vote_average.toFixed(1) }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <button
            *ngIf="hoveringPopular && canScrollLeftPopular"
            class="scroll-btn left"
            (click)="scrollPopular(-300)"
            aria-label="Scroll left"
          >
            ‹
          </button>

          <button
            *ngIf="hoveringPopular"
            class="scroll-btn right"
            (click)="scrollPopular(300)"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>
    </section>

      <!-- preview overlay + sheet -->
      <div class="preview-overlay" [class.open]="previewOpen" (click)="closePreview()"></div>
      <div class="preview-sheet" [class.open]="previewOpen" role="dialog" aria-modal="true" [attr.aria-hidden]="!previewOpen">
        <div class="preview-banner">
          <img *ngIf="previewData?.backdrop_path" class="banner-img" [src]="'https://image.tmdb.org/t/p/original' + previewData.backdrop_path" alt="backdrop" />
          <div *ngIf="previewData?.logo_path" class="banner-logo">
            <img [src]="'https://image.tmdb.org/t/p/w500' + previewData.logo_path" alt="logo" />
          </div>
        </div>
        <div class="preview-body">
          <div class="preview-info">
            <div style="font-size:1.25rem; font-weight:700">{{ previewData?.title }}</div>
            <div class="preview-meta">
              <span *ngIf="previewData?.release_date">{{ previewData.release_date | slice:0:4 }}</span>
              <span style="margin-left:8px">•</span>
              <span style="margin-left:8px">{{ previewData?.vote_average?.toFixed(1) }}</span>
              <span *ngIf="previewData?.genres?.length" style="margin-left:12px">• {{ previewData.genres.join(', ') }}</span>
            </div>
            <div class="preview-actions">
              <button (click)="playFromPreview()">Play</button>
              <button (click)="closePreview()">Close</button>
            </div>
            <div class="preview-overview">
              <p *ngIf="previewData?.overview">{{ previewData.overview }}</p>
            </div>
          </div>
        </div>
      </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #1f2937;
      }

      .movies-section {
        padding: 1rem 1.25rem;
      }

      h2 { color: #ffffff }

      h2 {
        margin: 0 0 0.75rem 0;
        font-weight: 600;
        padding: 0 08vw;
        box-sizing: border-box;
      }

      .loading {
        color: #6b7280;
        margin: 1rem 0;
        padding: 0 08vw;
        box-sizing: border-box;
      }

      .controls {
        display: block;
      }

      .row-wrapper {
        position: relative;
        /* add horizontal inset so every row (including scrollable) shows margins */
        padding: 0 08vw;
        box-sizing: border-box;
      }

      .movies-row {
        display: flex;
        gap: 0.75rem;
        overflow-x: auto;
        /* keep no extra padding here — parent provides the side inset */
        padding: 0.5rem 0;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }

      /* hide scrollbar across browsers while keeping scrolling usable */
      .movies-row::-webkit-scrollbar {
        display: none;
      }
      .movies-row {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .movie-card {
        scroll-snap-align: start;
        flex: 0 0 220px;
        width: 220px;
        border-radius: 10px;
        background: transparent;
        border: 0;
        box-shadow: none;
        overflow: hidden;
        cursor: pointer;
      }

      .poster-image {
        width: 100%;
        height: 330px;
        object-fit: cover;
        display: block;
        transition: transform 300ms ease;
        will-change: transform;
      }

      .card-info {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 0.25rem 0.6rem 0.28rem;
        color: #fff;
        background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 28%, rgba(0,0,0,0.18) 56%, rgba(0,0,0,0) 100%);
        /* remove harsh inset shadow in favor of a smooth gradient fade */
        opacity: 0;
        transition: opacity 220ms ease;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .title {
        font-size: 0.75rem;
        line-height: 1.0;
        color: #111827;
        margin-bottom: 0.12rem;
        max-height: 2.4rem;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.88rem;
        color: #6b7280;
      }

      .rating {
        color: #ffd36a;
        font-weight: 700;
        font-size: 0.95rem;
      }

      .title { font-weight:700; font-size:0.98rem; color: #ffffff; }
      .meta { color: rgba(255,255,255,0.9); font-size:0.85rem; display:flex; justify-content:space-between; align-items:center; }

      .movie-card:hover .poster-image {
        transform: scale(1.07);
      }

      .movie-card:hover .card-info,
      .movie-card:focus-within .card-info {
        opacity: 1;
      }

      /* transparent overlay arrows (hidden by default via ngIf until hovering) */
      .scroll-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 44px;
        height: 88px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
        line-height: 1;
        border: none;
        background: rgba(255, 255, 255, 0.4);
        color: rgba(17, 24, 39, 0.7);
        cursor: pointer;
        z-index: 20;
        padding: 0;
        border-radius: 6px;
      }

      .scroll-btn.left {
        left: 6px;
      }

      .scroll-btn.right {
        right: 6px;
      }

      .scroll-btn:hover {
        color: rgba(17, 24, 39, 0.95);
      }

      /* preview sheet */
      .preview-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.55);
        opacity: 0;
        pointer-events: none;
        transition: opacity 360ms ease-out;
        z-index: 80;
      }

      .preview-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }


      .preview-sheet {
        position: fixed;
        left: 20vw;
        right: 20vw;
        top: 8vh;
        bottom: 0;
        background: #071018;
        /* keep rounded corners at the top only, bottom should be square */
        border-radius: 12px 12px 0 0;
        /* start off-screen at the very bottom of the viewport */
        transform: translateY(100vh);
        opacity: 0;
        transition: transform 360ms cubic-bezier(.22,.9,.3,1), opacity 220ms ease;
        pointer-events: none;
        will-change: transform, opacity;
        z-index: 90;
        overflow: auto;
        color: #fff;
      }

      .preview-sheet.open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      .preview-banner {
        position: relative;
        width: 100%;
        /* allow banner height to be driven by the image so it can grow vertically */
        height: auto;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
        overflow: visible;
        background: #071018;
        display: block;
      }

      .banner-img {
        display: block;
        width: 100%;
        height: auto;
        object-fit: cover;
        object-position: center top;
      }

      .banner-logo {
        position: absolute;
        left: 1rem;
        bottom: 1rem;
        z-index: 2;
        width: 40%;
        max-width: 40%;
        /* cap logo height; allow width to shrink proportionally instead of clipping */
        max-height: 30vh;
        background: transparent;
        padding: 0;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        overflow: visible;
      }

      .banner-logo img { height: auto; max-height: 30vh; width: auto; max-width: 100%; display:block }

      .preview-body { padding: 1rem 1.5rem 1.5rem; display:block }

      .preview-info { margin-top: 8px }

      .preview-logo { max-height: 56px; display:block; margin-bottom:8px }

      .preview-meta { color: rgba(255,255,255,0.85); font-size:0.95rem; margin-bottom:8px }

      .preview-actions { display:flex; gap:8px; margin-bottom:8px }

      .preview-overview { color: rgba(255,255,255,0.92); }
    `,
  ],
})
export class Home implements OnInit {
  @ViewChild('scrollContainer', { static: false }) private scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('continueScrollContainer', { static: false }) private continueScrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('popularScrollContainer', { static: false }) private popularScrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('tvScrollContainer', { static: false }) private tvScrollContainer!: ElementRef<HTMLDivElement>;

  movies: TmdbMovie[] = [];
  isLoading = true;

  moviesPopular: TmdbMovie[] = [];
  tvShows: TmdbTv[] = [];

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

  // combined continue list: movies and shows (shows include season/episode in progress)
  continueList: Array<{
    id: number;
    media_type: 'movie' | 'tv';
    poster_path?: string | null;
    title: string;
    release_date?: string;
    vote_average: number;
    season?: number | null;
    episode?: number | null;
  }> = [];

  hovering = false;
  canScrollLeft = false;
  hoveringContinue = false;
  canScrollLeftContinue = false;
  hoveringPopular = false;
  canScrollLeftPopular = false;
  hoveringTv = false;
  canScrollLeftTv = false;
  continueMovies: TmdbMovie[] = [];
  // preview sheet state
  previewOpen = false;
  previewLoading = false;
  previewData: any = null;
  previewBackdropStyle = '';

  constructor(private readonly tmdb: TmdbService, private readonly router: Router) { }

  ngOnInit(): void {
    this.tmdb.getTopRatedMovies().subscribe({
      next: (response) => {
        this.movies = response.results.filter((movie) => movie.original_language === 'en');
        this.moviesPage = response.page || 1;
        this.moviesTotalPages = response.total_pages || 1;
        this.isLoading = false;
        // let DOM render, then initialize scroll state
        setTimeout(() => this.onScroll(), 0);
        // load continue list from storage
        this.loadContinueFromStorage();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });

    this.tmdb.getPopularMovies().subscribe({
      next: (response) => {
        this.moviesPopular = response.results.filter((movie) => movie.original_language === 'en');
        this.popularPage = response.page || 1;
        this.popularTotalPages = response.total_pages || 1;
        // let DOM render, then initialize scroll state
        setTimeout(() => this.onScrollPopular(), 0);
      },
      error: (err) => {
        console.error(err);
      },
    });

    this.tmdb.getTopRatedTvShows().subscribe({
      next: (response) => {
        this.tvShows = response.results.filter((s) => s.original_language === 'en');
        this.tvPage = response.page || 1;
        this.tvTotalPages = response.total_pages || 1;
        setTimeout(() => this.onScrollTv(), 0);
      },
      error: (err) => {
        console.error(err);
      },
    });

    // refresh continue list when other components save progress
    window.addEventListener('continueMoviesUpdated', () => this.loadContinueFromStorage());
    window.addEventListener('continueShowsUpdated', () => this.loadContinueFromStorage());
  }

  openPreview(mediaType: 'movie' | 'tv', id: number, item?: any) {
    this.previewOpen = true;
    this.previewLoading = true;
    this.previewData = null;

    if (mediaType === 'movie') {
      forkJoin({
        details: this.tmdb.getMovieDetails(id).pipe(catchError(() => of(null))),
        images: this.tmdb.getMovieImages(id).pipe(catchError(() => of(null))),
      }).subscribe(({ details, images }: any) => {
        this.previewLoading = false;
        if (!details) return;
        const logo = (images?.logos || [])[0];
        this.previewData = {
          id: details.id,
          media_type: 'movie',
          title: details.title,
          overview: details.overview,
          genres: details.genres?.map((g: any) => g.name) || [],
          vote_average: details.vote_average,
          release_date: details.release_date,
          poster_path: details.poster_path,
          // prefer the details backdrop_path (use TMDB details endpoint)
          backdrop_path: details.backdrop_path || images?.backdrops?.[0]?.file_path || null,
          logo_path: logo?.file_path || null,
        };
        this.previewBackdropStyle = this.previewData.backdrop_path ? `linear-gradient(180deg, rgba(7,16,24,0.0), rgba(7,16,24,0.85)), url('https://image.tmdb.org/t/p/original${this.previewData.backdrop_path}')` : '';
      });
    } else {
      forkJoin({
        details: this.tmdb.getTvDetails(id).pipe(catchError(() => of(null))),
        images: this.tmdb.getTvImages(id).pipe(catchError(() => of(null))),
      }).subscribe(({ details, images }: any) => {
        this.previewLoading = false;
        if (!details) return;
        const logo = (images?.logos || [])[0];
        this.previewData = {
          id: details.id,
          media_type: 'tv',
          title: details.name,
          overview: details.overview,
          genres: details.genres?.map((g: any) => g.name) || [],
          vote_average: details.vote_average,
          release_date: details.first_air_date,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path || images?.backdrops?.[0]?.file_path || null,
          logo_path: logo?.file_path || null,
        };
        this.previewBackdropStyle = this.previewData.backdrop_path ? `linear-gradient(180deg, rgba(7,16,24,0.0), rgba(7,16,24,0.85)), url('https://image.tmdb.org/t/p/original${this.previewData.backdrop_path}')` : '';
      });
    }
  }

  closePreview() {
    this.previewOpen = false;
    this.previewData = null;
    this.previewBackdropStyle = '';
  }

  playFromPreview() {
    if (!this.previewData) return;
    const item: any = { id: this.previewData.id, media_type: this.previewData.media_type };
    this.closePreview();
    this.openContinue(item);
  }

  private loadContinueFromStorage() {
    // reset and load movies (legacy key 'continueMovies' stores an array of numeric ids)
    this.continueList = [];
    // load movies (legacy key 'continueMovies' stores an array of numeric ids)
    const rawMovies = localStorage.getItem('continueMovies');
    if (rawMovies) {
      let ids: number[] = [];
      try {
        ids = JSON.parse(rawMovies) as number[];
      } catch {
        ids = [];
      }
      ids.forEach((id) => {
        // avoid duplicates
        if (this.continueList.find((i) => i.id === id && i.media_type === 'movie')) return;
        this.tmdb.getMovieDetails(id).subscribe({
          next: (m) => {
            this.continueList.push({
              id: m.id,
              media_type: 'movie',
              poster_path: m.poster_path,
              title: m.title,
              release_date: m.release_date || '',
              vote_average: m.vote_average,
            });
          },
          error: () => { },
        });
      });
    }

    // load show progress from 'continueShows' which stores [{ id, season, episode }]
    const rawShows = localStorage.getItem('continueShows');
    if (rawShows) {
      let entries: Array<{ id: number; season?: number | null; episode?: number | null }> = [];
      try {
        entries = JSON.parse(rawShows) as Array<{ id: number; season?: number | null; episode?: number | null }>;
      } catch {
        entries = [];
      }
      entries.forEach((e) => {
        if (this.continueList.find((i) => i.id === e.id && i.media_type === 'tv')) return;
        this.tmdb.getTvDetails(e.id).subscribe({
          next: (s) => {
            this.continueList.push({
              id: s.id,
              media_type: 'tv',
              poster_path: s.poster_path,
              title: s.name,
              release_date: s.first_air_date || '',
              vote_average: s.vote_average,
              season: e.season ?? null,
              episode: e.episode ?? null,
            });
          },
          error: () => { },
        });
      });
    }
  }

  onScroll() {
    const el = this.scrollContainer?.nativeElement;
    if (!el) {
      this.canScrollLeft = false;
      return;
    }
    this.canScrollLeft = el.scrollLeft > 5;

    // if scrolled near the right edge, attempt to load more movies
    if (!this.loadingMoreMovies && (el.scrollLeft + el.clientWidth) >= (el.scrollWidth - 220)) {
      this.loadMoreMovies();
    }
  }

  scroll(amount: number) {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    // update left arrow visibility after scroll (best-effort)
    setTimeout(() => this.onScroll(), 250);
  }

  private loadMoreMovies() {
    if (this.moviesPage >= this.moviesTotalPages) return;
    this.loadingMoreMovies = true;
    const next = this.moviesPage + 1;
    this.tmdb.getTopRatedMovies(next).subscribe({
      next: (res) => {
        const more = res.results.filter((m) => m.original_language === 'en');
        this.movies.push(...more);
        this.moviesPage = res.page || this.moviesPage;
        this.moviesTotalPages = res.total_pages || this.moviesTotalPages;
        this.loadingMoreMovies = false;
      },
      error: () => (this.loadingMoreMovies = false),
    });
  }

  onScrollContinue() {
    const el = this.continueScrollContainer?.nativeElement;
    if (!el) {
      this.canScrollLeftContinue = false;
      return;
    }
    this.canScrollLeftContinue = el.scrollLeft > 5;
  }

  scrollContinue(amount: number) {
    const el = this.continueScrollContainer?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(() => this.onScrollContinue(), 250);
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

  onScrollPopular() {
    const el = this.popularScrollContainer?.nativeElement;
    if (!el) {
      this.canScrollLeftPopular = false;
      return;
    }
    this.canScrollLeftPopular = el.scrollLeft > 5;

    if (!this.loadingMorePopular && (el.scrollLeft + el.clientWidth) >= (el.scrollWidth - 220)) {
      this.loadMorePopular();
    }
  }

  scrollPopular(amount: number) {
    const el = this.popularScrollContainer?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(() => this.onScrollPopular(), 250);
  }

  private loadMorePopular() {
    if (this.popularPage >= this.popularTotalPages) return;
    this.loadingMorePopular = true;
    const next = this.popularPage + 1;
    this.tmdb.getPopularMovies(next).subscribe({
      next: (res) => {
        const more = res.results.filter((m) => m.original_language === 'en');
        this.moviesPopular.push(...more);
        this.popularPage = res.page || this.popularPage;
        this.popularTotalPages = res.total_pages || this.popularTotalPages;
        this.loadingMorePopular = false;
      },
      error: () => (this.loadingMorePopular = false),
    });
  }

  openShow(tmdbId: number) {
    this.router.navigate(['/show', tmdbId]);
  }

  onScrollTv() {
    const el = this.tvScrollContainer?.nativeElement;
    if (!el) {
      this.canScrollLeftTv = false;
      return;
    }
    this.canScrollLeftTv = el.scrollLeft > 5;

    if (!this.loadingMoreTv && (el.scrollLeft + el.clientWidth) >= (el.scrollWidth - 220)) {
      this.loadMoreTv();
    }
  }

  scrollTv(amount: number) {
    const el = this.tvScrollContainer?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(() => this.onScrollTv(), 250);
  }

  private loadMoreTv() {
    if (this.tvPage >= this.tvTotalPages) return;
    this.loadingMoreTv = true;
    const next = this.tvPage + 1;
    this.tmdb.getTopRatedTvShows(next).subscribe({
      next: (res) => {
        const more = res.results.filter((s) => s.original_language === 'en');
        this.tvShows.push(...more);
        this.tvPage = res.page || this.tvPage;
        this.tvTotalPages = res.total_pages || this.tvTotalPages;
        this.loadingMoreTv = false;
      },
      error: () => (this.loadingMoreTv = false),
    });
  }

  openMovie(tmdbId: number) {
    this.router.navigate(['/movie', tmdbId]);
  }
}
