import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NgFor, NgIf, SlicePipe } from '@angular/common';

export interface HeroSlide {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  overview?: string;
  backdrop_path?: string | null;
  logo_path?: string | null;
  vote_average: number;
  year: string;
  genres?: string[];
}

@Component({
  standalone: true,
  selector: 'app-hero-carousel',
  imports: [NgFor, NgIf, SlicePipe],
  template: `
    <div class="hero" *ngIf="slides.length > 0">
      <!-- slides -->
      <div
        *ngFor="let s of slides; let i = index"
        class="slide"
        [class.active]="i === current"
        [class.prev]="i === prev"
      >
        <img
          *ngIf="s.backdrop_path"
          class="slide-img"
          [src]="'https://image.tmdb.org/t/p/original' + s.backdrop_path"
          alt=""
        />
        <div class="slide-overlay"></div>
        <div class="slide-content">
          <img *ngIf="s.logo_path" class="slide-logo" [src]="'https://image.tmdb.org/t/p/w500' + s.logo_path" [alt]="s.title" />
          <div class="slide-title" *ngIf="!s.logo_path">{{ s.title }}</div>
          <div class="slide-meta">
            <span class="pill">{{ s.year }}</span>
            <span class="pill">&#9733; {{ s.vote_average.toFixed(1) }}</span>
            <span class="pill type">{{ s.media_type === 'tv' ? 'Series' : 'Movie' }}</span>
            <span class="pill genre" *ngFor="let g of (s.genres || []) | slice:0:3">{{ g }}</span>
          </div>
          <p class="slide-overview" *ngIf="s.overview">{{ s.overview | slice:0:180 }}{{ (s.overview!.length) > 180 ? '…' : '' }}</p>
          <button class="slide-play" (click)="slideClick.emit(s)">&#9654; Play</button>
        </div>
      </div>

      <!-- arrows -->
      <button class="arrow left" (click)="goTo(current - 1)" aria-label="Previous">&#8249;</button>
      <button class="arrow right" (click)="goTo(current + 1)" aria-label="Next">&#8250;</button>

      <!-- dots -->
      <div class="dots">
        <button
          *ngFor="let s of slides; let i = index"
          class="dot"
          [class.active]="i === current"
          (click)="goTo(i)"
          [attr.aria-label]="'Slide ' + (i + 1)"
        ></button>
      </div>
    </div>
  `,
  styles: [
    `
      .hero {
        position: relative;
        width: 100%;
        aspect-ratio: 2.4 / 1;
        overflow: hidden;
        border-radius: 0;
        margin-bottom: 0.5rem;
      }

      /* slides */
      .slide {
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 700ms ease;
        pointer-events: none;
        z-index: 0;
      }
      .slide.active {
        opacity: 1;
        pointer-events: auto;
        z-index: 2;
      }
      .slide.prev {
        opacity: 0;
        z-index: 1;
      }

      .slide-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 20%;
        display: block;
      }

      .slide-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to top,
            rgba(14, 14, 14, 1) 0%,
            rgba(14, 14, 14, 0.85) 12%,
            rgba(0, 0, 0, 0.35) 50%,
            rgba(0, 0, 0, 0.08) 80%,
            transparent 100%
          ),
          linear-gradient(
            to right,
            rgba(14, 14, 14, 0.7) 0%,
            transparent 55%
          );
      }

      .slide-content {
        position: absolute;
        left: 8vw;
        bottom: 18%;
        z-index: 3;
        max-width: 45%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .slide-logo {
        max-width: 280px;
        max-height: 6vw;
        width: auto;
        height: auto;
        object-fit: contain;
        object-position: left;
        display: block;
        filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.6));
      }

      .slide-title {
        
        font-family:'Staatliches' , 'Doto', 'Roboto', system-ui, sans-serif;
        font-size: clamp(1.6rem, 3vw, 2.8rem);
        font-weight: 800;
        color: #fff;
        line-height: 1.1;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
      }

      .slide-meta {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .pill {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(6px);
        color: rgba(255, 255, 255, 0.9);
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.82rem;
        font-weight: 600;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .pill.type {
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.76rem;
      }
      .pill.genre {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.08);
        font-size: 0.78rem;
      }

      .slide-overview {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.92rem;
        line-height: 1.45;
        margin: 0;
        max-width: 90%;
        text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
      }

      .slide-play {
        align-self: flex-start;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 0.55rem 1.5rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.92rem;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        transition: transform 180ms ease, background 180ms ease,
          box-shadow 180ms ease;
        margin-top: 0.15rem;
      }
      .slide-play:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.16);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      }
      .slide-play:active {
        transform: translateY(0);
      }

      /* arrows */
      .arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        border: none;
        background: rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(6px);
        color: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        transition: transform 180ms ease, background 180ms ease;
        opacity: 0;
      }
      .hero:hover .arrow {
        opacity: 1;
      }
      .arrow.left {
        left: 1rem;
      }
      .arrow.right {
        right: 1rem;
      }
      .arrow:hover {
        transform: translateY(-50%) scale(1.08);
        background: rgba(255, 255, 255, 0.12);
      }

      /* dots */
      .dots {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.25);
        cursor: pointer;
        padding: 0;
        transition: background 220ms ease, transform 220ms ease,
          width 220ms ease;
      }
      .dot.active {
        background: #fff;
        width: 22px;
        border-radius: 999px;
        transform: scaleY(1);
      }
      .dot:hover:not(.active) {
        background: rgba(255, 255, 255, 0.5);
      }
    `,
  ],
})
export class HeroCarouselComponent implements OnInit, OnDestroy, OnChanges {
  @Input() slides: HeroSlide[] = [];
  @Input() interval = 6000;
  @Output() slideClick = new EventEmitter<HeroSlide>();

  current = 0;
  prev = -1;
  private timer: any = null;

  ngOnInit() {
    this.startTimer();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['slides']) {
      this.current = 0;
      this.prev = -1;
      this.restartTimer();
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  goTo(index: number) {
    if (this.slides.length === 0) return;
    this.prev = this.current;
    this.current =
      ((index % this.slides.length) + this.slides.length) % this.slides.length;
    this.restartTimer();
  }

  private startTimer() {
    this.stopTimer();
    if (this.slides.length <= 1) return;
    this.timer = setInterval(() => this.goTo(this.current + 1), this.interval);
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private restartTimer() {
    this.stopTimer();
    this.startTimer();
  }
}
