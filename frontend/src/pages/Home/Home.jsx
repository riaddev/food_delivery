import Header from "../../components/NavBar";
import Hero from "./Hero";
import CuisineStrip from "./CuisineStrip";
import TrendingDishes from "./TrendingDishes";
import WhyUs from "./WhyUs";
import Testimonials from "./Testimonials";
import CTABanner from "./CTABanner";
import Footer from "../../components/Footer";

const LandingPage = () => {
  return (
    <>
      <Header />
      <Hero />
      <CuisineStrip />
      <TrendingDishes />
      <WhyUs />
      <Testimonials />
      <CTABanner />
      <Footer />
    </>
  );
};

export default LandingPage;
