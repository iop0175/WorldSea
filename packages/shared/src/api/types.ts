/** Workers API 응답 타입 (API 설계 단계에서 확장) */
export interface HealthResponse {
  ok: true;
  service: 'worldsea-server';
  time: string;
}
