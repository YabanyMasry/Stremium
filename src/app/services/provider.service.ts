import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type StreamProvider = 'cinesrc' | 'vidking';

export interface ProviderMeta {
  id: StreamProvider;
  label: string;
  origin: string;
}

export const PROVIDERS: ReadonlyArray<ProviderMeta> = [
  { id: 'cinesrc', label: 'CineSrc',  origin: 'https://cinesrc.st' },
  { id: 'vidking', label: 'Vidking',  origin: 'https://www.vidking.net' },
] as const;

const STORAGE_KEY = 'streamProvider';
const DEFAULT: StreamProvider = 'cinesrc';

/** Persists and broadcasts the user's preferred embed provider. */
@Injectable({ providedIn: 'root' })
export class ProviderService {
  private readonly _provider = new BehaviorSubject<StreamProvider>(this.loadInitial());
  readonly provider$ = this._provider.asObservable();

  get current(): StreamProvider {
    return this._provider.value;
  }

  set(p: StreamProvider): void {
    if (p === this._provider.value) return;
    try { localStorage.setItem(STORAGE_KEY, p); } catch { /* ignore */ }
    this._provider.next(p);
  }

  metaFor(p: StreamProvider): ProviderMeta {
    return PROVIDERS.find((x) => x.id === p) ?? PROVIDERS[0];
  }

  private loadInitial(): StreamProvider {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'cinesrc' || raw === 'vidking') return raw;
    } catch { /* ignore */ }
    return DEFAULT;
  }
}
