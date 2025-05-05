import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

import img1 from '../images/img1.jpg';
import img2 from '../images/img2.jpg';
import img3 from '../images/img3.jpg';

const Carrossel = () => {
  return (
    <Swiper
      modules={[Autoplay]}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      loop={true}
      slidesPerView={1}
      className="carrossel-container"
    >
      <SwiperSlide><img src={img1} alt="Slide 1" className="carrossel-img" /></SwiperSlide>
      <SwiperSlide><img src={img2} alt="Slide 2" className="carrossel-img" /></SwiperSlide>
      <SwiperSlide><img src={img3} alt="Slide 3" className="carrossel-img" /></SwiperSlide>
    </Swiper>
  );
};

export default Carrossel;