import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { PartyService, SyncEvent } from '../services/party.service';
import { PartyOverlayComponent } from '../party/party-overlay';
import { ProviderService, StreamProvider, PROVIDERS } from '../services/provider.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [NgIf, NgFor, PartyOverlayComponent],
  template: `
    <div class="player-shell">
      <button class="back-btn" (click)="goHome()" aria-label="Back to home">
        <img src="assets/Stream 1.png" alt="Stream" class="back-logo" />
      </button>

      <!-- Provider switcher (top-right) -->
      <div class="provider-switcher">
        <button
          type="button"
          class="provider-trigger"
          (click)="toggleProviderMenu()"
          [attr.aria-expanded]="providerOpen"
          aria-haspopup="listbox"
          aria-label="Switch streaming provider"
          [title]="'Source: ' + currentProviderLabel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          <span class="provider-label">{{ currentProviderLabel }}</span>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7l5 5 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <ul *ngIf="providerOpen" class="provider-list" role="listbox">
          <li
            *ngFor="let p of providers"
            role="option"
            class="provider-item"
            [class.selected]="p.id === currentProvider"
            (click)="selectProvider(p.id)"
          >
            <span class="dot" [class.on]="p.id === currentProvider"></span>
            <span>{{ p.label }}</span>
          </li>
        </ul>
      </div>

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

    /* ── Provider switcher ── */
    .provider-switcher {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 50;
      font-family: 'Roboto', system-ui, sans-serif;
    }
    .provider-trigger {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 12px;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 999px;
      background: rgba(14,14,14,0.55);
      backdrop-filter: blur(14px) saturate(1.4);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      box-shadow: 0 4px 18px rgba(0,0,0,0.45);
      color: rgba(255,255,255,0.92);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
    }
    .provider-trigger:hover {
      transform: translateY(-1px);
      background: rgba(14,14,14,0.72);
      box-shadow: 0 6px 24px rgba(0,0,0,0.55);
    }
    .provider-trigger:active { transform: translateY(0); }
    .provider-label {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .provider-list {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      min-width: 180px;
      margin: 0;
      padding: 6px;
      list-style: none;
      background: rgba(20,20,20,0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.55);
      animation: providerFadeIn 160ms ease;
    }
    @keyframes providerFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .provider-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      color: rgba(255,255,255,0.85);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 120ms ease;
    }
    .provider-item:hover { background: rgba(255,255,255,0.08); }
    .provider-item.selected { background: rgba(229,9,20,0.15); color: #fff; }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: rgba(255,255,255,0.25);
      transition: background 160ms ease, box-shadow 160ms ease;
    }
    .dot.on {
      background: #e50914;
      box-shadow: 0 0 8px rgba(229,9,20,0.7);
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

    @media (max-width: 480px) {
      .provider-switcher { top: 12px; right: 12px; }
      .provider-trigger { height: 32px; padding: 0 10px; font-size: 0.76rem; }
      .provider-label { max-width: 80px; }
    }
  `],
})
export class PlayerComponent implements OnInit, OnDestroy {
  @Input() src: SafeResourceUrl | null = null;
  @Input() title = '';
  @Input() saved = false;
  /** localStorage key used to persist playback position (e.g. "movie_123" or "tv_456_1_3") */
  @Input() progressKey: string | null = null;
  /** Current TV season/episode (when applicable) — used to detect in-player switches. */
  @Input() currentSeason: number | null = null;
  @Input() currentEpisode: number | null = null;
  @Output() overlaySave = new EventEmitter<void>();
  @Output() providerChanged = new EventEmitter<StreamProvider>();
  /** Fired when the embedded player switches to a different episode on its own. */
  @Output() episodeChanged = new EventEmitter<{ season: number; episode: number }>();

  @ViewChild('playerFrame') private playerFrame!: ElementRef<HTMLIFrameElement>;

  /** Shown when the embed reports an error (best practice: handle errors gracefully). */
  playerError: string | null = null;
  playerReady = false;

  /* ── Provider switcher state ── */
  readonly providers = PROVIDERS;
  providerOpen = false;
  currentProvider: StreamProvider = 'cinesrc';

  private static readonly STORAGE_KEY = 'playbackProgress';
  private static readonly THROTTLE_MS = 5_000;
  /** Map provider id → trusted origin for postMessage. */
  private static readonly ORIGINS: Record<StreamProvider, string> = {
    cinesrc: 'https://cinesrc.st',
    vidking: 'https://www.vidking.net',
  };
  private messageHandler: ((e: MessageEvent) => void) | null = null;
  private docClickHandler: ((e: Event) => void) | null = null;
  private lastSaveTime = 0;
  private partySub: Subscription | null = null;
  private providerSub: Subscription | null = null;

  /** Prevents echo: when we apply a sync command from a peer, ignore the
   *  resulting iframe event so we don't re-broadcast it back. */
  private suppressNextEvent: string | null = null;

  get currentProviderLabel(): string {
    return this.providerSvc.metaFor(this.currentProvider).label;
  }

  constructor(
    private readonly router: Router,
    private readonly zone: NgZone,
    private readonly party: PartyService,
    private readonly providerSvc: ProviderService,
  ) {}

  ngOnInit(): void {
    this.currentProvider = this.providerSvc.current;
    this.providerSub = this.providerSvc.provider$.subscribe((p) => {
      this.zone.run(() => (this.currentProvider = p));
    });

    /* ── Iframe postMessage listener ── */
    this.messageHandler = (e: MessageEvent) => {
      const expected = PlayerComponent.ORIGINS[this.currentProvider];
      if (e.origin !== expected) return;

      const normalized = this.normalize(e.data);
      if (!normalized) return;
      const { kind, currentTime, season, episode } = normalized;

      /* ── In-player episode change → notify parent so it can update cookies/state ── */
      if (
        typeof season === 'number' && season > 0 &&
        typeof episode === 'number' && episode > 0
      ) {
        const seasonChanged = this.currentSeason != null && season !== this.currentSeason;
        const episodeChanged = this.currentEpisode != null && episode !== this.currentEpisode;
        if (seasonChanged || episodeChanged) {
          // Update our local snapshot first to avoid re-emitting on the next event.
          this.currentSeason = season;
          this.currentEpisode = episode;
          this.zone.run(() => this.episodeChanged.emit({ season, episode }));
        }
      }

      /* ── ready & errors ── */
      if (kind === 'ready') {
        this.zone.run(() => (this.playerReady = true));
        return;
      }
      if (kind === 'error') {
        this.zone.run(() => (this.playerError = normalized.error ?? 'Playback error'));
        return;
      }

      /* ── Progress persistence (throttled) ── */
      if (kind === 'timeupdate' && this.progressKey && typeof currentTime === 'number') {
        const now = Date.now();
        if (now - this.lastSaveTime >= PlayerComponent.THROTTLE_MS) {
          this.lastSaveTime = now;
          this.zone.runOutsideAngular(() => {
            try {
              const map: Record<string, number> = JSON.parse(
                localStorage.getItem(PlayerComponent.STORAGE_KEY) || '{}',
              );
              map[this.progressKey!] = Math.floor(currentTime);
              localStorage.setItem(PlayerComponent.STORAGE_KEY, JSON.stringify(map));
            } catch { /* ignore */ }
          });
        }
      }

      /* ── Party sync: host → broadcast relevant events to peers ── */
      if (this.party && this.party.isHostNow) {
        if (this.suppressNextEvent === kind) {
          this.suppressNextEvent = null;
          return;
        }

        let sync: SyncEvent | null = null;
        switch (kind) {
          case 'play':
            sync = { action: 'play' };
            break;
          case 'pause':
            sync = { action: 'pause' };
            break;
          case 'timeupdate':
          case 'seeked':
            if (typeof currentTime === 'number') {
              sync = { action: 'seek', currentTime };
            }
            break;
        }
        if (sync) this.party.broadcastSync(sync);
      }
    };
    window.addEventListener('message', this.messageHandler);

    /* close provider menu on outside click */
    this.docClickHandler = (e: Event) => {
      if (!this.providerOpen) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('.provider-switcher')) return;
      this.zone.run(() => (this.providerOpen = false));
    };
    document.addEventListener('click', this.docClickHandler);

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
    if (this.docClickHandler) {
      document.removeEventListener('click', this.docClickHandler);
      this.docClickHandler = null;
    }
    this.partySub?.unsubscribe();
    this.providerSub?.unsubscribe();
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

  toggleProviderMenu(): void {
    this.providerOpen = !this.providerOpen;
  }

  selectProvider(id: StreamProvider): void {
    this.providerOpen = false;
    if (id === this.currentProvider) return;
    // reset transient player state — new embed loads fresh
    this.playerError = null;
    this.playerReady = false;
    this.providerSvc.set(id);
    this.providerChanged.emit(id);
  }

  /**
   * Normalize per-provider message shapes into a common form.
   * Returns null when the message isn't recognized.
   */
  private normalize(
    data: any,
  ): { kind: string; currentTime?: number; error?: string; season?: number; episode?: number } | null {
    if (!data || typeof data !== 'object') return null;
    const num = (v: unknown): number | undefined => (typeof v === 'number' && isFinite(v) ? v : undefined);

    // CineSrc: { type: 'cinesrc:<event>', currentTime?, season?, episode?, error? }
    if (typeof data.type === 'string' && data.type.startsWith('cinesrc:')) {
      return {
        kind: data.type.slice('cinesrc:'.length),
        currentTime: num(data.currentTime),
        error: typeof data.error === 'string' ? data.error : undefined,
        season: num(data.season),
        episode: num(data.episode),
      };
    }

    // Vidking: { type: 'PLAYER_EVENT', data: { event, currentTime, season, episode, ... } }
    if (data.type === 'PLAYER_EVENT' && data.data && typeof data.data === 'object') {
      const d = data.data;
      if (typeof d.event !== 'string') return null;
      return {
        kind: d.event,
        currentTime: num(d.currentTime),
        season: num(d.season),
        episode: num(d.episode),
      };
    }

    return null;
  }

  /* ── Private: send postMessage command to the active iframe ──
   * Only CineSrc documents a command channel; vidking is event-only,
   * so command-based sync (party seek/play) only takes effect on cinesrc. */
  private sendCommand(command: string, args: any[] = []): void {
    const iframe = this.playerFrame?.nativeElement;
    if (!iframe?.contentWindow) return;
    const target = PlayerComponent.ORIGINS[this.currentProvider];
    if (this.currentProvider === 'cinesrc') {
      iframe.contentWindow.postMessage({ type: 'cinesrc:command', command, args }, target);
    }
    // vidking: no documented command API — no-op
  }

  /** Apply an incoming sync event from the party host. */
  private applySyncEvent(evt: SyncEvent): void {
    switch (evt.action) {
      case 'play':
        this.suppressNextEvent = 'play';
        this.sendCommand('play');
        break;
      case 'pause':
        this.suppressNextEvent = 'pause';
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
