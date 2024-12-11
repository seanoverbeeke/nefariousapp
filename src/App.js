import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import backgroundPopcorn from './assets/appbackground.jpg';

function App() {
    const registerRentalApiUrl = 'https://k8vt6n911b.execute-api.us-east-1.amazonaws.com/default/registerRental';
    const startRentalApiUrl = 'https://gzrcpz0sxj.execute-api.us-east-1.amazonaws.com/default/startRental';
    const videoUrl = 'https://d2tsu3r8qeqtsh.cloudfront.net/greengoldsample.m3u8';

    // State management
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rentalActive, setRentalActive] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [hoursLeft, setHoursLeft] = useState(24);
    const [hasRentalEnded, setHasRentalEnded] = useState(false);
    const [authenticationComplete, setAuthenticationComplete] = useState(false);

    const searchParams = new URLSearchParams(window.location.search);
    const nfctagid = searchParams.get('nfctagid');

    useEffect(() => {
        const checkRentalStatus = async () => {
            if (!authenticationComplete && nfctagid && !isAuthorized) {
                try {
                    setIsLoading(true);

                    // Step 1: Check Registration
                    const registerResponse = await fetch(registerRentalApiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ nfctagid }),
                    });

                    const registerData = await registerResponse.json();

                    if (registerData.success) {
                        setIsAuthorized(true);

                        // Check if the rental is already active
                        if (registerData.data?.startTime) {
                            const currentTime = Date.now();
                            const startTime = registerData.data.startTime;
                            const durationHours = registerData.data.durationHours || 24;

                            const hoursElapsed = (currentTime - startTime) / (1000 * 60 * 60);

                            if (hoursElapsed < durationHours) {
                                setRentalActive(true);
                                setHoursLeft(Math.max(0, durationHours - Math.floor(hoursElapsed)));
                                setHasRentalEnded(false);
                                return;
                            }
                        }

                        // If no startTime or rental is expired, show "Start Rental"
                        setRentalActive(false);
                        setHasRentalEnded(false);
                    } else {
                        setError(registerData.message);
                    }
                } catch (error) {
                    setError('Failed to check rental status. Please try again.');
                } finally {
                    setIsLoading(false);
                    setAuthenticationComplete(true);
                }
            }
        };

        checkRentalStatus();
    }, [nfctagid, authenticationComplete, isAuthorized]);

    const handleStartRental = async () => {
        if (!nfctagid) {
            setError('No rental ID found');
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(startRentalApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nfctagid }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setRentalActive(true);
                setHasRentalEnded(false);
                setHoursLeft(data.hoursRemaining);
                setError(null);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to start rental. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlay = () => {
        setShowVideo(true);
    };

    const handleRentAgain = () => {
        setRentalActive(false);
        setShowVideo(false);
        setHasRentalEnded(false);
        setHoursLeft(24);
        setError(null);
    };

    const handleCloseVideo = () => {
        setShowVideo(false);
    };

    useEffect(() => {
        if (!isAuthorized || !rentalActive) return;

        const timer = setInterval(() => {
            setHoursLeft((prev) => {
                const newHours = Math.max(prev - 1, 0);
                if (newHours === 0) {
                    setRentalActive(false);
                    setShowVideo(false);
                    setHasRentalEnded(true);
                }
                return newHours;
            });
        }, 1000 * 60 * 60); // Decrease every hour

        return () => clearInterval(timer);
    }, [rentalActive, isAuthorized]);

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
                <div className="text-white text-center">
                    <h1 className="text-3xl font-bold mb-4">Error</h1>
                    <p className="text-xl">{error}</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
                <h1 className="text-white text-3xl font-bold">Authorizing...</h1>
            </div>
        );
    }

    let buttonLabel = '';
    let buttonAction = null;

    if (!rentalActive && !hasRentalEnded) {
        buttonLabel = 'Start Rental';
        buttonAction = handleStartRental;
    } else if (rentalActive) {
        buttonLabel = 'Play';
        buttonAction = handlePlay;
    } else if (hasRentalEnded) {
        buttonLabel = 'Rent Again';
        buttonAction = handleRentAgain;
    }

    return (
        <div className="bg-black min-h-screen overflow-auto flex items-center justify-center">
            <div className="w-full max-w-[1080px] aspect-[9/16] bg-black relative mx-auto">
                {!showVideo ? (
                    <>
                        <img
                            src={backgroundPopcorn}
                            alt="Movie Poster"
                            className="w-full h-full object-contain bg-black"
                        />
                        {rentalActive && (
                            <div
                                className="absolute left-0 right-0 text-center text-white text-xl font-bold bg-black/50 py-2"
                                style={{ bottom: '180px' }}
                            >
                                {hoursLeft} Hours Remaining
                            </div>
                        )}
                        <button
                            onClick={buttonAction}
                            className="absolute left-1/2 transform -translate-x-1/2 px-12 py-4 text-white text-xl font-bold rounded-lg hover:opacity-90 bg-green-600"
                            style={{ bottom: '100px' }}
                        >
                            {buttonLabel}
                        </button>
                    </>
                ) : (
                    <div className="w-full h-full relative bg-black">
                        <button
                            onClick={handleCloseVideo}
                            className="absolute top-4 right-4 z-50 bg-black text-white rounded-full px-4 py-2 text-xl font-bold hover:opacity-90"
                        >
                            X
                        </button>

                        <ReactPlayer
                            url={videoUrl}
                            width="100%"
                            height="100%"
                            controls
                            playing
                            muted={true} // Fixes autoplay restrictions
                            config={{
                                file: {
                                    forceHLS: true, // Forces HLS playback
                                    attributes: {
                                        crossOrigin: 'anonymous', // Ensures proper cross-origin handling
                                    },
                                },
                            }}
                            onError={(e) => {
                                console.error('Player Error:', e);
                                setError('Failed to play video. Please try again.');
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
