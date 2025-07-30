import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  ChartBarIcon,
  HeartIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import LandingIllustration from '../components/ui/LandingIllustration';
import Navbar from '../components/layout/Navbar';
import AnimatedSection from '../components/ui/AnimatedSection';
import CountUp from '../components/ui/CountUp';
import Chatbot from '../components/ui/Chatbot';
import AnimatedTimeline from '../components/ui/AnimatedTimeline';

const LandingPage = () => {
  const navigate = useNavigate();

  const hrBenefits = [
    {
      icon: UserGroupIcon,
      title: "Appariement Intelligent d'Employés",
      description: "Créez des connexions significatives entre départements, équipes et sites grâce à notre algorithme de correspondance intelligent."
    },
    {
      icon: ChartBarIcon,
      title: "Analyses de Campagne",
      description: "Suivez l'engagement, mesurez le succès des connexions et obtenez des insights sur vos initiatives de culture d'entreprise."
    },
    {
      icon: SparklesIcon,
      title: "Création Facile de Campagnes",
      description: "Lancez des campagnes de rencontres café en quelques minutes avec des modèles personnalisables et une planification automatisée."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Spécialiste Marketing",
      quote: "CoffeeMeet m'a aidée à me connecter avec des collègues que je n'aurais jamais rencontrés autrement. J'ai créé de véritables amitiés et appris énormément sur les différents départements !",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Développeur Logiciel",
      quote: "En tant que travailleur à distance, je me sentais déconnecté. Les rencontres café m'ont donné l'occasion de créer des liens avec mes coéquipiers et de me sentir plus intégré dans la culture d'entreprise.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Coordinatrice RH",
      quote: "Ces discussions café décontractées ont été formidables pour décloisonner les départements. Les gens collaborent davantage et l'énergie au bureau est bien meilleure !",
      rating: 5
    }
  ];

  const stats = [
    { number: 87, label: "Rapportent des relations professionnelles plus fortes" },
    { number: 92, label: "Se sentent plus connectés à la culture d'entreprise" },
    { number: 78, label: "Collaboration inter-équipes accrue" },
    { number: 95, label: "Recommanderaient à leurs collègues" }
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 lg:pt-32">
        <div className="flex min-h-screen">
          {/* Left side - Content */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8 text-center lg:text-left">


              {/* Hero Content */}
              <AnimatedSection animation="fadeInUp" delay={400}>
                <div className="space-y-8">
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-warmGray-800 leading-tight">
                    Favorisez des relations authentiques et créez une communauté <span className="text-peach-600">d'entreprise</span> florissante
                  </h1>
                  <p className="text-xl lg:text-2xl text-warmGray-600 leading-relaxed">
                    Connectez les employés entre départements, sites et équipes grâce à des campagnes de rencontres café personnalisées.
                    Créez des liens durables qui renforcent l'engagement, la collaboration et la culture d'entreprise.
                  </p>
                </div>
              </AnimatedSection>

              {/* CTA Buttons */}
              <AnimatedSection animation="fadeInUp" delay={600}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-12">
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-5 px-10 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2 text-lg"
                  >
                    Commencer Gratuitement
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="border-2 border-warmGray-400 text-warmGray-700 hover:bg-warmGray-50 font-medium py-5 px-10 rounded-full transition-all duration-200 transform hover:scale-[1.02] text-lg"
                  >
                    Se Connecter
                  </button>
                </div>
              </AnimatedSection>


            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="hidden lg:block flex-1 relative min-h-[600px]">
            <AnimatedSection animation="fadeInRight" delay={400}>
              <LandingIllustration />
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-warmGray-800 mb-6">
                Créer des connexions qui comptent
              </h2>
              <p className="text-xl text-warmGray-600 max-w-3xl mx-auto leading-relaxed">
                Nous croyons que des relations professionnelles solides sont le fondement d'organisations prospères.
                CoffeeMeet facilite la création de connexions significatives qui renforcent l'engagement, la collaboration et la culture d'entreprise.
              </p>
            </div>
          </AnimatedSection>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <AnimatedSection key={index} animation="scaleIn" delay={index * 100}>
                <div className="text-center">
                  <CountUp
                    end={stat.number}
                    duration={5000}
                    suffix="%"
                    delay={index * 500}
                    className="text-4xl font-bold text-peach-600 mb-2"
                  />
                  <div className="text-sm text-warmGray-600">{stat.label}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-warmGray-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-warmGray-800 mb-6">
                Commencez à créer des connexions en 3 étapes
              </h2>
              <p className="text-xl text-warmGray-600 max-w-3xl mx-auto">
                Lancez votre première campagne de rencontres café en quelques minutes
              </p>
            </div>
          </AnimatedSection>

          {/* Steps */}
          <AnimatedTimeline className="space-y-20">
            {/* Step 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <AnimatedSection animation="fadeInLeft">
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-warmGray-200 overflow-hidden">
                    {/* Mock browser window */}
                    <div className="bg-warmGray-100 rounded-t-lg p-3 mb-6 -mx-6 -mt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="bg-white rounded px-3 py-1 text-xs text-warmGray-600">
                          coffeemeet.com/campaigns/new
                        </div>
                        <div className="w-16"></div>
                      </div>
                    </div>

                    {/* Campaign Creation Interface */}
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-warmGray-800">Créer une nouvelle campagne</h4>
                        <div className="bg-peach-100 text-peach-700 px-3 py-1 rounded-full text-sm font-medium">
                          Étape 1/3
                        </div>
                      </div>

                      {/* Campaign Templates */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-warmGray-700">Choisir un modèle</label>
                        <div className="grid grid-cols-1 gap-3">
                          {/* Template 1 - Selected */}
                          <div className="border-2 border-peach-300 bg-peach-50 rounded-lg p-4 cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 bg-peach-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">☕</span>
                                  <div>
                                    <h5 className="font-medium text-warmGray-800">Rencontres Café Hebdomadaires</h5>
                                    <p className="text-sm text-warmGray-600">Parfait pour les équipes régulières</p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-peach-600 text-sm font-medium">Populaire</div>
                            </div>
                          </div>

                          {/* Template 2 */}
                          <div className="border border-warmGray-200 bg-white rounded-lg p-4 cursor-pointer hover:border-warmGray-300">
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 border-2 border-warmGray-300 rounded-full"></div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">🤝</span>
                                  <div>
                                    <h5 className="font-medium text-warmGray-800">Intégration Nouveaux Employés</h5>
                                    <p className="text-sm text-warmGray-600">Idéal pour l'onboarding</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Template 3 */}
                          <div className="border border-warmGray-200 bg-white rounded-lg p-4 cursor-pointer hover:border-warmGray-300">
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 border-2 border-warmGray-300 rounded-full"></div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">🎯</span>
                                  <div>
                                    <h5 className="font-medium text-warmGray-800">Connexions Inter-Départements</h5>
                                    <p className="text-sm text-warmGray-600">Briser les silos organisationnels</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4">
                        <button className="w-full bg-peach-600 hover:bg-peach-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                          Continuer avec ce modèle
                        </button>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>

              <div className="flex-1">
                <AnimatedSection animation="fadeInRight">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-peach-600 text-white rounded-full font-bold text-xl mb-6">
                      01
                    </div>
                    <h3 className="text-2xl font-bold text-warmGray-800 mb-4">
                      Créez une campagne
                    </h3>
                    <p className="text-lg text-warmGray-600 mb-6 leading-relaxed">
                      Choisissez parmi une liste de modèles de campagnes, puis personnalisez-les pour s'adapter au style unique de votre équipe.
                    </p>
                    <button
                      onClick={() => navigate('/register')}
                      className="bg-peach-600 hover:bg-peach-700 text-white font-medium py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center gap-2"
                    >
                      Commencer
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </AnimatedSection>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="flex-1">
                <AnimatedSection animation="fadeInRight">
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-warmGray-200">
                    {/* Audience Selection Interface */}
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-warmGray-800">Sélectionner l'audience</h4>
                        <div className="bg-peach-100 text-peach-700 px-3 py-1 rounded-full text-sm font-medium">
                          Étape 2/3
                        </div>
                      </div>

                      {/* Department Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-warmGray-700">Départements</label>
                          <span className="text-xs text-warmGray-500">3 sélectionnés</span>
                        </div>

                        <div className="space-y-3">
                          {/* Marketing - Selected */}
                          <div className="flex items-center space-x-3 p-4 bg-peach-50 rounded-lg border-2 border-peach-200 cursor-pointer">
                            <div className="w-5 h-5 bg-peach-600 rounded border-2 border-peach-600 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">M</span>
                                </div>
                                <div>
                                  <h5 className="font-medium text-warmGray-800">Marketing</h5>
                                  <p className="text-sm text-warmGray-600">12 employés</p>
                                </div>
                              </div>
                              <div className="flex -space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full border-2 border-white"></div>
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
                                <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full border-2 border-white"></div>
                              </div>
                            </div>
                          </div>

                          {/* HR - Selected */}
                          <div className="flex items-center space-x-3 p-4 bg-peach-50 rounded-lg border-2 border-peach-200 cursor-pointer">
                            <div className="w-5 h-5 bg-peach-600 rounded border-2 border-peach-600 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">RH</span>
                                </div>
                                <div>
                                  <h5 className="font-medium text-warmGray-800">Ressources Humaines</h5>
                                  <p className="text-sm text-warmGray-600">8 employés</p>
                                </div>
                              </div>
                              <div className="flex -space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full border-2 border-white"></div>
                                <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full border-2 border-white"></div>
                              </div>
                            </div>
                          </div>

                          {/* Tech - Not Selected */}
                          <div className="flex items-center space-x-3 p-4 bg-warmGray-50 rounded-lg border-2 border-warmGray-200 cursor-pointer hover:border-warmGray-300">
                            <div className="w-5 h-5 border-2 border-warmGray-300 rounded"></div>
                            <div className="flex-1 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">T</span>
                                </div>
                                <div>
                                  <h5 className="font-medium text-warmGray-800">Technologie</h5>
                                  <p className="text-sm text-warmGray-600">15 employés</p>
                                </div>
                              </div>
                              <div className="flex -space-x-2 opacity-50">
                                <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full border-2 border-white"></div>
                                <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full border-2 border-white"></div>
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-cream-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-warmGray-700">Total participants</span>
                          <span className="text-lg font-bold text-peach-600">20 employés</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>

              <div className="flex-1">
                <AnimatedSection animation="fadeInLeft">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-peach-600 text-white rounded-full font-bold text-xl mb-6">
                      02
                    </div>
                    <h3 className="text-2xl font-bold text-warmGray-800 mb-4">
                      Choisissez votre audience
                    </h3>
                    <p className="text-lg text-warmGray-600 mb-6 leading-relaxed">
                      Sélectionnez facilement qui vous voulez dans votre campagne, et laissez CoffeeMeet s'occuper du reste. Notre plateforme gère automatiquement les appariements.
                    </p>
                    <button
                      onClick={() => navigate('/register')}
                      className="bg-peach-600 hover:bg-peach-700 text-white font-medium py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center gap-2"
                    >
                      Commencer
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </AnimatedSection>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <AnimatedSection animation="fadeInLeft">
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-warmGray-200">
                    {/* Campaign Launch Interface */}
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-warmGray-800">Tableau de bord</h4>
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Campagne Active</span>
                        </div>
                      </div>

                      {/* Active Campaign Card */}
                      <div className="bg-gradient-to-r from-peach-50 to-cream-50 rounded-xl p-6 border border-peach-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-peach-600 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-white text-2xl">☕</span>
                            </div>
                            <div>
                              <h5 className="font-bold text-warmGray-800 text-lg">Rencontres Café Hebdomadaires</h5>
                              <p className="text-warmGray-600 text-sm">Lancée il y a 2 jours</p>
                            </div>
                          </div>
                          <button className="text-peach-600 hover:text-peach-700 text-sm font-medium">
                            Modifier
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-warmGray-600">Progression des appariements</span>
                            <span className="font-medium text-warmGray-800">12/20 participants</span>
                          </div>
                          <div className="w-full bg-warmGray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-peach-500 to-peach-600 h-2 rounded-full" style={{width: '60%'}}></div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-700">8</p>
                              <p className="text-sm text-blue-600">Rencontres planifiées</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-700">5</p>
                              <p className="text-sm text-green-600">Rencontres terminées</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="space-y-3">
                        <h6 className="text-sm font-medium text-warmGray-700">Activité récente</h6>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3 p-3 bg-warmGray-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-warmGray-700">Marie et Thomas ont confirmé leur rencontre</span>
                            <span className="text-xs text-warmGray-500 ml-auto">Il y a 2h</span>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-warmGray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-warmGray-700">Nouveau appariement: Sophie & Lucas</span>
                            <span className="text-xs text-warmGray-500 ml-auto">Il y a 4h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>

              <div className="flex-1">
                <AnimatedSection animation="fadeInRight">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-peach-600 text-white rounded-full font-bold text-xl mb-6">
                      03
                    </div>
                    <h3 className="text-2xl font-bold text-warmGray-800 mb-4">
                      Lancez votre campagne !
                    </h3>
                    <p className="text-lg text-warmGray-600 mb-6 leading-relaxed">
                      Avec CoffeeMeet, annoncer votre campagne et gérer l'intégration des utilisateurs est sans effort—un seul clic suffit. Les employés seront automatiquement appariés pour des rencontres café.
                    </p>
                    <button
                      onClick={() => navigate('/register')}
                      className="bg-peach-600 hover:bg-peach-700 text-white font-medium py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center gap-2"
                    >
                      Commencer
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </AnimatedTimeline>
        </div>
      </section>

      {/* HR Manager Benefits Section */}
      <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8 bg-peach-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-warmGray-800 mb-6">
                Outils puissants pour les responsables RH
              </h2>
              <p className="text-xl text-warmGray-600 max-w-3xl mx-auto">
                Tout ce dont vous avez besoin pour créer, gérer et mesurer des campagnes de connexion professionnelle réussies
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {hrBenefits.map((benefit, index) => (
              <AnimatedSection key={index} animation="fadeInUp" delay={index * 200}>
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="bg-peach-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <benefit.icon className="h-8 w-8 text-peach-600" />
                  </div>
                  <h3 className="text-xl font-bold text-warmGray-800 mb-4">{benefit.title}</h3>
                  <p className="text-warmGray-600 leading-relaxed">{benefit.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Employee Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-warmGray-800 mb-6">
                Ce que disent les employés
              </h2>
              <p className="text-xl text-warmGray-600">
                Témoignages authentiques de personnes qui ont vécu le pouvoir des connexions professionnelles
              </p>
            </div>
          </AnimatedSection>

          {/* Horizontal Scrolling Testimonials */}
          <div className="relative">
            <div className="flex animate-scroll-horizontal space-x-8">
              {/* First set of testimonials */}
              {testimonials.map((testimonial, index) => (
                <div key={`first-${index}`} className="flex-shrink-0 w-80 bg-white rounded-2xl p-8 shadow-sm border border-warmGray-100">
                  {/* Rating Stars */}
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="h-5 w-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-warmGray-700 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="border-t border-warmGray-100 pt-4">
                    <div className="font-medium text-warmGray-800">{testimonial.name}</div>
                    <div className="text-sm text-warmGray-500">{testimonial.role}</div>
                  </div>
                </div>
              ))}

              {/* Duplicate set for seamless loop */}
              {testimonials.map((testimonial, index) => (
                <div key={`second-${index}`} className="flex-shrink-0 w-80 bg-white rounded-2xl p-8 shadow-sm border border-warmGray-100">
                  {/* Rating Stars */}
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="h-5 w-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-warmGray-700 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="border-t border-warmGray-100 pt-4">
                    <div className="font-medium text-warmGray-800">{testimonial.name}</div>
                    <div className="text-sm text-warmGray-500">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-peach-100 to-cream">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection animation="fadeInUp">
            <div className="mb-8">
              <HeartIcon className="h-16 w-16 text-peach-600 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-warmGray-800 mb-6">
                Prêt à transformer votre culture d'entreprise ?
              </h2>
              <p className="text-xl text-warmGray-600 mb-8 leading-relaxed">
                Rejoignez des centaines d'entreprises qui utilisent CoffeeMeet pour créer des équipes plus fortes et connectées.
                Commencez à créer des relations significatives dès aujourd'hui.
              </p>
            </div>
          </AnimatedSection>

          {/* Benefits List */}
          <AnimatedSection animation="fadeInUp" delay={200}>
            <div className="grid md:grid-cols-2 gap-4 mb-12 text-left max-w-2xl mx-auto">
              {[
                "Configurez votre première campagne en moins de 5 minutes",
                "Algorithme de correspondance intelligent pour des connexions significatives",
                "Analyses complètes et suivi de l'engagement",
                "Intégration transparente avec votre flux de travail existant"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircleIcon className="h-6 w-6 text-peach-600 flex-shrink-0" />
                  <span className="text-warmGray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Final CTA Buttons */}
          <AnimatedSection animation="fadeInUp" delay={400}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2 text-lg"
              >
                Commencer à Créer des Connexions
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="border-2 border-warmGray-400 text-warmGray-700 hover:bg-white font-medium py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-[1.02] text-lg"
              >
                Vous avez déjà un compte ?
              </button>
            </div>
          </AnimatedSection>

          {/* Contact Info */}
          <AnimatedSection animation="fadeIn" delay={600}>
            <div className="mt-12 pt-8 border-t border-warmGray-200">
              <p className="text-sm text-warmGray-500">
                Des questions ? Nous sommes là pour vous aider. Contactez-nous à{' '}
                <a href="mailto:cffmeet.info@gmail.com" className="text-peach-600 hover:text-peach-700 font-medium">
                  cffmeet.info@gmail.com
                </a>
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Chatbot Widget */}
      <Chatbot />
    </div>
  );
};

export default LandingPage;
