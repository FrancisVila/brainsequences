import React, { useEffect, useRef, useState } from 'react';
import './atlasImage.css';
import timTaylorCss from '../images/tim_taylor.css?raw';
import timTaylorAllCss from '../images/tim_taylor_all.css?raw';

export interface Link {
    from: string;
    to: string;
    label: string;
}

export interface AtlasImageProps {
    atlasSvg: string;
    backgroundImage?: string;
    highlightedIds?: (string | number)[];
}

const AtlasImage: React.FC<AtlasImageProps> = ({ 
    atlasSvg, 
    backgroundImage, 
    highlightedIds = [],
}) => {
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<'sketch' | 'bitmap' | 'all'>('sketch');
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Select appropriate CSS based on view
    const cssContent = view === 'all' ? timTaylorAllCss : timTaylorCss;

    useEffect(() => {


        if (!svgContainerRef.current) return;

        // Load and parse the SVG
        const loadSvg = async () => {
            try {
                const response = await fetch(atlasSvg);
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
                        path_or_text.classList.add('atlas');


                    }
                });

                // Clear container and append the modified SVG first
                if (svgContainerRef.current) {
                    svgContainerRef.current.innerHTML = '';
                    svgContainerRef.current.appendChild(svgElement);
                }


            } catch (error) {
                console.error('Error loading SVG:', error);
            }
        };

        loadSvg();
    }, [atlasSvg, highlightedIds, view]);

    return (
        <>
            <style>
                {cssContent}
            </style>

            <div style={{ position: 'relative' }}>
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
                    
                    <button
                        onClick={() => setIsFullscreen(true)}
                        style={{
                            marginLeft: '20px',
                            padding: '8px 12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '16px',
                            float: 'right',
                            position: 'relative',
                            top: '-5px'
                        }}
                        title="View fullscreen"
                    >
                        ⛶
                    </button>
                </div>
                
                <div 
                    ref={svgContainerRef}
                    className="svg-container"
                />
            </div>

            {isFullscreen && (
                <div
                    onClick={() => setIsFullscreen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                >
                    <button
                        onClick={() => setIsFullscreen(false)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            padding: '10px 15px',
                            border: 'none',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '20px',
                            zIndex: 10000
                        }}
                        title="Close fullscreen"
                    >
                        ✕
                    </button>
                    
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '95vw',
                            height: '95vh',
                            overflow: 'auto',
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <div 
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            dangerouslySetInnerHTML={{ 
                                __html: svgContainerRef.current?.innerHTML || '' 
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default AtlasImage;
