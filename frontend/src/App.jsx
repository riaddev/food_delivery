import React from "react";
import "./components/LandingPage.css";

import Header from "./components/Header";
import Hero from "./components/Hero";
import CuisineStrip from "./components/CuisineStrip";
import TrendingDishes from "./components/TrendingDishes";
import WhyUs from "./components/WhyUs";
import MobileAppSection from "./components/MobileAppSection";
import Testimonials from "./components/Testimonials";
import CTABanner from "./components/CTABanner";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <Header />
      <Hero />
      <CuisineStrip />
      <TrendingDishes />
      <WhyUs />
      <MobileAppSection />
      <Testimonials />
      <CTABanner />
      <Footer />
    </>
  );
}

export default App;
