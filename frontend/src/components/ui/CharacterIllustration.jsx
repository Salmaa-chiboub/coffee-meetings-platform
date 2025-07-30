import React, { useState } from 'react';

// Try multiple image sources
const getCharacterImage = () => {
  // Try different paths for the character image
  const imagePaths = [
    '/character.png',
    '/assets/character.png',
    '/src/assets/character.png',
    require('../../assets/character.png'),
  ];

  // For now, let's use the public folder approach which is most reliable
  return '/character.png';
};

const CharacterIllustration = ({ type = 'login', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const characterImage = getCharacterImage();

  // Don't show background for evaluation type
  const showBackground = type !== 'evaluation';

  return (
    <div className={`fixed top-0 right-0 w-1/2 h-screen pointer-events-none ${className}`}>
      {/* Background - Hidden for evaluation type */}
      {showBackground && (
        <div className="absolute inset-0 overflow-hidden">
        {/* Main arch shape - rounded top on both sides, straight sides, extends to bottom */}
        <div
          className="absolute bg-peach-200 opacity-50"
          style={{
            width: '70%',
            height: '85vh',
            top: '15vh',
            right: '5%',
            borderRadius: '50% 50% 0% 0%',
          }}
        ></div>

        {/* Secondary layer for depth */}
        <div
          className="absolute bg-peach-100 opacity-30"
          style={{
            width: '60%',
            height: '83vh',
            top: '17vh',
            right: '10%',
            borderRadius: '45% 45% 0% 0%',
          }}
        ></div>
      </div>
      )}

      {/* Character Container - Fixed to viewport */}
      <div className="absolute bottom-16 right-21 z-10">
        <div className="text-center">
          {/* Character Image */}
          <div className="relative">
            {!imageError ? (
              <img
                src={characterImage}
                alt="Character with laptop and headphones"
                className="w-96 h-96 object-contain drop-shadow-2xl"
                onLoad={() => {
                  console.log('Character image loaded successfully from:', characterImage);
                }}
                onError={(e) => {
                  console.error('Failed to load character image from:', characterImage);
                  setImageError(true);
                }}
              />
            ) : (
              /* Fallback placeholder */
              <div className="w-96 h-96 bg-peach-100 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-6xl mb-2">
                    {type === 'login' ? '👨‍💻' : '🎉'}
                  </div>
                  <p className="text-xs text-warmGray-500">
                    Character image not found
                  </p>
                  <p className="text-xs text-warmGray-400 mt-1">
                    Please add character.png to public folder
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterIllustration;
