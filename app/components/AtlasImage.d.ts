import React from 'react';

export interface AtlasImageProps {
    atlasSvg: string;
    backgroundImage?: string;
    atlasIds?: (string | number)[];
    cssFile: string;
}

declare const AtlasImage: React.FC<AtlasImageProps>;

export default AtlasImage;
