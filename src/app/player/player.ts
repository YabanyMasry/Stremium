import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="player-shell">
      <button class="back-btn" (click)="goHome()" aria-label="Back to home">
        <img src="assets/Stream 1.png" alt="Stream" class="back-logo" />
      </button>

      <iframe
        *ngIf="src"
        [src]="src"
        width="100%"
        height="100%"
        frameborder="0"
        allowfullscreen
        allow="autoplay; fullscreen; picture-in-picture"
        class="player-iframe"
        [title]="title || 'Player'"
      ></iframe>

      <!-- first-click overlay to trigger save -->
      <div
        *ngIf="!saved"
        class="player-overlay"
        role="button"
        tabindex="0"
        (click)="onOverlayClick()"
        (keydown.enter)="onOverlayClick()"
        aria-label="Save to continue watching"
      ></div>
    </div>
  `,
  styles: [`
    .player-shell {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .back-btn {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 999px;
      background: rgba(14,14,14,0.55);
      backdrop-filter: blur(14px) saturate(1.4);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      box-shadow: 0 4px 18px rgba(0,0,0,0.45);
      cursor: pointer;
      transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
      padding: 0;
    }
    .back-btn:hover {
      transform: scale(1.06);
      background: rgba(14,14,14,0.72);
      box-shadow: 0 6px 24px rgba(0,0,0,0.55);
    }
    .back-btn:active {
      transform: scale(0.97);
    }

    .back-logo {
      height: 20px;
      width: auto;
      filter: brightness(0) invert(1);
    }

    .player-iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      background: #000;
    }

    .player-overlay {
      position: absolute;
      inset: 0;
      z-index: 30;
      background: transparent;
      cursor: pointer;
    }
  `],
})
export class PlayerComponent {
  @Input() src: SafeResourceUrl | null = null;
  @Input() title = '';
  @Input() saved = false;
  @Output() overlaySave = new EventEmitter<void>();

  constructor(private readonly router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }

  onOverlayClick() {
    this.overlaySave.emit();
  }
}
