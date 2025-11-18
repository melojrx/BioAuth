export interface UserProfile {
  id: string;
  name: string;
  email: string;
  descriptor: number[]; // Float32Array serialized to number[]
  createdAt: number;
}

export enum AuthStatus {
  IDLE = 'IDLE',
  DETECTING = 'DETECTING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REGISTERING = 'REGISTERING'
}

export interface DetectionResult {
  score: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: {
    positions: Array<{ x: number; y: number }>;
  };
}

export type FaceApiState = {
  isModelLoaded: boolean;
  loadingProgress: number;
  error: string | null;
};