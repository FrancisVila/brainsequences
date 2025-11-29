import React from 'react';

export interface HighlightedImageProps {
    highlightedSvg: string;
    backgroundImage?: string;
    highlightedIds?: (string | number)[];
    cssFile: string;
}

declare const HighlightedImage: React.FC<HighlightedImageProps>;

export default HighlightedImage;
