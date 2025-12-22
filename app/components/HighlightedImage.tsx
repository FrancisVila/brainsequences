import React, { useEffect, useRef, useState } from 'react';
import './highlightedImage.css';
import timTaylorCss from '../images/tim_taylor.css?raw';
import timTaylorAllCss from '../images/tim_taylor_all.css?raw';

export interface Link {
    from: string;
    to: string;
    label: string;
}

export interface HighlightedImageProps {
    highlightedSvg: string;
    backgroundImage?: string;
    highlightedIds?: (string | number)[];
    links?: Link[];
}

const HighlightedImage: React.FC<HighlightedImageProps> = ({ 
    highlightedSvg, 
    backgroundImage, 
    highlightedIds = [],
    links = []
}) => {
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<'sketch' | 'bitmap' | 'all'>('sketch');
    
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

                // Clear container and append the modified SVG first
                if (svgContainerRef.current) {
                    svgContainerRef.current.innerHTML = '';
                    svgContainerRef.current.appendChild(svgElement);
                }

                // Process links after SVG is in the DOM
                if (links && links.length > 0) {
                    console.log('Processing links:', links);
                    // Find the link0 group
                    const linksGroup = svgElement.querySelector('#links');
                    const link0Group = svgElement.querySelector('#link0') as SVGGElement;
                    console.log('linksGroup:', linksGroup);
                    console.log('link0Group:', link0Group);
                    
                    if (link0Group && linksGroup) {
                        console.log('Found both groups, creating links');
                        links.forEach((link, index) => {
                            console.log('Creating link:', link, 'index:', index);
                            // Clone the link0 group
                            const newLinkGroup = link0Group.cloneNode(true) as SVGGElement;
                            
                            // Remove the transform from the cloned group to position it correctly
                            newLinkGroup.removeAttribute('transform');
                            
                            // Update the link group id and label
                            const linkId = `link${index + 1}`;
                            newLinkGroup.setAttribute('id', `link${index + 1}`);
                            newLinkGroup.setAttribute('inkscape:label', linkId);
                            
                            // Find the path element within the cloned group
                            const pathElement = newLinkGroup.querySelector('path') as SVGPathElement;
                            const textElement = newLinkGroup.querySelector('text') as SVGTextElement;
                            const textPathElement = textElement?.querySelector('textPath') as SVGTextPathElement;
                            const tspanElement = textPathElement?.querySelector('tspan') as SVGTSpanElement;
                            
                            if (pathElement) {
                                // Get the paths for 'from' and 'to' brain parts
                                const fromPath = svgElement.querySelector(`[id="${link.from}"]`) as SVGPathElement;
                                const toPath = svgElement.querySelector(`[id="${link.to}"]`) as SVGPathElement;
                                console.log('fromPath:', fromPath, 'for id:', link.from);
                                console.log('toPath:', toPath, 'for id:', link.to);
                                
                                if (fromPath && toPath) {
                                    // Get bounding boxes to find centers
                                    const fromBox = fromPath.getBBox();
                                    const toBox = toPath.getBBox();
                                    
                                    // Calculate centers
                                    const fromCenter = {
                                        x: fromBox.x + fromBox.width / 2,
                                        y: fromBox.y + fromBox.height / 2
                                    };
                                    const toCenter = {
                                        x: toBox.x + toBox.width / 2,
                                        y: toBox.y + toBox.height / 2
                                    };
                                    
                                    // Find closest corners
                                    const fromCorners = [
                                        { x: fromBox.x, y: fromBox.y },
                                        { x: fromBox.x + fromBox.width, y: fromBox.y },
                                        { x: fromBox.x, y: fromBox.y + fromBox.height },
                                        { x: fromBox.x + fromBox.width, y: fromBox.y + fromBox.height }
                                    ];
                                    const toCorners = [
                                        { x: toBox.x, y: toBox.y },
                                        { x: toBox.x + toBox.width, y: toBox.y },
                                        { x: toBox.x, y: toBox.y + toBox.height },
                                        { x: toBox.x + toBox.width, y: toBox.y + toBox.height }
                                    ];
                                    
                                    // Find corner of 'from' closest to 'to' center
                                    let fromCorner = fromCorners[0];
                                    let minFromDist = Infinity;
                                    fromCorners.forEach(corner => {
                                        const dist = Math.sqrt(Math.pow(corner.x - toCenter.x, 2) + Math.pow(corner.y - toCenter.y, 2));
                                        if (dist < minFromDist) {
                                            minFromDist = dist;
                                            fromCorner = corner;
                                        }
                                    });
                                    
                                    // Find corner of 'to' closest to 'from' center
                                    let toCorner = toCorners[0];
                                    let minToDist = Infinity;
                                    toCorners.forEach(corner => {
                                        const dist = Math.sqrt(Math.pow(corner.x - fromCenter.x, 2) + Math.pow(corner.y - fromCenter.y, 2));
                                        if (dist < minToDist) {
                                            minToDist = dist;
                                            toCorner = corner;
                                        }
                                    });
                                    
                                    // Update path with new coordinates
                                    const newPathD = `M ${fromCorner.x},${fromCorner.y} C ${(fromCorner.x + toCorner.x) / 2},${(fromCorner.y + toCorner.y) / 2} ${(fromCorner.x + toCorner.x) / 2},${(fromCorner.y + toCorner.y) / 2} ${toCorner.x},${toCorner.y}`;
                                    pathElement.setAttribute('d', newPathD);
                                    pathElement.setAttribute('id', `path${index + 4}`);
                                    pathElement.setAttribute('inkscape:label', `link_text${index}`);
                                }
                            }
                            
                            // Update text label
                            if (tspanElement) {
                                tspanElement.textContent = link.label;
                            }
                            
                            // Append the new link group to the links container
                            linksGroup.appendChild(newLinkGroup);
                        });
                    }
                }

            } catch (error) {
                console.error('Error loading SVG:', error);
            }
        };

        loadSvg();
    }, [highlightedSvg, highlightedIds, view, links]);

    return (
        <>
            <style>
                {cssContent}
            </style>

            <div style={{ margin: '20px 0' }}>
                <label style={{ marginRight: '15px', fontWeight: 'bold' }}>View Mode:</label>
                <label style={{ marginRight: '15px' }}>
                    <input 
                        type="radio" 
                        value="sketch" 
                        checked={view === 'sketch'} 
                        onChange={(e) => setView(e.target.value as 'sketch')}
                        style={{ marginRight: '5px' }}
                    />
                    Sketch
                </label>
                <label style={{ marginRight: '15px' }}>
                    <input 
                        type="radio" 
                        value="bitmap" 
                        checked={view === 'bitmap'} 
                        onChange={(e) => setView(e.target.value as 'bitmap')}
                        style={{ marginRight: '5px' }}
                    />
                    Bitmap
                </label>
                <label>
                    <input 
                        type="radio" 
                        value="all" 
                        checked={view === 'all'} 
                        onChange={(e) => setView(e.target.value as 'all')}
                        style={{ marginRight: '5px' }}
                    />
                    All
                </label>
            </div>
            
            <div 
                ref={svgContainerRef}
                className="svg-container"
            />
    
        </>
    );
};

export default HighlightedImage;
