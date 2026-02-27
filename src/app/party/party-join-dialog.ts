import { Component, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { PartyService, ContentInfo } from '../services/party.service';

@Component({
  selector: 'app-party-join-dialog',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="backdrop" *ngIf="open" (click)="close()"></div>

    <div class="dialog" *ngIf="open">
      <div class="dialog-header">
        <h3>Join Watch Party</h3>
        <button class="close-btn" (click)="close()" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <p class="dialog-desc">Enter the 6-character party code shared by the host.</p>

      <div class="input-row">
        <input
          #codeInput
          type="text"
          maxlength="6"
          placeholder="XXXXXX"
          [value]="code"
          (input)="onCodeInput($event)"
          (keydown.enter)="join()"
          class="code-input"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <p class="error" *ngIf="error">{{ error }}</p>

      <button
        class="join-btn"
        [disabled]="code.length < 6 || joining"
        (click)="join()"
      >
        <svg *ngIf="!joining" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        {{ joining ? 'Connecting…' : 'Join Party' }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 2000;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(4px);
      animation: fadeIn 200ms ease;
    }

    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2001;
      width: 340px;
      max-width: calc(100vw - 32px);
      padding: 24px;
      border-radius: 18px;
      background: rgba(18,18,18,0.96);
      backdrop-filter: blur(18px) saturate(1.4);
      -webkit-backdrop-filter: blur(18px) saturate(1.4);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 16px 48px rgba(0,0,0,0.6);
      color: #fff;
      animation: dialogIn 280ms cubic-bezier(.25,.8,.25,1);
      overflow: visible;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .dialog-header h3 {
      margin: 0;
      font-family: 'Doto', 'Roboto', system-ui, sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.55);
      cursor: pointer;
      transition: background 160ms ease, color 160ms ease;
    }
    .close-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }

    .dialog-desc {
      margin: 8px 0 16px;
      color: rgba(255,255,255,0.5);
      font-size: 0.84rem;
      line-height: 1.4;
    }

    .input-row { display: flex; gap: 8px; margin-bottom: 12px; }

    .code-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.05);
      color: #fff;
      font-family: 'Doto', 'Roboto Mono', monospace;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-align: center;
      text-transform: uppercase;
      outline: none;
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }
    .code-input::placeholder {
      color: rgba(255,255,255,0.2);
      letter-spacing: 0.3em;
      font-weight: 400;
    }
    .code-input:focus {
      border-color: rgba(255,255,255,0.22);
      box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
    }

    .error {
      margin: 0 0 10px;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(220,38,38,0.15);
      border: 1px solid rgba(220,38,38,0.3);
      color: #f87171;
      font-size: 0.78rem;
    }

    .join-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 0;
      border: none;
      border-radius: 12px;
      background: rgba(229,9,20,0.85);
      color: #fff;
      font-family: 'Roboto', system-ui, sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 180ms ease, transform 120ms ease, opacity 180ms ease;
    }
    .join-btn:hover:not(:disabled) { background: rgba(229,9,20,1); transform: scale(1.01); }
    .join-btn:active:not(:disabled) { transform: scale(0.98); }
    .join-btn:disabled { opacity: 0.45; cursor: default; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes dialogIn {
      from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
  `],
})
export class PartyJoinDialogComponent {
  @Output() closed = new EventEmitter<void>();

  open = false;
  code = '';
  joining = false;
  error: string | null = null;

  constructor(
    private readonly party: PartyService,
    private readonly router: Router,
  ) {}

  show(): void {
    this.open = true;
    this.code = '';
    this.error = null;
    this.joining = false;
  }

  close(): void {
    this.open = false;
    this.closed.emit();
  }

  onCodeInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.code = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    (event.target as HTMLInputElement).value = this.code;
    this.error = null;
  }

  async join(): Promise<void> {
    if (this.code.length < 6 || this.joining) return;
    this.joining = true;
    this.error = null;

    try {
      const content: ContentInfo | null = await this.party.joinParty(this.code);
      this.open = false;

      if (content) {
        // Navigate to the correct content page
        if (content.contentType === 'movie') {
          this.router.navigate(['/movie', content.tmdbId]);
        } else {
          this.router.navigate(['/show', content.tmdbId], {
            queryParams: {
              season: content.season ?? 1,
              episode: content.episode ?? 1,
            },
          });
        }
      }
    } catch (err: any) {
      this.error = err?.message ?? 'Could not connect to party';
    } finally {
      this.joining = false;
    }
  }
}
