import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { noticeAPI, admissionAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const slides = [
  "./assets/images/College_pic.jpg",
  "./assets/images/MAIN_FATOK.jpg",
  "./new-slider-image-1.png",
  "./new-slider-image-2.png",
  "./new-slider-image-3.png",
  "./new-slider-image-4.png",
  "./new-slider-image-5.png",
  "./new-slider-image-6.png",
  "./new-slider-image-7.png",
  "./new-slider-image-8.png",
  "./new-slider-image-9.png",
  "./new-slider-image-10.png",
];

const Home = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [admissionTemplate, setAdmissionTemplate] = useState(null);
  const [admissionLoading, setAdmissionLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchLatestNotices();
    fetchAdmissionTemplate();
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLatestNotices = async () => {
    try {
      const response = await noticeAPI.getAll();
      setNotices(response.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmissionTemplate = async () => {
    setAdmissionLoading(true);
    try {
      const response = await admissionAPI.getDefaultTemplate();
      setAdmissionTemplate(response.data);
    } catch (error) {
      console.error("Error fetching default admission template:", error);
      try {
        const listResponse = await admissionAPI.listTemplates();
        const templates = listResponse.data || [];
        if (templates.length > 0) {
          setAdmissionTemplate(templates[0]);
        }
      } catch (listError) {
        console.error("Error loading admission templates list:", listError);
      }
    } finally {
      setAdmissionLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const shouldShowAdmissionCta = !user && admissionTemplate;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Recent Notices and Image Slider */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          {shouldShowAdmissionCta ? (
            <Link
              to="/admission"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
            >
              Fillup Admission Form
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v16h16M8 12l4 4 4-4M12 16V4"
                />
              </svg>
            </Link>
          ) : (
            !user && (
              <button
                disabled
                className="inline-flex items-center px-5 py-2 rounded-lg bg-gray-300 text-gray-600 font-semibold cursor-not-allowed"
              >
                {admissionLoading ? "Preparing admission form..." : "Admission form unavailable"}
              </button>
            )
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Notices Box */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
              <div className="bg-blue-600 text-white px-4 py-3">
                <h3 className="font-bold text-lg text-center">
                  Recent Notices
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : notices.length > 0 ? (
                  notices.slice(0, 3).map((notice) => (
                    <Link
                      key={notice.id}
                      to={`/notices/${notice.id}`}
                      className="block p-3 bg-gray-50 hover:bg-green-50 rounded transition border-l-4 border-blue-600"
                    >
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {notice.title}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No notices available
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Image Slider */}
          <div className="lg:col-span-2">
            <div
              className="relative bg-white rounded-lg shadow-md overflow-hidden"
              style={{ height: "400px" }}
            >
              <div className="relative h-full">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentSlide ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <img
                      src={slide}
                      alt={`College Building ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full transition shadow-lg"
              >
                <svg
                  className="w-6 h-6 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full transition shadow-lg"
              >
                <svg
                  className="w-6 h-6 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition ${
                      index === currentSlide ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section with Image */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2
                className="text-3xl font-bold text-blue-700 mb-6"
                style={{ fontFamily: "serif" }}
              >
                প্রতিষ্ঠানের ইতিহাস ও বর্তমান অবস্থা
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4 text-justify">
                <p>
                  কলেজের ইতিহাস নাটোর জেলার চলনবিল অঞ্চলের নারী শিক্ষার
                  ঐতিহ্যবাহী শিক্ষা প্রতিষ্ঠান রোজী মোজাম্মেল মহিলা কলেজ যা ১৯৯৪
                  সালে বিশিষ্ট শিক্ষানুরাগী এম মোজাম্মেল হক এর উদ্যোগে
                  প্রতিষ্ঠিত হয় । সে সময় প্রতিষ্ঠাতা অধ্যক্ষ ছিলেন এম
                  মোজাম্মেল হক । প্রতিষ্ঠাতা সভাপতি ছিলেন শ্রীযুক্ত বাবু
                  নরেন্দ্রনাথ কর্মকার । অত্র কলেজের দাতা ছিলেন রোজী মোজাম্মেল ।
                  কলেজটি উচ্চ মাধ্যমিক পর্যায়ে অধিভূক্তি হয় ২৯ সেপ্টেম্বর ১৯৯৪
                  ইং তারিখে এবং স্নাতক (পাস) পর্যায়ে অধিভূক্তি হয় ৩০ জুন ২০০৪
                  সালে । পর্যায়ক্রমে স্নাতক (সম্মান) পর্যায়ে অধিভূক্তি পায় ১৩
                  সেপ্টেম্বর ২০০৭ সালে । ত্রিশ বছর ধরে গুরুদাসপুর উপজেলা সদরে
                  নারী শিক্ষার ক্ষেত্রে রোজী মোজাম্মেল মহিলা কলেজ উল্লেখযোগ্য
                  ভূমিকা রেখে চলেছে । সংসদ সদস্য এম মোজাম্মেল হক একজন
                  শিক্ষানুরাগী ছিলেন । ........
                </p>
                <Link
                  to="/about"
                  className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-green-700 transition font-semibold"
                >
                  Read More
                </Link>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600"
                alt="College Building"
                className="w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Admission Section */}
      <section
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200)",
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block bg-orange-500 text-white px-6 py-2 rounded-full font-bold mb-6 text-sm">
            New
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            ADMISSION <span className="text-orange-500">GOING</span> ON
          </h2>
          <Link
            to="/admission"
            className="inline-block px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold transition text-lg"
          >
            APPLY NOW
          </Link>
        </div>
      </section>

      {/* Principal's Message */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img
                  src="./assets/images/chairman.jpg"
                  alt="chairman"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2
                className="text-3xl font-bold text-blue-700 mb-3"
                style={{ fontFamily: "serif" }}
              >
                Chairman Notes
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4 text-justify mb-5">
                <p className="font-semibold text-lg">
                  Professor Abu Hena Mostofa Kamal
                </p>
                <p className="text-gray-600 mb-4">
                  In the name of Allah, the Most Gracious, the Most Merciful.
                  All praise is due to Allah, the Lord of all worlds, whose
                  boundless mercy and divine guidance illuminate our paths. May
                  countless blessings and peace be upon our beloved Prophet
                  Muhammad (صلى الله عليه وسلم), the ultimate guide and source
                  of wisdom for all of humanity
                </p>
                <p className="text-gray-600 mb-4">
                  It is with profound honour and an immense sense of
                  responsibility that I extend my heartfelt greetings to all
                  those associated with Rosey Mozammel Women's College— an
                  institution that stands as a beacon of knowledge, empowerment,
                  and intellectual advancement for the women of this region.
                </p>
                <p className="text-gray-600 mb-4">
                  This college is not merely a structure of bricks and mortar;
                  it is a testament to sacrifice, perseverance, and an
                  unwavering commitment to education, made possible by the
                  extraordinary dedication of my revered parents, Rosey Mozammel
                  and Md. Mozammel Haque, former Member of Parliament for
                  Natore-4. Their vision was clear and resolute—to provide
                  quality education for women, ensuring that they are equipped
                  with the knowledge and skills necessary to lead, inspire, and
                  contribute meaningfully to society.
                </p>
                <HashLink
                  smooth
                  to="/about#principal-message"
                  className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-green-700 transition font-semibold"
                >
                  Read More
                </HashLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services/Departments Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2
            className="text-3xl font-bold text-center text-blue-700 mb-3"
            style={{ fontFamily: "serif" }}
          >
            আমাদের বিভাগসমূহ
          </h2>
          <p className="text-center text-gray-600 mb-12">
            বিভিন্ন শাখার মান সম্মত শিক্ষা প্রদানে আমরা প্রতিশ্রুতিবদ্ধ এবং
            শিক্ষার মান নিশ্চিতে সদা তৎপর
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service 1 */}
            <div className="bg-gradient-to-b from-green-400 to-green-500 rounded-lg p-6 text-center text-white hover:shadow-xl transition transform hover:-translate-y-1">
              <div className="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"></path>
                </svg>
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "serif" }}
              >
                উচ্চ মাধ্যমিক
              </h3>
              <p className="text-sm opacity-90">Higher Secondary Education</p>
            </div>

            {/* Service 2 */}
            <div className="bg-gradient-to-b from-green-400 to-green-500 rounded-lg p-6 text-center text-white hover:shadow-xl transition transform hover:-translate-y-1">
              <div className="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                </svg>
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "serif" }}
              >
                স্নাতক (পাস)
              </h3>
              <p className="text-sm opacity-90">Degree Pass Course</p>
            </div>

            {/* Service 3 */}
            <div className="bg-gradient-to-b from-green-400 to-green-500 rounded-lg p-6 text-center text-white hover:shadow-xl transition transform hover:-translate-y-1">
              <div className="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "serif" }}
              >
                কম্পিউটার ল্যাব
              </h3>
              <p className="text-sm opacity-90">Computer Laboratory</p>
            </div>

            {/* Service 4 */}
            <div className="bg-gradient-to-b from-green-400 to-green-500 rounded-lg p-6 text-center text-white hover:shadow-xl transition transform hover:-translate-y-1">
              <div className="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
                </svg>
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "serif" }}
              >
                মাল্টিমিডিয়া ক্লাসরুম
              </h3>
              <p className="text-sm opacity-90">Multimedia Classroom</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-gradient-to-r from-green-100 to-green-50">
        <div className="container mx-auto px-4">
          <h2
            className="text-2xl font-bold text-blue-700 mb-8 text-center"
            style={{ fontFamily: "serif" }}
          >
            প্রতিষ্ঠানের সফলতার সারাংশ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">
                705+
              </div>
              <div className="text-gray-700 font-medium">ছাত্র ছাত্রী</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">
                93%
              </div>
              <div className="text-gray-700 font-medium">পাসের হার</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">
                23+
              </div>
              <div className="text-gray-700 font-medium">অভিজ্ঞ শিক্ষক</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">
                40+
              </div>
              <div className="text-gray-700 font-medium">বছরের ঐতিহ্য</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
