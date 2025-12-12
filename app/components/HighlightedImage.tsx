import React, { useEffect, useRef } from 'react';
import './highlightedImage.css';

export interface HighlightedImageProps {
    highlightedSvg: string;
    backgroundImage?: string;
    highlightedIds?: (string | number)[];
    view?: 'sketch' | 'bitmap' | 'all';
}

const HighlightedImage: React.FC<HighlightedImageProps> = ({ 
    highlightedSvg, 
    backgroundImage, 
    highlightedIds = [],
    view = 'sketch'
}) => {
    const svgContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {


        if (!svgContainerRef.current) return;

        // Load and parse the SVG
        const loadSvg = async () => {
            try {
                const response = await fetch(highlightedSvg);
                const svgText = await response.text();
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElement = svgDoc.documentElement;
                
                // Remove width and height attributes
                svgElement.removeAttribute('width');
                svgElement.removeAttribute('height');

                // Set visibility of background groups based on view parameter
                const sketchBackgrounds = svgElement.querySelector('#sketch_backgrounds');
                const bitmapBackgrounds = svgElement.querySelector('#bitmap_backgrounds');
                
                if (view === 'sketch') {
                    if (sketchBackgrounds) sketchBackgrounds.setAttribute('style', 'display:inline');
                    if (bitmapBackgrounds) bitmapBackgrounds.setAttribute('style', 'display:none');
                } else if (view === 'bitmap') {
                    if (sketchBackgrounds) sketchBackgrounds.setAttribute('style', 'display:none');
                    if (bitmapBackgrounds) bitmapBackgrounds.setAttribute('style', 'display:inline');
                } else if (view === 'all') {
                    if (sketchBackgrounds) sketchBackgrounds.setAttribute('style', 'display:none');
                    if (bitmapBackgrounds) bitmapBackgrounds.setAttribute('style', 'display:inline');
                }

                // Get all path elements
                const paths = svgElement.querySelectorAll('path');
                
                // Assign IDs to paths that don't have one (based on position)
                paths.forEach((path, index) => {
                    if (!path.hasAttribute('id')) {
                        path.setAttribute('id', String(index));
                    }
                });

                // Apply highlighting to matching paths
                const normalizedHighlightedIds = highlightedIds.map(id => String(id));
                paths.forEach((path) => {
                    const pathId = path.getAttribute('id');
                    if (pathId && (normalizedHighlightedIds.includes(pathId) || 
                        normalizedHighlightedIds.includes(String(Number(pathId))))) {
                        path.classList.add('highlighted');

                        const clonedPath = path.cloneNode(true) as SVGPathElement;
                        // Set fill-opacity to 1 in the style attribute
                        const currentStyle = clonedPath.getAttribute('style') || '';
                        const updatedStyle = currentStyle.replace(/fill-opacity:\s*[\d.]+/g, 'fill-opacity:1');
                        if (!updatedStyle.includes('fill-opacity')) {
                            clonedPath.setAttribute('style', currentStyle + ';fill-opacity:1');
                        } else {
                            clonedPath.setAttribute('style', updatedStyle);
                        }
                        
                        // Append clonedPath to the group with id 'showtime'
                        let showtimeGroup = svgElement.querySelector('#showtime');
                        if (!showtimeGroup) {
                            showtimeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                            showtimeGroup.setAttribute('id', 'showtime');
                            svgElement.appendChild(showtimeGroup);
                        }
                        showtimeGroup.appendChild(clonedPath);
                    }
                });



                // Clear container and append the modified SVG
                if (svgContainerRef.current) {
                    svgContainerRef.current.innerHTML = '';
                    svgContainerRef.current.appendChild(svgElement);
                }

            } catch (error) {
                console.error('Error loading SVG:', error);
            }
        };

        loadSvg();
    }, [highlightedSvg, highlightedIds, view]);

    // Determine which CSS file to link based on view
    const cssFile = view === 'all' ? 'tim_taylor_all.css' : 'tim_taylor.css';

    return (
        <>
            <link rel="stylesheet" type="text/css" href={cssFile} />
            <style>
                {`
                    .leaflet-interactive {
                        stroke: #038103;
                        stroke-opacity: 1;
                        stroke-width: 1;
                        stroke-linecap: round;
                        stroke-linejoin: round;
                        fill: #038103;
                        fill-opacity: 0;
                        fill-rule: evenodd;
                    }

                    .highlighted {
                        stroke-opacity: 1 !important;
                        stroke-width: 2 !important;
                        fill-opacity: 0.6 !important;
                    }
                `}
            </style>

            
            <div 
                ref={svgContainerRef}
                className="svg-container"
            />
    
        </>
    );
};

export default HighlightedImage;
