import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import Peer, { DataConnection } from 'peerjs';

/* ───────────────────── shared types ───────────────────── */

export interface ContentInfo {
  contentType: 'movie' | 'tv';
  tmdbId: number;
  season?: number;
  episode?: number;
}

export interface SyncEvent {
  action: 'play' | 'pause' | 'seek';
  currentTime?: number;
}

interface PartyMessage {
  kind: 'sync' | 'content' | 'welcome';
  payload: any;
}

/* ───────────────────── constants ───────────────────── */

const PEER_PREFIX = 'stream-party-';
const CODE_LENGTH = 6;

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/* ───────────────────── service ───────────────────── */

@Injectable({ providedIn: 'root' })
export class PartyService {
  /* — PeerJS internals — */
  private peer: Peer | null = null;
  private connections: DataConnection[] = [];

  /* — observable state — */
  private readonly _inParty   = new BehaviorSubject<boolean>(false);
  private readonly _isHost    = new BehaviorSubject<boolean>(false);
  private readonly _partyCode = new BehaviorSubject<string | null>(null);
  private readonly _members   = new BehaviorSubject<number>(0);
  private readonly _syncEvent = new Subject<SyncEvent>();
  private readonly _contentEvent = new Subject<ContentInfo>();
  private readonly _error     = new Subject<string>();

  readonly inParty$      = this._inParty.asObservable();
  readonly isHost$       = this._isHost.asObservable();
  readonly partyCode$    = this._partyCode.asObservable();
  readonly members$      = this._members.asObservable();
  readonly syncEvent$    = this._syncEvent.asObservable();
  readonly contentEvent$ = this._contentEvent.asObservable();
  readonly error$        = this._error.asObservable();

  /** Synchronous snapshot — used by PlayerComponent to avoid echo loops. */
  get isHostNow(): boolean { return this._isHost.value; }
  get inPartyNow(): boolean { return this._inParty.value; }

  /** The content currently being watched (set by movie/show pages). */
  currentContent: ContentInfo | null = null;

  constructor(private readonly zone: NgZone) {}

  /* ──────────── host: create party ──────────── */

  createParty(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.peer) this.destroyPeer();

      const code = randomCode();
      const peerId = PEER_PREFIX + code;

      this.peer = new Peer(peerId);

      this.peer.on('open', () => {
        this.zone.run(() => {
          this._partyCode.next(code);
          this._isHost.next(true);
          this._inParty.next(true);
          this._members.next(1); // host counts as 1
          resolve(code);
        });
      });

      this.peer.on('connection', (conn) => this.handleIncomingConnection(conn));

      this.peer.on('error', (err) => {
        this.zone.run(() => this._error.next(err.message ?? String(err)));
        reject(err);
      });
    });
  }

  /* ──────────── guest: join party ──────────── */

  joinParty(code: string): Promise<ContentInfo | null> {
    return new Promise((resolve, reject) => {
      if (this.peer) this.destroyPeer();

      const hostId = PEER_PREFIX + code.toUpperCase().trim();
      this.peer = new Peer(); // random id for guest

      this.peer.on('open', () => {
        const conn = this.peer!.connect(hostId, { reliable: true });

        conn.on('open', () => {
          this.zone.run(() => {
            this.connections = [conn];
            this._partyCode.next(code.toUpperCase().trim());
            this._isHost.next(false);
            this._inParty.next(true);
          });
          this.listenToConnection(conn, true, resolve);
        });

        conn.on('error', (err) => {
          this.zone.run(() => this._error.next(err.message ?? String(err)));
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        this.zone.run(() => this._error.next(err.message ?? String(err)));
        reject(err);
      });

      // timeout after 15 s
      setTimeout(() => reject(new Error('Connection timed out')), 15_000);
    });
  }

  /* ──────────── leave / destroy ──────────── */

  leaveParty(): void {
    this.destroyPeer();
    this._inParty.next(false);
    this._isHost.next(false);
    this._partyCode.next(null);
    this._members.next(0);
    this.currentContent = null;
  }

  /* ──────────── host: broadcast sync ──────────── */

  broadcastSync(event: SyncEvent): void {
    if (!this._isHost.value) return;
    const msg: PartyMessage = { kind: 'sync', payload: event };
    for (const conn of this.connections) {
      if (conn.open) conn.send(msg);
    }
  }

  /** Host: broadcast current content so late joiners know what to watch. */
  broadcastContent(): void {
    if (!this._isHost.value || !this.currentContent) return;
    const msg: PartyMessage = { kind: 'content', payload: this.currentContent };
    for (const conn of this.connections) {
      if (conn.open) conn.send(msg);
    }
  }

  /* ──────────── internal helpers ──────────── */

  private handleIncomingConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.zone.run(() => {
        this.connections.push(conn);
        this._members.next(this.connections.length + 1); // +1 for host
      });

      // Send current content + time to the newcomer
      if (this.currentContent) {
        const welcome: PartyMessage = { kind: 'welcome', payload: this.currentContent };
        conn.send(welcome);
      }

      this.listenToConnection(conn, false);
    });

    conn.on('close', () => this.removeConnection(conn));
    conn.on('error', () => this.removeConnection(conn));
  }

  private listenToConnection(
    conn: DataConnection,
    isGuest: boolean,
    resolveContent?: (c: ContentInfo | null) => void,
  ): void {
    let contentResolved = false;

    conn.on('data', (raw: unknown) => {
      if (!this.isValidMessage(raw)) return;
      const msg = raw as PartyMessage;

      this.zone.run(() => {
        switch (msg.kind) {
          case 'sync': {
            const p = msg.payload;
            if (!p || typeof p !== 'object' || !['play', 'pause', 'seek'].includes(p.action)) return;
            if (p.action === 'seek' && typeof p.currentTime !== 'number') return;
            this._syncEvent.next(p as SyncEvent);
            break;
          }

          case 'welcome':
          case 'content': {
            const c = msg.payload;
            if (!c || typeof c !== 'object') return;
            if (!['movie', 'tv'].includes(c.contentType)) return;
            if (typeof c.tmdbId !== 'number' || c.tmdbId < 1) return;
            const content = c as ContentInfo;
            this._contentEvent.next(content);
            if (isGuest && resolveContent && !contentResolved) {
              contentResolved = true;
              resolveContent(content);
            }
            break;
          }
        }
      });
    });

    conn.on('close', () => this.removeConnection(conn));
    conn.on('error', () => this.removeConnection(conn));
  }

  private removeConnection(conn: DataConnection): void {
    this.connections = this.connections.filter((c) => c !== conn);
    this.zone.run(() => {
      this._members.next(this.connections.length + (this._isHost.value ? 1 : 0));
    });
  }

  private destroyPeer(): void {
    for (const conn of this.connections) {
      try { conn.close(); } catch { /* ignore */ }
    }
    this.connections = [];
    try { this.peer?.destroy(); } catch { /* ignore */ }
    this.peer = null;
  }

  private isValidMessage(data: unknown): data is PartyMessage {
    if (!data || typeof data !== 'object') return false;
    const msg = data as any;
    return typeof msg.kind === 'string' && ['sync', 'content', 'welcome'].includes(msg.kind);
  }
}
