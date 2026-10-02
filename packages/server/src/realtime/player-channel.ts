import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../env';

/**
 * 플레이어별 실시간 채널 (Durable Object 1개 = 플레이어 1명).
 * WebSocket Hibernation을 써서 연결이 쉬는 동안에는 과금되지 않는다.
 * 용도: 희귀어 입질 알림, 경매 입찰/낙찰 알림.
 * 앱이 꺼져 있으면 모바일은 FCM 푸시로 대신 알린다 (API 설계 단계에서 연결).
 */
export class PlayerChannel extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('WebSocket 연결만 받습니다', { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  /** 서버 내부에서 이 플레이어에게 이벤트를 보낼 때 호출 (RPC) */
  async push(event: { type: string; payload?: unknown }): Promise<number> {
    const message = JSON.stringify(event);
    const sockets = this.ctx.getWebSockets();
    for (const ws of sockets) ws.send(message);
    return sockets.length;
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // 클라이언트 → 서버 메시지는 현재 ping만 처리. 게임 행동은 모두 HTTP API로 한다.
    if (message === 'ping') ws.send('pong');
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    ws.close(code, 'closed');
  }
}
