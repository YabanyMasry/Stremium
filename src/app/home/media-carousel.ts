import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MediaRowDirective } from './media-row.directive';

export interface MediaRowItem {
  id: number;
  media_type: 'movie' | 'tv';
  poster_path?: string | null;
  title: string;
  year: string;
  vote_average: number;
  data?: any;
}

@Component({
  standalone: true,
  selector: 'app-media-carousel',
  imports: [NgFor, NgIf, MatCardModule, MediaRowDirective],
  template: `
    <div
      class="row-container"
      appMediaRow
      (mouseenter)="hovering = true"
      (mouseleave)="hovering = false"
    >
      <div
        #scrollEl
        class="media-row"
        tabindex="0"
        role="list"
        (scroll)="onScroll()"
      >
        <mat-card
          *ngFor="let item of items; trackBy: trackById"
          class="media-card"
          role="listitem"
          tabindex="0"
          (click)="itemClick.emit(item)"
          (keydown.enter)="itemClick.emit(item)"
        >
          <img
            *ngIf="item.poster_path"
            mat-card-image
            [src]="'https://image.tmdb.org/t/p/w500' + item.poster_path"
            [alt]="item.title + ' poster'"
            class="media-poster"
          />
          <mat-card-content class="card-overlay">
            <div class="media-title">{{ item.title }}</div>
            <div class="media-meta">
              <span class="year">{{ item.year }}</span>
              <span class="rating">{{ item.vote_average.toFixed(1) }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <button
        *ngIf="hovering && canScrollLeft"
        class="scroll-btn left"
        (click)="scroll(-300)"
        aria-label="Scroll left"
      >&#8249;</button>
      <button
        *ngIf="hovering"
        class="scroll-btn right"
        (click)="scroll(300)"
        aria-label="Scroll right"
      >&#8250;</button>
    </div>
  `,
  styles: [`
    /* Row container + fade overlays */
    .row-container { position: relative; padding: 0 8vw; box-sizing: border-box; z-index: 0; }

    .row-container::before,
    .row-container::after {
      content: "";
      position: absolute;
      top: 0; bottom: 0;
      width: 3vw;
      pointer-events: none;
      z-index: 29;
      opacity: 0;
      transition: opacity 200ms ease;
    }
    .row-container::before { left: 8vw; }
    .row-container::after  { right: 8vw; }

    .row-container.has-left-fade::before {
      opacity: 1;
      background: linear-gradient(to right,
        rgba(14,14,14,0.98) 0%, rgba(14,14,14,0.88) 20%, rgba(14,14,14,0.6) 45%,
        rgba(14,14,14,0.25) 70%, rgba(14,14,14,0.06) 92%, rgba(14,14,14,0) 100%);
    }
    .row-container.has-right-fade::after {
      opacity: 1;
      background: linear-gradient(to left,
        rgba(14,14,14,0.98) 0%, rgba(14,14,14,0.88) 20%, rgba(14,14,14,0.6) 45%,
        rgba(14,14,14,0.25) 70%, rgba(14,14,14,0.06) 92%, rgba(14,14,14,0) 100%);
    }

    /* Scrollable row */
    .media-row {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      padding: 0.5rem 0;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .media-row::-webkit-scrollbar { display: none; }

    /* Card */
    .media-card {
      position: relative;
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

    .media-poster {
      width: 100%;
      height: 330px;
      object-fit: cover;
      display: block;
      transition: transform 300ms ease;
      will-change: transform;
    }

    .media-card .card-overlay,
    .mat-mdc-card-content.card-overlay,
    .mat-mdc-card-content:last-child.card-overlay {
      box-sizing: border-box;
      padding: 0.6rem 0.7rem 8px;
      height: 60%;
    }

    .card-overlay {
      position: absolute;
      left: 0; bottom: 0; right: 0;
      height: 60%;
      padding: 0.6rem 0.7rem 0.05rem;
      color: #fff;
      background: linear-gradient(to top,
        rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 20%, rgba(0,0,0,0.55) 55%,
        rgba(0,0,0,0.18) 80%, rgba(0,0,0,0) 100%);
      opacity: 0;
      transition: opacity 220ms ease;
      display: flex;
      flex-direction: column;
      gap: 1px;
      justify-content: flex-end;
      z-index: 10;
    }

    .media-title {
      font-family: 'Staatliches', 'Doto', 'Roboto', system-ui, sans-serif;
      font-size: 1.1rem;
      line-height: 1.02;
      color: #ffffff;
      margin-bottom: 0.12rem;
      max-height: 2.8rem;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .media-meta {
      color: rgba(255,255,255,0.9);
      font-size: 0.85rem;
      display: flex;
      justify-content: left;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Staatliches', 'Doto', 'Roboto', system-ui, sans-serif;
    }

    /* Hover / focus */
    .media-card:hover .media-poster { transform: scale(1.07); }
    .media-card:hover .card-overlay,
    .media-card:focus-within .card-overlay { opacity: 1; }

    /* Scroll buttons */
    .scroll-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      line-height: 1;
      border: none;
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.95);
      cursor: pointer;
      z-index: 30;
      padding: 0;
      border-radius: 50%;
      box-shadow: 0 6px 18px rgba(0,0,0,0.6);
      backdrop-filter: blur(6px);
      transition: transform 180ms ease, background 180ms ease, color 180ms ease;
    }
    .scroll-btn.left  { left: 7vw; }
    .scroll-btn.right { right: 7vw; }
    .scroll-btn:hover {
      transform: translateY(-50%) scale(1.06);
      background: rgba(255,255,255,0.12);
      color: rgba(0,0,0,0.9);
    }
  `],
})
export class MediaCarouselComponent implements AfterViewInit {
  @Input() items: MediaRowItem[] = [];
  @Output() itemClick = new EventEmitter<MediaRowItem>();
  @Output() nearEnd = new EventEmitter<void>();

  @ViewChild('scrollEl', { static: false }) private scrollEl!: ElementRef<HTMLDivElement>;

  hovering = false;
  canScrollLeft = false;

  private nearEndThrottled = false;

  ngAfterViewInit() {
    setTimeout(() => this.onScroll(), 0);
  }

  trackById(_: number, item: MediaRowItem) {
    return item.media_type + item.id;
  }

  onScroll() {
    const el = this.scrollEl?.nativeElement;
    if (!el) { this.canScrollLeft = false; return; }
    this.canScrollLeft = el.scrollLeft > 5;

    if (!this.nearEndThrottled && (el.scrollLeft + el.clientWidth) >= (el.scrollWidth - 220)) {
      this.nearEndThrottled = true;
      this.nearEnd.emit();
      setTimeout(() => (this.nearEndThrottled = false), 500);
    }
  }

  scroll(amount: number) {
    const el = this.scrollEl?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(() => this.onScroll(), 250);
  }
}
