// Global type declarations for Flutter WebView integration

interface FlutterObject {
  postMessage(message: string): void;
  addEventListener(event: 'message', handler: (event: { data: string }) => void): void;
  removeEventListener(event: 'message', handler: (event: { data: string }) => void): void;
  onmessage?: (event: { data: string }) => void;
}

declare global {
  interface Window {
    flutterObject?: FlutterObject;
  }
  
  const flutterObject: FlutterObject | undefined;
}

export {};
