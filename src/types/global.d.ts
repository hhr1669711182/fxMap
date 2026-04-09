declare global {
  interface Window {
    Live2D: any;
    loadlive2d: any;
  }
}

export {};

declare module "../../../public/publicLink.js" {
  export const publicLink: {
    d25: string;
    d3: string;
  };
}

