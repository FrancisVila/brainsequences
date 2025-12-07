import React, { useEffect, useRef } from 'react';
import './highlightedImage.css';

export interface HighlightedImageProps {
    highlightedSvg: string;
    backgroundImage?: string;
    highlightedIds?: (string | number)[];
}

const HighlightedImage: React.FC<HighlightedImageProps> = ({ 
    highlightedSvg, 
    backgroundImage, 
    highlightedIds = []
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
                    }
                });

                // Find the path with id Precuneus-7 and copy it to group named showtime
                const precuneusPath = svgElement.querySelector('#Precuneus-7');
                let showtimeGroup = svgElement.querySelector('#showtime');
                
                if (precuneusPath) {
                    // Create showtime group if it doesn't exist
                    if (!showtimeGroup) {
                        showtimeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                        showtimeGroup.setAttribute('id', 'showtime');
                        svgElement.appendChild(showtimeGroup);
                    }
                    
                    // Clone the path and append to showtime group
                    const clonedPath = precuneusPath.cloneNode(true) as SVGPathElement;
                    showtimeGroup.appendChild(clonedPath);
                }

                // Remove brain_parts group but keep all its child elements
                const brainPartsGroup = svgElement.querySelector('#brain_parts');
                 ;
                if (brainPartsGroup && brainPartsGroup.parentNode) {
                    // Move all children to the parent before removing the group
                    const root = brainPartsGroup.parentNode;
                    const brainPartsHere = svgElement.querySelector('#brain_parts_here');
                    while (brainPartsGroup.firstChild) {
                        if (brainPartsHere) {
                            root.insertBefore(brainPartsHere, brainPartsGroup);
                        }
                    }
                    // Remove the now-empty group
                    brainPartsGroup.remove();
                }

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
    }, [highlightedSvg, highlightedIds]);

    return (
        <>
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
