import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';

const CONTENT_API = 'https://ngk1i8c791.execute-api.us-east-1.amazonaws.com/get-content';

function App() {
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showVideo, setShowVideo] = useState(false);
    const [playTrailer, setPlayTrailer] = useState(false);

    const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    const searchParams = new URLSearchParams(window.location.search);
    const contentId = searchParams.get('contentId');

    useEffect(() => {
        const fetchContent = async () => {
            if (!contentId) {
                setError('No movie specified. Please scan a valid MovieCoin.');
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${CONTENT_API}?contentId=${contentId}`);
                const data = await response.json();

                if (response.ok && data.movieUrl) {
                    setContent(data);
                } else {
                    setError('Movie not found. Please try a different MovieCoin.');
                }
            } catch (err) {
                console.error('Error fetching content:', err);
                setError('Failed to load movie. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [contentId]);

    const handlePlay = () => {
        setPlayTrailer(false);
        setShowVideo(true);
    };

    const handlePlayTrailer = () => {
        setPlayTrailer(true);
        setShowVideo(true);
    };

    const handleCloseVideo = () => {
        setShowVideo(false);
        setPlayTrailer(false);
    };

    if (isLoading) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
                <h1 className="text-white text-3xl font-bold">Loading...</h1>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
                <div className="text-white text-center px-4">
                    <h1 className="text-3xl font-bold mb-4">MovieCoin™</h1>
                    <p className="text-xl">{error}</p>
                </div>
            </div>
        );
    }

    const videoSrc = playTrailer ? content.trailerUrl : content.movieUrl;

    return (
        <div className="bg-black min-h-screen overflow-auto flex items-center justify-center">
            <div className="w-full max-w-[1080px] bg-black relative mx-auto">
                {!showVideo ? (
                    <div className="flex flex-col items-center justify-center min-h-screen px-4">
                        {content.contentPosterUrl && (
                            <img
                                src={content.contentPosterUrl}
                                alt={content.contentTitle}
                                className="w-full max-w-md rounded-lg shadow-lg mb-6"
                                style={{ maxHeight: '60vh', objectFit: 'contain' }}
                            />
                        )}
                        <h1 className="text-white text-3xl font-bold mb-2 text-center">
                            {content.contentTitle}
                        </h1>
                        {content.contentDescription && (
                            <p className="text-gray-400 text-center max-w-md mb-8 text-sm leading-relaxed">
                                {content.contentDescription}
                            </p>
                        )}
                        <button
                            onClick={handlePlay}
                            className="px-12 py-4 text-white text-xl font-bold rounded-lg hover:opacity-90 bg-green-600"
                        >
                            ▶ Play Movie
                        </button>
                        {content.trailerUrl && (
                            <button
                                onClick={handlePlayTrailer}
                                className="mt-4 px-8 py-3 text-white text-lg font-bold rounded-lg hover:opacity-90 bg-gray-700"
                            >
                                Watch Trailer
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="w-screen h-screen relative bg-black">
                        <button
                            onClick={handleCloseVideo}
                            className="absolute top-4 right-4 z-50 bg-black/70 text-white rounded-full px-4 py-2 text-xl font-bold hover:opacity-90"
                        >
                            ✕
                        </button>
                        {isIOS() ? (
                            <video
                                src={videoSrc}
                                width="100%"
                                height="100%"
                                controls
                                autoPlay
                                playsInline
                                crossOrigin="anonymous"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={() => setError('Failed to play video. Please try again.')}
                            />
                        ) : (
                            <ReactPlayer
                                url={videoSrc}
                                width="100%"
                                height="100%"
                                controls
                                playing
                                config={{
                                    file: {
                                        forceHLS: true,
                                        attributes: { crossOrigin: 'anonymous' },
                                    },
                                }}
                                onError={() => setError('Failed to play video. Please try again.')}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
