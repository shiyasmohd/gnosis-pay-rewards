declare module '*.svg?url' {
  /**
   * SVG images with `?url` suffix imported via next-image-loader
   */
  const content: {
    src: string;
    height: number;
    width: number;
  };

  export default content;
}

declare module '*.svg' {
  /**
   * SVG images imported via next-image-loader
   */
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;

  export default content;
}
