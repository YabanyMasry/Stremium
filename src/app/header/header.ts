import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { TmdbService } from '../services/tmdb.service';

interface SearchItem {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
}

@Component({
  selector: 'app-header',
  imports: [NgIf, NgFor, SlicePipe],
  template: `
    <header class="site-header">
      <div class="container">
        <div
          class="logo"
          role="button"
          tabindex="0"
          (click)="goHome()"
          (keydown.enter)="goHome()"
          aria-label="Go to home"
        >
          <span class="logo-mark">◐</span>
          <span class="brand">Stream</span>
        </div>

        <div class="search">
          <input
            type="search"
            placeholder="Search movies, TV..."
            (input)="onInput($event)"
            [value]="query"
            aria-label="Search"
          />

          <div class="results" *ngIf="showResults">
            <div class="result" *ngFor="let r of searchResults" (click)="onResultClick(r)">
              <img *ngIf="r.poster_path" [src]="'https://image.tmdb.org/t/p/w92' + r.poster_path" alt="poster" />
              <div class="meta">
                <div class="title">{{ r.title || r.name }}</div>
                <div class="sub">{{ r.media_type }} • {{ (r.release_date || r.first_air_date) | slice:0:4 }}</div>
              </div>
            </div>
            <div class="empty" *ngIf="!isSearching && searchResults.length === 0">No results</div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: `
    .site-header { background: #0f172a; color: #fff; padding: 0.5rem 1rem; }
    .container { display:flex; align-items:center; justify-content:space-between; max-width:1100px; margin:0 auto; }
    .logo { display:flex; align-items:center; gap:0.5rem; cursor:pointer; user-select:none; }
    .logo-mark { display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; background:linear-gradient(135deg,#06b6d4,#7c3aed); border-radius:8px; font-weight:700; }
    .brand { font-weight:700; font-size:1rem; color:#fff; }
    .search { position:relative; width:360px; }
    .search input { width:100%; padding:0.5rem 0.6rem; border-radius:6px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:#fff; }
    .results { position:absolute; left:0; right:0; top:110%; background:#fff; color:#111827; box-shadow:0 6px 18px rgba(2,6,23,0.24); border-radius:8px; max-height:360px; overflow:auto; z-index:40; }
    .result { display:flex; gap:0.6rem; padding:0.5rem; align-items:center; cursor:pointer; border-bottom:1px solid #eee; }
    .result img { width:48px; height:72px; object-fit:cover; border-radius:4px; }
    .result .meta { font-size:0.9rem; }
    .result .title { font-weight:600; }
    .result .sub { color:#6b7280; font-size:0.85rem; }
    .empty { padding:0.5rem; color:#6b7280; }
  `,
})
export class Header {
  query = '';
  private timer: any = null;
  searchResults: SearchItem[] = [];
  isSearching = false;
  showResults = false;

  constructor(private readonly router: Router, private readonly tmdb: TmdbService) {}

  goHome(): void {
    this.router.navigate(['/']);
  }

  onInput(event: Event) {
    const v = (event.target as HTMLInputElement).value;
    this.query = v;
    if (this.timer) clearTimeout(this.timer);
    if (!v || v.trim().length === 0) {
      this.searchResults = [];
      this.showResults = false;
      return;
    }
    this.isSearching = true;
    // debounce 400ms
    this.timer = setTimeout(() => this.doSearch(v.trim()), 400);
  }

  private doSearch(q: string) {
    this.tmdb.searchMulti(q).subscribe({
      next: (res) => {
        const items = (res.results || []) as SearchItem[];
        // exclude person media type
        this.searchResults = items.filter((i) => i.media_type !== 'person');
        this.isSearching = false;
        this.showResults = true;
      },
      error: (err) => {
        console.error(err);
        this.searchResults = [];
        this.isSearching = false;
        this.showResults = true;
      }
    });
  }

  onResultClick(item: SearchItem) {
    this.showResults = false;
    if (item.media_type === 'movie') {
      this.router.navigate(['/movie', item.id]);
    } else if (item.media_type === 'tv') {
      this.router.navigate(['/show', item.id]);
    }
  }
}
