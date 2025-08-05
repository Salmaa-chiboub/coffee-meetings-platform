import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false);
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const solutions = [
    {
      title: "Connexions Inter-Départements",
      description: "Décloisonner les équipes et les départements",
      icon: (
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-peach-100 to-peach-200 rounded-xl shadow-sm">
          <svg className="w-6 h-6 text-peach-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      )
    },
    {
      title: "Intégration Nouveaux Employés",
      description: "Aider les nouvelles recrues à se connecter avec les équipes existantes",
      icon: (
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
      )
    },
    {
      title: "Cohésion d'Équipe à Distance",
      description: "Connecter les travailleurs distants et hybrides",
      icon: (
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-sm">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
      )
    },
    {
      title: "Programmes de Mentorat",
      description: "Associer mentors et mentorés à travers l'organisation",
      icon: (
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-sm">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      )
    }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-cream/95 backdrop-blur-md shadow-lg border-b border-warmGray-200' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200"
            >
              {/* CoffeeMeet Logo */}
              <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12">
                <img
                  src="/logo.png"
                  alt="CoffeeMeet Logo"
                  className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
                />
              </div>

              {/* Brand Text */}
              <span className="text-2xl lg:text-3xl font-bold text-warmGray-800 hover:text-peach-600 transition-colors duration-200">
                Coffee<span className="text-peach-600">Meet</span>
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Solutions Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowSolutionsDropdown(true)}
                onMouseLeave={() => setShowSolutionsDropdown(false)}
                className="flex items-center text-warmGray-700 hover:text-peach-600 font-medium transition-colors duration-200"
              >
                Solutions
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </button>

              {/* Solutions Dropdown Menu */}
              {showSolutionsDropdown && (
                <div
                  onMouseEnter={() => setShowSolutionsDropdown(true)}
                  onMouseLeave={() => setShowSolutionsDropdown(false)}
                  className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-warmGray-100 py-4 z-50"
                >
                  {solutions.map((solution, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToSection('solutions')}
                      className="w-full px-6 py-4 text-left hover:bg-peach-50 transition-colors duration-200 flex items-start space-x-4 group"
                    >
                      <div className="flex-shrink-0 transform group-hover:scale-105 transition-transform duration-200">
                        {solution.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-warmGray-800 group-hover:text-peach-700 transition-colors duration-200">{solution.title}</h4>
                        <p className="text-sm text-warmGray-600 mt-0.5 leading-relaxed">{solution.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* About */}
            <button
              onClick={() => scrollToSection('about')}
              className="text-warmGray-700 hover:text-peach-600 font-medium transition-colors duration-200"
            >
              À Propos
            </button>

            {/* Testimonials */}
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-warmGray-700 hover:text-peach-600 font-medium transition-colors duration-200"
            >
              Témoignages
            </button>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="text-warmGray-700 hover:text-peach-600 font-medium transition-colors duration-200"
            >
              Connexion
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-semibold py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center gap-2 text-lg shadow-md hover:shadow-lg"
            >
              Commencer
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-warmGray-700 hover:text-peach-600 transition-colors duration-200"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-cream/95 backdrop-blur-md rounded-2xl mt-2 border border-warmGray-200 shadow-lg">
              {/* Mobile Solutions */}
              <div className="space-y-2">
                <div className="px-3 py-2 text-sm font-medium text-warmGray-500 uppercase tracking-wider">
                  Solutions
                </div>
                {solutions.map((solution, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSection('solutions')}
                    className="w-full text-left px-3 py-3 text-warmGray-700 hover:text-peach-600 hover:bg-peach-50 rounded-lg transition-colors duration-200 flex items-center space-x-3 group"
                  >
                    <div className="flex-shrink-0 transform group-hover:scale-105 transition-transform duration-200">
                      {solution.icon}
                    </div>
                    <span className="font-medium">{solution.title}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-warmGray-200 pt-2">
                <button
                  onClick={() => scrollToSection('about')}
                  className="block w-full text-left px-3 py-2 text-warmGray-700 hover:text-peach-600 hover:bg-peach-50 rounded-lg font-medium transition-colors duration-200"
                >
                  À Propos
                </button>
                <button
                  onClick={() => scrollToSection('testimonials')}
                  className="block w-full text-left px-3 py-2 text-warmGray-700 hover:text-peach-600 hover:bg-peach-50 rounded-lg font-medium transition-colors duration-200"
                >
                  Témoignages
                </button>
              </div>

              <div className="border-t border-warmGray-200 pt-2 space-y-2">
                <button
                  onClick={() => navigate('/login')}
                  className="block w-full text-left px-3 py-2 text-warmGray-700 hover:text-peach-600 hover:bg-peach-50 rounded-lg font-medium transition-colors duration-200"
                >
                  Connexion
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-semibold py-4 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 text-lg shadow-md hover:shadow-lg"
                >
                  Commencer
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
