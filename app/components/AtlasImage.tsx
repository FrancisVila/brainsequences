import React, { useEffect, useRef, useState, type JSX } from 'react';
import './atlasImage.css';
import timTaylorCss from '../images/tim_taylor.css?raw';
import timTaylorAllCss from '../images/tim_taylor_all.css?raw';

export interface Link {
    from: string;
    to: string;
    label: string;
}

export interface StepLink {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    curvature?: number;
    strokeWidth?: number;
}

export interface AtlasImageProps {
    atlasSvg: string;
    backgroundImage?: string;
    highlightedIds?: (string | number)[];
    stepLinks?: StepLink[];
}

const AtlasImage: React.FC<AtlasImageProps> = ({ 
    atlasSvg, 
    backgroundImage, 
    highlightedIds = [],
    stepLinks = [],
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
                

                // Add body_part class to all paths inside body_parts group
                const bodyPartsGroup = svgElement.querySelector('#body_parts');
                if (bodyPartsGroup) {
                    const bodyPartPaths = bodyPartsGroup.querySelectorAll('path, text');
                    bodyPartPaths.forEach(path => {
                        path.classList.add('body_part');
                    });
                }

                // Apply highlighting to paths matching the highlightedIds, and texts matching highlightedIds with _text suffix
                const normalizedHighlightedIds = highlightedIds.flatMap(label => {
                    const strId = String(label).toLowerCase().trim().replace(/[\s_-]/g, '');
                    return [strId, strId + 'text'];
                });
                paths_and_texts.forEach((path_or_text) => {
                    const pathId = path_or_text.getAttribute('inkscape:label')?.toString().toLowerCase().trim().replace(/[\s_-]/g, '');
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


// function taking the coordinates of 2 points plus an extra offset parameter to adjust the curve
const generateCurvePoints = (x1: number, y1: number, x2: number, y2: number, offset: number): string => {
    const portion = 0.8;
    // form factor required because the SVG viewBox of the lines is square but the displayed area is rectangular
    // CHANGE THIS IF THE ASPECT RATIO CHANGES 
    const formFactor = 1.88;
    const intermediateX = x1 + (x2 - x1)*portion;
    const intermediateY = y1 + (y2 - y1) * portion;
    let offsetX = intermediateX + (y2-y1)*offset;
    let offsetY = intermediateY + (x1-x2)*offset*formFactor ;
    // x1=10; y1=20; x2=50; y2=60;  offsetX=50; offsetY=40;
    return `M ${x1} ${y1} Q ${offsetX},${offsetY} ${x2},${y2}`;
}

const generateCurvePath = (x1: number, y1: number, x2: number, y2: number, offset: number=0.25): JSX.Element => {
    return      <svg 
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            border: '2px solid red',
                            display:  'block'
                        }}
                    >
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="4"
                                markerHeight="4"
                                refX="4"
                                refY="2"
                                orient="auto"
                            >
                                <path d="M 0,0 L 4,2 L 0,4 z" fill="#AA1100" />
                            </marker>
                        </defs>
                        <path d={generateCurvePoints(x1, y1, x2, y2, offset)} stroke="#AA1100" strokeWidth="0.5" fill="none" markerEnd="url(#arrowhead)" />
                    </svg>
}

    const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
        const svg = event.currentTarget;
        const point = svg.createSVGPoint();

        point.x = event.clientX;
        point.y = event.clientY;

        // Transform to SVG coordinates
        const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

        console.log(`SVG coordinates: x=${svgPoint.x}, y=${svgPoint.y}`);
    };

    return (
        <>
            <style>
                {cssContent}
            </style>

            <div id="atlas-image-container" style={{ position: 'relative', maxWidth: '700px' }}>
                    <button
                        id="fullscreen-button"
                        onClick={() => setIsFullscreen(true)}
                        title="View fullscreen"
                    >
                        ⛶
                    </button>
                
                <div style={{ position: 'relative', lineHeight: 0, display: 'inline-block' }}>
                    <div 
                        id="svg-container"
                        ref={svgContainerRef}
                        className="svg-container"
                        style={{ lineHeight: 0, display: 'block' }}
                    />
                    {stepLinks.map((link, index) => 
                        generateCurvePath(
                            link.x1, 
                            link.y1, 
                            link.x2, 
                            link.y2, 
                            link.curvature ?? 0.25
                        )
                    )}

                </div>
                 <div id="view-mode-controls">
                    <label style={{ marginRight: '15px', fontWeight: 'bold' }}>
                        Atlas view mode:</label>
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
            </div>

            {isFullscreen && (
                <div
                    onClick={() => setIsFullscreen(false)}
                    className="fullscreen-overlay"
                >
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="fullscreen-close-button"
                        title="Close fullscreen"
                    >
                        ✕
                    </button>
                    
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="fullscreen-content"
                    >
                        <div 
                            className="fullscreen-svg-container"
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
