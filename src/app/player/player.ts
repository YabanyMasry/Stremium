import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { PartyService, SyncEvent } from '../services/party.service';
import { PartyOverlayComponent } from '../party/party-overlay';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [NgIf, PartyOverlayComponent],
  template: `
    <div class="player-shell">
      <button class="back-btn" (click)="goHome()" aria-label="Back to home">
        <img src="assets/Stream 1.png" alt="Stream" class="back-logo" />
      </button>

      <!-- Watch Party overlay — top-center of player -->
      <app-party-overlay></app-party-overlay>

      <!-- Error fallback UI (best practice: handle errors gracefully) -->
      <div *ngIf="playerError" class="player-error">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ playerError }}</span>
      </div>

      <iframe
        #playerFrame
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

    .player-error {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 55;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      border-radius: 12px;
      background: rgba(220,38,38,0.85);
      backdrop-filter: blur(10px);
      color: #fff;
      font-size: 0.84rem;
      font-family: 'Roboto', system-ui, sans-serif;
      box-shadow: 0 4px 18px rgba(0,0,0,0.45);
      animation: errorSlideUp 300ms ease;
      white-space: nowrap;
    }
    @keyframes errorSlideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(12px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `],
})
export class PlayerComponent implements OnInit, OnDestroy {
  @Input() src: SafeResourceUrl | null = null;
  @Input() title = '';
  @Input() saved = false;
  /** localStorage key used to persist playback position (e.g. "movie_123" or "tv_456_1_3") */
  @Input() progressKey: string | null = null;
  @Output() overlaySave = new EventEmitter<void>();

  @ViewChild('playerFrame') private playerFrame!: ElementRef<HTMLIFrameElement>;

  /** Shown when the embed reports an error (best practice: handle errors gracefully). */
  playerError: string | null = null;
  playerReady = false;

  private static readonly STORAGE_KEY = 'playbackProgress';
  private static readonly THROTTLE_MS = 5_000;
  private static readonly EMBED_ORIGIN = 'https://cinesrc.st';
  private messageHandler: ((e: MessageEvent) => void) | null = null;
  private lastSaveTime = 0;
  private partySub: Subscription | null = null;

  /** Prevents echo: when we apply a sync command from a peer, ignore the
   *  resulting iframe event so we don't re-broadcast it back. */
  private suppressNextEvent: string | null = null;

  constructor(
    private readonly router: Router,
    private readonly zone: NgZone,
    private readonly party: PartyService,
  ) {}

  ngOnInit(): void {
    /* ── Iframe postMessage listener ── */
    this.messageHandler = (e: MessageEvent) => {
      /* Best practice: always verify origin */
      if (e.origin !== PlayerComponent.EMBED_ORIGIN) return;

      const d = e.data;
      if (!d || typeof d.type !== 'string') return;

      /* ── Best practice: handle player ready & errors gracefully ── */
      if (d.type === 'cinesrc:ready') {
        this.zone.run(() => (this.playerReady = true));
        return;
      }
      if (d.type === 'cinesrc:error') {
        this.zone.run(() => (this.playerError = d.error ?? 'Playback error'));
        return;
      }

      /* ── Progress persistence (throttled) ── */
      if (d.type === 'cinesrc:timeupdate' && this.progressKey) {
        const now = Date.now();
        if (now - this.lastSaveTime >= PlayerComponent.THROTTLE_MS) {
          this.lastSaveTime = now;
          this.zone.runOutsideAngular(() => {
            try {
              const map: Record<string, number> = JSON.parse(
                localStorage.getItem(PlayerComponent.STORAGE_KEY) || '{}',
              );
              map[this.progressKey!] = Math.floor(d.currentTime);
              localStorage.setItem(PlayerComponent.STORAGE_KEY, JSON.stringify(map));
            } catch { /* ignore */ }
          });
        }
      }

      /* ── Party sync: host → broadcast relevant events to peers ── */
      if (this.party && this.party.isHostNow) {
        if (this.suppressNextEvent === d.type) {
          this.suppressNextEvent = null;
          return;
        }

        let sync: SyncEvent | null = null;
        switch (d.type) {
          case 'cinesrc:play':
            sync = { action: 'play' };
            break;
          case 'cinesrc:pause':
            sync = { action: 'pause' };
            break;
          case 'cinesrc:timeupdate':
            // Host periodically shares current time so late joiners can sync
            sync = { action: 'seek', currentTime: d.currentTime };
            break;
        }
        if (sync) this.party.broadcastSync(sync);
      }
    };
    window.addEventListener('message', this.messageHandler);

    /* ── Party sync: guest → receive commands from host ── */
    this.partySub = this.party.syncEvent$.subscribe((evt) => {
      if (this.party.isHostNow) return; // host ignores its own broadcasts
      this.applySyncEvent(evt);
    });
  }

  ngOnDestroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    this.partySub?.unsubscribe();
  }

  /** Read saved playback seconds for the given key, or 0 */
  static getSavedTime(key: string): number {
    try {
      const map: Record<string, number> = JSON.parse(
        localStorage.getItem(PlayerComponent.STORAGE_KEY) || '{}',
      );
      return map[key] ?? 0;
    } catch {
      return 0;
    }
  }

  goHome() {
    this.party.leaveParty(); // clean up if in a party
    this.router.navigate(['/']);
  }

  onOverlayClick() {
    this.overlaySave.emit();
  }

  /* ── Private: send postMessage command to the CineSrc iframe ── */
  private sendCommand(command: string, args: any[] = []): void {
    const iframe = this.playerFrame?.nativeElement;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { type: 'cinesrc:command', command, args },
      PlayerComponent.EMBED_ORIGIN,
    );
  }

  /** Apply an incoming sync event from the party host. */
  private applySyncEvent(evt: SyncEvent): void {
    switch (evt.action) {
      case 'play':
        this.suppressNextEvent = 'cinesrc:play';
        this.sendCommand('play');
        break;
      case 'pause':
        this.suppressNextEvent = 'cinesrc:pause';
        this.sendCommand('pause');
        break;
      case 'seek':
        if (evt.currentTime != null) {
          this.sendCommand('seek', [evt.currentTime]);
        }
        break;
    }
  }
}
