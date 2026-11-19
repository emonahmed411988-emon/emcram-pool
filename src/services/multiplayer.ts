import { io, Socket } from 'socket.io-client';
import { PlayerFormat, PrivateRoomState, UserAccount } from '../types/game';

export interface ShotPayload {
  roomCode: string;
  seatIndex: number;
  strikerX: number;
  strikerY: number;
  vx: number;
  vy: number;
}

class MultiplayerService {
  private socket: Socket | null = null;
  private currentUrl = '';
  public connected = false;

  public connect(serverUrl: string): Socket | null {
    const url = serverUrl.trim();
    if (!url) {
      this.disconnect();
      return null;
    }
    if (this.socket && this.currentUrl === url) {
      return this.socket;
    }
    this.disconnect();
    this.currentUrl = url;
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 4500,
      reconnectionAttempts: 3,
    });
    this.socket.on('connect', () => {
      this.connected = true;
    });
    this.socket.on('disconnect', () => {
      this.connected = false;
    });
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.currentUrl = '';
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public async registerRemote(
    serverUrl: string,
    payload: { username: string; email: string; password: string; account: UserAccount }
  ): Promise<{ ok: boolean; account?: UserAccount; error?: string }> {
    if (!serverUrl.trim()) return { ok: false, error: 'Offline mode' };
    try {
      const res = await fetch(`${serverUrl.replace(/\/$/, '')}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch {
      return { ok: false, error: 'Server unreachable' };
    }
  }

  public async loginRemote(
    serverUrl: string,
    payload: { email: string; password: string }
  ): Promise<{ ok: boolean; account?: UserAccount; error?: string }> {
    if (!serverUrl.trim()) return { ok: false, error: 'Offline mode' };
    try {
      const res = await fetch(`${serverUrl.replace(/\/$/, '')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch {
      return { ok: false, error: 'Server unreachable' };
    }
  }

  public async syncProfileRemote(serverUrl: string, account: UserAccount): Promise<void> {
    if (!serverUrl.trim() || account.isGuest) return;
    try {
      await fetch(`${serverUrl.replace(/\/$/, '')}/api/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account }),
      });
    } catch {
      // silent offline fallback
    }
  }

  public createOnlineRoom(
    format: PlayerFormat,
    mode: 'disc-pool' | 'carrom',
    user: { id: string; username: string; avatarId: string; level: number }
  ): Promise<PrivateRoomState | null> {
    return new Promise((resolve) => {
      if (!this.socket || !this.connected) {
        resolve(null);
        return;
      }
      const timer = setTimeout(() => resolve(null), 3000);
      this.socket.emit('room:create', { format, mode, user }, (room: PrivateRoomState | null) => {
        clearTimeout(timer);
        resolve(room);
      });
    });
  }

  public joinOnlineRoom(
    code: string,
    user: { id: string; username: string; avatarId: string; level: number }
  ): Promise<{ ok: boolean; room?: PrivateRoomState; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.connected) {
        resolve({ ok: false, error: 'No online server connected' });
        return;
      }
      const timer = setTimeout(() => resolve({ ok: false, error: 'Room join timed out' }), 3000);
      this.socket.emit(
        'room:join',
        { code: code.toUpperCase(), user },
        (resp: { ok: boolean; room?: PrivateRoomState; error?: string }) => {
          clearTimeout(timer);
          resolve(resp);
        }
      );
    });
  }

  public emitShot(payload: ShotPayload) {
    if (this.socket && this.connected) {
      this.socket.emit('match:shoot', payload);
    }
  }

  public emitSlider(roomCode: string, seatIndex: number, norm: number) {
    if (this.socket && this.connected) {
      this.socket.emit('match:slider', { roomCode, seatIndex, norm });
    }
  }

  public emitMatchChat(roomCode: string, seatIndex: number, text: string) {
    if (this.socket && this.connected) {
      this.socket.emit('match:chat', { roomCode, seatIndex, text });
    }
  }
}

export const multiplayer = new MultiplayerService();
