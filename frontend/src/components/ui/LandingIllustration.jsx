import React, { useState } from 'react';

const LandingIllustration = ({ className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  // Try to load a coffee meeting image
  const getCoffeeMeetingImage = () => {
    // Use the public folder approach which is most reliable
    return '/coffee-meeting.png';
  };

  const coffeeMeetingImage = getCoffeeMeetingImage();

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      {/* Background Design Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main decorative shape - maximum size with 1% increase */}
        <div
          className="absolute bg-peach-200 opacity-40"
          style={{
            width: '100%',
            height: '100%',
            top: '0%',
            right: '0%',
            borderRadius: '50% 50% 20% 20%',
          }}
        ></div>

        {/* Secondary decorative layer - increased by 1% proportionally */}
        <div
          className="absolute bg-peach-100 opacity-25"
          style={{
            width: '94%',
            height: '96%',
            top: '2%',
            right: '2%',
            borderRadius: '45% 45% 25% 25%',
          }}
        ></div>

        {/* Proportionally scaled accent circles */}
        <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-peach-300 opacity-30 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-peach-400 opacity-25 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/4 w-10 h-10 bg-peach-200 opacity-35 rounded-full"></div>
        <div className="absolute top-1/5 right-1/5 w-5 h-5 bg-peach-300 opacity-20 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/3 w-9 h-9 bg-peach-100 opacity-30 rounded-full"></div>
      </div>

      {/* Coffee Meeting Illustration Container */}
      <div className="relative z-10 flex items-center justify-center">
        {!imageError ? (
          <div className="relative w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem] overflow-hidden drop-shadow-2xl">
            <img
              src={coffeeMeetingImage}
              alt="Two men having coffee and talking behind a table"
              className="w-full h-full object-cover object-center"
              style={{
                objectPosition: 'center top',
                transform: 'scale(1.3) translateY(8%)'
              }}
              onLoad={() => {
                console.log('Coffee meeting image loaded successfully from:', coffeeMeetingImage);
              }}
              onError={(e) => {
                console.error('Failed to load coffee meeting image from:', coffeeMeetingImage);
                setImageError(true);
              }}
            />


          </div>
        ) : (
          /* Fallback placeholder - matches CharacterIllustration style */
          <div className="w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem] bg-peach-100 rounded-2xl flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">
                ☕
              </div>
              <h3 className="text-lg font-bold text-warmGray-800 mb-1">
                Coffee Connections
              </h3>
              <p className="text-sm text-warmGray-600 max-w-xs leading-relaxed mb-4">
                Building meaningful workplace relationships through coffee meetings
              </p>
              <p className="text-xs text-warmGray-500">
                Coffee meeting image not found
              </p>
              <p className="text-xs text-warmGray-400 mt-1">
                Please add coffee-meeting.png to public folder
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Additional decorative elements - proportionally scaled */}
      <div className="absolute top-10 right-10 opacity-20">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-peach-400 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-peach-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="w-3 h-3 bg-peach-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="absolute bottom-10 right-20 opacity-15">
        <div className="text-3xl">
          ☕
        </div>
      </div>

      {/* Additional decorative coffee icon - scaled down */}
      <div className="absolute top-16 left-10 opacity-10">
        <div className="text-4xl">
          ☕
        </div>
      </div>
    </div>
  );
};

export default LandingIllustration;
