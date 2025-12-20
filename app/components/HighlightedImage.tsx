import React, { useEffect, useRef } from 'react';
import './highlightedImage.css';
import timTaylorCss from '../images/tim_taylor.css?raw';
import timTaylorAllCss from '../images/tim_taylor_all.css?raw';

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
    
    // Select appropriate CSS based on view
    const cssContent = view === 'all' ? timTaylorAllCss : timTaylorCss;

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
                const paths_and_texts = svgElement.querySelectorAll('path, text');
                
                // Assign IDs to paths that don't have one (based on position)
                paths_and_texts.forEach((path_or_text, index) => {
                    if (!path_or_text.hasAttribute('id')) {
                        path_or_text.setAttribute('id', String(index));
                    }
                });

                // Add body_part class to all paths inside body_parts group
                const bodyPartsGroup = svgElement.querySelector('#body_parts');
                if (bodyPartsGroup) {
                    const bodyPartPaths = bodyPartsGroup.querySelectorAll('path, text');
                    bodyPartPaths.forEach(path => {
                        path.classList.add('body_part');
                    });
                }

                // Apply highlighting to paths matching the highlightedIds, and texts matching highlightedIds with _text suffix
                const normalizedHighlightedIds = highlightedIds.flatMap(id => {
                    const strId = String(id).toLowerCase().trim();
                    return [strId, strId + '_text'];
                });
                paths_and_texts.forEach((path_or_text) => {
                    const pathId = path_or_text.getAttribute('id')?.toString().toLowerCase().trim();
                    if (pathId && 
                        (normalizedHighlightedIds.includes(pathId) || 
                        (normalizedHighlightedIds.includes(String(Number(pathId))) 
                        )))
                    
                    {
                        path_or_text.classList.add('highlighted');


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

    return (
        <>
            <style>
                {cssContent}
            </style>

            
            <div 
                ref={svgContainerRef}
                className="svg-container"
            />
    
        </>
    );
};

export default HighlightedImage;
