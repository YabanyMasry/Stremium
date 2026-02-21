import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
import { TmdbMovie, TmdbTv, TmdbService } from '../services/tmdb.service';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [NgFor, NgIf, SlicePipe, MatCardModule],
  template: `
    <section class="movies-section">
      <h2>Continue Watching</h2>
      <p *ngIf="isLoading && continueList.length === 0" class="loading">Loading...</p>

      <div *ngIf="continueList.length > 0" class="controls">
        <div class="row-wrapper" (mouseenter)="hoveringContinue = true" (mouseleave)="hoveringContinue = false">
          <div #continueScrollContainer class="movies-row" tabindex="0" role="list" (scroll)="onScrollContinue()">
            <mat-card *ngFor="let item of continueList" class="movie-card" role="listitem" tabindex="0" (click)="openContinue(item)" (keydown.enter)="openContinue(item)">
              <img *ngIf="item.poster_path" mat-card-image [src]="'https://image.tmdb.org/t/p/w500' + item.poster_path" [alt]="item.title + ' poster'" class="poster-image" />
              <mat-card-content class="card-info">
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
                (click)="openShow(show.id)"
                (keydown.enter)="openShow(show.id)"
              >
                <img
                  *ngIf="show.poster_path"
                  mat-card-image
                  [src]="'https://image.tmdb.org/t/p/w500' + show.poster_path"
                  [alt]="show.name + ' poster'"
                  class="poster-image"
                />
                <mat-card-content class="card-info">
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
              (click)="openMovie(movie.id)"
              (keydown.enter)="openMovie(movie.id)"
            >
              <img
                *ngIf="movie.poster_path"
                mat-card-image
                [src]="'https://image.tmdb.org/t/p/w500' + movie.poster_path"
                [alt]="movie.title + ' poster'"
                class="poster-image"
              />
              <mat-card-content class="card-info">
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
              (click)="openMovie(movie.id)"
              (keydown.enter)="openMovie(movie.id)"
            >
              <img
                *ngIf="movie.poster_path"
                mat-card-image
                [src]="'https://image.tmdb.org/t/p/w500' + movie.poster_path"
                [alt]="movie.title + ' poster'"
                class="poster-image"
              />
              <mat-card-content class="card-info">
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
  `,
  styles: [
    `
      .movies-section {
        padding: 1rem 1.25rem;
      }

      h2 {
        margin: 0 0 0.75rem 0;
        font-weight: 600;
      }

      .loading {
        color: #6b7280;
        margin: 1rem 0;
      }

      .controls {
        display: block;
      }

      .row-wrapper {
        position: relative;
      }

      .movies-row {
        display: flex;
        gap: 0.75rem;
        overflow-x: auto;
        padding: 0.5rem 0.5rem;
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
        flex: 0 0 180px;
        width: 180px;
        border-radius: 8px;
        background: #ffffff;
        border: 1px solid #e6e6e6;
        box-shadow: none;
        overflow: hidden;
        cursor: pointer;
      }

      .poster-image {
        width: 100%;
        height: 270px;
        object-fit: cover;
        display: block;
      }

      .card-info {
        padding: 0.6rem 0.65rem;
      }

      .title {
        font-size: 0.95rem;
        line-height: 1.2;
        color: #111827;
        margin-bottom: 0.35rem;
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
        color: #d18d16;
        font-weight: 600;
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

  constructor(private readonly tmdb: TmdbService, private readonly router: Router) {}

  ngOnInit(): void {
    this.tmdb.getTopRatedMovies().subscribe({
      next: (response) => {
        this.movies = response.results.filter((movie) => movie.original_language === 'en');
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
          error: () => {},
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
          error: () => {},
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
  }

  scroll(amount: number) {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    // update left arrow visibility after scroll (best-effort)
    setTimeout(() => this.onScroll(), 250);
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
  }

  scrollPopular(amount: number) {
    const el = this.popularScrollContainer?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(() => this.onScrollPopular(), 250);
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
  }

  scrollTv(amount: number) {
    const el = this.tvScrollContainer?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(() => this.onScrollTv(), 250);
  }

  openMovie(tmdbId: number) {
    this.router.navigate(['/movie', tmdbId]);
  }
}
