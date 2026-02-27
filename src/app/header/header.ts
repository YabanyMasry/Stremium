import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { TmdbService } from '../services/tmdb.service';
import { PartyService } from '../services/party.service';
import { PartyJoinDialogComponent } from '../party/party-join-dialog';
import { PreviewSheetComponent, PreviewPlayEvent } from '../home/preview-sheet';

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
  imports: [NgIf, NgFor, SlicePipe, PartyJoinDialogComponent, PreviewSheetComponent],
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
          <img src="assets/Stream 1.png" alt="Stream" class="logo-img" />
        </div>

        <nav class="nav-links" [class.hidden]="searchExpanded">
          <a [class.active]="isActive('/')" (click)="navigate('/')" tabindex="0">Home</a>
          <a [class.active]="isActive('/movies')" (click)="navigate('/movies')" tabindex="0">Movies</a>
          <a [class.active]="isActive('/series')" (click)="navigate('/series')" tabindex="0">Series</a>
          <a class="party-link" [class.active-party]="party.inPartyNow" (click)="openPartyDialog()" tabindex="0" title="Join Watch Party">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Party
          </a>
        </nav>

        <div class="search" [class.full]="searchExpanded">
          <input
            #searchInput
            type="text"
            placeholder="Search..."
            [class.expanded]="searchExpanded"
            (input)="onInput($event)"
            (focus)="expandSearch()"
            (blur)="collapseSearch()"
            [value]="query"
            aria-label="Search"
          />
          <button class="clear-btn" *ngIf="query" (mousedown)="clearSearch($event)" aria-label="Clear search">
            <svg viewBox="0 0 16 16" fill="none"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>

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

    <app-party-join-dialog #partyDialog></app-party-join-dialog>

    <app-preview-sheet
      [open]="previewOpen"
      [mediaType]="previewMediaType"
      [mediaId]="previewMediaId"
      (play)="onPreviewPlay($event)"
      (closed)="previewOpen = false"
    ></app-preview-sheet>
  `,
  styles: `
    .site-header {
      position: fixed;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 40px);
      max-width: 750px;
      background: rgba(14,14,14,0.72);
      color: #fff;
      padding: 0.55rem 0.85rem;
      border-radius: 22px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.07);
      z-index: 1100;
      backdrop-filter: blur(18px) saturate(1.4);
      -webkit-backdrop-filter: blur(18px) saturate(1.4);
    }

    .container { display: flex; align-items: center; gap: 1rem; padding: 0 4px; }

    .logo { display: flex; align-items: center; cursor: pointer; user-select: none; flex-shrink: 0; }
    .logo-img { height: 28px; width: auto; display: block; filter: brightness(0) invert(1); }

    .nav-links { display: flex; gap: 0.15rem; align-items: center; flex-shrink: 0; transition: opacity 220ms ease, max-width 320ms cubic-bezier(.25,.8,.25,1), margin 320ms ease; overflow: hidden; max-width: 420px; white-space: nowrap; }
    .nav-links.hidden { opacity: 0; max-width: 0; pointer-events: none; margin: 0; }
    .nav-links a {
      color: rgba(255,255,255,0.50);
      text-decoration: none;
      font-family: 'doto' ,'Roboto', system-ui, sans-serif;
      font-weight: 100;
      font-size: 1rem;
      padding: 0.3rem 0.75rem;
      border-radius: 22px;
      cursor: pointer;
      transition: color 160ms ease, background 160ms ease;
      user-select: none;
    }
    .nav-links a:hover { color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.06); }
    .nav-links a.active { color: #fff; background: rgba(255,255,255,0.10); }

    .party-link { display: inline-flex; align-items: center; gap: 4px; }
    .party-link svg { flex-shrink: 0; }
    .party-link.active-party { color: rgba(229,9,20,0.95); background: rgba(229,9,20,0.12); }

    .search { position: relative; margin-left: auto; flex: 1; display: flex; align-items: center; transition: flex-grow 320ms cubic-bezier(.25,.8,.25,1); }
    .search input { padding-right: 2rem; }
    .search.full { flex-grow: 1; }
    .search input {
      width: 100%;
      padding: 0.42rem 0.75rem;
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.05);
      color: #fff;
      font-size: 0.88rem;
      outline: none;
      transition: border-color 220ms ease, background 220ms ease, box-shadow 220ms ease;
    }
    .search input::placeholder { color: rgba(255,255,255,0.3); }
    .search input:focus { border-color: rgba(255,255,255,0.16); background: rgba(255,255,255,0.07); box-shadow: 0 0 0 3px rgba(255,255,255,0.04); }

    .clear-btn {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      width: 22px; height: 22px; padding: 0; border: none; border-radius: 50%;
      background: rgba(255,255,255,0.10); color: rgba(255,255,255,0.55);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: background 160ms ease, color 160ms ease;
    }
    .clear-btn:hover { background: rgba(255,255,255,0.18); color: rgba(255,255,255,0.85); }
    .clear-btn svg { width: 12px; height: 12px; }

    .results {
      position: absolute; left: 0; right: 0; top: calc(100% + 10px);
      background: rgba(18,18,18,0.94);
      backdrop-filter: blur(14px);
      color: #fff;
      box-shadow: 0 12px 36px rgba(0,0,0,0.55);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      max-height: 380px; overflow: auto; z-index: 1200;
    }
    .result { display: flex; gap: 0.65rem; padding: 0.55rem 0.65rem; align-items: center; cursor: pointer; transition: background 120ms ease; }
    .result + .result { border-top: 1px solid rgba(255,255,255,0.06); }
    .result:hover { background: rgba(255,255,255,0.06); }
    .result img { width: 44px; height: 66px; object-fit: cover; border-radius: 6px; }
    .result .meta { font-size: 0.88rem; }
    .result .title { font-weight: 600; color: #fff; }
    .result .sub { color: rgba(255,255,255,0.45); font-size: 0.82rem; }
    .empty { padding: 0.65rem; color: rgba(255,255,255,0.4); font-size: 0.88rem; }
  `,
})
export class Header {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('partyDialog') partyDialog!: PartyJoinDialogComponent;
  query = '';
  private timer: any = null;
  searchResults: SearchItem[] = [];
  isSearching = false;
  showResults = false;
  searchExpanded = false;

  // preview sheet state
  previewOpen = false;
  previewMediaType: 'movie' | 'tv' = 'movie';
  previewMediaId: number | null = null;

  constructor(
    private readonly router: Router,
    private readonly tmdb: TmdbService,
    readonly party: PartyService,
  ) {}

  openPartyDialog(): void {
    this.partyDialog?.show();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  isActive(path: string): boolean {
    if (path === '/') return this.router.url === '/';
    return this.router.url.startsWith(path);
  }

  expandSearch() {
    this.searchExpanded = true;
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }

  collapseSearch() {
    // delay collapse so click on results can register
    setTimeout(() => {
      if (!this.query) {
        this.searchExpanded = false;
        this.showResults = false;
      }
    }, 200);
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

  clearSearch(event: Event) {
    event.preventDefault(); // keep focus
    this.query = '';
    this.searchResults = [];
    this.showResults = false;
    this.searchInput?.nativeElement?.focus();
  }

  onResultClick(item: SearchItem) {
    this.showResults = false;
    this.query = '';
    this.searchExpanded = false;
    this.previewMediaType = item.media_type === 'tv' ? 'tv' : 'movie';
    this.previewMediaId = item.id;
    this.previewOpen = true;
  }

  onPreviewPlay(event: PreviewPlayEvent) {
    this.previewOpen = false;
    if (event.media_type === 'movie') {
      this.router.navigate(['/movie', event.id]);
    } else {
      this.router.navigate(['/show', event.id], {
        queryParams: {
          season: event.season ?? 1,
          episode: event.episode ?? 1,
        },
      });
    }
  }
}
