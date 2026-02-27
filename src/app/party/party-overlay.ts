import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { PartyService } from '../services/party.service';

@Component({
  selector: 'app-party-overlay',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  template: `
    <!-- "Create Party" pill — shown when NOT in a party -->
    <button
      *ngIf="!(party.inParty$ | async)"
      class="create-btn"
      (click)="onCreate()"
      [disabled]="creating"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      {{ creating ? 'Creating…' : 'Watch Party' }}
    </button>

    <!-- Active party HUD — shown when in a party -->
    <div *ngIf="party.inParty$ | async" class="party-hud">
      <div class="hud-row">
        <div class="hud-badge host" *ngIf="party.isHost$ | async">HOST</div>
        <div class="hud-badge guest" *ngIf="!(party.isHost$ | async)">GUEST</div>

        <button class="code-pill" (click)="copyCode()" [title]="copied ? 'Copied!' : 'Click to copy code'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span class="code-text">{{ party.partyCode$ | async }}</span>
          <span class="copied-badge" *ngIf="copied">Copied!</span>
        </button>

        <span class="members-count" title="Connected members">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          {{ party.members$ | async }}
        </span>

        <button class="leave-btn" (click)="onLeave()" title="Leave party">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <p class="hud-error" *ngIf="error">{{ error }}</p>
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 60;
      pointer-events: none;
    }

    /* ── Create button (subtle / transparent so it doesn't cover player text) ── */
    .create-btn {
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 999px;
      background: rgba(14,14,14,0.25);
      backdrop-filter: blur(8px) saturate(1.2);
      -webkit-backdrop-filter: blur(8px) saturate(1.2);
      box-shadow: 0 2px 10px rgba(0,0,0,0.25);
      color: rgba(255,255,255,0.45);
      font-family: 'Roboto', system-ui, sans-serif;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: transform 180ms ease, background 260ms ease, box-shadow 260ms ease, color 260ms ease, opacity 180ms ease;
      white-space: nowrap;
      opacity: 0;
      animation: fadeSlideIn 400ms 600ms ease forwards;
    }
    .create-btn:hover {
      transform: scale(1.04);
      background: rgba(14,14,14,0.55);
      color: rgba(255,255,255,0.85);
      box-shadow: 0 4px 18px rgba(0,0,0,0.45);
    }
    .create-btn:active { transform: scale(0.97); }
    .create-btn:disabled { opacity: 0.35; cursor: default; }

    /* ── Party HUD ── */
    .party-hud {
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      animation: fadeSlideIn 300ms ease forwards;
    }

    .hud-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(14,14,14,0.65);
      backdrop-filter: blur(14px) saturate(1.4);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      border: 1px solid rgba(255,255,255,0.10);
      box-shadow: 0 4px 18px rgba(0,0,0,0.45);
      transition: background 260ms ease, box-shadow 260ms ease;
    }
    .hud-row:hover {
      background: rgba(14,14,14,0.78);
      box-shadow: 0 6px 24px rgba(0,0,0,0.55);
    }

    .hud-badge {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: 2px 8px;
      border-radius: 999px;
      text-transform: uppercase;
    }
    .hud-badge.host { background: rgba(229,9,20,0.85); color: #fff; }
    .hud-badge.guest { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.8); }

    .code-pill {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      color: #fff;
      font-family: 'Doto', 'Roboto Mono', monospace;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      cursor: pointer;
      transition: background 160ms ease;
    }
    .code-pill:hover { background: rgba(255,255,255,0.12); }
    .code-text { user-select: all; }

    .copied-badge {
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.68rem;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 6px;
      background: rgba(34,197,94,0.9);
      color: #fff;
      white-space: nowrap;
      animation: fadeSlideIn 200ms ease;
      pointer-events: none;
    }

    .members-count {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: rgba(255,255,255,0.65);
      font-size: 0.78rem;
      font-weight: 500;
    }

    .leave-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      padding: 0;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.55);
      cursor: pointer;
      transition: background 160ms ease, color 160ms ease;
    }
    .leave-btn:hover { background: rgba(229,9,20,0.6); color: #fff; }

    .hud-error {
      margin: 0;
      padding: 4px 12px;
      border-radius: 8px;
      background: rgba(220,38,38,0.8);
      color: #fff;
      font-size: 0.72rem;
    }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class PartyOverlayComponent implements OnInit, OnDestroy {
  creating = false;
  copied = false;
  error: string | null = null;

  private subs: Subscription[] = [];

  constructor(readonly party: PartyService) {}

  ngOnInit(): void {
    this.subs.push(
      this.party.error$.subscribe((msg) => {
        this.error = msg;
        setTimeout(() => (this.error = null), 5_000);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  async onCreate(): Promise<void> {
    if (this.creating) return;
    this.creating = true;
    try {
      await this.party.createParty();
    } catch (err: any) {
      this.error = err?.message ?? 'Failed to create party';
    } finally {
      this.creating = false;
    }
  }

  onLeave(): void {
    this.party.leaveParty();
  }

  copyCode(): void {
    const code = this.party.partyCode$.subscribe((c) => {
      if (c) {
        navigator.clipboard.writeText(c).catch(() => {});
        this.copied = true;
        setTimeout(() => (this.copied = false), 2_000);
      }
      code.unsubscribe();
    });
  }
}
